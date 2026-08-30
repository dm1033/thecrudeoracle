import { describe, expect, it } from "vitest";
import { ALLOWED_DATA_TYPES, assertRequiredFields, assertValidPastDate, loadJson } from "./helpers";

interface Company {
  company: string;
  ticker: string;
  exchange: string;
  country: string;
  sector: string;
  category: string;
  status: string;
  source: string;
  source_url: string;
  last_updated: string;
  data_type: string;
}

interface WatchlistFile {
  meta: { description: string; last_published: string; status: string };
  categories: string[];
  companies: Company[];
}

describe("data/investment-watchlist.json", () => {
  const data = loadJson<WatchlistFile>("investment-watchlist.json");

  it("parses and has the expected top-level shape", () => {
    expect(Array.isArray(data.categories)).toBe(true);
    expect(Array.isArray(data.companies)).toBe(true);
    expect(data.companies.length).toBeGreaterThan(0);
  });

  it("every company has the fields WatchlistPage/DataMeta render", () => {
    assertRequiredFields(
      data.companies as unknown as Record<string, unknown>[],
      ["company", "ticker", "exchange", "category", "source", "source_url", "last_updated", "data_type"],
      "ticker",
    );
  });

  it("tickers are unique (used as the React list key)", () => {
    const tickers = data.companies.map((c) => c.ticker);
    expect(new Set(tickers).size).toBe(tickers.length);
  });

  it("every company's category exists in the top-level categories list", () => {
    // The page groups companies by iterating `categories` and filtering
    // companies by category — a company whose category isn't in the list
    // would silently never render anywhere.
    for (const c of data.companies) {
      expect(data.categories, `company "${c.company}" category "${c.category}"`).toContain(c.category);
    }
  });

  it("data_type is one of DataMeta's BADGE_STYLES keys", () => {
    for (const c of data.companies) {
      expect(ALLOWED_DATA_TYPES, `${c.ticker}.data_type = "${c.data_type}"`).toContain(c.data_type);
    }
  });

  it("last_updated is a valid date and not in the future", () => {
    for (const c of data.companies) {
      assertValidPastDate(c.last_updated, `${c.ticker}.last_updated`);
    }
  });
});
