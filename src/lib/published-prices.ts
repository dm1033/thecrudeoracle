import { unstable_cache } from "next/cache";
import {
  EIA_DATA_REVALIDATE_SECONDS,
  EIA_SERIES,
  EiaFetchError,
  EiaValidationError,
  getBrentSpot,
  getWtiSpot,
  logEiaFallback,
  readEiaApiKey,
  redactApiKey,
  type DailySeriesResult,
} from "@/lib/eia";
import { marketPrices, type MarketPrice } from "@/lib/data";

/** In-process copy of the shared snapshot. Fresh reads do not touch the network. */
const MEMORY_TTL_MS = EIA_DATA_REVALIDATE_SECONDS * 1000;

const PRICE_BOUNDS = { min: 0, max: 400 };
const PCT_BOUNDS = { min: -50, max: 50 };
const MAX_AGE_DAYS = 10;

export interface PublishedPrices {
  prices: MarketPrice[];
  /** True when Brent and WTI on this read came from the EIA Open Data API. */
  eia: boolean;
  /** Newest manual desk mark still on the board (ISO). */
  manualUpdated: string;
  /** Observation time of the EIA overlay, when `eia` is true. */
  eiaUpdated: string | null;
}

interface MemoryEntry {
  at: number;
  value: PublishedPrices;
}

let memory: MemoryEntry | null = null;
let pending: Promise<PublishedPrices> | null = null;
let epoch = 0;
let lastFailure: { reason: string | null; latestPeriod: string | null } | null = null;

function configuredEiaKey(): boolean {
  return readEiaApiKey() !== null;
}

export interface EiaHealth {
  configured: boolean;
  ok: boolean;
  reason: string | null;
  latestPeriod: string | null;
}

function newestIso(prices: MarketPrice[]): string {
  return prices.reduce((best, price) => (price.last_updated > best ? price.last_updated : best), prices[0]?.last_updated ?? "");
}

function manualBoard(): PublishedPrices {
  return {
    prices: marketPrices,
    eia: false,
    manualUpdated: newestIso(marketPrices),
    eiaUpdated: null,
  };
}

function inRange(value: number | null, bounds: { min: number; max: number }): boolean {
  if (value === null) return true;
  return Number.isFinite(value) && value >= bounds.min && value <= bounds.max;
}

function observationFresh(date: string): boolean {
  const parsed = Date.parse(`${date.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(parsed)) return false;
  const ageDays = (Date.now() - parsed) / 86_400_000;
  return ageDays >= -1 && ageDays <= MAX_AGE_DAYS;
}

/**
 * Same field mapping as scripts/update-eia-data.mjs. Returns null instead of
 * throwing so a bad series id never replaces the published desk mark.
 * Stale and out-of-range prints are logged before the desk mark is kept.
 */
function overlaySpot(price: MarketPrice, result: DailySeriesResult, description: string, sourceUrl: string): { price: MarketPrice | null; reason: string | null } {
  const label = `${price.ticker} ${result.latest.seriesId}`;
  if (!observationFresh(result.latest.date)) {
    const reason = `${label} observation ${result.latest.date} is outside the ${MAX_AGE_DAYS}-day window`;
    logEiaFallback("stale data", reason);
    return { price: null, reason };
  }
  const next = Math.round(result.latest.value * 100) / 100;
  if (!inRange(next, PRICE_BOUNDS)) {
    const reason = `${label} price ${next} is outside ${PRICE_BOUNDS.min}–${PRICE_BOUNDS.max}`;
    logEiaFallback("out-of-range", reason);
    return { price: null, reason };
  }
  if (!inRange(result.dailyChangePct, PCT_BOUNDS) || !inRange(result.weeklyChangePct, PCT_BOUNDS) || !inRange(result.monthlyChangePct, PCT_BOUNDS)) {
    const reason =
      `${label} percent change is outside ${PCT_BOUNDS.min}–${PCT_BOUNDS.max} ` +
      `(daily ${result.dailyChangePct}, weekly ${result.weeklyChangePct}, monthly ${result.monthlyChangePct})`;
    logEiaFallback("out-of-range", reason);
    return { price: null, reason };
  }

  const daily = result.dailyChangePct ?? price.daily_change;
  const trend = result.dailyChangePct === null ? price.trend : daily > 0 ? "up" : daily < 0 ? "down" : "flat";

  return {
    price: {
      ...price,
      price: next,
      daily_change: daily,
      weekly_change: result.weeklyChangePct ?? price.weekly_change,
      monthly_change: result.monthlyChangePct ?? price.monthly_change,
      trend,
      source: `EIA Open Data API — ${description}`,
      source_url: sourceUrl,
      last_updated: `${result.latest.date.slice(0, 10)}T00:00:00Z`,
      data_type: "delayed",
    },
    reason: null,
  };
}

function logThrownFallback(err: unknown): string {
  const detail = redactApiKey(err instanceof Error ? err.message : String(err));
  if (err instanceof EiaFetchError && /responded \d+/.test(detail)) {
    logEiaFallback("non-200", detail);
    return detail;
  }
  if (err instanceof EiaValidationError && /zero observation|none had a usable/i.test(detail)) {
    logEiaFallback("empty data", detail);
    return detail;
  }
  if (/EIA API error body/i.test(detail)) {
    logEiaFallback("non-200", detail);
    return detail;
  }
  logEiaFallback("fetch error", detail);
  return detail;
}

interface SpotProbe {
  ok: boolean;
  reason: string | null;
  latestPeriod: string | null;
  value: PublishedPrices | null;
}

function periodOf(result: DailySeriesResult | null): string | null {
  const date = result?.latest.date?.slice(0, 10);
  return date || null;
}

function newerPeriod(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

async function probeSpots(): Promise<SpotProbe> {
  // One attempt each, started together. A retry would hold a cold render for
  // another full RWTC timeout after the first 8000ms failure.
  const opts = { timeoutMs: 8_000, maxRetries: 0 };
  const [brentSettled, wtiSettled] = await Promise.allSettled([getBrentSpot(opts), getWtiSpot(opts)]);
  const reasons: string[] = [];
  const brent = brentSettled.status === "fulfilled" ? brentSettled.value : null;
  const wti = wtiSettled.status === "fulfilled" ? wtiSettled.value : null;
  if (brentSettled.status === "rejected") reasons.push(logThrownFallback(brentSettled.reason));
  if (wtiSettled.status === "rejected") reasons.push(logThrownFallback(wtiSettled.reason));

  const latestPeriod = newerPeriod(periodOf(brent), periodOf(wti));
  const brentPrice = marketPrices.find((price) => price.ticker === "BRN");
  const wtiPrice = marketPrices.find((price) => price.ticker === "WTI");
  const brentNext = brent && brentPrice ? overlaySpot(brentPrice, brent, EIA_SERIES.BRENT_SPOT.description, EIA_SERIES.BRENT_SPOT.sourcePageUrl) : null;
  const wtiNext = wti && wtiPrice ? overlaySpot(wtiPrice, wti, EIA_SERIES.WTI_SPOT.description, EIA_SERIES.WTI_SPOT.sourcePageUrl) : null;
  const brentMark = brentNext?.price ?? null;
  const wtiMark = wtiNext?.price ?? null;
  if (brentNext?.reason) reasons.push(brentNext.reason);
  if (wtiNext?.reason) reasons.push(wtiNext.reason);
  if (!brentMark || !wtiMark) {
    if (!reasons.length) reasons.push("Brent or WTI spot was rejected");
    return { ok: false, reason: reasons.join("; "), latestPeriod, value: null };
  }

  const prices = marketPrices.map((price) => {
    if (price.ticker === "BRN") return brentMark;
    if (price.ticker === "WTI") return wtiMark;
    return price;
  });
  const manual = prices.filter((price) => price.data_type !== "delayed");
  const value: PublishedPrices = {
    prices,
    eia: true,
    manualUpdated: newestIso(manual.length ? manual : marketPrices),
    eiaUpdated: brentMark.last_updated > wtiMark.last_updated ? brentMark.last_updated : wtiMark.last_updated,
  };
  return { ok: true, reason: null, latestPeriod, value };
}

class EiaProbeError extends Error {
  readonly latestPeriod: string | null;
  constructor(message: string, latestPeriod: string | null) {
    super(message);
    this.name = "EiaProbeError";
    this.latestPeriod = latestPeriod;
  }
}

/** Live Brent+WTI read. Throws on failure so a bad payload is not cached. */
async function loadFreshPrices(): Promise<PublishedPrices> {
  const probe = await probeSpots();
  if (!probe.value) {
    throw new EiaProbeError(probe.reason ?? "EIA spot overlay unavailable", probe.latestPeriod);
  }
  return probe.value;
}

/**
 * Shared across server instances. A fresh hit returns without calling EIA.
 * A stale hit returns the last good snapshot and refreshes in the background.
 * Failures throw, which leaves the previous cache entry in place.
 */
const loadCachedPrices = unstable_cache(loadFreshPrices, ["eia-brent-wti-v1"], {
  revalidate: EIA_DATA_REVALIDATE_SECONDS,
  tags: ["eia-brent-wti"],
});

function isMissingNextCache(err: unknown): boolean {
  return err instanceof Error && err.message.includes("incrementalCache missing");
}

function remember(value: PublishedPrices, token: number): void {
  if (token !== epoch) return;
  memory = { at: Date.now(), value };
  lastFailure = null;
}

function noteFailure(err: unknown, token: number): void {
  if (token !== epoch) return;
  const latestPeriod = err instanceof EiaProbeError ? err.latestPeriod : null;
  const reason = redactApiKey(err instanceof Error ? err.message : String(err));
  lastFailure = { reason, latestPeriod };
}

function refreshShared(): Promise<PublishedPrices> {
  if (!pending) {
    const token = epoch;
    const run = (async () => {
      try {
        return await loadCachedPrices();
      } catch (err) {
        if (!isMissingNextCache(err)) throw err;
        return loadFreshPrices();
      }
    })()
      .then((value) => {
        remember(value, token);
        return value;
      })
      .catch((err) => {
        noteFailure(err, token);
        throw err;
      })
      .finally(() => {
        if (pending === run) pending = null;
      });
    pending = run;
  }
  return pending;
}

function snapshotServable(value: PublishedPrices): boolean {
  return Boolean(value.eia && value.eiaUpdated && observationFresh(value.eiaUpdated));
}

/**
 * Brent and WTI from EIA when a key is set.
 * A warm or stale snapshot is returned without waiting on the network.
 * A live timeout or error serves that last good snapshot instead of desk marks.
 */
export function getPublishedPrices(): Promise<PublishedPrices> {
  if (!configuredEiaKey()) return Promise.resolve(manualBoard());
  if (memory && snapshotServable(memory.value)) {
    if (Date.now() - memory.at >= MEMORY_TTL_MS) {
      void refreshShared().catch(() => {});
    }
    return Promise.resolve(memory.value);
  }
  return refreshShared().catch(() => {
    if (memory && snapshotServable(memory.value)) return memory.value;
    return manualBoard();
  });
}

/** Brent/WTI probe for /api/eia-health. Uses the same cache. Never includes the API key. */
export async function checkEiaHealth(): Promise<EiaHealth> {
  if (!configuredEiaKey()) {
    return { configured: false, ok: false, reason: "EIA API key is not set", latestPeriod: null };
  }
  const feed = await getPublishedPrices();
  if (feed.eia && feed.eiaUpdated) {
    return { configured: true, ok: true, reason: null, latestPeriod: feed.eiaUpdated.slice(0, 10) };
  }
  return {
    configured: true,
    ok: false,
    reason: lastFailure?.reason ?? "EIA spot overlay unavailable",
    latestPeriod: lastFailure?.latestPeriod ?? null,
  };
}

/** Drops the in-process EIA overlay cache. Used by tests. */
export function resetPublishedPricesCache(): void {
  epoch += 1;
  memory = null;
  pending = null;
  lastFailure = null;
}

/** Test helper: the next read should treat the in-process snapshot as stale. */
export function expirePublishedPricesCache(): void {
  if (memory) memory.at = Date.now() - MEMORY_TTL_MS - 1;
}
