import { describe, expect, it } from "vitest";
import {
  ALLOWED_DATA_TYPES,
  ALLOWED_IMPACTS,
  ALLOWED_SEVERITY,
  ALLOWED_TRENDS,
  assertRequiredFields,
  assertValidPastDate,
  isFiniteNumber,
  loadJson,
} from "./helpers";

interface BalanceRow {
  metric: string;
  value: string;
  unit: string;
  trend: string;
  impact: string;
  source: string;
  source_url: string;
  last_updated: string;
  data_type: string;
}

interface Anomaly {
  id: string;
  severity: string;
  sigma: number;
  title: string;
  observed: string;
  baseline: string;
  explanation: string;
  source: string;
  last_updated: string;
  data_type: string;
}

interface FlowSummary {
  comment: string;
  data_type: string;
  headline: string;
  last_updated: string;
  source: string;
}

interface FlowMapFile {
  meta: { description: string; last_published: string; status: string; methodology: string };
  flow_summary: FlowSummary;
  anomalies: Anomaly[];
  loadings: BalanceRow[];
  discharges: BalanceRow[];
  signals: BalanceRow[];
}

const ROW_SECTIONS = ["loadings", "discharges", "signals"] as const;

describe("data/flow-map.json", () => {
  const data = loadJson<FlowMapFile>("flow-map.json");

  it("parses and has the expected top-level shape", () => {
    expect(Array.isArray(data.anomalies)).toBe(true);
    expect(data.anomalies.length).toBeGreaterThan(0);
    for (const section of ROW_SECTIONS) {
      expect(Array.isArray(data[section]), section).toBe(true);
      expect(data[section].length, `${section} should not be empty`).toBeGreaterThan(0);
    }
  });

  it("anomaly ids are unique (used as the React list key)", () => {
    const ids = data.anomalies.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every anomaly has the fields the anomaly card renders", () => {
    assertRequiredFields(
      data.anomalies as unknown as Record<string, unknown>[],
      ["id", "severity", "sigma", "title", "observed", "baseline", "explanation", "source", "last_updated", "data_type"],
      "id",
    );
  });

  it("anomaly severity is one of SEVERITY_STYLE's keys, and sigma is a finite number", () => {
    for (const a of data.anomalies) {
      expect(ALLOWED_SEVERITY, `${a.id}.severity = "${a.severity}"`).toContain(a.severity);
      expect(isFiniteNumber(a.sigma), `${a.id}.sigma`).toBe(true);
    }
  });

  it("anomaly severity respects the file's own documented alert/watch thresholds", () => {
    // meta.methodology: "Anomalies are flagged at |sigma| >= 1.5 (watch) and
    // |sigma| >= 2.0 (alert)" — "info" is not given a sigma floor by that
    // text (it's used here for a sub-threshold-but-still-notable entry,
    // "td3c-freight" at sigma 1.2), so only watch/alert are enforced.
    for (const a of data.anomalies) {
      if (a.severity === "watch") {
        expect(Math.abs(a.sigma), `${a.id} is severity "watch" but sigma is below the 1.5 watch threshold`).toBeGreaterThanOrEqual(1.5);
      }
      if (a.severity === "alert") {
        expect(Math.abs(a.sigma), `${a.id} is severity "alert" but sigma is below the 2.0 alert threshold`).toBeGreaterThanOrEqual(2.0);
      }
    }
  });

  for (const section of ROW_SECTIONS) {
    it(`${section}: every row has the fields BalanceTable renders`, () => {
      assertRequiredFields(
        data[section] as unknown as Record<string, unknown>[],
        ["metric", "value", "unit", "trend", "impact", "source", "source_url", "last_updated", "data_type"],
        "metric",
      );
    });

    it(`${section}: trend/impact are within BalanceTable's known badge sets`, () => {
      for (const row of data[section]) {
        expect(ALLOWED_TRENDS, `${section}/${row.metric}.trend`).toContain(row.trend);
        expect(ALLOWED_IMPACTS, `${section}/${row.metric}.impact`).toContain(row.impact);
      }
    });
  }

  it("every data_type in the file is one of the values the UI recognises", () => {
    const allDataTypes = [
      data.flow_summary.data_type,
      ...data.anomalies.map((a) => a.data_type),
      ...ROW_SECTIONS.flatMap((s) => data[s].map((r) => r.data_type)),
    ];
    for (const dt of allDataTypes) {
      expect(ALLOWED_DATA_TYPES, `data_type = "${dt}"`).toContain(dt);
    }
  });

  it("all last_updated dates are valid and not in the future", () => {
    assertValidPastDate(data.flow_summary.last_updated, "flow_summary.last_updated");
    for (const a of data.anomalies) assertValidPastDate(a.last_updated, `anomaly ${a.id}.last_updated`);
    for (const section of ROW_SECTIONS) {
      for (const row of data[section]) assertValidPastDate(row.last_updated, `${section}/${row.metric}.last_updated`);
    }
  });
});
