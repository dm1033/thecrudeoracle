import {
  EIA_SERIES,
  buildEiaDataUrl,
  fetchWithRetry,
  parseEiaResponse,
  readEiaApiKey,
  redactApiKey,
  type EiaSeriesDef,
} from "@/lib/eia";

export interface WeeklyPoint {
  /** Week-ending date, YYYY-MM-DD. */
  date: string;
  /** Million barrels. */
  value: number;
}

export interface SeasonalWeek {
  isoYear: number;
  isoWeek: number;
  date: string;
  value: number;
  /** This week minus the print exactly seven days earlier. Null when that print is absent. */
  change: number | null;
}

export interface SeasonalBand {
  isoWeek: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  /** Sample size behind the band. */
  count: number;
  current: number | null;
  prior: number | null;
}

export interface SeasonalSeries {
  id: string;
  name: string;
  unit: "million barrels";
  points: SeasonalWeek[];
  bands: SeasonalBand[];
  asOf: string | null;
}

export interface SeasonalSuite {
  series: SeasonalSeries[];
  fetchedAt: string;
}

const SERIES: { def: EiaSeriesDef; name: string }[] = [
  { def: EIA_SERIES.US_COMMERCIAL_CRUDE_STOCKS, name: "US crude (ex-SPR)" },
  { def: EIA_SERIES.CUSHING_CRUDE_STOCKS, name: "Cushing" },
  { def: EIA_SERIES.US_DISTILLATE_STOCKS, name: "Distillate" },
  { def: EIA_SERIES.US_GASOLINE_STOCKS, name: "Gasoline" },
];

/** ISO week of a YYYY-MM-DD date. Week 1 is the week of the year's first Thursday. */
export function isoWeekParts(date: string): { isoYear: number; isoWeek: number } {
  const parsed = new Date(`${date}T00:00:00Z`);
  const thursday = new Date(parsed);
  thursday.setUTCDate(parsed.getUTCDate() + 4 - (parsed.getUTCDay() || 7));
  const isoYear = thursday.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const isoWeek = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return { isoYear, isoWeek };
}

function shiftDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Builds the 5-year ISO-week band from weekly stocks.
 * History is the five ISO years before the newest print. A change is recorded
 * only when the previous week-ending date is exactly seven days earlier.
 */
export function buildSeasonalSeries(id: string, name: string, raw: readonly WeeklyPoint[]): SeasonalSeries {
  const points = [...raw].sort((a, b) => a.date.localeCompare(b.date));
  const byDate = new Map(points.map((point) => [point.date, point.value]));
  const dated = points.map((point) => {
    const prior = byDate.get(shiftDays(point.date, -7));
    return {
      ...isoWeekParts(point.date),
      date: point.date,
      value: point.value,
      change: prior == null ? null : round3(point.value - prior),
    };
  });
  const latest = dated.at(-1);
  const currentYear = latest?.isoYear ?? 0;
  const history = dated.filter((point) => point.isoYear >= currentYear - 5 && point.isoYear < currentYear);
  const bands: SeasonalBand[] = [];
  for (let week = 1; week <= 53; week += 1) {
    const sample = history.filter((point) => point.isoWeek === week).map((point) => point.value);
    const current = dated.find((point) => point.isoYear === currentYear && point.isoWeek === week)?.value ?? null;
    const prior = dated.find((point) => point.isoYear === currentYear - 1 && point.isoWeek === week)?.value ?? null;
    if (!sample.length && current == null && prior == null) continue;
    bands.push({
      isoWeek: week,
      min: sample.length ? round3(Math.min(...sample)) : null,
      max: sample.length ? round3(Math.max(...sample)) : null,
      mean: sample.length ? round3(sample.reduce((sum, value) => sum + value, 0) / sample.length) : null,
      count: sample.length,
      current,
      prior,
    });
  }
  return {
    id,
    name,
    unit: "million barrels",
    points: dated,
    bands,
    asOf: latest?.date ?? null,
  };
}

async function weekly(def: EiaSeriesDef): Promise<WeeklyPoint[]> {
  const json = await fetchWithRetry(buildEiaDataUrl(def, { length: 265 }));
  return parseEiaResponse(json, def).map((row) => ({ date: row.date, value: row.value }));
}

/** About five years of EIA weekly stocks. Null without a key or when every series fails. */
export async function getEiaSeasonalSuite(now = new Date()): Promise<SeasonalSuite | null> {
  if (!readEiaApiKey()) return null;
  try {
    const loaded = await Promise.all(
      SERIES.map(async (series) => {
        try {
          const points = await weekly(series.def);
          return points.length ? buildSeasonalSeries(series.def.seriesId, series.name, points) : null;
        } catch (error) {
          console.warn(
            `[eia-seasonal] ${series.def.seriesId} not loaded: ${redactApiKey(error instanceof Error ? error.message : String(error))}`,
          );
          return null;
        }
      }),
    );
    const series = loaded.filter((item): item is SeasonalSeries => item != null);
    return series.length ? { series, fetchedAt: now.toISOString() } : null;
  } catch (error) {
    console.warn(`[eia-seasonal] not loaded: ${redactApiKey(error instanceof Error ? error.message : String(error))}`);
    return null;
  }
}
