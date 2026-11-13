import { describe, expect, it } from "vitest";
import { buildDashboardCards, pickCards } from "@/lib/dashboard-cards";
import { parseMonitorFeed } from "@/lib/oracle-intelligence";
import type { SteoFeed } from "@/lib/steo";

const ok = (as_of: string, values: Record<string, unknown>) => ({
  status: "ok",
  as_of,
  fetched_utc: "2026-11-13T12:00:00Z",
  source_name: "Source",
  source_url: "https://example.org/",
  values,
});

const feed = parseMonitorFeed({
  modules: {
    prices: ok("2026-11-11", {
      brent_usd_bbl: 92.14,
      brent_date: "2026-11-11",
      wti_usd_bbl: 89.62,
      wti_date: "2026-11-11",
      crack_321_usd_bbl: 36.86,
      crack_321_date: "2026-11-11",
    }),
    inventories: ok("2026-11-06", {
      us_commercial_crude: {
        week_ending: "2026-11-06",
        million_barrels: 420.5,
        change_million_barrels: -2.1,
        previous_week_ending: "2026-10-30",
        change_vs_usual: -0.5,
        changes_compared: 51,
      },
    }),
    positioning: ok("2026-11-03", {
      managed_money_net: 21728,
      net_change: -9400,
      previous_report_date: "2026-10-27",
      net_change_vs_usual: -0.65,
      net_changes_compared: 51,
    }),
    news: ok("2026-11-12T07:00:00Z", { share_last_24h_vs_7d_average: 0.74, search_terms: ["Strait of Hormuz", "OPEC quota", 7] }),
  },
});

const steo: SteoFeed = {
  asOf: "2026-10",
  fetchedAt: "2026-11-13T12:00:00Z",
  balance: null,
  rows: [
    {
      id: "COPS_OPEC",
      role: "supply",
      description: "OPEC spare capacity as EIA names it",
      unit: "million barrels per day",
      latest: { period: "2026-10", value: 0.01 },
      yearAgo: { period: "2025-10", value: 3 },
      changeOnYear: -2.99,
      forecast: { period: "2027-01", value: 0.5 },
    },
    {
      id: "PATC_WORLD",
      role: "world_demand",
      description: "World consumption as EIA names it",
      unit: "million barrels per day",
      latest: { period: "2026-10", value: 102.8 },
      yearAgo: null,
      changeOnYear: null,
      forecast: null,
    },
  ],
};

describe("buildDashboardCards", () => {
  const cards = buildDashboardCards(feed, steo);

  it("builds a card only for what loaded", () => {
    expect(cards.supply.map((card) => card.id)).toEqual(["us-crude", "steo-cops_opec"]);
    expect(cards.demand.map((card) => card.id)).toEqual(["steo-patc_world", "crack-321"]);
    expect(cards.context.map((card) => card.id)).toEqual(["supply-news", "wti-positioning"]);
  });

  it("carries the figure, its own date and its source", () => {
    const stocks = cards.supply[0];
    expect(stocks.value).toBe("420.5 mb");
    expect(stocks.asOf).toBe("2026-11-06");
    expect(stocks.detail).toBe("Change on the previous report: −2.1 mb. Within its usual range for this series.");
    expect(stocks.sourceName).toBe("Source");

    const spare = cards.supply[1];
    expect(spare.label).toBe("OPEC spare capacity as EIA names it");
    expect(spare.value).toBe("0.01 million barrels per day");
    expect(spare.detail).toBe("EIA estimate for Oct 2026. A year earlier: 3.00 (−2.99). EIA forecast for Jan 2027: 0.50.");
    expect(spare.asOf).toBe("2026-10-01T00:00:00Z");

    expect(cards.demand[0].detail).toBe("EIA estimate for Oct 2026.");
    expect(cards.demand[1].value).toBe("$36.86/bbl");
  });

  it("describes news coverage as a count, not a risk level", () => {
    const news = cards.context[0];
    expect(news.value).toBe("0.74× its 7-day average");
    expect(news.detail).toContain("It is not a measure of risk.");
    expect(news.detail).toContain("Search terms: Strait of Hormuz, OPEC quota.");
    expect(news.asOf).toBe("2026-11-12T07:00:00Z");
  });

  it("never rates a figure as bullish, bearish or elevated", () => {
    const text = JSON.stringify(cards).toLowerCase();
    for (const word of ["bullish", "bearish", "elevated", "sample", "buy", "sell"]) expect(text).not.toContain(word);
  });

  it("is empty when nothing loaded", () => {
    expect(buildDashboardCards(parseMonitorFeed({}), null)).toEqual({ supply: [], demand: [], context: [] });
  });
});

describe("pickCards", () => {
  it("keeps the asked order, skips what is missing and caps the count", () => {
    const cards = buildDashboardCards(feed, steo);
    expect(pickCards(cards, ["supply-news", "cushing", "us-crude", "crack-321"], 2).map((card) => card.id)).toEqual(["supply-news", "us-crude"]);
  });
});
