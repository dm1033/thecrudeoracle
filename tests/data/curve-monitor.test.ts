import { describe, expect, it } from "vitest";
import {
  ALLOWED_DATA_TYPES,
  ALLOWED_MOMENTUM,
  ALLOWED_PHYSICAL_CHECK,
  ALLOWED_VALUATIONS,
  assertRequiredFields,
  assertValidPastDate,
  loadJson,
} from "./helpers";

interface SpreadRow {
  instrument: string;
  value: string;
  unit: string;
  change: string;
  valuation: string;
  momentum: string;
  physical_check: string;
  note: string;
  source: string;
  source_url: string;
  last_updated: string;
  data_type: string;
}

interface CurveSummary {
  brent_state: string;
  comment: string;
  data_type: string;
  headline: string;
  last_updated: string;
  source: string;
  wti_state: string;
}

interface CurveMonitorFile {
  meta: { description: string; last_published: string; status: string };
  curve_summary: CurveSummary;
  flat_price: SpreadRow[];
  timespreads: SpreadRow[];
  differentials: SpreadRow[];
  cracks: SpreadRow[];
  arbitrage: SpreadRow[];
}

const SECTIONS = ["flat_price", "timespreads", "differentials", "cracks", "arbitrage"] as const;

describe("data/curve-monitor.json", () => {
  const data = loadJson<CurveMonitorFile>("curve-monitor.json");

  it("parses and has the expected top-level shape", () => {
    for (const section of SECTIONS) {
      expect(Array.isArray(data[section]), section).toBe(true);
      expect(data[section].length, `${section} should not be empty`).toBeGreaterThan(0);
    }
    expect(data.curve_summary).toBeTypeOf("object");
  });

  for (const section of SECTIONS) {
    it(`${section}: every row has the fields SpreadTable renders`, () => {
      assertRequiredFields(
        data[section] as unknown as Record<string, unknown>[],
        [
          "instrument",
          "value",
          "unit",
          "valuation",
          "momentum",
          "physical_check",
          "source",
          "source_url",
          "last_updated",
          "data_type",
        ],
        "instrument",
      );
    });

    it(`${section}: valuation/momentum/physical_check are within SpreadTable's known badge sets`, () => {
      for (const row of data[section]) {
        expect(ALLOWED_VALUATIONS, `${section}/${row.instrument}.valuation`).toContain(row.valuation);
        expect(ALLOWED_MOMENTUM, `${section}/${row.instrument}.momentum`).toContain(row.momentum);
        expect(ALLOWED_PHYSICAL_CHECK, `${section}/${row.instrument}.physical_check`).toContain(
          row.physical_check,
        );
      }
    });

    it(`${section}: data_type is one of the values the UI recognises`, () => {
      for (const row of data[section]) {
        expect(ALLOWED_DATA_TYPES, `${section}/${row.instrument}.data_type`).toContain(row.data_type);
      }
    });

    it(`${section}: last_updated is a valid date and not in the future`, () => {
      for (const row of data[section]) {
        assertValidPastDate(row.last_updated, `${section}/${row.instrument}.last_updated`);
      }
    });
  }

  it("curve_summary has headline/comment/state fields and a valid last_updated", () => {
    assertRequiredFields(
      [data.curve_summary as unknown as Record<string, unknown>],
      ["headline", "comment", "brent_state", "wti_state", "source", "last_updated", "data_type"],
      "source",
    );
    assertValidPastDate(data.curve_summary.last_updated, "curve_summary.last_updated");
  });
});
