import { unstable_cache } from "next/cache";
import {
  DEFAULT_MAX_RETRIES,
  DEFAULT_TIMEOUT_MS,
  EIA_DATA_REVALIDATE_SECONDS,
  getBrentSpot,
  getHenryHubSpot,
  getWtiSpot,
  logEiaFallback,
  readEiaApiKey,
  recentEiaWindow,
  redactApiKey,
  type EiaObservation,
} from "@/lib/eia";
import { buildDailyNote, noteDates, type DailyNote, type PricePoint } from "@/lib/daily-note";

/** Same age cap as the homepage overlay. Older last-good prints are not shown as a morning note. */
const MAX_AGE_DAYS = 21;
const MEMORY_TTL_MS = EIA_DATA_REVALIDATE_SECONDS * 1000;

export interface SpotHistory {
  brent: PricePoint[];
  wti: PricePoint[];
  henryHub: PricePoint[] | null;
  fetchedAt: string;
}

export interface DailyFeed {
  history: SpotHistory;
  /** True when this read is a previous successful EIA payload after a failed refresh. */
  fallback: boolean;
}

export type DailyNoteResult =
  | {
      status: "ready";
      note: DailyNote;
      fetchedAt: string;
      fallback: boolean;
      archiveDates: string[];
    }
  | { status: "unavailable" }
  | { status: "missing"; latestDate: string | null };

interface MemoryEntry {
  at: number;
  value: SpotHistory;
}

let memory: MemoryEntry | null = null;
let pending: Promise<SpotHistory> | null = null;
let refreshFailed = false;

function toPoints(rows: readonly EiaObservation[]): PricePoint[] {
  return rows.map((row) => ({ date: row.date.slice(0, 10), value: row.value }));
}

function newestBrent(history: SpotHistory): string {
  return history.brent.reduce((best, point) => (point.date > best ? point.date : best), "");
}

function fresh(date: string, now = Date.now()): boolean {
  const parsed = Date.parse(`${date.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(parsed)) return false;
  const ageDays = (now - parsed) / 86_400_000;
  return ageDays >= -1 && ageDays <= MAX_AGE_DAYS;
}

function servable(history: SpotHistory, now = Date.now()): boolean {
  return history.brent.length > 0 && history.wti.length > 0 && fresh(newestBrent(history), now);
}

async function loadHistory(): Promise<SpotHistory> {
  if (!readEiaApiKey()) {
    throw new Error("EIA API key is not set");
  }
  const opts = { ...recentEiaWindow("daily"), timeoutMs: DEFAULT_TIMEOUT_MS, maxRetries: DEFAULT_MAX_RETRIES, cache: "no-store" as const };
  const [brentSettled, wtiSettled, hubSettled] = await Promise.allSettled([
    getBrentSpot(opts),
    getWtiSpot(opts),
    getHenryHubSpot(opts),
  ]);
  if (brentSettled.status !== "fulfilled" || wtiSettled.status !== "fulfilled") {
    const detail = [brentSettled, wtiSettled]
      .filter((item) => item.status === "rejected")
      .map((item) => redactApiKey(item.reason instanceof Error ? item.reason.message : String(item.reason)))
      .join("; ");
    logEiaFallback("fetch error", detail || "Brent or WTI spot was not available");
    throw new Error("EIA Brent or WTI spot was not available");
  }
  const history: SpotHistory = {
    brent: toPoints(brentSettled.value.observations),
    wti: toPoints(wtiSettled.value.observations),
    henryHub: hubSettled.status === "fulfilled" ? toPoints(hubSettled.value.observations) : null,
    fetchedAt: new Date().toISOString(),
  };
  const newest = newestBrent(history);
  if (!fresh(newest)) {
    logEiaFallback("stale data", `Brent print ${newest} is outside the ${MAX_AGE_DAYS}-day window`);
    throw new Error(`EIA Brent print ${newest} is outside the ${MAX_AGE_DAYS}-day window`);
  }
  return history;
}

const loadCachedHistory = unstable_cache(loadHistory, ["daily-note-eia-v2"], {
  revalidate: EIA_DATA_REVALIDATE_SECONDS,
  tags: ["daily-note", "eia-spot", "eia-brent-wti"],
});

async function refresh(): Promise<SpotHistory> {
  if (!pending) {
    pending = (async () => {
      try {
        return await loadCachedHistory();
      } catch (err) {
        if (err instanceof Error && err.message.includes("incrementalCache missing")) return loadHistory();
        throw err;
      }
    })()
      .then((value) => {
        memory = { at: Date.now(), value };
        return value;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

function refreshInBackground(): void {
  void refresh()
    .then(() => {
      refreshFailed = false;
    })
    .catch(() => {
      refreshFailed = true;
    });
}

/**
 * Brent, WTI and Henry Hub history from the EIA API.
 * A warm snapshot is returned without waiting, including after it is due for
 * a refresh. A failed refresh keeps the last good snapshot when that print is
 * still inside the age window. No desk marks.
 */
export async function getDailyFeed(): Promise<DailyFeed | null> {
  if (!readEiaApiKey()) return null;
  if (memory && servable(memory.value)) {
    if (Date.now() - memory.at >= MEMORY_TTL_MS) refreshInBackground();
    return { history: memory.value, fallback: refreshFailed };
  }
  try {
    refreshFailed = false;
    return { history: await refresh(), fallback: false };
  } catch {
    refreshFailed = true;
    if (memory && servable(memory.value)) return { history: memory.value, fallback: true };
    return null;
  }
}

export async function loadDailyNote(date: string): Promise<DailyNoteResult> {
  const feed = await getDailyFeed();
  if (!feed) return { status: "unavailable" };
  const archiveDates = noteDates(feed.history.brent);
  const asOf = date === "latest" ? archiveDates[0] : date;
  if (!asOf) return { status: "unavailable" };
  const note = buildDailyNote({
    asOf,
    brent: feed.history.brent,
    wti: feed.history.wti,
    henryHub: feed.history.henryHub,
    exact: true,
  });
  if (!note) return { status: "missing", latestDate: archiveDates[0] ?? null };
  return {
    status: "ready",
    note,
    fetchedAt: feed.history.fetchedAt,
    fallback: feed.fallback,
    archiveDates,
  };
}

export async function listDailyNoteDates(): Promise<string[]> {
  try {
    const feed = await getDailyFeed();
    if (!feed) return [];
    return noteDates(feed.history.brent);
  } catch {
    return [];
  }
}

/** Drops the in-process snapshot. Used by tests. */
export function resetDailyFeedCache(): void {
  memory = null;
  pending = null;
  refreshFailed = false;
}

/** Test helper: the next read should treat the in-process snapshot as stale. */
export function expireDailyFeedCache(): void {
  if (memory) memory.at = 0;
}
