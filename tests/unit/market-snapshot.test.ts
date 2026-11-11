import { describe, expect, it } from "vitest";
import { loadJson } from "../data/helpers";
import { parseMarketSnapshot } from "@/lib/market-snapshot";

const cftcRow = (report_date: string, long: number, short: number) => ({
  report_date,
  contract: "WTI-PHYSICAL - NEW YORK MERCANTILE EXCHANGE",
  open_interest: 2_000_000,
  managed_money_long: long,
  managed_money_short: short,
  managed_money_spreading: 100,
  managed_money_net: 999_999, // deliberately wrong: the parser must recompute it
});

const eiaRow = (period: string, value: number, series = "WCESTUS1") => ({
  period,
  series,
  value_thousand_bbl: value,
  units: "MBBL",
});

describe("parseMarketSnapshot", () => {
  it("returns empty sections for a missing or malformed file", () => {
    for (const raw of [null, undefined, [], "x", {}, { cftc_wti_managed_money: [], eia_us_crude_stocks: 5 }]) {
      const snapshot = parseMarketSnapshot(raw);
      expect(snapshot.cftc).toEqual({ fetchedAt: null, rows: [] });
      expect(snapshot.eia.rows).toEqual([]);
      expect(snapshot.eia.fetchedAt).toBeNull();
    }
  });

  it("sorts CFTC rows newest first, recomputes net and derives the change", () => {
    const { cftc } = parseMarketSnapshot({
      cftc_wti_managed_money: {
        updated_at_utc: "2026-11-13T21:00:00Z",
        rows: [cftcRow("2026-11-03", 200, 80), cftcRow("2026-11-10", 250, 70)],
      },
    });
    expect(cftc.fetchedAt).toBe("2026-11-13T21:00:00Z");
    expect(cftc.rows.map((row) => row.reportDate)).toEqual(["2026-11-10", "2026-11-03"]);
    expect(cftc.rows[0].net).toBe(180);
    expect(cftc.rows[0].netChange).toBe(60);
    expect(cftc.rows[0].previousReportDate).toBe("2026-11-03");
    expect(cftc.rows[1].netChange).toBeNull();
  });

  it("drops CFTC rows with a missing, non-numeric or negative field instead of showing zero", () => {
    const { cftc } = parseMarketSnapshot({
      cftc_wti_managed_money: {
        rows: [
          cftcRow("2026-11-10", 250, 70),
          { ...cftcRow("2026-11-03", 200, 80), managed_money_short: undefined },
          { ...cftcRow("2026-10-27", 200, 80), managed_money_long: "200" },
          { ...cftcRow("2026-10-20", 200, 80), open_interest: -1 },
          { ...cftcRow("not-a-date", 200, 80) },
          cftcRow("2026-11-10", 1, 1), // duplicate date
          null,
        ],
      },
    });
    expect(cftc.rows).toHaveLength(1);
    expect(cftc.rows[0].long).toBe(250);
  });

  it("converts EIA stocks to million barrels with a week-on-week change", () => {
    const { eia } = parseMarketSnapshot({
      eia_us_crude_stocks: {
        updated_at_utc: "2026-11-11T16:00:00Z",
        rows: [eiaRow("2026-10-30", 420_500), eiaRow("2026-11-06", 421_750)],
      },
    });
    expect(eia.series).toBe("WCESTUS1");
    expect(eia.rows[0]).toEqual({
      weekEnding: "2026-11-06",
      thousandBarrels: 421_750,
      millionBarrels: 421.75,
      changeMillionBarrels: 1.25,
      previousWeekEnding: "2026-10-30",
    });
    expect(eia.rows[1].changeMillionBarrels).toBeNull();
  });

  it("never shows rows from another EIA series (e.g. stocks including the SPR)", () => {
    const { eia } = parseMarketSnapshot({
      eia_us_crude_stocks: { rows: [eiaRow("2026-11-06", 830_000, "WCRSTUS1"), eiaRow("2026-11-06", 0)] },
    });
    expect(eia.rows).toEqual([]);
  });

  it("ignores an unparseable fetch timestamp", () => {
    const { cftc } = parseMarketSnapshot({ cftc_wti_managed_money: { updated_at_utc: "soon", rows: [] } });
    expect(cftc.fetchedAt).toBeNull();
  });
});

describe("data/market_snapshot.json", () => {
  it("is valid JSON whose every row survives the parser", () => {
    const raw = loadJson<Record<string, { rows?: unknown[] }>>("market_snapshot.json");
    const snapshot = parseMarketSnapshot(raw);
    expect(snapshot.cftc.rows).toHaveLength(raw.cftc_wti_managed_money?.rows?.length ?? 0);
    expect(snapshot.eia.rows).toHaveLength(raw.eia_us_crude_stocks?.rows?.length ?? 0);
  });
});
