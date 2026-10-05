/**
 * Derived figures for the $10M paper fund.
 * Narrative lives in data/virtual-portfolio.json. Ratios that can be
 * recomputed are recomputed here so the pages cannot drift from the ledger.
 */

export interface Factor {
  family: string;
  max: number;
  score: number;
  effect: "increased" | "decreased";
  note: string;
}

export interface Opportunity {
  rank: number;
  market: string;
  direction: string;
  structure: string;
  confidence: number;
  risk_reward_ratio: number | null;
  risk_reward: string;
  status: string;
  entry: number | null;
  stop: number | null;
  target: number | null;
  entry_label: string;
  stop_label: string;
  target_label: string;
  holding_period: string;
  strategy: string;
  summary: string;
  factors: Factor[];
  why_it_could_be_wrong: string;
  invalidation: string;
}

export interface Position {
  id: string;
  trade_id?: string;
  category: string;
  asset: string;
  ticker: string;
  exchange?: string;
  currency?: string;
  direction: string;
  size: string;
  entry_price: string;
  current_price: string;
  capital_allocated: number;
  notional?: number;
  weight_pct: number;
  risk_pct?: number;
  unrealised_pl: number;
  realised_pl: number;
  risk_level: string;
  stop_loss: string;
  target: string;
  confidence?: number;
  thesis?: string;
  opened_at?: string;
  strategy?: string;
  decision?: string;
  source: string;
  source_url: string;
  last_updated: string;
  data_type: string;
}

export interface ClosedTrade {
  id: string;
  trade_id?: string;
  date_opened: string;
  date_closed: string;
  asset: string;
  ticker: string;
  exchange?: string;
  currency?: string;
  direction: string;
  strategy?: string;
  entry_price: string;
  exit_price: string;
  capital_allocated: number;
  realised_pl: number;
  return_pct: number;
  reason_closed: string;
  thesis_outcome?: string;
  lesson: string;
  holding_period?: string;
  source?: string;
  last_updated: string;
  data_type: string;
}

export interface JournalEntry {
  trade_id: string;
  date: string;
  timestamp?: string;
  asset: string;
  ticker: string;
  decision: string;
  direction: string;
  entry_price: string;
  position_size: string;
  capital_allocated: string;
  thesis: string;
  catalyst: string;
  supporting_data: string;
  risk: string;
  invalidation: string;
  stop_loss: string;
  target: string;
  holding_period: string;
  confidence: string;
  sources: string[];
  strategy_fit: string;
  special_risk_warning: string | null;
  why_it_could_be_wrong?: string;
  status?: string;
}

export interface EquityPoint {
  date: string;
  nav: number;
  weekly_pnl: number;
  note: string;
}

export interface WeeklyReport {
  id: string;
  title: string;
  week_start: string;
  week_end: string;
  published: string;
  decision: string;
  starting_nav: number;
  ending_nav: number;
  weekly_pnl: number;
  weekly_return_pct: number;
  trades_opened: string[];
  trades_closed: string[];
  winners: string[];
  losses: string[];
  loss_analysis: string;
  what_worked: string;
  process_review: string;
  committee: { role: string; weight: number; view: string; lean: string }[];
}

export interface FundFile {
  meta: {
    name: string;
    type: string;
    description: string;
    objective: string;
    disclaimer: string;
    inception: string;
    week: string;
    last_published: string;
    status: string;
    prior_fund_archive: string;
  };
  account: {
    starting_value: number;
    current_value: number;
    return_pct: number;
    weekly_pnl: number;
    weekly_return_pct: number;
    cash_balance: number;
    cash_pct: number;
    unrealised_pl: number;
    realised_pl: number;
    gross_exposure: number;
    gross_exposure_pct: number;
    max_drawdown_pct: number;
    current_drawdown_pct: number;
    risk_level: string;
    open_positions: number;
    closed_trades: number;
    currency: string;
    last_updated: string;
    data_type: string;
    oracle_confidence_index: number | null;
    oracle_confidence_note: string;
    best_opportunity: string;
    best_opportunity_confidence: number;
    largest_risk: string;
  };
  rules: {
    position_limits: string[];
    cash_reserve: string;
    risk_per_trade: string;
    confidence_gate: string;
    drawdown_ladder: { level: string; action: string; status: string }[];
    conduct: string[];
  };
  allocation: { category: string; target_pct: number; actual_pct: number; note: string }[];
  positions: Position[];
  closed_trades: ClosedTrade[];
  post_trade_reviews: unknown[];
  trade_log: JournalEntry[];
  exposure: { by_asset_type: { label: string; pct: number }[]; by_region: { label: string; pct: number }[]; by_theme: { label: string; pct: number }[] };
  contributors: { asset: string; pl: number }[];
  detractors: { asset: string; pl: number }[];
  benchmarks: {
    period: string;
    rows: { metric: string; portfolio: string; brent: string; wti: string; energy_etf: string; notes: string }[];
    note: string;
    last_updated: string;
    data_type: string;
  };
  equity_curve: EquityPoint[];
  marks: Record<string, string | number>;
  opportunities: Opportunity[];
  weekly_reports: WeeklyReport[];
  daily_brief: {
    date: string;
    title: string;
    sections: { n: number; label: string; text: string }[];
    source: string;
    last_updated: string;
    data_type: string;
  };
  next_events: { date: string; event: string; relevance: string }[];
}

export function usd(n: number, signed = false): string {
  const abs = Math.abs(Math.round(n)).toLocaleString("en-US");
  if (!signed) return `$${abs}`;
  if (n > 0) return `+$${abs}`;
  if (n < 0) return `−$${abs}`;
  return `$${abs}`;
}

export function pct(n: number, digits = 2): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

export function toneClass(n: number): string {
  if (n > 0) return "text-gain";
  if (n < 0) return "text-loss";
  return "text-white";
}

/** Payoff for a long, a short, or a spread that profits when the quoted spread falls. */
export function payoffRatio(
  entry: number,
  stop: number,
  target: number,
  style: "long" | "short" | "spread-short",
): number | null {
  const risk = style === "long" ? entry - stop : stop - entry;
  const reward = style === "long" ? target - entry : entry - target;
  if (!(risk > 0) || !(reward > 0)) return null;
  return reward / risk;
}

export interface PerformanceSnapshot {
  closedCount: number;
  winCount: number;
  lossCount: number;
  winRate: number | null;
  lossRate: number | null;
  avgWin: number | null;
  avgLoss: number | null;
  profitFactor: number | null;
  expectancy: number | null;
  avgPayoff: number | null;
  sharpe: number | null;
  sortino: number | null;
  weeklyReturns: number[];
  limitation: string | null;
  byDirection: { direction: string; pnl: number; count: number }[];
  byStrategy: { strategy: string; pnl: number; count: number }[];
  byAsset: { asset: string; pnl: number; count: number }[];
}

const MIN_CLOSED_FOR_RATIOS = 8;

export function performanceOf(fund: FundFile): PerformanceSnapshot {
  const closed = fund.closed_trades;
  const wins = closed.filter((t) => t.realised_pl > 0);
  const losses = closed.filter((t) => t.realised_pl < 0);
  const grossWin = wins.reduce((s, t) => s + t.realised_pl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.realised_pl, 0));
  const enough = closed.length >= MIN_CLOSED_FOR_RATIOS;

  const weeklyReturns: number[] = [];
  for (let i = 1; i < fund.equity_curve.length; i += 1) {
    const prev = fund.equity_curve[i - 1].nav;
    if (prev > 0) weeklyReturns.push((fund.equity_curve[i].nav - prev) / prev);
  }
  const enoughWeeks = weeklyReturns.length >= MIN_CLOSED_FOR_RATIOS;

  const buckets = (key: (t: ClosedTrade) => string) => {
    const map = new Map<string, { pnl: number; count: number }>();
    for (const t of closed) {
      const k = key(t);
      const row = map.get(k) ?? { pnl: 0, count: 0 };
      row.pnl += t.realised_pl;
      row.count += 1;
      map.set(k, row);
    }
    for (const p of fund.positions) {
      const k = key({
        direction: p.direction,
        strategy: p.strategy ?? p.category,
        asset: p.asset,
      } as ClosedTrade);
      const row = map.get(k) ?? { pnl: 0, count: 0 };
      row.pnl += p.unrealised_pl;
      row.count += 1;
      map.set(k, row);
    }
    return Array.from(map.entries()).map(([name, row]) => ({ name, ...row }));
  };

  return {
    closedCount: closed.length,
    winCount: wins.length,
    lossCount: losses.length,
    winRate: enough ? wins.length / closed.length : null,
    lossRate: enough ? losses.length / closed.length : null,
    avgWin: enough && wins.length ? grossWin / wins.length : null,
    avgLoss: enough && losses.length ? grossLoss / losses.length : null,
    profitFactor: enough && grossLoss > 0 ? grossWin / grossLoss : null,
    expectancy: enough && closed.length ? closed.reduce((s, t) => s + t.realised_pl, 0) / closed.length : null,
    avgPayoff: null,
    sharpe: enoughWeeks ? sharpe(weeklyReturns) : null,
    sortino: enoughWeeks ? sortino(weeklyReturns) : null,
    weeklyReturns,
    limitation:
      closed.length < MIN_CLOSED_FOR_RATIOS || weeklyReturns.length < MIN_CLOSED_FOR_RATIOS
        ? `Win rate, profit factor, expectancy, Sharpe and Sortino need at least ${MIN_CLOSED_FOR_RATIOS} closed trades and ${MIN_CLOSED_FOR_RATIOS} weekly returns. This book has ${closed.length} closed trade${closed.length === 1 ? "" : "s"} and ${weeklyReturns.length} weekly return${weeklyReturns.length === 1 ? "" : "s"}.`
        : null,
    byDirection: buckets((t) => t.direction).map((r) => ({ direction: r.name, pnl: r.pnl, count: r.count })),
    byStrategy: buckets((t) => t.strategy ?? "unspecified").map((r) => ({ strategy: r.name, pnl: r.pnl, count: r.count })),
    byAsset: buckets((t) => t.asset).map((r) => ({ asset: r.name, pnl: r.pnl, count: r.count })),
  };
}

function mean(xs: number[]): number {
  return xs.reduce((s, n) => s + n, 0) / xs.length;
}

function sharpe(weekly: number[]): number {
  const m = mean(weekly);
  const variance = mean(weekly.map((r) => (r - m) ** 2));
  const sd = Math.sqrt(variance);
  if (sd === 0) return 0;
  return (m / sd) * Math.sqrt(52);
}

function sortino(weekly: number[]): number {
  const m = mean(weekly);
  const downside = weekly.filter((r) => r < 0);
  if (downside.length === 0) return m > 0 ? Infinity : 0;
  const dd = Math.sqrt(mean(downside.map((r) => r ** 2)));
  if (dd === 0) return 0;
  return (m / dd) * Math.sqrt(52);
}

export interface ArchiveEntry {
  id: string;
  kind: "open" | "closed" | "decision";
  outcome: "open" | "win" | "loss" | "flat" | "no-trade";
  title: string;
  direction: string;
  opened: string;
  closed: string | null;
  entry: string;
  exit: string | null;
  pnl: number | null;
  returnPct: number | null;
  thesis: string;
  exitRationale: string | null;
  holding: string;
  confidence: string;
  searchable: string;
}

export function archiveEntries(fund: FundFile): ArchiveEntry[] {
  const fromOpen: ArchiveEntry[] = fund.positions.map((p) => ({
    id: p.trade_id ?? p.id,
    kind: "open",
    outcome: "open",
    title: p.asset,
    direction: p.direction,
    opened: p.opened_at ?? p.last_updated,
    closed: null,
    entry: p.entry_price,
    exit: null,
    pnl: p.unrealised_pl,
    returnPct: null,
    thesis: p.thesis ?? p.decision ?? "",
    exitRationale: null,
    holding: "Open",
    confidence: p.confidence != null ? String(p.confidence) : "—",
    searchable: `${p.trade_id ?? ""} ${p.id} ${p.asset} ${p.ticker} ${p.direction} ${p.thesis ?? ""}`.toLowerCase(),
  }));

  const fromClosed: ArchiveEntry[] = fund.closed_trades.map((t) => ({
    id: t.trade_id ?? t.id,
    kind: "closed",
    outcome: t.realised_pl > 0 ? "win" : t.realised_pl < 0 ? "loss" : "flat",
    title: t.asset,
    direction: t.direction,
    opened: t.date_opened,
    closed: t.date_closed,
    entry: t.entry_price,
    exit: t.exit_price,
    pnl: t.realised_pl,
    returnPct: t.return_pct,
    thesis: t.lesson,
    exitRationale: t.reason_closed,
    holding: t.holding_period ?? `${t.date_opened} → ${t.date_closed}`,
    confidence: "—",
    searchable: `${t.id} ${t.asset} ${t.ticker} ${t.direction} ${t.reason_closed} ${t.lesson}`.toLowerCase(),
  }));

  const openIds = new Set(fromOpen.map((e) => e.id));
  const fromJournal: ArchiveEntry[] = fund.trade_log
    .filter((t) => !openIds.has(t.trade_id))
    .map((t) => ({
      id: t.trade_id,
      kind: "decision" as const,
      outcome: t.decision.toLowerCase().includes("no trade") ? ("no-trade" as const) : ("flat" as const),
      title: t.asset,
      direction: t.direction,
      opened: t.timestamp ?? t.date,
      closed: null,
      entry: t.entry_price,
      exit: null,
      pnl: null,
      returnPct: null,
      thesis: t.thesis,
      exitRationale: t.why_it_could_be_wrong ?? null,
      holding: t.holding_period,
      confidence: t.confidence,
      searchable: `${t.trade_id} ${t.asset} ${t.decision} ${t.thesis} ${t.risk}`.toLowerCase(),
    }));

  return [...fromOpen, ...fromClosed, ...fromJournal];
}

export function factorSum(opp: Opportunity): number {
  return opp.factors.reduce((s, f) => s + f.score, 0);
}
