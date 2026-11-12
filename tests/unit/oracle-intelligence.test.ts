import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { MONITOR_MODULES, headlines, monitorLastData, num, parseMonitorFeed } from "@/lib/oracle-intelligence";

const ok = (values: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
  status: "ok",
  as_of: "2026-11-10",
  fetched_utc: "2026-11-11T22:00:00Z",
  source_name: "Source",
  source_url: "https://example.org/",
  values,
  ...extra,
});

describe("parseMonitorFeed", () => {
  it("reads every module as not loaded when the file is missing or malformed", () => {
    for (const raw of [null, [], "x", {}, { modules: [] }, { modules: { prices: 5 } }]) {
      const feed = parseMonitorFeed(raw);
      for (const name of MONITOR_MODULES) expect(feed[name].status).toBe("not_loaded");
      expect(monitorLastData(feed)).toBeNull();
    }
  });

  it("keeps the stated reason for a module that has not loaded", () => {
    const feed = parseMonitorFeed({ modules: { macro: { status: "not_loaded", reason: "the FRED_API_KEY repository secret is not set" } } });
    expect(feed.macro).toEqual({ status: "not_loaded", reason: "the FRED_API_KEY repository secret is not set" });
  });

  it("rejects an ok module with no data date, no values or no source", () => {
    const feed = parseMonitorFeed({
      modules: {
        prices: ok({}, { as_of: "soon" }),
        inventories: ok({}, { values: null }),
        positioning: ok({}, { source_name: 7 }),
        macro: ok({ a: 1 }),
      },
    });
    expect(feed.prices.status).toBe("not_loaded");
    expect(feed.inventories.status).toBe("not_loaded");
    expect(feed.positioning.status).toBe("not_loaded");
    expect(feed.macro.status).toBe("ok");
  });

  it("drops a source link that is not https", () => {
    const feed = parseMonitorFeed({ modules: { news: ok({}, { source_url: "javascript:alert(1)" }) } });
    expect(feed.news.status === "ok" && feed.news.sourceUrl).toBeNull();
  });

  it("reports the newest data date across loaded modules", () => {
    const feed = parseMonitorFeed({ modules: { prices: ok({}), news: ok({}, { as_of: "2026-11-11T12:00:00Z" }) } });
    expect(monitorLastData(feed)).toBe("2026-11-11T12:00:00.000Z");
  });
});

describe("value readers", () => {
  it("num returns only finite numbers, at any depth", () => {
    const values = { a: 1.5, b: "2", c: null, d: { e: -3, f: Number.NaN }, g: 0 };
    expect(num(values, "a")).toBe(1.5);
    expect(num(values, "g")).toBe(0);
    expect(num(values, "d.e")).toBe(-3);
    for (const path of ["b", "c", "d.f", "d.x", "x.y", "a.b"]) expect(num(values, path)).toBeNull();
  });

  it("headlines keeps only complete https items", () => {
    const list = headlines({
      headlines: [
        { title: "Kept", domain: "a.example", url: "https://a.example/1", seen_utc: "2026-11-11T10:00:00Z" },
        { title: "http", domain: "b.example", url: "http://b.example/1", seen_utc: "2026-11-11T10:00:00Z" },
        { title: "script", domain: "c.example", url: "javascript:alert(1)", seen_utc: "2026-11-11T10:00:00Z" },
        { title: "  ", domain: "d.example", url: "https://d.example/1", seen_utc: "2026-11-11T10:00:00Z" },
        { title: "no date", domain: "e.example", url: "https://e.example/1" },
        null,
      ],
    });
    expect(list.map((item) => item.title)).toEqual(["Kept"]);
    expect(headlines({ headlines: "nope" })).toEqual([]);
  });
});

describe("public/data/oracle_intelligence.json", () => {
  const file = JSON.parse(readFileSync(path.resolve(__dirname, "../../public/data/oracle_intelligence.json"), "utf-8"));

  it("has every module, each either loaded with a data date or not loaded with a reason", () => {
    const feed = parseMonitorFeed(file);
    for (const name of MONITOR_MODULES) {
      const stated = file.modules?.[name]?.status;
      expect(["ok", "not_loaded"], name).toContain(stated);
      expect(feed[name].status, `${name} must survive the parser as written`).toBe(stated);
    }
  });

  it("names no broker and carries no trading-signal wording", () => {
    const text = JSON.stringify(file).toLowerCase();
    for (const banned of ["interactive brokers", "pepperstone", "ic markets", "ninjatrader", "fp markets", "plus500", "avatrade", "tradestation", "bullish", "bearish", "squeeze", "golden cross", "resistance"]) {
      expect(text, banned).not.toContain(banned);
    }
  });
});
