import { describe, expect, it } from "vitest";
import { assertRequiredFields, assertValidPastDate, isFiniteNumber, loadJson } from "./helpers";

interface Account {
  starting_value: number;
  current_value: number;
  return_pct: number;
  cash_balance: number;
  cash_pct: number;
  unrealised_pl: number;
  realised_pl: number;
  max_drawdown_pct: number;
  last_updated: string;
  data_type: string;
}

interface Position {
  id: string;
  category: string;
  asset: string;
  capital_allocated: number;
  weight_pct: number;
  unrealised_pl: number;
  realised_pl: number;
  last_updated: string;
  data_type: string;
}

interface ClosedTrade {
  id: string;
  capital_allocated: number;
  realised_pl: number;
  last_updated: string;
  data_type: string;
}

interface Allocation {
  category: string;
  target_pct: number;
  actual_pct: number;
}

interface Rules {
  position_limits: string[];
  cash_reserve: string;
}

interface PortfolioFile {
  meta: { inception: string; last_published: string; status: string };
  account: Account;
  rules: Rules;
  allocation: Allocation[];
  positions: Position[];
  closed_trades: ClosedTrade[];
}

describe("data/virtual-portfolio.json", () => {
  const data = loadJson<PortfolioFile>("virtual-portfolio.json");

  it("parses and has the expected top-level shape", () => {
    expect(data.account).toBeTypeOf("object");
    expect(Array.isArray(data.positions)).toBe(true);
    expect(Array.isArray(data.allocation)).toBe(true);
    expect(Array.isArray(data.closed_trades)).toBe(true);
    expect(Array.isArray(data.rules.position_limits)).toBe(true);
  });

  it("account carries the fields the portfolio pages render", () => {
    assertRequiredFields(
      [data.account as unknown as Record<string, unknown>],
      [
        "starting_value",
        "current_value",
        "return_pct",
        "cash_balance",
        "cash_pct",
        "unrealised_pl",
        "realised_pl",
        "last_updated",
        "data_type",
      ],
      "last_updated",
    );
  });

  it("every position carries id, capital_allocated, weight_pct, last_updated and data_type", () => {
    assertRequiredFields(
      data.positions as unknown as Record<string, unknown>[],
      ["id", "category", "capital_allocated", "weight_pct", "last_updated", "data_type"],
      "id",
    );
  });

  it("account.current_value = starting_value + unrealised_pl + realised_pl (within $1)", () => {
    const { starting_value, current_value, unrealised_pl, realised_pl } = data.account;
    const expected = starting_value + unrealised_pl + realised_pl;
    expect(Math.abs(current_value - expected)).toBeLessThanOrEqual(1);
  });

  it("account.return_pct agrees with (current_value - starting_value) / starting_value", () => {
    const { starting_value, current_value, return_pct } = data.account;
    const expectedPct = ((current_value - starting_value) / starting_value) * 100;
    // return_pct is published rounded to 1 decimal — allow a generous but
    // real tolerance rather than loosening this into a no-op.
    expect(Math.abs(return_pct - expectedPct)).toBeLessThan(0.15);
  });

  it("account.unrealised_pl equals the sum of every open position's unrealised_pl", () => {
    const sum = data.positions.reduce((acc, p) => acc + p.unrealised_pl, 0);
    expect(Math.abs(sum - data.account.unrealised_pl)).toBeLessThanOrEqual(1);
  });

  it("account.realised_pl equals the sum of every closed trade's realised_pl", () => {
    const sum = data.closed_trades.reduce((acc, t) => acc + t.realised_pl, 0);
    expect(Math.abs(sum - data.account.realised_pl)).toBeLessThanOrEqual(1);
  });

  it("cash_balance + sum(position capital_allocated) reconciles to starting_value (within $1)", () => {
    const deployed = data.positions.reduce((acc, p) => acc + p.capital_allocated, 0);
    expect(Math.abs(deployed + data.account.cash_balance - data.account.starting_value)).toBeLessThanOrEqual(1);
  });

  it("cash_pct matches cash_balance / starting_value (within 0.2 percentage points)", () => {
    const expectedPct = (data.account.cash_balance / data.account.starting_value) * 100;
    expect(Math.abs(data.account.cash_pct - expectedPct)).toBeLessThan(0.2);
  });

  it("every position's weight_pct matches capital_allocated / starting_value (within 0.2pp)", () => {
    for (const p of data.positions) {
      const expectedPct = (p.capital_allocated / data.account.starting_value) * 100;
      expect(Math.abs(p.weight_pct - expectedPct), `position ${p.id}`).toBeLessThan(0.2);
    }
  });

  it("allocation actual_pct sums to ~100%", () => {
    const sum = data.allocation.reduce((acc, a) => acc + a.actual_pct, 0);
    expect(Math.abs(sum - 100)).toBeLessThan(0.5);
  });

  it("allocation target_pct sums to ~100%", () => {
    const sum = data.allocation.reduce((acc, a) => acc + a.target_pct, 0);
    expect(Math.abs(sum - 100)).toBeLessThan(0.5);
  });

  it("each allocation category's actual_pct matches the sum of that category's position weight_pct", () => {
    for (const a of data.allocation) {
      if (a.category === "Cash Reserve") continue; // no "position" rows for cash
      const sum = data.positions
        .filter((p) => p.category === a.category)
        .reduce((acc, p) => acc + p.weight_pct, 0);
      expect(Math.abs(sum - a.actual_pct), `category "${a.category}"`).toBeLessThan(0.2);
    }
  });

  it("no position's weight_pct exceeds the position-limit ceilings stated in rules.position_limits", () => {
    // rules.position_limits is free text (edited by a non-engineer), so we
    // parse out just the numeric caps rather than assume a fixed order —
    // e.g. "Speculative position: maximum 5%" -> 5. The overall ceiling is
    // the highest cap named (currently the 20% high-conviction cap); no
    // single position should ever exceed the loosest stated limit.
    const caps = data.rules.position_limits
      .map((line) => {
        const match = line.match(/maximum\s+(\d+(?:\.\d+)?)%/i);
        return match ? Number(match[1]) : null;
      })
      .filter((n): n is number => n !== null);
    expect(caps.length, "expected at least one numeric cap in rules.position_limits").toBeGreaterThan(0);
    const looseCeiling = Math.max(...caps);
    for (const p of data.positions) {
      expect(p.weight_pct, `position ${p.id} (${p.category}) weight_pct`).toBeLessThanOrEqual(looseCeiling);
    }
  });

  it("no single-equity position exceeds the 10% single-equity cap", () => {
    // Single-equity positions are identified by their id-prefix scheme
    // (P-xxx) minus the ones that are explicitly futures/ETC/ETF instruments,
    // which the rules text carves out separately (margin-adjusted notional,
    // or fund wrappers rather than a single equity line).
    const nonEquityMarkers = /futures|etc|etf/i;
    for (const p of data.positions) {
      const isSingleEquity = !nonEquityMarkers.test(p.id) && !nonEquityMarkers.test(p.asset ?? "");
      if (isSingleEquity) {
        expect(p.weight_pct, `position ${p.id} single-equity weight_pct`).toBeLessThanOrEqual(10);
      }
    }
  });

  it("account and position dates are valid and not in the future", () => {
    assertValidPastDate(data.account.last_updated, "account.last_updated");
    assertValidPastDate(data.meta.inception, "meta.inception");
    assertValidPastDate(data.meta.last_published, "meta.last_published");
    for (const p of data.positions) {
      assertValidPastDate(p.last_updated, `position ${p.id}.last_updated`);
    }
  });

  it("every position's capital_allocated and weight_pct are finite, non-negative numbers", () => {
    for (const p of data.positions) {
      expect(isFiniteNumber(p.capital_allocated), `${p.id}.capital_allocated`).toBe(true);
      expect(isFiniteNumber(p.weight_pct), `${p.id}.weight_pct`).toBe(true);
      expect(p.capital_allocated, `${p.id}.capital_allocated`).toBeGreaterThanOrEqual(0);
      expect(p.weight_pct, `${p.id}.weight_pct`).toBeGreaterThanOrEqual(0);
    }
  });
});
