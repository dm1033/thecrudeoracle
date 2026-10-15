import { describe, expect, it } from "vitest";
import portfolio from "../../data/virtual-portfolio.json";
import watchlist from "../../data/investment-watchlist.json";
import { isSampleInstrument, PAPER_FUND_PUBLISHED } from "@/lib/sample-marks";

describe("sample marks", () => {
  it("flags SMPL tickers and (sample) or (placeholder) labels", () => {
    expect(isSampleInstrument(["SMPL-A"])).toBe(true);
    expect(isSampleInstrument(["SMPL-J", "Integrated Major"])).toBe(true);
    expect(isSampleInstrument(["CRUD-ETC", "Brent Crude ETC (sample)"])).toBe(true);
    expect(isSampleInstrument(["£XX bn (placeholder)"])).toBe(true);
    expect(isSampleInstrument(["BRN Sep-26", "ICE Brent futures"])).toBe(false);
    expect(isSampleInstrument([undefined, ""])).toBe(false);
  });

  it("withholds the paper fund while any book line is still a sample", () => {
    const lines = [...portfolio.positions, ...portfolio.closed_trades];
    const sampleLines = lines.filter((line) => isSampleInstrument([line.ticker, line.asset]));
    const cleanLines = lines.filter((line) => !isSampleInstrument([line.ticker, line.asset]));
    expect(sampleLines.length).toBeGreaterThan(0);
    expect(cleanLines.length).toBeGreaterThan(0);
    expect(PAPER_FUND_PUBLISHED).toBe(false);
  });

  it("treats the public watchlist tickers as sample instruments", () => {
    expect(watchlist.companies.length).toBeGreaterThan(0);
    expect(
      watchlist.companies.every((company) =>
        isSampleInstrument([company.ticker, company.company, company.market_cap]),
      ),
    ).toBe(true);
  });
});
