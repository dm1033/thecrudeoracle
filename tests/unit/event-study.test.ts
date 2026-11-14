import { describe, expect, it } from "vitest";
import { buildEventStudy, buildEvents, summarise, type Point } from "@/lib/event-study";

/** Fridays from `start`, one per value. */
function weeks(start: string, values: number[]): Point[] {
  return values.map((value, i) => {
    const d = new Date(`${start}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 7 * i);
    return { date: d.toISOString().slice(0, 10), value };
  });
}

/** Weekdays from `start` with a price from `price(dayIndex)`. */
function weekdays(start: string, count: number, price: (i: number) => number): Point[] {
  const out: Point[] = [];
  const d = new Date(`${start}T00:00:00Z`);
  while (out.length < count) {
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) out.push({ date: d.toISOString().slice(0, 10), value: price(out.length) });
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

describe("summarise", () => {
  it("gives median, mean, range and the share above zero", () => {
    expect(summarise([-2, 1, 3, 4], 1, 2)).toEqual({ horizon: 1, count: 4, median: 2, mean: 1.5, min: -2, max: 4, shareUp: 0.75 });
    expect(summarise([5, -1, 2], 0, 2)?.median).toBe(2);
    expect(summarise([], 0, 2)).toBeNull();
  });
});

describe("buildEvents", () => {
  // Fri 2 Jan and Fri 9 Jan 2026. The 9 Jan figure is released Wed 14 Jan.
  const stocks = weeks("2026-01-02", [420, 425]);
  const wti: Point[] = [
    { date: "2026-01-12", value: 99 },
    { date: "2026-01-13", value: 100 }, // last price before the release
    { date: "2026-01-14", value: 102 }, // release day
    { date: "2026-01-15", value: 101 },
    { date: "2026-01-16", value: 98 },
    { date: "2026-01-20", value: 97 }, // Monday is a holiday: no price
    { date: "2026-01-21", value: 104 },
    { date: "2026-01-22", value: 110 },
  ];
  const brent: Point[] = [
    { date: "2026-01-13", value: 104 },
    { date: "2026-01-14", value: 105 },
    { date: "2026-01-15", value: 106 },
    { date: "2026-01-22", value: 111 },
  ];

  it("measures from the last price before the release, in trading days", () => {
    const [event] = buildEvents(stocks, wti, brent);
    expect(event.weekEnding).toBe("2026-01-09");
    expect(event.releaseDate).toBe("2026-01-14");
    expect(event.stockChange).toBe(5);
    expect(event.base).toEqual({ date: "2026-01-13", value: 100 });
    expect(event.wtiPct).toEqual({ 0: 2, 1: 1, 3: -3, 5: 10 });
  });

  it("gives a spread change only when Brent has both days", () => {
    const [event] = buildEvents(stocks, wti, brent);
    // Spread was 4 before. Release day 105 − 102 = 3, next day 106 − 101 = 5, day five 111 − 110 = 1.
    expect(event.spreadChange).toEqual({ 0: -1, 1: 1, 5: -3 });
  });

  it("skips a week that follows a gap, and a release beyond the price history", () => {
    const gappy = [...weeks("2026-01-02", [420]), { date: "2026-01-16", value: 430 }];
    expect(buildEvents(gappy, wti, brent)).toEqual([]);
    expect(buildEvents(weeks("2026-03-06", [420, 425]), wti, brent)).toEqual([]);
    expect(buildEvents(weeks("2025-11-07", [420, 425]), wti, brent)).toEqual([]);
  });

  it("leaves out horizons the history does not reach", () => {
    const [event] = buildEvents(stocks, wti.slice(0, 4), brent);
    expect(event.wtiPct).toEqual({ 0: 2, 1: 1 });
  });
});

describe("buildEventStudy", () => {
  // 61 weeks of stocks: mostly flat, with a few large builds and draws.
  const levels: number[] = [400];
  for (let i = 1; i <= 60; i++) levels.push(levels[i - 1] + (i % 10 === 0 ? 8 : i % 10 === 5 ? -7 : i % 2 ? 0.5 : -0.5));
  const stocks = weeks("2025-01-03", levels);
  const wti = weekdays("2025-01-01", 330, (i) => 70 + (i % 5));
  const brent = wti.map((point) => ({ date: point.date, value: point.value + 3 }));

  it("splits the largest builds and draws from all weeks and shows the sample size", () => {
    const study = buildEventStudy(stocks, wti, brent, "now")!;
    expect(study.weeks).toBe(60);
    expect(study.groupSize).toBe(10);
    const [builds, draws, all] = study.groups;
    expect(builds.events.every((event) => event.stockChange > 0)).toBe(true);
    expect(builds.changeRange![1]).toBe(8);
    expect(draws.events.every((event) => event.stockChange < 0)).toBe(true);
    expect(draws.changeRange![0]).toBe(-7);
    expect(draws.events[0].stockChange).toBe(-7);
    expect(all.events).toHaveLength(60);
    expect(all.wti.map((row) => row.horizon)).toEqual([0, 1, 3, 5]);
    expect(all.wti[0].count).toBe(60);
    // Brent is WTI plus a constant, so the spread never changes.
    expect(all.spread.every((row) => row.median === 0 && row.min === 0 && row.max === 0)).toBe(true);
  });

  it("returns null with less than a year of weeks", () => {
    expect(buildEventStudy(stocks.slice(0, 30), wti, brent, "now")).toBeNull();
    expect(buildEventStudy([], [], [], "now")).toBeNull();
  });
});
