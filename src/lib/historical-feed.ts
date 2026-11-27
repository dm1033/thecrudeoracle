import { cachedFeed } from "@/lib/cached-feed";
import {
  DEFAULT_MAX_RETRIES,
  DEFAULT_TIMEOUT_MS,
  EIA_SERIES,
  buildEiaDataUrl,
  fetchWithRetry,
  parseEiaResponse,
  readEiaApiKey,
  redactApiKey,
} from "@/lib/eia";
import { brentWtiSpread, type HistoryPoint, type SpotHistory } from "@/lib/historical-series";

const RENDER = { timeoutMs: DEFAULT_TIMEOUT_MS, maxRetries: DEFAULT_MAX_RETRIES, cache: "no-store" as const };

async function daily(def: (typeof EIA_SERIES)[keyof typeof EIA_SERIES], length: number, start: string): Promise<HistoryPoint[]> {
  const json = await fetchWithRetry(buildEiaDataUrl(def, { length, start }), RENDER);
  return parseEiaResponse(json, def)
    .map((row) => ({ date: row.date, value: row.value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function loadHistorical(now: Date): Promise<SpotHistory> {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - 5 * 366);
  const windowStart = start.toISOString().slice(0, 10);
  const [brent, wti, henryHub] = await Promise.all([
    daily(EIA_SERIES.BRENT_SPOT, 1400, windowStart),
    daily(EIA_SERIES.WTI_SPOT, 1400, windowStart),
    daily(EIA_SERIES.HENRY_HUB_SPOT, 1400, windowStart),
  ]);
  if (brent.length < 2 && wti.length < 2 && henryHub.length < 2) {
    throw new Error("EIA spot history was empty");
  }
  return { brent, wti, henryHub, spread: brentWtiSpread(brent, wti), fetchedAt: now.toISOString() };
}

const historyCache = cachedFeed({
  key: "eia-spot-history-5y-v1",
  tags: ["eia-spot"],
  load: async () => {
    try {
      return await loadHistorical(new Date());
    } catch (error) {
      console.warn(`[historical-series] not loaded: ${redactApiKey(error instanceof Error ? error.message : String(error))}`);
      throw error;
    }
  },
});

function sameUtcDay(now: Date): boolean {
  return now.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
}

/** Up to about five years of EIA daily spots. Null without a key or when a read fails. */
export async function getHistoricalSpotSeries(now = new Date()): Promise<SpotHistory | null> {
  if (!readEiaApiKey()) return null;
  if (!sameUtcDay(now)) {
    try {
      return await loadHistorical(now);
    } catch (error) {
      console.warn(`[historical-series] not loaded: ${redactApiKey(error instanceof Error ? error.message : String(error))}`);
      return null;
    }
  }
  return historyCache.get();
}
