import { describe, expect, it } from "vitest";
import { buildSteoFeed, buildSteoUrl, formatSteoMonth, parseSteoResponse } from "@/lib/steo";

const row = (seriesId: string, period: string, value: unknown, extra: Record<string, unknown> = {}) => ({
  seriesId,
  period,
  value,
  seriesDescription: `${seriesId} description from EIA`,
  unit: "million barrels per day",
  ...extra,
});

function months(seriesId: string, start: [number, number], values: number[]) {
  return values.map((value, i) => {
    const date = new Date(Date.UTC(start[0], start[1] - 1 + i, 1));
    return row(seriesId, `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`, value);
  });
}

describe("parseSteoResponse", () => {
  it("returns nothing for a malformed response", () => {
    for (const json of [null, {}, { response: {} }, { response: { data: "x" } }]) expect(parseSteoResponse(json)).toEqual([]);
  });

  it("keeps only requested series with a period, a finite value and EIA's own label and unit", () => {
    const series = parseSteoResponse({
      response: {
        data: [
          row("PAPR_WORLD", "2026-09", "103.5"),
          row("PAPR_WORLD", "2026-08", 103.1),
          row("PAPR_WORLD", "2026-08", 999), // duplicate month
          row("PAPR_WORLD", "2026-10", null),
          row("PAPR_WORLD", "2026-11", ""),
          row("PAPR_WORLD", "2026", 1),
          row("NOT_REQUESTED", "2026-09", 1),
          row("PATC_WORLD", "2026-09", 104, { seriesDescription: "" }),
          row("PATC_OECD", "2026-09", 45, { unit: 7 }),
          "junk",
        ],
      },
    });
    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({ id: "PAPR_WORLD", role: "world_supply", description: "PAPR_WORLD description from EIA" });
    expect(series[0].points).toEqual([
      { period: "2026-08", value: 103.1 },
      { period: "2026-09", value: 103.5 },
    ]);
  });
});

describe("buildSteoFeed", () => {
  const series = parseSteoResponse({
    response: {
      data: [
        ...months("PAPR_WORLD", [2025, 8], [100, 100, 100.5, 101, 101, 101, 102, 102, 102, 102, 103, 103, 103.2, 103.4, 103.6, 103.9, 104.1, 104.3]),
        ...months("PATC_WORLD", [2025, 8], [101, 101, 101, 101, 101, 101, 102, 102, 102, 102, 103, 103, 103.5, 103.7, 103.9, 104.0, 104.2, 104.4]),
        ...months("COPRPUS", [2026, 9], [13.4, 13.5]),
      ],
    },
  });
  const feed = buildSteoFeed(series, "2026-11", "2026-11-13T19:00:00Z");

  it("treats months before the current one as estimates and later ones as forecasts", () => {
    const supply = feed?.rows.find((r) => r.id === "PAPR_WORLD");
    expect(supply?.latest).toEqual({ period: "2026-10", value: 103.6 });
    expect(supply?.yearAgo).toEqual({ period: "2025-10", value: 100.5 });
    expect(supply?.changeOnYear).toBeCloseTo(3.1, 6);
    expect(supply?.forecast).toEqual({ period: "2027-01", value: 104.3 });
    expect(feed?.asOf).toBe("2026-10");
  });

  it("computes the balance as supply minus demand for the same estimated month", () => {
    expect(feed?.balance?.period).toBe("2026-10");
    expect(feed?.balance?.balance).toBeCloseTo(-0.3, 6);
    expect(feed?.balance?.unit).toBe("million barrels per day");
  });

  it("leaves year-ago, change and forecast empty when EIA has not published them", () => {
    const us = feed?.rows.find((r) => r.id === "COPRPUS");
    expect(us).toMatchObject({ yearAgo: null, changeOnYear: null, forecast: null });
    expect(us?.latest.period).toBe("2026-10");
  });

  it("gives no balance when supply and demand end on different months or units", () => {
    const uneven = parseSteoResponse({ response: { data: [...months("PAPR_WORLD", [2026, 9], [103, 104]), ...months("PATC_WORLD", [2026, 9], [103])] } });
    expect(buildSteoFeed(uneven, "2026-11", "x")?.balance).toBeNull();
    const units = parseSteoResponse({
      response: { data: [row("PAPR_WORLD", "2026-10", 103), row("PATC_WORLD", "2026-10", 104, { unit: "something else" })] },
    });
    expect(buildSteoFeed(units, "2026-11", "x")?.balance).toBeNull();
  });

  it("returns null when no series has an estimated month", () => {
    expect(buildSteoFeed([], "2026-11", "x")).toBeNull();
    const future = parseSteoResponse({ response: { data: [row("PAPR_WORLD", "2026-12", 1)] } });
    expect(buildSteoFeed(future, "2026-11", "x")).toBeNull();
  });
});

describe("helpers", () => {
  it("builds a monthly STEO query that carries the key only as a parameter", () => {
    const url = new URL(buildSteoUrl("KEY", "2025-08", "2027-05"));
    expect(url.pathname).toBe("/v2/steo/data/");
    expect(url.searchParams.get("frequency")).toBe("monthly");
    expect(url.searchParams.getAll("facets[seriesId][]")).toContain("PAPR_WORLD");
    expect(url.searchParams.get("start")).toBe("2025-08");
  });

  it("formats a month", () => {
    expect(formatSteoMonth("2026-10")).toBe("Oct 2026");
  });
});
