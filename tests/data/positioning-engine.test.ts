import { describe, expect, it } from "vitest";
import {
  ALLOWED_DATA_TYPES,
  ALLOWED_LIQUIDATION_RISK,
  ALLOWED_STANCE,
  assertRequiredFields,
  assertValidPastDate,
  loadJson,
} from "./helpers";

interface PositionRow {
  instrument: string;
  net_position: string;
  change: string;
  percentile: string;
  stance: string;
  note: string;
  source: string;
  source_url: string;
  last_updated: string;
  data_type: string;
}

interface ChecklistItem {
  condition: string;
  status: string;
  detail: string;
}

interface CrowdRisk {
  id: string;
  instrument: string;
  direction_of_risk: string;
  checklist: ChecklistItem[];
  liquidation_risk: string;
  explanation: string;
  source: string;
  last_updated: string;
  data_type: string;
}

interface PositioningEngineFile {
  meta: { description: string; last_published: string; status: string; methodology: string };
  positioning: PositionRow[];
  crowd_risk: CrowdRisk[];
}

const ALLOWED_CHECKLIST_STATUS = ["yes", "no", "partial"];

describe("data/positioning-engine.json", () => {
  const data = loadJson<PositioningEngineFile>("positioning-engine.json");

  it("parses and has the expected top-level shape", () => {
    expect(Array.isArray(data.positioning)).toBe(true);
    expect(data.positioning.length).toBeGreaterThan(0);
    expect(Array.isArray(data.crowd_risk)).toBe(true);
    expect(data.crowd_risk.length).toBeGreaterThan(0);
  });

  it("every positioning row has the fields PositioningTable renders", () => {
    assertRequiredFields(
      data.positioning as unknown as Record<string, unknown>[],
      ["instrument", "net_position", "percentile", "stance", "source", "source_url", "last_updated", "data_type"],
      "instrument",
    );
  });

  it("stance is one of STANCE_STYLE's keys", () => {
    for (const row of data.positioning) {
      expect(ALLOWED_STANCE, `${row.instrument}.stance = "${row.stance}"`).toContain(row.stance);
    }
  });

  it("crowd_risk ids are unique, and every entry has the fields the card renders", () => {
    const ids = data.crowd_risk.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    assertRequiredFields(
      data.crowd_risk as unknown as Record<string, unknown>[],
      ["id", "instrument", "direction_of_risk", "liquidation_risk", "explanation", "source", "last_updated", "data_type"],
      "id",
    );
  });

  it("liquidation_risk is one of RISK_STYLE's keys, and checklist statuses are recognised", () => {
    for (const c of data.crowd_risk) {
      expect(ALLOWED_LIQUIDATION_RISK, `${c.id}.liquidation_risk = "${c.liquidation_risk}"`).toContain(
        c.liquidation_risk,
      );
      expect(Array.isArray(c.checklist), c.id).toBe(true);
      expect(c.checklist.length, `${c.id}.checklist`).toBeGreaterThan(0);
      for (const item of c.checklist) {
        expect(ALLOWED_CHECKLIST_STATUS, `${c.id} checklist status "${item.status}"`).toContain(item.status);
      }
    }
  });

  it("data_type is one of the values the UI recognises", () => {
    for (const row of data.positioning) expect(ALLOWED_DATA_TYPES, row.instrument).toContain(row.data_type);
    for (const c of data.crowd_risk) expect(ALLOWED_DATA_TYPES, c.id).toContain(c.data_type);
  });

  it("all last_updated dates are valid and not in the future", () => {
    for (const row of data.positioning) assertValidPastDate(row.last_updated, `${row.instrument}.last_updated`);
    for (const c of data.crowd_risk) assertValidPastDate(c.last_updated, `${c.id}.last_updated`);
  });
});
