import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_MAX_RETRIES, DEFAULT_TIMEOUT_MS } from "@/lib/eia";
import { expireEiaWeeklyCache, getEiaWeekly, resetEiaWeeklyCache } from "@/lib/eia-weekly";
import { getPublishedPrices, resetPublishedPricesCache } from "@/lib/published-prices";

const SECRET = "SECRETKEYVALUE";

function daysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function weeklyPayload(series: string) {
  return {
    response: {
      data: [
        { period: daysAgo(5), series, value: "412300", units: "MBBL" },
        { period: daysAgo(12), series, value: "410100", units: "MBBL" },
      ],
    },
  };
}

describe("render fetch budget", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.EIA_API_KEY;
    delete process.env.EIA_API;
    resetPublishedPricesCache();
    resetEiaWeeklyCache();
  });

  it("caps a render fetch at one short attempt", () => {
    expect(DEFAULT_TIMEOUT_MS).toBeGreaterThanOrEqual(3_000);
    expect(DEFAULT_TIMEOUT_MS).toBeLessThanOrEqual(5_000);
    expect(DEFAULT_MAX_RETRIES).toBe(0);
  });

  it("does not keep the root layout on a dynamic render", () => {
    const layout = readFileSync(resolve(process.cwd(), "src/app/layout.tsx"), "utf8");
    expect(layout).not.toContain("force-dynamic");
    expect(layout).toContain("export const revalidate = 7200");
    expect(layout).toContain("Data temporarily unavailable");
  });

  it("returns the desk marks within one timeout when EIA never answers", async () => {
    process.env.EIA_API_KEY = SECRET;
    let calls = 0;
    vi.stubGlobal("fetch", (_url: unknown, init?: RequestInit) => {
      calls += 1;
      return new Promise((_resolve, reject) => {
        const abort = () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        };
        if (init?.signal?.aborted) abort();
        else init?.signal?.addEventListener("abort", abort, { once: true });
      });
    });
    const started = Date.now();
    const feed = await getPublishedPrices();
    const elapsed = Date.now() - started;
    expect(feed.eia).toBe(false);
    expect(feed.prices.find((price) => price.ticker === "BRN")?.price).toBe(79.15);
    expect(calls).toBe(3);
    expect(elapsed).toBeGreaterThan(3_000);
    expect(elapsed).toBeLessThan(DEFAULT_TIMEOUT_MS + 1_500);
  }, 10_000);

  it("returns the last weekly print without waiting on a hung refresh", async () => {
    process.env.EIA_API_KEY = SECRET;
    vi.stubGlobal("fetch", (input: RequestInfo | URL) => {
      const series = new URL(String(input)).searchParams.get("facets[series][]") ?? "WCESTUS1";
      return Promise.resolve(new Response(JSON.stringify(weeklyPayload(series)), { status: 200 }));
    });
    const first = await getEiaWeekly();
    expect(first?.report.lines.length).toBeGreaterThan(0);
    const stocks = first?.report.lines.find((line) => line.seriesId === "WCESTUS1")?.millionBarrels;
    expireEiaWeeklyCache();

    vi.stubGlobal("fetch", (_url: unknown, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });
    const started = Date.now();
    const again = await getEiaWeekly();
    expect(Date.now() - started).toBeLessThan(200);
    expect(again?.report.lines.find((line) => line.seriesId === "WCESTUS1")?.millionBarrels).toBe(stocks);
  });
});
