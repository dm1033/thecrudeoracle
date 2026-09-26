import { describe, expect, it } from "vitest";
// The CODA paper-trade engine is dependency-free ESM; import it directly.
import {
  loadPortfolio,
  recompute,
  proposeTrades,
  applyTrades,
  validate,
} from "../../agent/lib/portfolio.mjs";

const TODAY = "2026-09-26";

describe("CODA SIMULATED paper-trade engine", () => {
  it("the shipped virtual portfolio is internally consistent", () => {
    const pf = recompute(loadPortfolio(), null);
    expect(() => validate(pf)).not.toThrow();
  });

  it("proposeTrades is deterministic", () => {
    const a = proposeTrades(recompute(loadPortfolio(), null), null);
    const b = proposeTrades(recompute(loadPortfolio(), null), null);
    expect(a).toEqual(b);
  });

  it("an applied proposal stays internally consistent (passes the same identities the data suite enforces)", () => {
    const before = recompute(loadPortfolio(), null);
    const { trades } = proposeTrades(before, null);
    const after = trades.length ? applyTrades(before, trades, TODAY) : before;
    expect(() => validate(after)).not.toThrow();
  });

  it("trading does not change the marked current_value (only crystallises P/L)", () => {
    const before = recompute(loadPortfolio(), null);
    const { trades } = proposeTrades(before, null);
    if (!trades.length) return;
    const after = applyTrades(before, trades, TODAY);
    expect(Math.abs(after.account.current_value - before.account.current_value)).toBeLessThanOrEqual(1);
  });

  it("never breaches the minimum cash reserve or the position caps", () => {
    const before = recompute(loadPortfolio(), null);
    const { trades } = proposeTrades(before, null);
    const after = trades.length ? applyTrades(before, trades, TODAY) : before;
    expect(after.account.cash_pct).toBeGreaterThanOrEqual(10 - 0.2);
    for (const p of after.positions) {
      expect(p.weight_pct).toBeLessThanOrEqual(20 + 1e-9);
      const single = !/futures|etc|etf/i.test(p.id) && !/futures|etc|etf/i.test(p.asset ?? "");
      if (single) expect(p.weight_pct).toBeLessThanOrEqual(10 + 1e-9);
    }
  });

  it("preserves the mandatory paper-trading disclaimer and virtual-capital type", () => {
    const before = recompute(loadPortfolio(), null);
    const { trades } = proposeTrades(before, null);
    const after = trades.length ? applyTrades(before, trades, TODAY) : before;
    expect(after.meta.disclaimer).toContain("not financial advice");
    expect(after.meta.type.toLowerCase()).toContain("virtual capital");
  });

  it("rejects a portfolio that violates an accounting identity", () => {
    const pf = recompute(loadPortfolio(), null);
    pf.account.cash_balance += 50000; // break cash + deployed = starting
    expect(() => validate(pf)).toThrow(/validation failed/i);
  });
});
