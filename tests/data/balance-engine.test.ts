import { describe, expect, it } from "vitest";
import {
  ALLOWED_DATA_TYPES,
  ALLOWED_IMPACTS,
  ALLOWED_TRENDS,
  assertRequiredFields,
  assertValidPastDate,
  loadJson,
} from "./helpers";

interface BalanceRow {
  metric: string;
  value: string;
  unit: string;
  change: string;
  trend: string;
  impact: string;
  note: string;
  source: string;
  source_url: string;
  last_updated: string;
  data_type: string;
}

interface BalanceSummary {
  total_supply: number;
  total_demand: number;
  implied_balance: number;
  unit: string;
  comment: string;
  source: string;
  last_updated: string;
  data_type: string;
}

interface BalanceEngineFile {
  meta: { description: string; last_published: string; status: string };
  balance_summary: BalanceSummary;
  supply: BalanceRow[];
  demand: BalanceRow[];
  stocks: BalanceRow[];
}

describe("data/balance-engine.json", () => {
  const data = loadJson<BalanceEngineFile>("balance-engine.json");

  it("parses and has the expected top-level shape", () => {
    for (const section of ["supply", "demand", "stocks"] as const) {
      expect(Array.isArray(data[section]), section).toBe(true);
      expect(data[section].length, `${section} should not be empty`).toBeGreaterThan(0);
    }
    expect(data.balance_summary).toBeTypeOf("object");
  });

  it("balance_summary.implied_balance = total_supply - total_demand (within 0.05)", () => {
    const { total_supply, total_demand, implied_balance } = data.balance_summary;
    expect(Math.abs(implied_balance - (total_supply - total_demand))).toBeLessThan(0.05);
  });

  for (const section of ["supply", "demand", "stocks"] as const) {
    it(`${section}: every row has the fields BalanceTable renders`, () => {
      assertRequiredFields(
        data[section] as unknown as Record<string, unknown>[],
        ["metric", "value", "unit", "trend", "impact", "source", "source_url", "last_updated", "data_type"],
        "metric",
      );
    });

    it(`${section}: trend is one of BalanceTable's TREND_GLYPH keys`, () => {
      for (const row of data[section]) {
        expect(ALLOWED_TRENDS, `${section}/${row.metric}.trend = "${row.trend}"`).toContain(row.trend);
      }
    });

    it(`${section}: impact is one of BalanceTable's IMPACT_STYLE keys`, () => {
      for (const row of data[section]) {
        expect(ALLOWED_IMPACTS, `${section}/${row.metric}.impact = "${row.impact}"`).toContain(row.impact);
      }
    });

    it(`${section}: data_type is one of the values the UI recognises`, () => {
      for (const row of data[section]) {
        expect(ALLOWED_DATA_TYPES, `${section}/${row.metric}.data_type`).toContain(row.data_type);
      }
    });

    it(`${section}: last_updated is a valid date and not in the future`, () => {
      for (const row of data[section]) {
        assertValidPastDate(row.last_updated, `${section}/${row.metric}.last_updated`);
      }
    });
  }

  it("balance_summary.last_updated is valid and not in the future", () => {
    assertValidPastDate(data.balance_summary.last_updated, "balance_summary.last_updated");
  });
});
