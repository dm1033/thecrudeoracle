import { describe, expect, it } from "vitest";
import { ALLOWED_DATA_TYPES, assertRequiredFields, assertValidPastDate, isFiniteNumber, loadJson } from "./helpers";

interface Place {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

interface Attachment {
  imo: number;
  headline: string;
  read: string;
  factors: { factor: string; detail: string }[];
  implication: string;
  source: string;
  source_url: string;
  last_updated: string;
  data_type: string;
  places: Place[];
}

describe("data/vessel-attachments.json", () => {
  const data = loadJson<{ attachments: Attachment[] }>("vessel-attachments.json");

  it("attaches a desk note to the TankerMap share hull", () => {
    expect(data.attachments.map((row) => row.imo)).toContain(1076599);
  });

  it("every note has the fields the vessel card renders", () => {
    assertRequiredFields(
      data.attachments as unknown as Record<string, unknown>[],
      ["imo", "headline", "read", "implication", "source", "source_url", "last_updated", "data_type"],
      "imo",
    );
    for (const row of data.attachments) {
      expect(ALLOWED_DATA_TYPES).toContain(row.data_type);
      assertValidPastDate(row.last_updated, String(row.imo));
      expect(row.source_url.startsWith("https://tankermap.com/")).toBe(true);
      expect(row.factors.length).toBeGreaterThan(0);
      expect(row.places.length).toBeGreaterThan(0);
      const ids = row.places.map((place) => place.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const place of row.places) {
        expect(isFiniteNumber(place.lat)).toBe(true);
        expect(isFiniteNumber(place.lon)).toBe(true);
        expect(place.lat).toBeGreaterThanOrEqual(-90);
        expect(place.lat).toBeLessThanOrEqual(90);
      }
    }
  });
});
