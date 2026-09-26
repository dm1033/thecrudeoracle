import { readFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./env.mjs";

// ---------------------------------------------------------------------------
// Paper-trading portfolio engine (SIMULATED / virtual capital only).
//
// This never touches real money or a broker. It reads the site's virtual
// portfolio, proposes rules-compliant SIMULATED trades, and returns a new
// portfolio object with every derived field recomputed so it satisfies the
// same accounting identities the data-integrity test suite enforces.
//
// Cost-basis model (matches tests/data/virtual-portfolio.test.ts):
//   cash_balance + Σ position.capital_allocated === starting_value
//   current_value === starting_value + Σ unrealised_pl + Σ realised_pl
//   weight_pct === capital_allocated / starting_value * 100
// Trading moves capital between cash and positions; marks (P/L) are not
// changed by trading, only crystallised from unrealised to realised.
// ---------------------------------------------------------------------------

const PORTFOLIO_FILE = path.join(ROOT, "data", "virtual-portfolio.json");

const round1 = (x) => Math.round(x * 10) / 10;

export function loadPortfolio() {
  return JSON.parse(readFileSync(PORTFOLIO_FILE, "utf8"));
}

export function portfolioPath() {
  return PORTFOLIO_FILE;
}

function numericCaps(pf) {
  const caps = (pf.rules?.position_limits ?? [])
    .map((l) => {
      const m = l.match(/maximum\s+(\d+(?:\.\d+)?)%/i);
      return m ? Number(m[1]) : null;
    })
    .filter((n) => n != null);
  const looseCeiling = caps.length ? Math.max(...caps) : 20;
  const spec = caps.length ? Math.min(...caps) : 5; // smallest stated cap is speculative
  const singleEquity = 10; // "Single equity: maximum 10%"
  const minCashPct = (() => {
    const m = String(pf.rules?.cash_reserve ?? "").match(/(\d+(?:\.\d+)?)%/);
    return m ? Number(m[1]) : 10;
  })();
  return { looseCeiling, spec, singleEquity, minCashPct };
}

const isSingleEquity = (p) => !/futures|etc|etf/i.test(p.id ?? "") && !/futures|etc|etf/i.test(p.asset ?? "");

function positionCap(pf, p) {
  const { spec, singleEquity, looseCeiling } = numericCaps(pf);
  let cap = /speculative/i.test(p.category) ? spec : looseCeiling;
  if (isSingleEquity(p)) cap = Math.min(cap, singleEquity);
  return cap;
}

// Recompute every derived field from positions + closed_trades so the file is
// internally consistent regardless of what trades were applied.
export function recompute(pf, today) {
  const starting = pf.account.starting_value;
  for (const p of pf.positions) p.weight_pct = round1((p.capital_allocated / starting) * 100);

  const sumCap = pf.positions.reduce((a, p) => a + p.capital_allocated, 0);
  const cash = starting - sumCap;
  const unrealised = pf.positions.reduce((a, p) => a + p.unrealised_pl, 0);
  const realised = pf.closed_trades.reduce((a, t) => a + t.realised_pl, 0);
  const current = starting + unrealised + realised;

  pf.account.cash_balance = cash;
  pf.account.cash_pct = round1((cash / starting) * 100);
  pf.account.unrealised_pl = unrealised;
  pf.account.realised_pl = realised;
  pf.account.current_value = current;
  pf.account.return_pct = round1(((current - starting) / starting) * 100);
  pf.account.open_positions = pf.positions.length;
  pf.account.closed_trades = pf.closed_trades.length;
  if (today) pf.account.last_updated = today;

  // Allocation actual_pct: per non-cash category = Σ its positions' weight_pct.
  // Cash Reserve is set so the actual column sums to exactly 100.
  let nonCashActual = 0;
  for (const a of pf.allocation) {
    if (/cash/i.test(a.category)) continue;
    a.actual_pct = round1(
      pf.positions.filter((p) => p.category === a.category).reduce((s, p) => s + p.weight_pct, 0),
    );
    nonCashActual += a.actual_pct;
  }
  const cashRow = pf.allocation.find((a) => /cash/i.test(a.category));
  if (cashRow) cashRow.actual_pct = round1(100 - nonCashActual);

  // Keep the "Cash" rows in the indicative exposure tables in step.
  for (const key of ["by_asset_type", "by_region", "by_theme"]) {
    for (const row of pf.exposure?.[key] ?? []) {
      if (/cash/i.test(row.label)) row.pct = pf.account.cash_pct;
    }
  }
  return pf;
}

// Deterministic, transparent rule: redeploy cash held above the target cash
// reserve into the most under-weight non-cash sleeve, in $10k units, within
// the machine-checkable position caps. Returns at most one proposed trade.
export function proposeTrades(pf, signals) {
  const starting = pf.account.starting_value;
  const { minCashPct } = numericCaps(pf);
  const cashRow = pf.allocation.find((a) => /cash/i.test(a.category));
  const targetCashPct = cashRow?.target_pct ?? minCashPct;

  const cash = pf.account.cash_balance;
  const excessCash = cash - (starting * targetCashPct) / 100;

  // Most under-target non-cash sleeve.
  const gaps = pf.allocation
    .filter((a) => !/cash/i.test(a.category))
    .map((a) => ({ category: a.category, gap: a.target_pct - a.actual_pct }))
    .sort((x, y) => y.gap - x.gap);

  const top = gaps[0];
  const reasons = [];
  if (!top || top.gap < 1.0) reasons.push("no sleeve is under its target by more than 1.0pp");
  if (excessCash < 10000) reasons.push("cash is not more than $10k above the target reserve");
  if (reasons.length) return { trades: [], reason: `No trade: ${reasons.join("; ")}.` };

  const inCat = pf.positions
    .filter((p) => p.category === top.category)
    .sort((a, b) => a.weight_pct - b.weight_pct);
  const pos = inCat[0];
  if (!pos) return { trades: [], reason: `No trade: no existing position in "${top.category}" to top up.` };

  const cap = positionCap(pf, pos);
  const headroomValue = ((cap - pos.weight_pct) / 100) * starting;
  const gapValue = (top.gap / 100) * starting;
  let amount = Math.min(gapValue, excessCash, headroomValue);
  amount = Math.floor(amount / 10000) * 10000; // $10k units

  if (amount < 10000) {
    return { trades: [], reason: `No trade: computed rebalance size for ${pos.ticker} below the $10k minimum (cap/headroom/cash constrained).` };
  }

  const signalNote = summariseSignal(signals, top.category);
  return {
    trades: [
      {
        op: "buy_add",
        id: pos.id,
        ticker: pos.ticker,
        asset: pos.asset,
        category: top.category,
        amount,
        fromCategoryGap: round1(top.gap),
        newWeightPct: round1(pos.weight_pct + (amount / starting) * 100),
        cap,
        signalNote,
      },
    ],
    reason: `Redeploy $${amount.toLocaleString("en-US")} of above-target cash toward the most under-weight sleeve ("${top.category}", ${round1(top.gap)}pp under target), within the ${cap}% position cap.`,
  };
}

function summariseSignal(signals, category) {
  if (!signals) return "No dashboard-signals context available.";
  const arr = signals.signals ?? signals.supply ?? [];
  if (Array.isArray(arr) && arr.length) {
    const first = arr[0];
    const label = first.title ?? first.name ?? first.label ?? "signal";
    const stance = first.signal ?? first.stance ?? first.status ?? "neutral";
    return `Context: ${label} — ${stance}.`;
  }
  return "Context: dashboard signals reviewed (indicative).";
}

// Apply proposed trades to a deep-cloned portfolio and recompute derived state.
export function applyTrades(pf, trades, today) {
  const next = structuredClone(pf);
  const starting = next.account.starting_value;

  for (const t of trades) {
    const p = next.positions.find((x) => x.id === t.id);
    if (!p) throw new Error(`applyTrades: position ${t.id} not found`);
    if (t.op === "buy_add") {
      p.capital_allocated += t.amount; // new lot bought at current mark → unrealised unchanged
      p.decision = "Buy / Add (SIMULATED)";
      p.size = `${p.size} + SIMULATED add $${t.amount.toLocaleString("en-US")}`;
      p.last_updated = today;
      appendTradeLog(next, p, t, today);
    } else if (t.op === "trim") {
      const frac = t.amount / p.capital_allocated;
      const realisedChunk = Math.round(p.unrealised_pl * frac);
      p.unrealised_pl -= realisedChunk;
      p.capital_allocated -= t.amount;
      p.decision = "Trim (SIMULATED)";
      p.last_updated = today;
      next.closed_trades.push({
        id: `T-SIM-${today}-${p.id}`,
        date_opened: p.last_updated,
        date_closed: today,
        asset: p.asset,
        ticker: p.ticker,
        exchange: p.exchange ?? "",
        currency: p.currency ?? "USD",
        direction: p.direction ?? "long",
        entry_price: p.entry_price ?? "",
        exit_price: p.current_price ?? "",
        capital_allocated: t.amount,
        realised_pl: realisedChunk,
        return_pct: p.capital_allocated ? round1((realisedChunk / t.amount) * 100) : 0,
        reason_closed: `SIMULATED partial trim proposed by CODA (rebalance). ${t.signalNote ?? ""}`.trim(),
        lesson: "Simulated rebalancing action for demonstration; reviewed by a human before merge.",
        source: p.source ?? "indicative",
        last_updated: today,
        data_type: "manual",
      });
    } else {
      throw new Error(`applyTrades: unknown op ${t.op}`);
    }
  }

  recompute(next, today);
  updateBrief(next, trades, today);
  next.meta.last_published = today;
  return next;
}

function appendTradeLog(pf, p, t, today) {
  const n = pf.trade_log.length + 1;
  pf.trade_log.push({
    trade_id: `T-SIM-${String(n).padStart(3, "0")}`,
    date: today,
    asset: p.asset,
    ticker: p.ticker,
    decision: "Buy / Add (SIMULATED)",
    direction: p.direction ?? "long",
    entry_price: p.current_price ?? "",
    position_size: `SIMULATED add $${t.amount.toLocaleString("en-US")} (rebalance toward ${t.category} target)`,
    capital_allocated: `+$${t.amount.toLocaleString("en-US")} from above-target cash`,
    thesis: `Rebalancing the ${t.category} sleeve toward its allocation target (${t.fromCategoryGap}pp under). ${t.signalNote ?? ""}`.trim(),
    catalyst: "Allocation drift vs target; scheduled CODA rebalance review.",
    supporting_data: "The Crude Oracle dashboard signals + allocation model (indicative).",
    risk: `Adds exposure to ${p.risk_level ?? "the position"}; sized within the ${t.cap}% position cap and the minimum cash reserve.`,
    invalidation: "Sleeve returns to/above target, or cash falls to the minimum reserve.",
    stop_loss: p.stop_loss ?? "as per existing position",
    target: p.target ?? "",
    holding_period: "review at next CODA cycle",
    confidence: "Medium",
    sources: ["The Crude Oracle allocation model", "dashboard-signals.json (indicative)"],
    strategy_fit: `Within the ${t.cap}% cap and minimum cash reserve; SIMULATED paper trade for human review — not advice.`,
    special_risk_warning: /speculative|high/i.test(`${p.category} ${p.risk_level ?? ""}`)
      ? "Speculative sleeve — simulated add kept within the stated per-position cap; review before merge."
      : null,
  });
}

function updateBrief(pf, trades, today) {
  if (!pf.daily_brief) return;
  pf.daily_brief.date = today;
  pf.daily_brief.title = `The Crude Oracle Daily Trading Brief — ${today}`;
  pf.daily_brief.last_updated = `${today}T07:00:00Z`;
  const s11 = pf.daily_brief.sections?.find((s) => /proposed paper trades/i.test(s.label));
  if (s11) {
    s11.text = trades.length
      ? `SIMULATED proposal (human-reviewed via PR): ${trades
          .map((t) => `${t.op === "buy_add" ? "add" : "trim"} ${t.ticker} $${t.amount.toLocaleString("en-US")} → ${t.newWeightPct ?? ""}%`)
          .join("; ")}. Not advice; virtual capital only.`
      : "No trade today. Discipline over activity — proposal engine found no rules-positive action.";
  }
}

// Mirror the data-integrity test invariants so a bad proposal never ships.
export function validate(pf) {
  const errors = [];
  const a = pf.account;
  const starting = a.starting_value;
  const approx = (x, y, tol) => Math.abs(x - y) <= tol;

  if (!approx(a.current_value, starting + a.unrealised_pl + a.realised_pl, 1))
    errors.push("current_value != starting + unrealised + realised");
  if (!approx(a.return_pct, ((a.current_value - starting) / starting) * 100, 0.15))
    errors.push("return_pct mismatch");
  if (!approx(pf.positions.reduce((s, p) => s + p.unrealised_pl, 0), a.unrealised_pl, 1))
    errors.push("account.unrealised_pl != Σ positions");
  if (!approx(pf.closed_trades.reduce((s, t) => s + t.realised_pl, 0), a.realised_pl, 1))
    errors.push("account.realised_pl != Σ closed_trades");
  const deployed = pf.positions.reduce((s, p) => s + p.capital_allocated, 0);
  if (!approx(deployed + a.cash_balance, starting, 1)) errors.push("cash + deployed != starting_value");
  if (!approx(a.cash_pct, (a.cash_balance / starting) * 100, 0.2)) errors.push("cash_pct mismatch");
  for (const p of pf.positions) {
    if (!approx(p.weight_pct, (p.capital_allocated / starting) * 100, 0.2)) errors.push(`weight_pct mismatch ${p.id}`);
    if (!(p.capital_allocated >= 0)) errors.push(`negative capital ${p.id}`);
  }
  if (!approx(pf.allocation.reduce((s, x) => s + x.actual_pct, 0), 100, 0.5)) errors.push("allocation actual != 100");
  if (!approx(pf.allocation.reduce((s, x) => s + x.target_pct, 0), 100, 0.5)) errors.push("allocation target != 100");
  for (const al of pf.allocation) {
    if (/cash/i.test(al.category)) continue;
    const sum = pf.positions.filter((p) => p.category === al.category).reduce((s, p) => s + p.weight_pct, 0);
    if (!approx(sum, al.actual_pct, 0.2)) errors.push(`category actual mismatch "${al.category}"`);
  }
  const { looseCeiling, singleEquity, minCashPct } = numericCaps(pf);
  for (const p of pf.positions) {
    if (p.weight_pct > looseCeiling + 1e-9) errors.push(`position over loose cap ${p.id}`);
    if (isSingleEquity(p) && p.weight_pct > singleEquity + 1e-9) errors.push(`single-equity over 10% ${p.id}`);
  }
  if (a.cash_pct < minCashPct - 0.2) errors.push(`cash below minimum reserve (${a.cash_pct}% < ${minCashPct}%)`);
  if (String(pf.meta?.disclaimer ?? "").length < 50) errors.push("disclaimer missing/short");
  if (errors.length) {
    const err = new Error(`Portfolio validation failed:\n - ${errors.join("\n - ")}`);
    err.code = "PORTFOLIO_INVALID";
    throw err;
  }
  return true;
}
