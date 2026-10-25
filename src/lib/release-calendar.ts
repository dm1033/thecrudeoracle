/**
 * Next EIA, Baker Hughes and CFTC releases.
 * Times are built in America/New_York and Europe/London so the UK display
 * follows the real civil clock, including the weeks when the two regions
 * change clocks on different Sundays.
 * Baker Hughes is a link only. This module stores no rig-count figures.
 */

const NEW_YORK = "America/New_York";
const LONDON = "Europe/London";

export interface ReleaseEvent {
  id: "eia-wpsr" | "baker-hughes" | "cftc-cot";
  title: string;
  whenEt: string;
  whenUk: string;
  href: string;
  detail: string;
}

interface Ymd {
  year: number;
  month: number;
  day: number;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function iso(ymd: Ymd): string {
  return `${ymd.year}-${pad(ymd.month)}-${pad(ymd.day)}`;
}

function fromIso(value: string): Ymd {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

function addDays(ymd: Ymd, days: number): Ymd {
  const date = new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day + days));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function weekday(ymd: Ymd): number {
  return new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day)).getUTCDay();
}

function nthWeekday(year: number, month: number, weekdayWanted: number, n: number): Ymd {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const delta = (weekdayWanted - firstWeekday + 7) % 7;
  return { year, month, day: 1 + delta + (n - 1) * 7 };
}

function lastWeekday(year: number, month: number, weekdayWanted: number): Ymd {
  const last = new Date(Date.UTC(year, month, 0));
  const delta = (last.getUTCDay() - weekdayWanted + 7) % 7;
  return { year, month, day: last.getUTCDate() - delta };
}

function observe(ymd: Ymd): string {
  const day = weekday(ymd);
  if (day === 6) return iso(addDays(ymd, -1));
  if (day === 0) return iso(addDays(ymd, 1));
  return iso(ymd);
}

/** Observed US federal holidays for one calendar year, as YYYY-MM-DD. */
export function usFederalHolidaySet(year: number): Set<string> {
  const dates = [
    observe({ year, month: 1, day: 1 }),
    iso(nthWeekday(year, 1, 1, 3)),
    iso(nthWeekday(year, 2, 1, 3)),
    iso(lastWeekday(year, 5, 1)),
    observe({ year, month: 6, day: 19 }),
    observe({ year, month: 7, day: 4 }),
    iso(nthWeekday(year, 9, 1, 1)),
    iso(nthWeekday(year, 10, 1, 2)),
    observe({ year, month: 11, day: 11 }),
    iso(nthWeekday(year, 11, 4, 4)),
    observe({ year, month: 12, day: 25 }),
  ];
  const nextNewYear = { year: year + 1, month: 1, day: 1 };
  if (weekday(nextNewYear) === 6) dates.push(iso({ year, month: 12, day: 31 }));
  return new Set(dates);
}

const holidayCache = new Map<number, Set<string>>();

export function isUsFederalHoliday(isoDate: string): boolean {
  const ymd = fromIso(isoDate.slice(0, 10));
  let set = holidayCache.get(ymd.year);
  if (!set) {
    set = usFederalHolidaySet(ymd.year);
    holidayCache.set(ymd.year, set);
  }
  return set.has(isoDate.slice(0, 10));
}

function zonedParts(instant: Date, timeZone: string): Ymd & { hour: number; minute: number } {
  const bag: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant)) {
    if (part.type !== "literal") bag[part.type] = part.value;
  }
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: Number(bag.hour),
    minute: Number(bag.minute),
  };
}

function offsetMinutes(instant: Date, timeZone: string): number {
  const parts = zonedParts(instant, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

/** Civil time in `timeZone` as a UTC instant. */
export function zonedTimeToUtc(ymd: Ymd, hour: number, minute: number, timeZone: string): Date {
  let utc = Date.UTC(ymd.year, ymd.month - 1, ymd.day, hour, minute);
  for (let i = 0; i < 3; i++) {
    utc = Date.UTC(ymd.year, ymd.month - 1, ymd.day, hour, minute) - offsetMinutes(new Date(utc), timeZone) * 60_000;
  }
  return new Date(utc);
}

function clock(instant: Date, timeZone: string, suffix: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("weekday")} ${get("day")} ${get("month")} ${get("year")}, ${get("hour")}:${get("minute")} ${suffix}`;
}

/** EIA moves WPSR to Thursday when Monday or Wednesday of that week is a US federal holiday. */
function wpsrDelayed(wednesday: Ymd): boolean {
  const monday = addDays(wednesday, -2);
  return isUsFederalHoliday(iso(wednesday)) || isUsFederalHoliday(iso(monday));
}

function isWpsrDate(ymd: Ymd): boolean {
  const day = weekday(ymd);
  if (day === 3) return !wpsrDelayed(ymd);
  if (day === 4) return wpsrDelayed(addDays(ymd, -1));
  return false;
}

function nextMatch(now: Date, matches: (ymd: Ymd) => boolean, hour: number, minute: number): Date {
  const start = zonedParts(now, NEW_YORK);
  const startYmd = { year: start.year, month: start.month, day: start.day };
  for (let i = 0; i < 21; i++) {
    const ymd = addDays(startYmd, i);
    if (!matches(ymd)) continue;
    const instant = zonedTimeToUtc(ymd, hour, minute, NEW_YORK);
    if (instant.getTime() >= now.getTime() - 60_000) return instant;
  }
  throw new Error("No release found in the next three weeks");
}

export function upcomingReleases(now: Date): ReleaseEvent[] {
  const eia = nextMatch(now, isWpsrDate, 10, 30);
  const rigs = nextMatch(now, (ymd) => weekday(ymd) === 5, 13, 0);
  const cot = nextMatch(now, (ymd) => weekday(ymd) === 5, 15, 30);
  return [
    {
      id: "eia-wpsr",
      title: "EIA Weekly Petroleum Status Report",
      whenEt: clock(eia, NEW_YORK, "ET"),
      whenUk: clock(eia, LONDON, "UK"),
      href: "https://www.eia.gov/petroleum/supply/weekly/",
      detail:
        "Wednesday 10:30 ET, or Thursday when a US federal holiday falls on the Monday or the Wednesday of that week.",
    },
    {
      id: "baker-hughes",
      title: "Baker Hughes rig count",
      whenEt: clock(rigs, NEW_YORK, "ET"),
      whenUk: clock(rigs, LONDON, "UK"),
      href: "https://rigcount.bakerhughes.com/",
      detail: "Friday 1:00pm ET. Link only. This note does not republish rig-count figures.",
    },
    {
      id: "cftc-cot",
      title: "CFTC Commitments of Traders",
      whenEt: clock(cot, NEW_YORK, "ET"),
      whenUk: clock(cot, LONDON, "UK"),
      href: "https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm",
      detail: "Friday 3:30pm ET.",
    },
  ];
}

export function formatLondonTimestamp(iso: string): string {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return iso;
  return clock(instant, LONDON, "UK");
}
