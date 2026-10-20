/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { GET } from "@/app/api/eia-health/route";
import { buildEiaDataUrl, EIA_SERIES, readEiaApiKey } from "@/lib/eia";
import { checkEiaHealth, expirePublishedPricesCache, getPublishedPrices, resetPublishedPricesCache } from "@/lib/published-prices";
import PriceFreshness from "@/components/PriceFreshness";
import DeskTape from "@/components/DeskTape";

const SECRET = "SECRETKEYVALUE";

function daysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function spotValue(series: string, brent: number, wti: number, hub = 3.12): number {
  if (series === "RBRTE") return brent;
  if (series === "RNGWHHD") return hub;
  return wti;
}

function payload(series: string, rows: Array<{ period: string; value: number }>) {
  return {
    response: {
      data: rows.map((row) => ({
        period: row.period,
        series,
        value: String(row.value),
        units: "$/BBL",
      })),
    },
  };
}

function logged(spy: { mock: { calls: unknown[][] } }): string {
  return spy.mock.calls.map((args) => args.map((part) => String(part)).join(" ")).join("\n");
}

beforeEach(() => {
  resetPublishedPricesCache();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  resetPublishedPricesCache();
  delete process.env.EIA_API_KEY;
  delete process.env.EIA_API;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("EIA API key", () => {
  it("prefers EIA_API_KEY and trims quotes and whitespace", () => {
    process.env.EIA_API_KEY = '  "quoted-key"  ';
    process.env.EIA_API = "alt-key-should-lose";
    expect(readEiaApiKey()).toBe("quoted-key");
    const url = new URL(buildEiaDataUrl(EIA_SERIES.BRENT_SPOT, { length: 2 }));
    expect(url.pathname).toBe("/v2/petroleum/pri/spt/data/");
    expect(url.searchParams.get("frequency")).toBe("daily");
    expect(url.searchParams.get("data[0]")).toBe("value");
    expect(url.searchParams.getAll("facets[series][]")).toContain("RBRTE");
    expect(url.searchParams.get("api_key")).toBe("quoted-key");
  });

  it("uses EIA_API when EIA_API_KEY is unset", () => {
    delete process.env.EIA_API_KEY;
    process.env.EIA_API = "  'alt-key-value'  ";
    expect(readEiaApiKey()).toBe("alt-key-value");
    const url = new URL(buildEiaDataUrl(EIA_SERIES.WTI_SPOT, { length: 2 }));
    expect(url.searchParams.getAll("facets[series][]")).toContain("RWTC");
    expect(url.searchParams.get("sort[0][column]")).toBe("period");
    expect(url.searchParams.get("sort[0][direction]")).toBe("desc");
    expect(url.searchParams.get("api_key")).toBe("alt-key-value");
  });
});

describe("EIA spot fallback", () => {
  it("logs a fetch error and keeps the desk marks", async () => {
    process.env.EIA_API_KEY = SECRET;
    vi.stubGlobal("fetch", () => Promise.reject(new Error(`network down ${SECRET}`)));
    const feed = await getPublishedPrices();
    expect(feed.eia).toBe(false);
    expect(feed.prices.find((price) => price.ticker === "BRN")?.price).toBe(79.15);
    const text = logged(vi.mocked(console.error));
    expect(text).toMatch(/fallback \(fetch error\)/);
    expect(text).toMatch(/network down/);
    expect(text).not.toContain(SECRET);
  });

  it("logs a non-200 status and the EIA error body without the key", async () => {
    process.env.EIA_API_KEY = SECRET;
    vi.stubGlobal("fetch", () =>
      Promise.resolve(
        new Response(JSON.stringify({ error: `invalid api_key ${SECRET}`, api_key: SECRET }), { status: 403 })
      )
    );
    const health = await checkEiaHealth();
    expect(health).toMatchObject({ configured: true, ok: false, latestPeriod: null });
    expect(health.reason).toMatch(/403/);
    expect(health.reason).toMatch(/invalid api_key/);
    expect(JSON.stringify(health)).not.toContain(SECRET);
    const text = logged(vi.mocked(console.error));
    expect(text).toMatch(/fallback \(non-200\)/);
    expect(text).toMatch(/403/);
    expect(text).not.toContain(SECRET);
  });

  it("logs empty data", async () => {
    process.env.EIA_API_KEY = SECRET;
    vi.stubGlobal("fetch", () => Promise.resolve(new Response(JSON.stringify({ response: { data: [] } }), { status: 200 })));
    const health = await checkEiaHealth();
    expect(health.ok).toBe(false);
    expect(health.latestPeriod).toBeNull();
    expect(health.reason).toMatch(/zero observation/);
    expect(logged(vi.mocked(console.error))).toMatch(/fallback \(empty data\)/);
  });

  it("logs stale data and still reports the period", async () => {
    process.env.EIA_API_KEY = SECRET;
    vi.stubGlobal("fetch", (input: RequestInfo | URL) => {
      const series = new URL(String(input)).searchParams.get("facets[series][]") ?? "RWTC";
      return Promise.resolve(new Response(JSON.stringify(payload(series, [{ period: "2020-01-02", value: 80 }])), { status: 200 }));
    });
    const health = await checkEiaHealth();
    expect(health.ok).toBe(false);
    expect(health.latestPeriod).toBe("2020-01-02");
    expect(health.reason).toMatch(/stale|outside/i);
    expect(logged(vi.mocked(console.error))).toMatch(/fallback \(stale data\)/);
    const feed = await getPublishedPrices();
    expect(feed.eia).toBe(false);
  });

  it("logs an out-of-range price", async () => {
    process.env.EIA_API_KEY = SECRET;
    const period = daysAgo(1);
    vi.stubGlobal("fetch", (input: RequestInfo | URL) => {
      const series = new URL(String(input)).searchParams.get("facets[series][]") ?? "RWTC";
      return Promise.resolve(new Response(JSON.stringify(payload(series, [{ period, value: 900 }])), { status: 200 }));
    });
    const feed = await getPublishedPrices();
    expect(feed.eia).toBe(false);
    expect(logged(vi.mocked(console.error))).toMatch(/fallback \(out-of-range\)/);
    const health = await checkEiaHealth();
    expect(health.latestPeriod).toBe(period);
    expect(health.reason).toMatch(/900/);
  });

  it("publishes a fresh in-range spot and its observation date", async () => {
    process.env.EIA_API_KEY = SECRET;
    const period = daysAgo(1);
    vi.stubGlobal("fetch", (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      expect(url.searchParams.get("frequency")).toBe("daily");
      expect(url.searchParams.get("data[0]")).toBe("value");
      expect(url.searchParams.get("api_key")).toBe(SECRET);
      const series = url.searchParams.get("facets[series][]") ?? "RWTC";
      return Promise.resolve(
        new Response(JSON.stringify(payload(series, [{ period, value: spotValue(series, 81.25, 76.5) }])), { status: 200 })
      );
    });
    const feed = await getPublishedPrices();
    expect(feed.eia).toBe(true);
    expect(feed.eiaUpdated).toBe(`${period}T00:00:00Z`);
    expect(feed.prices.find((price) => price.ticker === "BRN")?.price).toBe(81.25);
    expect(feed.prices.find((price) => price.ticker === "WTI")?.price).toBe(76.5);
    expect(logged(vi.mocked(console.error))).not.toMatch(/fallback/);
    const health = await checkEiaHealth();
    expect(health).toEqual({ configured: true, ok: true, reason: null, latestPeriod: period });
  });

  it("fetches Brent and WTI together and reuses a success for one to three hours", async () => {
    process.env.EIA_API_KEY = SECRET;
    const period = daysAgo(1);
    let inFlight = 0;
    let maxInFlight = 0;
    const inits: RequestInit[] = [];
    vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => {
      inits.push(init ?? {});
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      const series = new URL(String(input)).searchParams.get("facets[series][]") ?? "RWTC";
      return new Promise((resolve) => {
        setTimeout(() => {
          inFlight -= 1;
          resolve(
            new Response(JSON.stringify(payload(series, [{ period, value: spotValue(series, 82, 77) }])), { status: 200 })
          );
        }, 40);
      });
    });
    const feed = await getPublishedPrices();
    expect(maxInFlight).toBe(3);
    expect(feed.eia).toBe(true);
    expect(feed.prices.find((price) => price.ticker === "BRN")?.price).toBe(82);
    expect(feed.prices.find((price) => price.ticker === "WTI")?.price).toBe(77);
    expect(inits.length).toBeGreaterThanOrEqual(2);
    for (const init of inits) {
      const next = (init as { next?: { revalidate?: number }; cache?: string }).next;
      expect(next?.revalidate).toBeGreaterThanOrEqual(3600);
      expect(next?.revalidate).toBeLessThanOrEqual(10800);
      expect((init as { cache?: string }).cache).not.toBe("no-store");
    }

    vi.stubGlobal("fetch", () => Promise.reject(new Error("refetch inside the fresh window")));
    const again = await getPublishedPrices();
    expect(again.eia).toBe(true);
    expect(again.prices.find((price) => price.ticker === "BRN")?.price).toBe(82);
  });

  it("returns the last good print immediately when a later RWTC call hangs", async () => {
    process.env.EIA_API_KEY = SECRET;
    const period = daysAgo(1);
    vi.stubGlobal("fetch", (input: RequestInfo | URL) => {
      const series = new URL(String(input)).searchParams.get("facets[series][]") ?? "RWTC";
      return Promise.resolve(
        new Response(JSON.stringify(payload(series, [{ period, value: spotValue(series, 81.25, 76.5) }])), { status: 200 })
      );
    });
    const first = await getPublishedPrices();
    expect(first.eia).toBe(true);

    expirePublishedPricesCache();
    let release: (value: Response) => void = () => {};
    const hung = new Promise<Response>((resolve) => {
      release = resolve;
    });
    vi.stubGlobal("fetch", () => hung);

    const started = Date.now();
    const feed = await getPublishedPrices();
    expect(Date.now() - started).toBeLessThan(200);
    expect(feed.eia).toBe(true);
    expect(feed.prices.find((price) => price.ticker === "BRN")?.price).toBe(81.25);
    expect(feed.prices.find((price) => price.ticker === "WTI")?.price).toBe(76.5);
    const health = await checkEiaHealth();
    expect(health).toEqual({ configured: true, ok: true, reason: null, latestPeriod: period });

    release(new Response(JSON.stringify({ error: "slow" }), { status: 504 }));
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
});

describe("eia health route", () => {
  it("returns the public shape when no key is configured", async () => {
    const response = await GET();
    const body = await response.json();
    expect(body).toEqual({
      configured: false,
      ok: false,
      reason: "EIA API key is not set",
      latestPeriod: null,
    });
    expect(Object.keys(body).sort()).toEqual(["configured", "latestPeriod", "ok", "reason"]);
    expect(logged(vi.mocked(console.error))).toBe("");
  });
});

describe("homepage as-of date", () => {
  it("shows the EIA observation date on the price board", () => {
    render(
      <PriceFreshness
        feed={{
          prices: [],
          eia: true,
          manualUpdated: "2026-07-15T07:00:00Z",
          eiaUpdated: "2026-10-16T00:00:00Z",
          brentWtiHistory: [],
          henryHubHistory: [],
        }}
      />
    );
    const stamp = screen.getByText("2026-10-16");
    expect(stamp.closest("time")?.getAttribute("dateTime")).toBe("2026-10-16T00:00:00Z");
    expect(screen.getByText(/Brent and WTI as of/i)).toBeTruthy();
    expect(screen.getByText(/Source: EIA/i)).toBeTruthy();
    expect(screen.getByText(/Information only, not investment advice/i)).toBeTruthy();
  });

  it("shows the manual as-of date when the EIA overlay is off", () => {
    render(
      <PriceFreshness
        feed={{
          prices: [],
          eia: false,
          manualUpdated: "2026-07-15T07:00:00Z",
          eiaUpdated: null,
          brentWtiHistory: [],
          henryHubHistory: [],
        }}
      />
    );
    expect(screen.getByText("2026-07-15").closest("time")?.getAttribute("dateTime")).toBe("2026-07-15T07:00:00Z");
    expect(screen.getByText(/desk marks/i)).toBeTruthy();
  });

  it("shows the board as-of date on the hero tape", () => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes("reduce"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    })) as typeof window.matchMedia;
    render(
      <DeskTape
        tapeRef={{ current: null }}
        board={{ brent: 81.25, wti: 76.5, asOf: "2026-10-16T00:00:00Z", live: true }}
      />
    );
    expect(screen.getByText("2026-10-16").closest("time")?.getAttribute("dateTime")).toBe("2026-10-16T00:00:00Z");
    expect(screen.getAllByText(/delayed EIA spot/i).length).toBeGreaterThan(0);
    expect(screen.getByText("$81.25")).toBeTruthy();
    expect(screen.getByText("$76.50")).toBeTruthy();
  });
});
