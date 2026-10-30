import { describe, expect, it } from "vitest";
import { buildDailySeriesResult, type EiaObservation } from "@/lib/eia";
import {
  brentWtiSpread,
  buildDailyNote,
  describeChange,
  seriesWindow,
  type PricePoint,
} from "@/lib/daily-note";
import { getDailyFeed, resetDailyFeedCache } from "@/lib/daily-feed";

const BRENT: PricePoint[] = [
  { date: "2026-09-01", value: 70 },
  { date: "2026-09-15", value: 72 },
  { date: "2026-10-01", value: 74 },
  { date: "2026-10-20", value: 80 },
  { date: "2026-10-23", value: 81 },
  { date: "2026-10-24", value: 82 },
  { date: "2026-10-29", value: 79.5 },
  { date: "2026-10-30", value: 80 },
  { date: "2026-10-31", value: 99 },
];

function calendarDays(start: string, count: number, valueAt: (index: number) => number): PricePoint[] {
  const points: PricePoint[] = [];
  const date = new Date(`${start}T00:00:00Z`);
  for (let i = 0; i < count; i++) {
    points.push({ date: date.toISOString().slice(0, 10), value: valueAt(i) });
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return points;
}

function observation(point: PricePoint): EiaObservation {
  return {
    date: point.date,
    value: point.value,
    rawValue: point.value,
    units: "$/BBL",
    seriesId: "RBRTE",
    sourceUrl: "https://www.eia.gov/",
  };
}

describe("series changes", () => {
  it("computes day, week and month changes from the comparison print, not a guessed figure", () => {
    const window = seriesWindow(BRENT, "2026-10-30");
    expect(window).not.toBeNull();
    expect(window?.latest).toEqual({ date: "2026-10-30", value: 80 });
    expect(window?.day).toMatchObject({ absolute: 0.5, percent: 0.63, versusDate: "2026-10-29", versusValue: 79.5 });
    expect(window?.week).toMatchObject({ absolute: -1, percent: -1.23, versusDate: "2026-10-23", versusValue: 81 });
    expect(window?.month).toMatchObject({ absolute: 8, percent: 11.11, versusDate: "2026-09-15", versusValue: 72 });
    expect(window?.lastFive.map((point) => point.date)).toEqual([
      "2026-10-20",
      "2026-10-23",
      "2026-10-24",
      "2026-10-29",
      "2026-10-30",
    ]);
  });

  it("ignores prints after the as-of date", () => {
    const window = seriesWindow(BRENT, "2026-10-30");
    expect(window?.lastFive.some((point) => point.value === 99)).toBe(false);
    expect(seriesWindow(BRENT, "2026-08-01")).toBeNull();
  });

  it("leaves the percent null when the comparison print is zero", () => {
    const window = seriesWindow(
      [
        { date: "2026-10-01", value: 0 },
        { date: "2026-10-02", value: 1 },
      ],
      "2026-10-02"
    );
    expect(window?.day.absolute).toBe(1);
    expect(window?.day.percent).toBeNull();
    expect(describeChange(window!.day)).toBe("up $1.00 from 1 Oct 2026");
  });

  it("uses absolute value in the percent so a negative base still has a sign", () => {
    const window = seriesWindow(
      [
        { date: "2026-10-01", value: -10 },
        { date: "2026-10-02", value: -5 },
      ],
      "2026-10-02"
    );
    expect(window?.day).toMatchObject({ absolute: 5, percent: 50 });
  });

  it("says unchanged when the rounded prints are equal", () => {
    const window = seriesWindow(
      [
        { date: "2026-10-01", value: 5 },
        { date: "2026-10-02", value: 5 },
      ],
      "2026-10-02"
    );
    expect(describeChange(window!.day)).toBe("unchanged from 1 Oct 2026");
    expect(describeChange({ absolute: null, percent: null, versusDate: null, versusValue: null })).toBe("not available");
  });

  it("matches the EIA client percent for a dense daily series", () => {
    const points = calendarDays("2026-09-01", 60, (index) => 70 + index * 0.5);
    const latest = points[points.length - 1].date;
    const window = seriesWindow(points, latest);
    const eia = buildDailySeriesResult([...points].reverse().map(observation));
    expect(window?.day.percent).toBe(eia.dailyChangePct);
    expect(window?.week.percent).toBe(eia.weeklyChangePct);
    expect(window?.month.percent).toBe(eia.monthlyChangePct);
    expect(window?.day.absolute).toBe(0.5);
  });
});

describe("Brent–WTI spread", () => {
  it("uses the newest shared trade date and does not pair mismatched days", () => {
    const wti: PricePoint[] = [
      { date: "2026-10-29", value: 70 },
      { date: "2026-10-24", value: 71 },
    ];
    expect(brentWtiSpread(BRENT, wti, "2026-10-30")).toEqual({
      date: "2026-10-29",
      brent: 79.5,
      wti: 70,
      value: 9.5,
    });
    expect(
      brentWtiSpread(
        [{ date: "2026-10-30", value: 80 }],
        [{ date: "2026-10-30", value: 82.25 }],
        "2026-10-30"
      )
    ).toEqual({ date: "2026-10-30", brent: 80, wti: 82.25, value: -2.25 });
  });
});

describe("morning note summary", () => {
  const note = buildDailyNote({
    asOf: "2026-10-30",
    brent: BRENT,
    wti: [
      { date: "2026-10-23", value: 74 },
      { date: "2026-10-29", value: 73.25 },
      { date: "2026-10-30", value: 73.5 },
    ],
    henryHub: [
      { date: "2026-10-29", value: 3.1 },
      { date: "2026-10-30", value: 3.05 },
    ],
    exact: true,
  });

  it("states the prints it was given and ends with the disclaimer", () => {
    expect(note).not.toBeNull();
    const text = note!.summary.join(" ");
    expect(note!.summary.at(-1)).toBe("Information only, not investment advice.");
    expect(text).toContain("$80.00 per barrel");
    expect(text).toContain("$73.50 per barrel");
    expect(text).toContain("$3.05 per MMBtu");
    expect(text).toContain("$6.50 per barrel");
    expect(text).toContain("lag of one to two business days");
    expect(text).not.toContain("99.00");
    expect(text).not.toContain("126.55");
    expect(text.toLowerCase()).not.toMatch(/\b(buy|sell|bullish|bearish|forecast|predict|target|recommend|attractive)\b/);
  });

  it("does not invent a gas price when Henry Hub is missing", () => {
    const crudeOnly = buildDailyNote({
      asOf: "2026-10-30",
      brent: BRENT,
      wti: [{ date: "2026-10-30", value: 73.5 }],
      henryHub: null,
      exact: true,
    });
    expect(crudeOnly?.henryHub).toBeNull();
    expect(crudeOnly?.summary.join(" ")).toContain("no gas price is stated");
    expect(crudeOnly?.summary.join(" ")).not.toContain("MMBtu");
  });

  it("returns null for an archive date with no Brent print", () => {
    expect(
      buildDailyNote({
        asOf: "2026-10-25",
        brent: BRENT,
        wti: [{ date: "2026-10-24", value: 70 }],
        henryHub: null,
        exact: true,
      })
    ).toBeNull();
  });
});

describe("daily feed without a key", () => {
  it("returns no prices rather than a stand-in figure", async () => {
    const saved = process.env.EIA_API_KEY;
    const savedAlt = process.env.EIA_API;
    delete process.env.EIA_API_KEY;
    delete process.env.EIA_API;
    resetDailyFeedCache();
    await expect(getDailyFeed()).resolves.toBeNull();
    if (saved === undefined) delete process.env.EIA_API_KEY;
    else process.env.EIA_API_KEY = saved;
    if (savedAlt === undefined) delete process.env.EIA_API;
    else process.env.EIA_API = savedAlt;
  });
});
