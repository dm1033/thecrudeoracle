import { describe, expect, it } from "vitest";
import { resolveDeskCommand } from "@/lib/desk-bot-artifacts";
import { buildSeasonalSeries, isoWeekParts } from "@/lib/eia-seasonal";
import { brentWtiSpread, movingAverage, rebase, sliceRange } from "@/lib/historical-series";
import { CHOKEPOINTS } from "@/lib/chokepoints";

const empty = { prices: [], cftc: null, cftcPercentile: null, news: [], steoRows: [] };

describe("spot history math", () => {
  const points = [
    { date: "2026-01-01", value: 80 },
    { date: "2026-01-08", value: 88 },
    { date: "2026-01-15", value: 84 },
  ];

  it("slices a window from the newest print and rebases the first point to 100", () => {
    expect(sliceRange(points, "1W").map((point) => point.date)).toEqual(["2026-01-08", "2026-01-15"]);
    expect(rebase(points)[0].value).toBe(100);
    expect(rebase(points)[1].value).toBeCloseTo(110);
  });

  it("starts a moving average only once the window is full", () => {
    expect(movingAverage(points, 2)).toEqual([
      { date: "2026-01-08", value: 84 },
      { date: "2026-01-15", value: 86 },
    ]);
  });

  it("spreads only shared dates", () => {
    expect(brentWtiSpread(points, [{ date: "2026-01-15", value: 80 }])).toEqual([{ date: "2026-01-15", value: 4 }]);
  });
});

describe("seasonal bands", () => {
  it("treats 1 Jan 2026 as ISO week 1", () => {
    expect(isoWeekParts("2026-01-01")).toEqual({ isoYear: 2026, isoWeek: 1 });
  });

  it("records a change only when the prior print is seven days earlier", () => {
    const series = buildSeasonalSeries("WCESTUS1", "Crude", [
      { date: "2024-01-05", value: 420 },
      { date: "2024-01-12", value: 418 },
      { date: "2025-01-10", value: 430 },
      { date: "2026-01-09", value: 410 },
      { date: "2026-01-20", value: 412 },
    ]);
    expect(series.points.find((point) => point.date === "2024-01-12")?.change).toBe(-2);
    expect(series.points.find((point) => point.date === "2026-01-20")?.change).toBeNull();
    expect(series.bands.find((band) => band.isoWeek === isoWeekParts("2026-01-09").isoWeek)?.current).toBe(410);
  });
});

describe("desk commands", () => {
  it("does not invent a print when the board is empty", () => {
    const result = resolveDeskCommand("/spread brent-wti", empty);
    expect(result.artifact).toBeNull();
    expect(result.trace[0]?.status).toBe("unavailable");
    expect(JSON.stringify(result)).not.toMatch(/\d+\.\d{2}/);
  });

  it("keeps the six reference chokepoints and rejects an unknown one", () => {
    expect(CHOKEPOINTS.map((item) => item.id)).toEqual(["hormuz", "bab-el-mandeb", "suez", "malacca", "usgc", "north-sea"]);
    expect(resolveDeskCommand("/chokepoint nowhere", empty).trace[0]?.status).toBe("unavailable");
  });
});
