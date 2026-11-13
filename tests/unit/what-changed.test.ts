import { describe, expect, it } from "vitest";
import { changeStats } from "@/lib/monitor-live";
import { parseMonitorFeed } from "@/lib/oracle-intelligence";
import { sizeOf, whatChanged, whatChangedLastData } from "@/lib/what-changed";

const ok = (as_of: string, values: Record<string, unknown>) => ({
  status: "ok",
  as_of,
  fetched_utc: "2026-11-13T12:00:00Z",
  source_name: "Source",
  source_url: "https://example.org/",
  values,
});

describe("changeStats", () => {
  it("returns null with fewer than two values", () => {
    expect(changeStats([])).toBeNull();
    expect(changeStats([1])).toBeNull();
  });

  it("gives the change but no rating on a short history", () => {
    expect(changeStats([10, 8, 7])).toEqual({ change: 2, vsUsual: null, compared: 1 });
  });

  it("rates the latest change against earlier changes only", () => {
    // Earlier changes alternate +1 / -1; the latest change is +4.
    const earlier = Array.from({ length: 41 }, (_, i) => (i % 2 ? 100 : 101));
    const stats = changeStats([earlier[0] + 4, ...earlier]);
    expect(stats?.change).toBe(4);
    expect(stats?.compared).toBe(40);
    expect(stats?.vsUsual).toBeGreaterThan(3.5);
    expect(stats?.vsUsual).toBeLessThan(4.5);
  });

  it("gives no rating when earlier changes have no spread", () => {
    const flat = Array.from({ length: 30 }, () => 5);
    expect(changeStats([6, ...flat])?.vsUsual).toBeNull();
  });

  it("looks back no further than the limit", () => {
    const values = Array.from({ length: 400 }, (_, i) => i % 3);
    expect(changeStats(values, 52)?.compared).toBe(52);
  });
});

describe("sizeOf", () => {
  it("labels by magnitude, in either direction", () => {
    expect(sizeOf(null)).toBe("unknown");
    expect(sizeOf(0.99)).toBe("usual");
    expect(sizeOf(-1)).toBe("larger");
    expect(sizeOf(1.99)).toBe("larger");
    expect(sizeOf(-2)).toBe("unusual");
  });
});

describe("whatChanged", () => {
  const feed = parseMonitorFeed({
    modules: {
      prices: ok("2026-11-11", {
        brent_usd_bbl: 92.14,
        brent_date: "2026-11-11",
        wti_usd_bbl: 89.62,
        wti_date: "2026-11-11",
        henry_hub_usd_mmbtu: 3,
        henry_hub_date: "2026-11-10",
        changes: {
          brent: { change: -0.5, previous_date: "2026-11-10", vs_usual: -0.3, changes_compared: 250 },
          wti: { change: -4.1, previous_date: "2026-11-10", vs_usual: -2.4, changes_compared: 250 },
          henry_hub: { change: 0.05, previous_date: "2026-11-09" },
        },
      }),
      inventories: ok("2026-11-06", {
        us_commercial_crude: {
          week_ending: "2026-11-06",
          million_barrels: 414.4,
          change_million_barrels: 4.7,
          previous_week_ending: "2026-10-30",
          change_vs_usual: 1.3,
          changes_compared: 52,
        },
        cushing: { week_ending: "2026-11-06", million_barrels: 27.4 },
      }),
      positioning: ok("2026-11-03", {
        managed_money_net: 21728,
        net_change: -9400,
        previous_report_date: "2026-10-27",
        net_change_vs_usual: -0.6,
        net_changes_compared: 51,
      }),
      macro: { status: "not_loaded", reason: "x" },
    },
  });
  const items = whatChanged(feed);

  it("ranks by size against each series' own history, unrated series last", () => {
    expect(items.map((item) => item.id)).toEqual(["wti", "us-crude", "wti-positioning", "brent", "henry-hub"]);
    expect(items.map((item) => item.size)).toEqual(["unusual", "larger", "usual", "usual", "unknown"]);
  });

  it("leaves out a series with no previous print or whose module has not loaded", () => {
    const ids = items.map((item) => item.id);
    expect(ids).not.toContain("cushing");
    expect(ids).not.toContain("dollar");
    expect(ids).not.toContain("real-yield");
  });

  it("formats level, signed change and direction", () => {
    const wti = items.find((item) => item.id === "wti");
    expect(wti).toMatchObject({ level: "$89.62/bbl", change: "−4.10 $/bbl", direction: "down", asOf: "2026-11-11", previousDate: "2026-11-10", compared: 250 });
    const stocks = items.find((item) => item.id === "us-crude");
    expect(stocks).toMatchObject({ level: "414.4 mb", change: "+4.7 mb", direction: "up", cadence: "weekly", href: "/eia-weekly" });
    const positioning = items.find((item) => item.id === "wti-positioning");
    expect(positioning).toMatchObject({ level: "+21,728 contracts", change: "−9,400 contracts", asOf: "2026-11-03" });
  });

  it("uses no advice or forecast wording", () => {
    const text = JSON.stringify(items).toLowerCase();
    for (const banned of ["buy", "sell", "bullish", "bearish", "signal", "target"]) expect(text).not.toContain(banned);
  });

  it("returns nothing, and no date, when nothing has loaded", () => {
    const empty = whatChanged(parseMonitorFeed({}));
    expect(empty).toEqual([]);
    expect(whatChangedLastData(empty)).toBeNull();
    expect(whatChangedLastData(items)).toBe("2026-11-11T00:00:00.000Z");
  });
});
