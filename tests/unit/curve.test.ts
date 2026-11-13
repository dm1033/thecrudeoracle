import { describe, expect, it } from "vitest";
import { FUTURES_SERIES, SPOT_SERIES, buildCurveFeed, buildPriceUrl, parsePriceResponse } from "@/lib/curve";

const row = (series: string, period: string, value: unknown, units = "$/BBL") => ({
  series,
  period,
  value,
  units,
  "series-description": `${series} name from EIA`,
});

const GAS = "EER_EPMRU_PF4_Y35NY_DPG";
const DIESEL = "EER_EPD2DXL0_PF4_Y35NY_DPG";

/** Consecutive calendar days ending on `end`, newest first, one value per day. */
function days(series: string, end: string, values: number[], units = "$/BBL") {
  return values.map((value, i) => {
    const d = new Date(`${end}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i);
    return row(series, d.toISOString().slice(0, 10), value, units);
  });
}

const parse = (rows: unknown[], wanted: Parameters<typeof parsePriceResponse>[1] = SPOT_SERIES) =>
  parsePriceResponse({ response: { data: rows } }, wanted);

describe("parsePriceResponse", () => {
  it("returns nothing for a malformed response", () => {
    for (const json of [null, {}, { response: {} }, { response: { data: "x" } }]) expect(parsePriceResponse(json, SPOT_SERIES)).toEqual([]);
  });

  it("keeps EIA's own name and unit, newest first, and drops rows it cannot trust", () => {
    const series = parse([
      row("RWTC", "2026-11-05", "60.5"),
      row("RWTC", "2026-11-06", 61),
      row("RWTC", "2026-11-06", 99), // duplicate date: first one wins
      row("RWTC", "2026-11", 62), // not a daily period
      row("RWTC", "2026-11-04", null),
      row("RWTC", "2026-11-03", 0), // a price of zero is not a price
      row("RBRTE", "2026-11-06", 65, "$/GAL"), // wrong unit for crude
      row("OTHER", "2026-11-06", 1),
      { ...row(GAS, "2026-11-06", 1.9, "$/GAL"), "series-description": "" },
      "junk",
    ]);
    expect(series).toEqual([
      {
        id: "RWTC",
        description: "RWTC name from EIA",
        unit: "$/BBL",
        points: [
          { date: "2026-11-06", value: 61 },
          { date: "2026-11-05", value: 60.5 },
        ],
      },
    ]);
  });
});

describe("buildCurveFeed", () => {
  const spots = parse([
    ...days("RBRTE", "2026-11-06", [65, 64, ...Array(40).fill(63)]),
    ...days("RWTC", "2026-11-06", [61, 60.5, ...Array(40).fill(59)]),
    ...days(GAS, "2026-11-06", [2, 1.95, ...Array(40).fill(1.9)], "$/GAL"),
    ...days(DIESEL, "2026-11-06", [2.5, 2.4, ...Array(40).fill(2.3)], "$/GAL"),
  ]);
  const futures = parse(
    [
      ...days("RCLC1", "2026-11-06", [61.2, 61]),
      ...days("RCLC2", "2026-11-06", [60.9, 60.8]),
      ...days("RCLC3", "2026-11-06", [60.6, 60.6]),
      ...days("RCLC4", "2026-11-06", [60.2, 60.4]),
    ],
    FUTURES_SERIES
  );

  it("works each spread from same-day prices", () => {
    const feed = buildCurveFeed(spots, [], "2026-11-13", "now")!;
    const get = (key: string) => feed.spreads.find((spread) => spread.key === key)!;
    expect(get("brent_wti").latest).toEqual({ date: "2026-11-06", value: 4 });
    expect(get("brent_wti").change).toBe(0.5);
    expect(get("brent_wti").monthAgo).toEqual({ date: "2026-10-07", value: 4 });
    expect(get("gasoline_crack").latest.value).toBe(23); // 2 × 42 − 61
    expect(get("diesel_crack").latest.value).toBe(44); // 2.5 × 42 − 61
    expect(get("crack_321").latest.value).toBe(30); // (2 × 84 + 105) / 3 − 61
    expect(feed.spots.map((spot) => spot.id)).toEqual(SPOT_SERIES.map((s) => s.id));
    expect(feed.spots[2].change).toBe(0.05);
    expect(feed.asOf).toBe("2026-11-06");
    expect(feed.history).toHaveLength(42);
    expect(feed.history[0].date < feed.history.at(-1)!.date).toBe(true);
  });

  it("leaves a day out of a spread when one of its prices is missing", () => {
    const partial = parse([
      ...days("RBRTE", "2026-11-06", [65, 64, 63]),
      row("RWTC", "2026-11-05", 60.5),
      row("RWTC", "2026-11-04", 59),
    ]);
    const feed = buildCurveFeed(partial, [], "2026-11-13", "now")!;
    expect(feed.spreads.map((spread) => spread.key)).toEqual(["brent_wti"]);
    expect(feed.spreads[0].latest).toEqual({ date: "2026-11-05", value: 3.5 });
    expect(feed.history.map((item) => item.date)).toEqual(["2026-11-04", "2026-11-05"]);
  });

  it("shows no crack without a crude price", () => {
    const feed = buildCurveFeed(parse(days(GAS, "2026-11-06", [2, 1.9], "$/GAL")), [], "2026-11-13", "now")!;
    expect(feed.spreads).toEqual([]);
    expect(feed.spots).toHaveLength(1);
  });

  it("shows recent futures with the near-minus-far difference", () => {
    const feed = buildCurveFeed(spots, futures, "2026-11-13", "now")!;
    expect(feed.futures!.date).toBe("2026-11-06");
    expect(feed.futures!.contracts.map((c) => [c.contract, c.value, c.change])).toEqual([
      [1, 61.2, 0.2],
      [2, 60.9, 0.1],
      [3, 60.6, 0],
      [4, 60.2, -0.2],
    ]);
    expect(feed.futures!.nearMinusFar).toBe(1);
    expect(feed.futures!.farContract).toBe(4);
    expect(feed.futuresLastDate).toBeNull();
  });

  it("does not show futures that EIA has stopped updating", () => {
    const feed = buildCurveFeed(spots, futures, "2026-11-17", "now")!;
    expect(feed.futures).toBeNull();
    expect(feed.futuresLastDate).toBe("2026-11-06");
  });

  it("drops a contract that lags the others, and the curve if contract 1 is the one missing", () => {
    const lagging = parse([...days("RCLC1", "2026-11-06", [61.2]), ...days("RCLC2", "2026-11-05", [60.9]), ...days("RCLC3", "2026-11-06", [60.6])], FUTURES_SERIES);
    expect(buildCurveFeed(spots, lagging, "2026-11-13", "now")!.futures!.contracts.map((c) => c.contract)).toEqual([1, 3]);
    const noFront = parse([...days("RCLC1", "2026-11-05", [61.2]), ...days("RCLC2", "2026-11-06", [60.9]), ...days("RCLC3", "2026-11-06", [60.6])], FUTURES_SERIES);
    expect(buildCurveFeed(spots, noFront, "2026-11-13", "now")!.futures).toBeNull();
  });

  it("returns null when nothing loaded", () => {
    expect(buildCurveFeed([], [], "2026-11-13", "now")).toBeNull();
  });
});

describe("buildPriceUrl", () => {
  it("asks for every series, newest first", () => {
    const url = new URL(buildPriceUrl("KEY", "petroleum/pri/fut", ["RCLC1", "RCLC2"], 40));
    expect(url.pathname).toBe("/v2/petroleum/pri/fut/data/");
    expect(url.searchParams.getAll("facets[series][]")).toEqual(["RCLC1", "RCLC2"]);
    expect(url.searchParams.get("frequency")).toBe("daily");
    expect(url.searchParams.get("sort[0][direction]")).toBe("desc");
    expect(url.searchParams.get("length")).toBe("40");
  });
});
