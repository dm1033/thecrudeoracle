import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { addDays, assembleForecast, buildDieselView, type DieselCache } from "@/lib/diesel-assemble";
import { DIESEL_SERIES_IDS } from "@/lib/diesel-series";
import { DIESEL_SETUPS } from "@/lib/diesel-setups";
import {
  buildForecast,
  crack,
  daysOfCover,
  gasoilCrack,
  seasonalSample,
  withBand,
  type ForecastInput,
  type Point,
} from "@/lib/diesel-model";

const root = path.resolve(__dirname, "../..");

function input(overrides: Partial<ForecastInput> = {}): ForecastInput {
  return {
    asOf: "2026-09-25",
    stocksMb: 100,
    fiveYearAvgMb: 120,
    belowBand: true,
    daysOfCover: 20,
    coverMedian: 30,
    padd1SeasonalLow: false,
    utilization: 80,
    yieldLatest: 0.3,
    yieldPrior: 0.28,
    crack: 10,
    crackMedian: 20,
    crackP90: 40,
    stocksDrawing: true,
    wpsrRelease: "2026-09-30",
    runAt: "2026-10-06T06:18:07Z",
    staleDays: 6,
    pullFailed: false,
    ...overrides,
  };
}

describe("diesel crack and cover math", () => {
  it("converts a gallon of ULSD into a barrel crack", () => {
    expect(crack(4.999, 96.16)).toBeCloseTo(113.798, 3);
  });

  it("converts gasoil tonnes with the 7.45 factor", () => {
    expect(gasoilCrack(745, 80)).toBeCloseTo(20, 5);
  });

  it("divides thousand-barrel stocks by product supplied", () => {
    expect(daysOfCover(105180, 3948)).toBeCloseTo(26.641, 2);
    expect(daysOfCover(105180, 0)).toBeNull();
  });
});

describe("diesel forecast rule", () => {
  it("calls the book tight and the crack supported when stocks and cover are both short and the crack is under the median", () => {
    const result = buildForecast(input());
    expect(result.bias).toBe("Tight");
    expect(result.crackBias).toBe("supported");
    expect(result.confidence).toBe("standard");
    expect(result.line).toContain("Model, not a ticket.");
  });

  it("fades a tight crack that is already at the one-year 90th percentile", () => {
    expect(buildForecast(input({ crack: 50 })).crackBias).toBe("fading");
  });

  it("calls the book loose only when stocks, cover, utilization and a flat yield all agree", () => {
    const result = buildForecast(
      input({
        stocksMb: 130,
        belowBand: false,
        daysOfCover: 40,
        utilization: 92,
        yieldLatest: 0.3,
        yieldPrior: 0.31,
      }),
    );
    expect(result.bias).toBe("Loose");
    expect(result.crackBias).toBe("fading");
  });

  it("stays balanced when stocks are light but cover and PADD 1 do not confirm", () => {
    const result = buildForecast(input({ daysOfCover: 40, padd1SeasonalLow: false }));
    expect(result.bias).toBe("Balanced");
    expect(result.crackBias).toBe("two-way");
  });

  it("marks a tight book from a PADD 1 seasonal low even when cover is easy", () => {
    expect(buildForecast(input({ daysOfCover: 40, padd1SeasonalLow: true })).bias).toBe("Tight");
  });

  it("drops confidence when the WPSR release is stale or the pull failed", () => {
    expect(buildForecast(input({ staleDays: 9 })).confidence).toBe("low");
    expect(buildForecast(input({ pullFailed: true, staleDays: 1 })).confidence).toBe("low");
  });
});

describe("seasonal band", () => {
  it("excludes the current calendar year from the five-year sample", () => {
    const end = "2026-09-25";
    const points: Point[] = [5, 4, 3, 2, 1, 0].map((yearsBack) => ({
      period: addDays(end, -364 * yearsBack),
      value: yearsBack === 0 ? 99 : yearsBack,
    }));
    const sample = seasonalSample(points, end);
    expect(sample).not.toContain(99);
    expect(sample.length).toBeGreaterThanOrEqual(3);
    const band = withBand(points);
    const current = band.find((point) => point.period === end);
    expect(current?.avg).not.toBe(99);
    expect(current?.avg).not.toBeNull();
  });
});

describe("diesel setups", () => {
  it("keeps three expressions and no order language", () => {
    expect(DIESEL_SETUPS).toHaveLength(3);
    const text = DIESEL_SETUPS.map((setup) => `${setup.title} ${setup.expression} ${setup.invalidation}`).join("\n");
    expect(text.toLowerCase()).not.toMatch(/buy ho/);
    expect(text.toLowerCase()).not.toMatch(/position size/);
    expect(text.toLowerCase()).not.toMatch(/live order/);
    expect(text).not.toMatch(/\$\d/);
    for (const setup of DIESEL_SETUPS) {
      expect(setup.expression.length).toBeGreaterThan(0);
      expect(setup.invalidation.length).toBeGreaterThan(0);
    }
  });
});

describe("diesel cache and published forecast", () => {
  const cache = JSON.parse(readFileSync(path.join(root, "data", "diesel-cache.json"), "utf8")) as DieselCache;
  const forecast = JSON.parse(readFileSync(path.join(root, "data", "diesel-forecast.json"), "utf8"));

  it("holds every pinned series and a finite latest stock", () => {
    expect(Object.keys(cache.series).sort()).toEqual([...DIESEL_SERIES_IDS].sort());
    const stocks = cache.series.WDISTUS1.points;
    const latest = stocks[stocks.length - 1];
    expect(latest[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(latest[1]).toBeGreaterThan(50_000);
    expect(latest[1]).toBeLessThan(250_000);
    const sulfur =
      cache.series.WD0ST_NUS_1.points.at(-1)![1] +
      cache.series.WD1ST_NUS_1.points.at(-1)![1] +
      cache.series.WDGSTUS1.points.at(-1)![1];
    expect(Math.abs(sulfur - latest[1])).toBeLessThan(50);
  });

  it("matches the forecast file to the rule run against that cache", () => {
    const again = assembleForecast(cache, forecast.runAt);
    expect(again.forecast).toEqual(forecast.forecast);
    expect(again.input).toEqual(forecast.input);
    expect(again.forecast.line).toContain("Model, not a ticket.");
    const view = buildDieselView(cache);
    expect(view.daysOfCover).toBe(forecast.input.daysOfCover);
    expect(view.crackWti).toBe(forecast.input.crack);
    expect(view.charts.stocks.length).toBeGreaterThan(50);
  });
});
