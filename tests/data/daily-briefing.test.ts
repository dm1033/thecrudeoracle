import { describe, expect, it } from "vitest";
import { ALLOWED_DATA_TYPES, assertRequiredFields, assertValidPastDate, loadJson } from "./helpers";

interface Briefing {
  date: string;
  status: string;
  headline: string;
  oil_summary: string;
  bottom_line: string;
  sources: { name: string; url: string }[];
  last_updated: string;
  data_type: string;
}

interface DailyBriefingFile {
  meta: { description: string; status: string };
  briefings: Briefing[];
}

describe("data/daily-briefing.json", () => {
  const data = loadJson<DailyBriefingFile>("daily-briefing.json");

  it("parses and has the expected top-level shape", () => {
    expect(Array.isArray(data.briefings)).toBe(true);
    expect(data.briefings.length).toBeGreaterThan(0);
  });

  it("every briefing has the fields the daily-briefing page renders", () => {
    assertRequiredFields(
      data.briefings as unknown as Record<string, unknown>[],
      ["date", "status", "headline", "oil_summary", "bottom_line", "last_updated", "data_type"],
      "date",
    );
  });

  it("every briefing has at least one source with a name and url", () => {
    for (const b of data.briefings) {
      expect(Array.isArray(b.sources), b.date).toBe(true);
      expect(b.sources.length, `${b.date} sources`).toBeGreaterThan(0);
      for (const s of b.sources) {
        expect(s.name, `${b.date} source name`).toBeTruthy();
        expect(s.url, `${b.date} source url`).toMatch(/^https?:\/\//);
      }
    }
  });

  it("data_type is one of DataMeta's BADGE_STYLES keys", () => {
    for (const b of data.briefings) {
      expect(ALLOWED_DATA_TYPES, `${b.date}.data_type = "${b.data_type}"`).toContain(b.data_type);
    }
  });

  it("dates are valid and not in the future", () => {
    for (const b of data.briefings) {
      assertValidPastDate(b.date, `briefing ${b.date}.date`);
      assertValidPastDate(b.last_updated, `briefing ${b.date}.last_updated`);
    }
  });

  it("briefings[0] is the most recent edition (site relies on this: latestBriefing = briefings[0])", () => {
    // src/lib/data.ts: `export const latestBriefing = dailyBriefingJson.briefings[0]`.
    // If a new day's entry is appended at the end instead of prepended, the
    // whole site would silently keep showing a stale "latest" briefing.
    const dates = data.briefings.map((b) => Date.parse(b.date));
    const sorted = [...dates].sort((a, b) => b - a);
    expect(dates, "briefings must be ordered newest-first").toEqual(sorted);
  });
});
