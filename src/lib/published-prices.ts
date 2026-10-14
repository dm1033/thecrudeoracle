import { EIA_SERIES, getBrentSpot, getWtiSpot, type DailySeriesResult } from "@/lib/eia";
import { marketPrices, type MarketPrice } from "@/lib/data";

/** How long a successful EIA overlay may be reused inside one server instance. */
const MEMORY_TTL_MS = 6 * 60 * 60 * 1000;

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

function configuredEiaKey(): boolean {
  const key = process.env.EIA_API_KEY?.trim();
  return Boolean(key && key !== "replace_me");
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
 */
function overlaySpot(price: MarketPrice, result: DailySeriesResult, description: string, sourceUrl: string): MarketPrice | null {
  if (!observationFresh(result.latest.date)) return null;
  const next = Math.round(result.latest.value * 100) / 100;
  if (!inRange(next, PRICE_BOUNDS)) return null;
  if (!inRange(result.dailyChangePct, PCT_BOUNDS)) return null;
  if (!inRange(result.weeklyChangePct, PCT_BOUNDS)) return null;
  if (!inRange(result.monthlyChangePct, PCT_BOUNDS)) return null;

  const daily = result.dailyChangePct ?? price.daily_change;
  const trend = result.dailyChangePct === null ? price.trend : daily > 0 ? "up" : daily < 0 ? "down" : "flat";

  return {
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
  };
}

async function fetchOverlay(): Promise<PublishedPrices> {
  try {
    const opts = { timeoutMs: 8_000, maxRetries: 1, retryBaseDelayMs: 200 };
    const [brent, wti] = await Promise.all([getBrentSpot(opts), getWtiSpot(opts)]);
    const brentNext = overlaySpot(marketPrices.find((p) => p.ticker === "BRN")!, brent, EIA_SERIES.BRENT_SPOT.description, EIA_SERIES.BRENT_SPOT.sourcePageUrl);
    const wtiNext = overlaySpot(marketPrices.find((p) => p.ticker === "WTI")!, wti, EIA_SERIES.WTI_SPOT.description, EIA_SERIES.WTI_SPOT.sourcePageUrl);
    if (!brentNext || !wtiNext) return manualBoard();

    const prices = marketPrices.map((price) => {
      if (price.ticker === "BRN") return brentNext;
      if (price.ticker === "WTI") return wtiNext;
      return price;
    });
    const manual = prices.filter((price) => price.data_type !== "delayed");
    const value: PublishedPrices = {
      prices,
      eia: true,
      manualUpdated: newestIso(manual.length ? manual : marketPrices),
      eiaUpdated: brentNext.last_updated > wtiNext.last_updated ? brentNext.last_updated : wtiNext.last_updated,
    };
    memory = { at: Date.now(), value };
    return value;
  } catch {
    return manualBoard();
  }
}

async function loadFromEia(): Promise<PublishedPrices> {
  if (!configuredEiaKey()) return manualBoard();
  if (memory && Date.now() - memory.at < MEMORY_TTL_MS) return memory.value;
  if (!pending) {
    pending = fetchOverlay().finally(() => {
      pending = null;
    });
  }
  return pending;
}

/** Brent and WTI from EIA when EIA_API_KEY is set; otherwise the published JSON marks. */
export function getPublishedPrices(): Promise<PublishedPrices> {
  return loadFromEia();
}
