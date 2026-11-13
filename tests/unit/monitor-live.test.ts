import { describe, expect, it } from "vitest";
import type { EiaObservation } from "@/lib/eia";
import { pricesFromObservations, stockBlock } from "@/lib/monitor-live";

const obs = (date: string, value: number): EiaObservation => ({
  date,
  value,
  rawValue: value,
  units: "x",
  seriesId: "S",
  sourceUrl: "https://www.eia.gov/",
});

/** Newest-first run of n daily observations ending on 2026-11-10. */
function run(n: number, value: (i: number) => number): EiaObservation[] {
  return Array.from({ length: n }, (_, i) => {
    const day = new Date(Date.UTC(2026, 10, 10) - i * 86_400_000).toISOString().slice(0, 10);
    return obs(day, value(i));
  });
}

describe("pricesFromObservations", () => {
  it("returns null without both crude prints", () => {
    expect(pricesFromObservations({ brent: [], wti: run(5, () => 70) })).toBeNull();
    expect(pricesFromObservations({ brent: run(5, () => 70), wti: [] })).toBeNull();
  });

  it("computes spread, averages and the average daily move from the observations", () => {
    const built = pricesFromObservations({ brent: run(260, () => 80), wti: run(260, (i) => (i % 2 ? 74 : 75)) });
    expect(built?.asOf).toBe("2026-11-10");
    expect(built?.values).toMatchObject({
      brent_usd_bbl: 80,
      wti_usd_bbl: 75,
      brent_wti_spread_usd_bbl: 5,
      wti_50d_average_usd_bbl: 74.5,
      wti_200d_average_usd_bbl: 74.5,
      wti_30d_average_daily_move_usd_bbl: 1,
    });
  });

  it("leaves out the spread when the two prints are for different days", () => {
    const built = pricesFromObservations({ brent: run(3, () => 80).slice(1), wti: run(3, () => 75) });
    expect(built?.values).not.toHaveProperty("brent_wti_spread_usd_bbl");
    expect(built?.asOf).toBe("2026-11-10");
  });

  it("leaves out averages it has too little history for", () => {
    const built = pricesFromObservations({ brent: run(40, () => 80), wti: run(40, () => 75) });
    expect(built?.values).not.toHaveProperty("wti_50d_average_usd_bbl");
    expect(built?.values).not.toHaveProperty("wti_200d_average_usd_bbl");
    expect(built?.values).toHaveProperty("wti_30d_average_daily_move_usd_bbl");
  });

  it("computes the 3-2-1 crack only when all three prints share a day", () => {
    const wti = run(3, () => 75);
    const same = pricesFromObservations({ brent: wti, wti, gasoline: run(2, () => 2.2), diesel: run(2, () => 2.5) });
    expect(same?.values.crack_321_usd_bbl).toBe(21.6);
    const stale = pricesFromObservations({ brent: wti, wti, gasoline: run(3, () => 2.2).slice(1), diesel: run(2, () => 2.5) });
    expect(stale?.values).not.toHaveProperty("crack_321_usd_bbl");
    const missing = pricesFromObservations({ brent: wti, wti, gasoline: run(2, () => 2.2) });
    expect(missing?.values).not.toHaveProperty("crack_321_usd_bbl");
  });
});

describe("stockBlock", () => {
  it("returns null with no observations", () => {
    expect(stockBlock([])).toBeNull();
  });

  it("gives level and week-on-week change, and no z-score on a short history", () => {
    const block = stockBlock([obs("2026-11-06", 420.5), obs("2026-10-30", 421.75)]);
    expect(block).toEqual({
      week_ending: "2026-11-06",
      million_barrels: 420.5,
      change_million_barrels: -1.25,
      previous_week_ending: "2026-10-30",
    });
  });

  it("computes a z-score against at most 52 weeks", () => {
    const block = stockBlock(run(60, (i) => (i === 0 ? 430 : 420 + (i % 2))));
    expect(block?.weeks_in_comparison).toBe(52);
    expect(Number(block?.z_score)).toBeGreaterThan(2);
  });

  it("omits the z-score when the history has no spread", () => {
    expect(stockBlock(run(30, () => 420))).not.toHaveProperty("z_score");
  });
});
