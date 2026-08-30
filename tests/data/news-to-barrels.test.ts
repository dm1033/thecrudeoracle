import { describe, expect, it } from "vitest";
import {
  ALLOWED_CONFIDENCE,
  ALLOWED_DATA_TYPES,
  ALLOWED_NEWS_STATUS,
  assertRequiredFields,
  assertValidPastDate,
  loadJson,
} from "./helpers";

interface Impact {
  market: string;
  direction: string;
  effect: string;
}

interface NewsEvent {
  id: string;
  date: string;
  headline: string;
  event_type: string;
  region: string;
  status: string;
  affected_capacity: string;
  impacts: Impact[];
  confidence: string;
  source: string;
  source_url: string;
  last_updated: string;
  data_type: string;
}

interface NewsToBarrelsFile {
  meta: { description: string; last_published: string; status: string; methodology: string };
  events: NewsEvent[];
}

const ALLOWED_DIRECTION = ["bullish", "bearish", "neutral"];

describe("data/news-to-barrels.json", () => {
  const data = loadJson<NewsToBarrelsFile>("news-to-barrels.json");

  it("parses and has the expected top-level shape", () => {
    expect(Array.isArray(data.events)).toBe(true);
    expect(data.events.length).toBeGreaterThan(0);
  });

  it("every event has the fields the page renders", () => {
    assertRequiredFields(
      data.events as unknown as Record<string, unknown>[],
      [
        "id",
        "date",
        "headline",
        "event_type",
        "region",
        "status",
        "affected_capacity",
        "confidence",
        "source",
        "source_url",
        "last_updated",
        "data_type",
      ],
      "id",
    );
  });

  it("ids are unique (used as the React list key)", () => {
    const ids = data.events.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("status and confidence are within STATUS_STYLE/CONFIDENCE_STYLE's known keys", () => {
    for (const e of data.events) {
      expect(ALLOWED_NEWS_STATUS, `${e.id}.status = "${e.status}"`).toContain(e.status);
      expect(ALLOWED_CONFIDENCE, `${e.id}.confidence = "${e.confidence}"`).toContain(e.confidence);
    }
  });

  it("every event has at least one impact, each with a recognised direction", () => {
    for (const e of data.events) {
      expect(Array.isArray(e.impacts), e.id).toBe(true);
      expect(e.impacts.length, `${e.id}.impacts`).toBeGreaterThan(0);
      for (const impact of e.impacts) {
        expect(ALLOWED_DIRECTION, `${e.id} impact direction "${impact.direction}"`).toContain(impact.direction);
      }
    }
  });

  it("data_type is one of the values the UI recognises", () => {
    for (const e of data.events) {
      expect(ALLOWED_DATA_TYPES, `${e.id}.data_type`).toContain(e.data_type);
    }
  });

  it("date and last_updated are valid dates and not in the future", () => {
    for (const e of data.events) {
      assertValidPastDate(e.date, `${e.id}.date`);
      assertValidPastDate(e.last_updated, `${e.id}.last_updated`);
    }
  });
});
