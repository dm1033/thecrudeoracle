import { describe, expect, it } from "vitest";
import { ALLOWED_DATA_TYPES, ALLOWED_HYPOTHESIS_STATUS, assertRequiredFields, assertValidPastDate, loadJson } from "./helpers";

interface Hypothesis {
  id: string;
  title: string;
  thesis_type: string;
  status: string;
  opened: string;
  evidence: { point: string; module_ref: string; strength: string }[];
  invalidation: string[];
  confidence_pct: number;
  last_updated: string;
  data_type: string;
}

interface HypothesisBuilderFile {
  meta: { description: string; last_published: string; status: string; methodology: string };
  hypotheses: Hypothesis[];
}

const ALLOWED_STRENGTH = ["strong", "moderate", "weak"];

describe("data/hypothesis-builder.json", () => {
  const data = loadJson<HypothesisBuilderFile>("hypothesis-builder.json");

  it("parses and has the expected top-level shape", () => {
    expect(Array.isArray(data.hypotheses)).toBe(true);
    expect(data.hypotheses.length).toBeGreaterThan(0);
  });

  it("every hypothesis has the fields the page renders", () => {
    assertRequiredFields(
      data.hypotheses as unknown as Record<string, unknown>[],
      ["id", "title", "thesis_type", "status", "opened", "confidence_pct", "last_updated", "data_type"],
      "id",
    );
  });

  it("ids are unique (used as the React list key)", () => {
    const ids = data.hypotheses.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("status is one of STATUS_STYLE's keys", () => {
    for (const h of data.hypotheses) {
      expect(ALLOWED_HYPOTHESIS_STATUS, `${h.id}.status = "${h.status}"`).toContain(h.status);
    }
  });

  it("confidence_pct is a number between 0 and 100 inclusive", () => {
    for (const h of data.hypotheses) {
      expect(typeof h.confidence_pct, `${h.id}.confidence_pct`).toBe("number");
      expect(h.confidence_pct, `${h.id}.confidence_pct`).toBeGreaterThanOrEqual(0);
      expect(h.confidence_pct, `${h.id}.confidence_pct`).toBeLessThanOrEqual(100);
    }
  });

  it("every hypothesis has at least one evidence point, each with a recognised strength", () => {
    for (const h of data.hypotheses) {
      expect(Array.isArray(h.evidence), h.id).toBe(true);
      expect(h.evidence.length, `${h.id}.evidence`).toBeGreaterThan(0);
      for (const e of h.evidence) {
        expect(ALLOWED_STRENGTH, `${h.id} evidence strength "${e.strength}"`).toContain(e.strength);
      }
    }
  });

  it("data_type is one of the values the UI recognises", () => {
    for (const h of data.hypotheses) {
      expect(ALLOWED_DATA_TYPES, `${h.id}.data_type`).toContain(h.data_type);
    }
  });

  it("opened and last_updated are valid dates and not in the future", () => {
    for (const h of data.hypotheses) {
      assertValidPastDate(h.opened, `${h.id}.opened`);
      assertValidPastDate(h.last_updated, `${h.id}.last_updated`);
    }
  });
});
