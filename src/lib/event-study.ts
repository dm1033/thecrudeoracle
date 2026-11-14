import {
  EIA_SERIES,
  buildEiaDataUrl,
  fetchWithRetry,
  parseEiaResponse,
  readEiaApiKey,
  redactApiKey,
  type EiaSeriesDef,
} from "@/lib/eia";

/**
 * Event study: how WTI and the Brent-WTI spread moved in the days after the
 * largest weekly changes in US commercial crude stocks.
 *
 * Everything is arithmetic on EIA's published history. It describes what
 * happened in the past sample. It is not a forecast, and it cannot separate
 * the stock report from everything else that moved prices on those days.
 *
 * Timing: EIA's weekly figure is for the week ending Friday and is normally
 * published the following Wednesday. Holiday weeks are published a day late;
 * this study does not adjust for that and says so on the page.
 */

export interface Point {
  /** YYYY-MM-DD */
  date: string;
  value: number;
}

export const HORIZONS = [0, 1, 3, 5] as const;
export type Horizon = (typeof HORIZONS)[number];

/** Days from the week-ending Friday to the usual Wednesday release. */
export const RELEASE_LAG_DAYS = 5;

export interface StudyEvent {
  weekEnding: string;
  /** The usual release date for that week: the following Wednesday. */
  releaseDate: string;
  /** Weekly change in stocks, million barrels. */
  stockChange: number;
  /** Last WTI price before the release date. */
  base: Point;
  /** WTI percent change from `base` to the close N trading days after the release (0 = release day). */
  wtiPct: Partial<Record<Horizon, number>>;
  /** Change in Brent minus WTI over the same span, USD/bbl. */
  spreadChange: Partial<Record<Horizon, number>>;
}

export interface HorizonStats {
  horizon: Horizon;
  count: number;
  median: number;
  mean: number;
  min: number;
  max: number;
  /** Share of events where the figure was above zero, 0 to 1. */
  shareUp: number;
}

export interface StudyGroup {
  key: "builds" | "draws" | "all";
  label: string;
  events: StudyEvent[];
  /** Smallest and largest stock change in the group, million barrels. */
  changeRange: [number, number] | null;
  wti: HorizonStats[];
  spread: HorizonStats[];
}

export interface EventStudy {
  groups: StudyGroup[];
  /** Weeks with a stock change and a usable price window. */
  weeks: number;
  firstWeek: string;
  lastWeek: string;
  /** How many weeks are in each of the builds and draws groups. */
  groupSize: number;
  fetchedAt: string;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function shiftDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Summary of one horizon. Null when no event reaches that horizon. */
export function summarise(values: number[], horizon: Horizon, digits: number): HorizonStats | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return {
    horizon,
    count: values.length,
    median: round(median(sorted), digits),
    mean: round(values.reduce((sum, v) => sum + v, 0) / values.length, digits),
    min: round(sorted[0], digits),
    max: round(sorted[sorted.length - 1], digits),
    shareUp: round(values.filter((v) => v > 0).length / values.length, 3),
  };
}

/**
 * One event per week that has a previous week exactly seven days earlier and
 * a WTI price before the release. Horizons the price history does not reach
 * are left out of that event, never estimated.
 */
export function buildEvents(stocks: Point[], wti: Point[], brent: Point[]): StudyEvent[] {
  const weekly = [...stocks].sort((a, b) => a.date.localeCompare(b.date));
  const daily = [...wti].sort((a, b) => a.date.localeCompare(b.date));
  const brentByDate = new Map(brent.map((point) => [point.date, point.value]));
  const events: StudyEvent[] = [];

  for (let i = 1; i < weekly.length; i++) {
    const week = weekly[i];
    const previous = weekly[i - 1];
    if (shiftDays(previous.date, 7) !== week.date) continue; // a gap: the change would span more than one week
    const releaseDate = shiftDays(week.date, RELEASE_LAG_DAYS);
    const first = daily.findIndex((point) => point.date >= releaseDate);
    if (first <= 0) continue; // no price before the release, or the release is beyond the price history
    if (daily[first].date > shiftDays(releaseDate, 4)) continue; // no trading day near the release
    const base = daily[first - 1];
    if (base.value <= 0) continue;
    const baseBrent = brentByDate.get(base.date);

    const wtiPct: StudyEvent["wtiPct"] = {};
    const spreadChange: StudyEvent["spreadChange"] = {};
    for (const horizon of HORIZONS) {
      const point = daily[first + horizon];
      if (!point) continue;
      wtiPct[horizon] = round(((point.value - base.value) / base.value) * 100, 2);
      const brentThen = brentByDate.get(point.date);
      if (baseBrent != null && brentThen != null) {
        spreadChange[horizon] = round(brentThen - point.value - (baseBrent - base.value), 2);
      }
    }
    if (wtiPct[0] == null) continue;
    events.push({ weekEnding: week.date, releaseDate, stockChange: round(week.value - previous.value, 3), base, wtiPct, spreadChange });
  }
  return events;
}

function group(key: StudyGroup["key"], label: string, events: StudyEvent[]): StudyGroup {
  const stats = (pick: (event: StudyEvent, horizon: Horizon) => number | undefined, digits: number) =>
    HORIZONS.flatMap((horizon) => {
      const values = events.flatMap((event) => {
        const value = pick(event, horizon);
        return value == null ? [] : [value];
      });
      const summary = summarise(values, horizon, digits);
      return summary ? [summary] : [];
    });
  const changes = events.map((event) => event.stockChange).sort((a, b) => a - b);
  return {
    key,
    label,
    events,
    changeRange: changes.length ? [changes[0], changes[changes.length - 1]] : null,
    wti: stats((event, horizon) => event.wtiPct[horizon], 2),
    spread: stats((event, horizon) => event.spreadChange[horizon], 2),
  };
}

/** Builds the study. Null with too little history to say anything. */
export function buildEventStudy(stocks: Point[], wti: Point[], brent: Point[], fetchedAt: string, minimumWeeks = 52): EventStudy | null {
  const events = buildEvents(stocks, wti, brent);
  if (events.length < minimumWeeks) return null;
  // The largest tenth of builds and of draws, at least ten weeks each.
  const groupSize = Math.max(10, Math.round(events.length / 10));
  const byChange = [...events].sort((a, b) => b.stockChange - a.stockChange);
  const builds = byChange.slice(0, groupSize).filter((event) => event.stockChange > 0);
  const draws = byChange.slice(-groupSize).filter((event) => event.stockChange < 0).reverse();
  const weeks = events.map((event) => event.weekEnding).sort();
  return {
    groups: [
      group("builds", "Largest weekly builds", builds),
      group("draws", "Largest weekly draws", draws),
      group("all", "All weeks in the sample", events),
    ],
    weeks: events.length,
    firstWeek: weeks[0],
    lastWeek: weeks[weeks.length - 1],
    groupSize,
    fetchedAt,
  };
}

async function history(seriesDef: EiaSeriesDef, length: number): Promise<Point[]> {
  const json = await fetchWithRetry(buildEiaDataUrl(seriesDef, { length }));
  return parseEiaResponse(json, seriesDef).map((observation) => ({ date: observation.date, value: observation.value }));
}

/** About five years of history. Null when the site has no EIA key or a read fails. Never throws. */
export async function getEventStudy(now = new Date()): Promise<EventStudy | null> {
  if (!readEiaApiKey()) return null;
  try {
    const [stocks, wti, brent] = await Promise.all([
      history(EIA_SERIES.US_COMMERCIAL_CRUDE_STOCKS, 262),
      history(EIA_SERIES.WTI_SPOT, 1320),
      history(EIA_SERIES.BRENT_SPOT, 1320),
    ]);
    return buildEventStudy(stocks, wti, brent, now.toISOString());
  } catch (error) {
    console.warn(`[event-study] not loaded: ${redactApiKey(error instanceof Error ? error.message : String(error))}`);
    return null;
  }
}
