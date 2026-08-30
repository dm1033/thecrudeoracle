import { describe, expect, it } from "vitest";
import { ALLOWED_DATA_TYPES, ALLOWED_SIGNALS, assertRequiredFields, assertValidPastDate, loadJson } from "./helpers";

interface SignalCard {
  id: string;
  label: string;
  value: string;
  signal: string;
  detail: string;
  source: string;
  source_url: string;
  last_updated: string;
  data_type: string;
}

interface BottomLine {
  what_moved: string;
  why_it_moved: string;
  last_updated: string;
  source: string;
  data_type: string;
}

interface DashboardSignalsFile {
  meta: { description: string; last_published: string; status: string };
  supply: SignalCard[];
  demand: SignalCard[];
  risk: SignalCard[];
  bottom_line: BottomLine;
}

describe("data/dashboard-signals.json", () => {
  const data = loadJson<DashboardSignalsFile>("dashboard-signals.json");

  it("parses and has the expected top-level shape", () => {
    for (const section of ["supply", "demand", "risk"] as const) {
      expect(Array.isArray(data[section]), section).toBe(true);
      expect(data[section].length, `${section} should not be empty`).toBeGreaterThan(0);
    }
    expect(data.bottom_line).toBeTypeOf("object");
  });

  it("ids are unique across all three signal sections (rendered as React keys)", () => {
    const allIds = [...data.supply, ...data.demand, ...data.risk].map((c) => c.id);
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  for (const section of ["supply", "demand", "risk"] as const) {
    it(`${section}: every card has the fields SignalCardView/DataMeta render`, () => {
      assertRequiredFields(
        data[section] as unknown as Record<string, unknown>[],
        ["id", "label", "value", "signal", "source", "source_url", "last_updated", "data_type"],
        "id",
      );
    });

    it(`${section}: signal is one of SignalCardView's SIGNAL_STYLES keys`, () => {
      for (const card of data[section]) {
        expect(ALLOWED_SIGNALS, `${section}/${card.id}.signal = "${card.signal}"`).toContain(card.signal);
      }
    });

    it(`${section}: data_type is one of DataMeta's BADGE_STYLES keys`, () => {
      for (const card of data[section]) {
        expect(ALLOWED_DATA_TYPES, `${section}/${card.id}.data_type = "${card.data_type}"`).toContain(
          card.data_type,
        );
      }
    });

    it(`${section}: last_updated is a valid date and not in the future`, () => {
      for (const card of data[section]) {
        assertValidPastDate(card.last_updated, `${section}/${card.id}.last_updated`);
      }
    });
  }

  it("bottom_line has the fields the dashboard renders, and a valid last_updated", () => {
    assertRequiredFields(
      [data.bottom_line as unknown as Record<string, unknown>],
      ["what_moved", "why_it_moved", "source", "last_updated", "data_type"],
      "source",
    );
    expect(ALLOWED_DATA_TYPES).toContain(data.bottom_line.data_type);
    assertValidPastDate(data.bottom_line.last_updated, "bottom_line.last_updated");
  });
});
