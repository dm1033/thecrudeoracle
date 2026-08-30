import { describe, expect, it } from "vitest";
import { assertRequiredFields, assertValidPastDate, loadJson } from "./helpers";

interface Note {
  id: string;
  title: string;
  category: string;
  access: string;
  summary: string;
  date: string;
  reading_time: string;
  sources: string[];
  status: string;
}

interface ResearchLibraryFile {
  meta: { description: string; last_published: string; status: string };
  notes: Note[];
}

const ALLOWED_ACCESS = ["free", "premium"];

describe("data/research-library.json", () => {
  const data = loadJson<ResearchLibraryFile>("research-library.json");

  it("parses and has the expected top-level shape", () => {
    expect(Array.isArray(data.notes)).toBe(true);
    expect(data.notes.length).toBeGreaterThan(0);
  });

  it("every note has id, title, category, access, summary, date and status", () => {
    assertRequiredFields(
      data.notes as unknown as Record<string, unknown>[],
      ["id", "title", "category", "access", "summary", "date", "status"],
      "id",
    );
  });

  it("ids are unique (used as the React list key)", () => {
    const ids = data.notes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("access is either 'free' or 'premium' (gates whether PremiumGate shows the content)", () => {
    for (const n of data.notes) {
      expect(ALLOWED_ACCESS, `${n.id}.access = "${n.access}"`).toContain(n.access);
    }
  });

  it("date is valid and not in the future", () => {
    for (const n of data.notes) {
      assertValidPastDate(n.date, `${n.id}.date`);
    }
  });
});
