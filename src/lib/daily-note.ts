/**
 * Pure arithmetic for the morning note. Every figure on /daily is derived
 * from EIA observations passed in here. This module does not fetch, and it
 * does not substitute a desk mark when a print is missing.
 */

export interface PricePoint {
  /** Trade date, YYYY-MM-DD. */
  date: string;
  value: number;
}

export interface PeriodChange {
  /** Latest minus the comparison print, in the series unit, rounded to cents. */
  absolute: number | null;
  /** Percent change. Null when the comparison print is missing or its value is 0. */
  percent: number | null;
  versusDate: string | null;
  versusValue: number | null;
}

export interface SeriesWindow {
  latest: PricePoint;
  /** Previous published print. EIA daily spots skip weekends and holidays. */
  day: PeriodChange;
  /** Newest print on or before 7 calendar days before `latest`. */
  week: PeriodChange;
  /** Newest print on or before 30 calendar days before `latest`. */
  month: PeriodChange;
  /** Chronological, at most five prints ending at `latest`. */
  lastFive: PricePoint[];
}

export interface Spread {
  date: string;
  brent: number;
  wti: number;
  /** Brent minus WTI on `date`. */
  value: number;
}

export interface DailyNoteSeries {
  name: "Brent" | "WTI" | "Henry Hub";
  seriesId: "RBRTE" | "RWTC" | "RNGWHHD";
  unit: "USD/bbl" | "USD/MMBtu";
  window: SeriesWindow;
}

export interface DailyNote {
  /** Brent trade date this note is built on. */
  date: string;
  brent: DailyNoteSeries;
  wti: DailyNoteSeries;
  henryHub: DailyNoteSeries | null;
  spread: Spread | null;
  summary: string[];
}

const EMPTY_CHANGE: PeriodChange = {
  absolute: null,
  percent: null,
  versusDate: null,
  versusValue: null,
};

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Chronological, one row per trade date, values rounded to cents. */
export function sortPoints(points: readonly PricePoint[]): PricePoint[] {
  const byDate = new Map<string, number>();
  for (const point of points) {
    if (!/^\d{4}-\d{2}-\d{2}/.test(point.date) || !Number.isFinite(point.value)) continue;
    byDate.set(point.date.slice(0, 10), round(point.value, 2));
  }
  return Array.from(byDate.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([date, value]) => ({ date, value }));
}

function addUtcDays(iso: string, days: number): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function latestOnOrBefore(points: readonly PricePoint[], asOf: string): PricePoint | null {
  let found: PricePoint | null = null;
  for (const point of points) {
    if (point.date <= asOf) found = point;
    else break;
  }
  return found;
}

function changeBetween(latest: PricePoint, previous: PricePoint | null): PeriodChange {
  if (!previous) return EMPTY_CHANGE;
  const absolute = round(latest.value - previous.value, 2);
  const percent =
    previous.value === 0 ? null : round(((latest.value - previous.value) / Math.abs(previous.value)) * 100, 2);
  return {
    absolute,
    percent,
    versusDate: previous.date,
    versusValue: previous.value,
  };
}

/**
 * Changes for one series as of a trade date.
 * Prints after `asOf` are ignored. Returns null when nothing is on or before that date.
 */
export function seriesWindow(points: readonly PricePoint[], asOf: string): SeriesWindow | null {
  const sorted = sortPoints(points);
  const latest = latestOnOrBefore(sorted, asOf.slice(0, 10));
  if (!latest) return null;
  const upTo = sorted.filter((point) => point.date <= latest.date);
  const prior = upTo.length >= 2 ? upTo[upTo.length - 2] : null;
  const older = upTo.slice(0, -1);
  const weekTarget = addUtcDays(latest.date, -7);
  const monthTarget = addUtcDays(latest.date, -30);
  const week = [...older].reverse().find((point) => point.date <= weekTarget) ?? null;
  const month = [...older].reverse().find((point) => point.date <= monthTarget) ?? null;
  return {
    latest,
    day: changeBetween(latest, prior),
    week: changeBetween(latest, week),
    month: changeBetween(latest, month),
    lastFive: upTo.slice(-5),
  };
}

/** Brent minus WTI on the newest trade date shared by both series, on or before `asOf`. */
export function brentWtiSpread(brent: readonly PricePoint[], wti: readonly PricePoint[], asOf: string): Spread | null {
  const cutoff = asOf.slice(0, 10);
  const wtiByDate = new Map(sortPoints(wti).map((point) => [point.date, point.value]));
  let shared: Spread | null = null;
  for (const point of sortPoints(brent)) {
    if (point.date > cutoff) break;
    const wtiValue = wtiByDate.get(point.date);
    if (wtiValue == null) continue;
    shared = {
      date: point.date,
      brent: point.value,
      wti: wtiValue,
      value: round(point.value - wtiValue, 2),
    };
  }
  return shared;
}

export function isNoteDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Brent trade dates, newest first. */
export function noteDates(points: readonly PricePoint[]): string[] {
  return sortPoints(points)
    .map((point) => point.date)
    .reverse();
}

export function formatLongDate(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("day")} ${get("month")} ${get("year")}`;
}

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function describeChange(change: PeriodChange): string {
  if (change.absolute == null || change.versusDate == null) return "not available";
  const dated = formatLongDate(change.versusDate);
  if (change.absolute === 0) return `unchanged from ${dated}`;
  const direction = change.absolute > 0 ? "up" : "down";
  const amount = `${direction} ${money(Math.abs(change.absolute))}`;
  if (change.percent == null) return `${amount} from ${dated}`;
  const pct = `${change.percent > 0 ? "+" : ""}${change.percent.toFixed(2)}%`;
  return `${amount} (${pct}) from ${dated}`;
}

function seriesSentence(series: DailyNoteSeries, unitPhrase: string): string {
  const { window } = series;
  return (
    `${series.name} (EIA ${series.seriesId}) last printed at ${money(window.latest.value)} ${unitPhrase} on ${formatLongDate(window.latest.date)}. ` +
    `Day-on-day ${describeChange(window.day)}. Week-on-week ${describeChange(window.week)}. Month-on-month ${describeChange(window.month)}.`
  );
}

/** Template sentences. The last line is the required disclaimer. No forecast language. */
export function writeSummary(note: Omit<DailyNote, "summary">): string[] {
  const lines = [seriesSentence(note.brent, "per barrel"), seriesSentence(note.wti, "per barrel")];
  if (note.spread) {
    const side =
      note.spread.value > 0 ? "Brent above WTI" : note.spread.value < 0 ? "WTI above Brent" : "Brent level with WTI";
    lines.push(
      `The Brent–WTI spread on ${formatLongDate(note.spread.date)} was ${money(Math.abs(note.spread.value))} per barrel (${side}). The spread is Brent minus WTI on that shared trade date.`
    );
  } else {
    lines.push("A Brent–WTI spread is not stated because the two series do not share a trade date in the prints loaded.");
  }
  if (note.henryHub) {
    lines.push(seriesSentence(note.henryHub, "per MMBtu"));
  } else {
    lines.push("Henry Hub is not loaded from EIA for this note, so no gas price is stated.");
  }
  lines.push(
    "These figures are U.S. EIA daily spot prices. EIA publishes them with a lag of one to two business days after the trade date. Weekends and US holidays can make the calendar gap longer. The dates above are those trade dates."
  );
  lines.push("Information only, not investment advice.");
  return lines;
}

export function buildDailyNote(input: {
  asOf: string;
  brent: readonly PricePoint[];
  wti: readonly PricePoint[];
  henryHub: readonly PricePoint[] | null;
  /** Archive pages require a Brent print on `asOf` itself. */
  exact?: boolean;
}): DailyNote | null {
  const cutoff = input.asOf.slice(0, 10);
  const brentSorted = sortPoints(input.brent);
  const anchor = input.exact ? (brentSorted.find((point) => point.date === cutoff) ?? null) : latestOnOrBefore(brentSorted, cutoff);
  if (!anchor) return null;
  const brentWindow = seriesWindow(input.brent, anchor.date);
  const wtiWindow = seriesWindow(input.wti, anchor.date);
  if (!brentWindow || !wtiWindow) return null;
  const hubWindow = input.henryHub ? seriesWindow(input.henryHub, anchor.date) : null;
  const spread = brentWtiSpread(input.brent, input.wti, anchor.date);
  const draft = {
    date: anchor.date,
    brent: { name: "Brent" as const, seriesId: "RBRTE" as const, unit: "USD/bbl" as const, window: brentWindow },
    wti: { name: "WTI" as const, seriesId: "RWTC" as const, unit: "USD/bbl" as const, window: wtiWindow },
    henryHub: hubWindow
      ? { name: "Henry Hub" as const, seriesId: "RNGWHHD" as const, unit: "USD/MMBtu" as const, window: hubWindow }
      : null,
    spread,
  };
  return { ...draft, summary: writeSummary(draft) };
}

/** No sponsor is booked. The slot stays empty until a placement is agreed. */
export const DAILY_NOTE_SPONSOR: { name: string; href: string } | null = null;
