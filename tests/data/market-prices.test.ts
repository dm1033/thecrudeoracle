import { describe, expect, it } from "vitest";
import {
  ALLOWED_DATA_TYPES,
  ALLOWED_TRENDS,
  assertRequiredFields,
  assertValidPastDate,
  isFiniteNumber,
  loadJson,
} from "./helpers";

interface Price {
  asset: string;
  ticker: string;
  price: number;
  currency: string;
  daily_change: number;
  weekly_change: number;
  monthly_change: number;
  trend: string;
  source: string;
  source_url: string;
  last_updated: string;
  data_type: string;
}

interface MarketPricesFile {
  meta: { description: string; last_published: string; status: string };
  prices: Price[];
}

describe("data/market-prices.json", () => {
  const data = loadJson<MarketPricesFile>("market-prices.json");

  it("parses and has the expected top-level shape", () => {
    expect(data.meta).toBeTypeOf("object");
    expect(Array.isArray(data.prices)).toBe(true);
    expect(data.prices.length).toBeGreaterThan(0);
  });

  it("every price record has the fields MarketCard/DataMeta render", () => {
    assertRequiredFields(
      data.prices as unknown as Record<string, unknown>[],
      ["asset", "ticker", "price", "currency", "source", "source_url", "last_updated", "data_type"],
      "ticker",
    );
  });

  it("every ticker is unique (used as a lookup key by getPrice())", () => {
    const tickers = data.prices.map((p) => p.ticker);
    expect(new Set(tickers).size).toBe(tickers.length);
  });

  it("price, daily_change, weekly_change and monthly_change are all finite numbers", () => {
    for (const p of data.prices) {
      expect(isFiniteNumber(p.price), `${p.ticker}.price`).toBe(true);
      expect(isFiniteNumber(p.daily_change), `${p.ticker}.daily_change`).toBe(true);
      expect(isFiniteNumber(p.weekly_change), `${p.ticker}.weekly_change`).toBe(true);
      expect(isFiniteNumber(p.monthly_change), `${p.ticker}.monthly_change`).toBe(true);
      // A price of 0 or below is not a plausible traded/quoted market price.
      expect(p.price, `${p.ticker}.price should be positive`).toBeGreaterThan(0);
    }
  });

  it("data_type is one of the values the UI actually styles (DataMeta BADGE_STYLES)", () => {
    for (const p of data.prices) {
      expect(ALLOWED_DATA_TYPES, `${p.ticker}.data_type = "${p.data_type}"`).toContain(p.data_type);
    }
  });

  it("trend is one of the values BalanceTable/similar components recognise", () => {
    for (const p of data.prices) {
      expect(ALLOWED_TRENDS, `${p.ticker}.trend = "${p.trend}"`).toContain(p.trend);
    }
  });

  it("last_updated is a valid date and not in the future", () => {
    for (const p of data.prices) {
      assertValidPastDate(p.last_updated, `prices[${p.ticker}].last_updated`);
    }
    assertValidPastDate(data.meta.last_published, "meta.last_published");
  });
});
