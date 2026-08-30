import { describe, expect, it } from "vitest";
import { ALLOWED_DATA_TYPES, assertRequiredFields, assertValidPastDate, loadJson } from "./helpers";

interface Company {
  company: string;
  ticker: string;
  exchange: string;
  country: string;
  description: string;
  production_exposure: string;
  reserves_note: string;
  financial_health_note: string;
  valuation_note: string;
  management_note: string;
  catalyst: string;
  risk: string;
  latest_update: string;
  sources: { name: string; url: string }[];
  last_updated: string;
  data_type: string;
}

interface CompanyIntelFile {
  meta: { description: string; last_published: string; status: string };
  companies: Company[];
}

describe("data/company-intelligence.json", () => {
  const data = loadJson<CompanyIntelFile>("company-intelligence.json");

  it("parses and has the expected top-level shape", () => {
    expect(Array.isArray(data.companies)).toBe(true);
    expect(data.companies.length).toBeGreaterThan(0);
  });

  it("every company has every field the IntelCard component renders", () => {
    assertRequiredFields(
      data.companies as unknown as Record<string, unknown>[],
      [
        "company",
        "ticker",
        "exchange",
        "country",
        "description",
        "production_exposure",
        "reserves_note",
        "financial_health_note",
        "valuation_note",
        "management_note",
        "catalyst",
        "risk",
        "latest_update",
        "last_updated",
        "data_type",
      ],
      "ticker",
    );
  });

  it("tickers are unique (used as the React list key)", () => {
    const tickers = data.companies.map((c) => c.ticker);
    expect(new Set(tickers).size).toBe(tickers.length);
  });

  it("every company has at least one source with a name and url", () => {
    for (const c of data.companies) {
      expect(Array.isArray(c.sources), c.ticker).toBe(true);
      expect(c.sources.length, `${c.ticker} sources`).toBeGreaterThan(0);
      for (const s of c.sources) {
        expect(s.url, `${c.ticker} source url`).toMatch(/^https?:\/\//);
      }
    }
  });

  it("data_type is one of DataMeta's BADGE_STYLES keys", () => {
    // NOTE: src/app/company-intelligence/page.tsx currently hardcodes
    // `<DataTypeBadge dataType="manual" />` instead of reading `c.data_type`
    // (see report) — this record-level field is still validated here
    // because it is real, hand-edited data and a schema contract other
    // code/future pages may rely on.
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
