import { unstable_cache } from "next/cache";
import {
  EIA_DATA_REVALIDATE_SECONDS,
  EIA_SERIES,
  getWeeklyStockSeries,
  isThousandBarrelUnits,
  logEiaFallback,
  readEiaApiKey,
  redactApiKey,
  type EiaSeriesDef,
  type WeeklySeriesResult,
} from "@/lib/eia";

/** Same age cap as the daily note. A missed Wednesday release falls out of this window. */
const MAX_AGE_DAYS = 21;
const MEMORY_TTL_MS = EIA_DATA_REVALIDATE_SECONDS * 1000;

const WEEKLY_SERIES: { def: EiaSeriesDef; name: string }[] = [
  { def: EIA_SERIES.US_COMMERCIAL_CRUDE_STOCKS, name: "US crude (ex-SPR)" },
  { def: EIA_SERIES.US_GASOLINE_STOCKS, name: "Gasoline" },
  { def: EIA_SERIES.US_DISTILLATE_STOCKS, name: "Distillate" },
  { def: EIA_SERIES.CUSHING_CRUDE_STOCKS, name: "Cushing" },
];

export interface WeeklyStockLine {
  name: string;
  seriesId: string;
  sourceUrl: string;
  /** Week the stocks describe, YYYY-MM-DD. EIA's weekly period is the week-ending date. */
  weekEnding: string;
  /** Million barrels, three decimals, so a thousand-barrel integer stays exact. */
  millionBarrels: number;
  /** EIA's published thousand-barrel integer, before conversion. */
  thousandBarrels: number;
  previousWeekEnding: string | null;
  previousMillionBarrels: number | null;
  /** Million barrels, three decimals. Null when the prior week is missing. */
  changeMillionBarrels: number | null;
}

export interface WeeklySnapshot {
  lines: WeeklyStockLine[];
  /** Week-ending date of the US crude row. The page's "latest print" date. */
  weekEnding: string;
  fetchedAt: string;
}

export interface WeeklyFeed {
  report: WeeklySnapshot;
  /** True when this read is a previous successful EIA payload after a failed refresh. */
  fallback: boolean;
}

interface MemoryEntry {
  at: number;
  value: WeeklySnapshot;
}

let memory: MemoryEntry | null = null;
let pending: Promise<WeeklySnapshot> | null = null;

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function fresh(date: string, now = Date.now()): boolean {
  const parsed = Date.parse(`${date.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(parsed)) return false;
  const ageDays = (now - parsed) / 86_400_000;
  return ageDays >= -1 && ageDays <= MAX_AGE_DAYS;
}

function lineFrom(name: string, def: EiaSeriesDef, result: WeeklySeriesResult): WeeklyStockLine {
  if (!isThousandBarrelUnits(result.latest.units)) {
    throw new Error(`${def.seriesId} units '${result.latest.units}' are not thousand barrels`);
  }
  const previous = result.previous;
  return {
    name,
    seriesId: def.seriesId,
    sourceUrl: def.sourcePageUrl,
    weekEnding: result.latest.date.slice(0, 10),
    millionBarrels: round3(result.latest.value),
    thousandBarrels: result.latest.rawValue,
    previousWeekEnding: previous ? previous.date.slice(0, 10) : null,
    previousMillionBarrels: previous ? round3(previous.value) : null,
    changeMillionBarrels: previous ? round3(result.latest.value - previous.value) : null,
  };
}

async function loadReport(): Promise<WeeklySnapshot> {
  if (!readEiaApiKey()) throw new Error("EIA API key is not set");
  const opts = { length: 8, timeoutMs: 8_000, maxRetries: 0 };
  const settled = await Promise.allSettled(WEEKLY_SERIES.map((series) => getWeeklyStockSeries(series.def, opts)));
  const lines: WeeklyStockLine[] = [];
  const failures: string[] = [];
  settled.forEach((item, index) => {
    const series = WEEKLY_SERIES[index];
    if (item.status === "rejected") {
      const detail = redactApiKey(item.reason instanceof Error ? item.reason.message : String(item.reason));
      failures.push(`${series.def.seriesId}: ${detail}`);
      return;
    }
    try {
      lines.push(lineFrom(series.name, series.def, item.value));
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      logEiaFallback("out-of-range", detail);
      failures.push(detail);
    }
  });
  if (lines.length !== WEEKLY_SERIES.length) {
    logEiaFallback("fetch error", failures.join("; ") || "EIA weekly stocks were not available");
    throw new Error("EIA weekly stocks were not available");
  }
  const crude = lines[0];
  if (!fresh(crude.weekEnding)) {
    logEiaFallback("stale data", `US crude stocks week ${crude.weekEnding} is outside the ${MAX_AGE_DAYS}-day window`);
    throw new Error(`EIA weekly crude stocks ${crude.weekEnding} are outside the ${MAX_AGE_DAYS}-day window`);
  }
  return { lines, weekEnding: crude.weekEnding, fetchedAt: new Date().toISOString() };
}

const loadCachedReport = unstable_cache(loadReport, ["eia-weekly-wpsr-v1"], {
  revalidate: EIA_DATA_REVALIDATE_SECONDS,
  tags: ["eia-weekly", "eia-spot"],
});

async function refresh(): Promise<WeeklySnapshot> {
  if (!pending) {
    pending = (async () => {
      try {
        return await loadCachedReport();
      } catch (err) {
        if (err instanceof Error && err.message.includes("incrementalCache missing")) return loadReport();
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

function servable(report: WeeklySnapshot, now = Date.now()): boolean {
  return report.lines.length === WEEKLY_SERIES.length && fresh(report.weekEnding, now);
}

/**
 * Wednesday petroleum stocks from the EIA API.
 * A warm snapshot is reused for two hours. A failed refresh keeps the last
 * good snapshot when that week is still inside the age window. No desk marks.
 */
export async function getEiaWeekly(): Promise<WeeklyFeed | null> {
  if (!readEiaApiKey()) return null;
  if (memory && servable(memory.value)) {
    if (Date.now() - memory.at < MEMORY_TTL_MS) return { report: memory.value, fallback: false };
    try {
      return { report: await refresh(), fallback: false };
    } catch {
      if (memory && servable(memory.value)) return { report: memory.value, fallback: true };
      return null;
    }
  }
  try {
    return { report: await refresh(), fallback: false };
  } catch {
    if (memory && servable(memory.value)) return { report: memory.value, fallback: true };
    return null;
  }
}

/** Drops the in-process snapshot. Used by tests. */
export function resetEiaWeeklyCache(): void {
  memory = null;
  pending = null;
}
