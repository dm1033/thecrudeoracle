import { describe, expect, it } from "vitest";
import { spotDeskNote } from "@/lib/desk-note";
import { formatPriceDate, priceIsStale, priceSourceLabel } from "@/lib/price-stamp";
import type { PublishedPrices } from "@/lib/published-prices";
import type { MarketPrice } from "@/lib/data";

function price(partial: Partial<MarketPrice> & Pick<MarketPrice, "ticker" | "price" | "data_type" | "source" | "last_updated">): MarketPrice {
  return {
    asset: partial.ticker,
    currency: "USD",
    daily_change: 1,
    weekly_change: 0,
    monthly_change: 0,
    trend: "up",
    source_url: "https://www.eia.gov/",
    ...partial,
  };
}

describe("price stamp", () => {
  it("formats the trade date in UTC and flags anything older than 7 days", () => {
    expect(formatPriceDate("2026-10-14T00:00:00Z")).toBe("14 Oct 2026");
    expect(priceIsStale("2026-10-14T00:00:00Z", Date.parse("2026-10-20T00:00:00Z"))).toBe(false);
    expect(priceIsStale("2026-10-14T00:00:00Z", Date.parse("2026-10-22T00:00:00Z"))).toBe(true);
    expect(priceSourceLabel({ source: "EIA Open Data API — Brent", data_type: "delayed" })).toBe("EIA");
    expect(priceSourceLabel({ source: "EIA (indicative)", data_type: "manual" })).toBe("desk mark");
  });
});

describe("spot desk note", () => {
  it("states the EIA prints and does not give a valuation view", () => {
    const feed: PublishedPrices = {
      eia: true,
      manualUpdated: "2026-07-15T07:00:00Z",
      eiaUpdated: "2026-10-14T00:00:00Z",
      brentWtiHistory: [],
      henryHubHistory: [],
      prices: [
        price({
          ticker: "BRN",
          price: 126.55,
          daily_change: 0.4,
          data_type: "delayed",
          source: "EIA Open Data API — Brent",
          last_updated: "2026-10-14T00:00:00Z",
        }),
        price({
          ticker: "WTI",
          price: 120.1,
          daily_change: -0.2,
          data_type: "delayed",
          source: "EIA Open Data API — WTI",
          last_updated: "2026-10-14T00:00:00Z",
        }),
        price({
          ticker: "HH",
          price: 3.15,
          daily_change: 1.1,
          data_type: "delayed",
          source: "EIA Open Data API — Henry Hub",
          last_updated: "2026-10-14T00:00:00Z",
        }),
      ],
    };
    const text = spotDeskNote(feed).join(" ");
    expect(text).toContain("$126.55");
    expect(text).toContain("$3.15");
    expect(text).toContain("Information only, not investment advice.");
    expect(text.toLowerCase()).not.toContain("attractive");
    expect(text).not.toContain("79.15");
    expect(text).not.toContain("78");
  });

  it("does not repeat a July desk mark when EIA is down", () => {
    const feed: PublishedPrices = {
      eia: false,
      manualUpdated: "2026-07-15T07:00:00Z",
      eiaUpdated: null,
      brentWtiHistory: [],
      henryHubHistory: [],
      prices: [
        price({
          ticker: "BRN",
          price: 79.15,
          data_type: "manual",
          source: "ICE via EIA (indicative)",
          last_updated: "2026-07-15T07:00:00Z",
        }),
      ],
    };
    const text = spotDeskNote(feed).join(" ");
    expect(text).not.toContain("79.15");
    expect(text).toContain("no crude price is stated");
    expect(text).toContain("Information only, not investment advice.");
  });
});
