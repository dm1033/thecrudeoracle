import { describe, expect, it } from "vitest";
import { assertValidPastDate, isFiniteNumber, loadJson } from "./helpers";

interface ChartDataFile {
  meta: { description: string; last_published: string; data_type: string; source: string };
  brent_wti_30d: { date: string; brent: number; wti: number }[];
  gas_trend_30d: { date: string; ttf: number; nbp: number; hh: number }[];
  opec_production_months: { month: string; production: number; target: number }[];
  rig_count_weeks: { week: string; oil: number; gas: number }[];
  sector_heatmap: { sector: string; move: number }[];
  us_inventories_weeks: { week: string; stocks: number; fiveYearAvg: number }[];
  watchlist_performance_30d: { date: string; watchlist: number; benchmark: number }[];
}

// This file has no per-record last_updated/data_type (only chart series
// points), so the invariants here are numeric sanity — a hand-edit typo
// like a stray string or a dropped digit would otherwise silently break
// recharts (which just renders NaN as a gap or a broken axis).
const NUMERIC_SERIES: { key: keyof ChartDataFile; fields: string[] }[] = [
  { key: "brent_wti_30d", fields: ["brent", "wti"] },
  { key: "gas_trend_30d", fields: ["ttf", "nbp", "hh"] },
  { key: "opec_production_months", fields: ["production", "target"] },
  { key: "rig_count_weeks", fields: ["oil", "gas"] },
  { key: "sector_heatmap", fields: ["move"] },
  { key: "us_inventories_weeks", fields: ["stocks", "fiveYearAvg"] },
  { key: "watchlist_performance_30d", fields: ["watchlist", "benchmark"] },
];

describe("data/chart-data.json", () => {
  const data = loadJson<ChartDataFile>("chart-data.json");

  it("parses and has every expected chart series, non-empty", () => {
    for (const { key } of NUMERIC_SERIES) {
      const series = data[key] as unknown[];
      expect(Array.isArray(series), String(key)).toBe(true);
      expect(series.length, `${String(key)} should not be empty`).toBeGreaterThan(0);
    }
  });

  it("every numeric field in every series is a finite number (recharts renders NaN as a silent gap)", () => {
    for (const { key, fields } of NUMERIC_SERIES) {
      const series = data[key] as unknown as Record<string, unknown>[];
      series.forEach((point, i) => {
        for (const field of fields) {
          expect(isFiniteNumber(point[field]), `${String(key)}[${i}].${field}`).toBe(true);
        }
      });
    }
  });

  it("brent/wti/ttf/nbp/hh price-like series are positive", () => {
    for (const p of data.brent_wti_30d) {
      expect(p.brent).toBeGreaterThan(0);
      expect(p.wti).toBeGreaterThan(0);
    }
    for (const p of data.gas_trend_30d) {
      expect(p.ttf).toBeGreaterThan(0);
      expect(p.nbp).toBeGreaterThan(0);
      expect(p.hh).toBeGreaterThan(0);
    }
  });

  it("meta.last_published is valid and not in the future", () => {
    assertValidPastDate(data.meta.last_published, "meta.last_published");
  });
});
