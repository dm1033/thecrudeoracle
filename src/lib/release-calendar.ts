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
  /** UTC instant of the release. */
  at: string;
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

function isBusinessDay(ymd: Ymd): boolean {
  const day = weekday(ymd);
  return day !== 0 && day !== 6 && !isUsFederalHoliday(iso(ymd));
}

function nextBusinessDay(ymd: Ymd): Ymd {
  let cursor = ymd;
  for (let i = 0; i < 10; i++) {
    if (isBusinessDay(cursor)) return cursor;
    cursor = addDays(cursor, 1);
  }
  return cursor;
}

function isThanksgiving(ymd: Ymd): boolean {
  if (ymd.month !== 11 || weekday(ymd) !== 4) return false;
  return ymd.day === nthWeekday(ymd.year, 11, 4, 4).day;
}

/**
 * CFTC Commitments of Traders release dates for 2026, 3:30 p.m. Eastern.
 * Source: https://www.cftc.gov/MarketReports/CommitmentsofTraders/ReleaseSchedule/index.htm
 * (tentative schedule through 2026, read 23 Nov 2026). Dates CFTC marks with an
 * asterisk are delayed for a federal holiday. Several of those Mondays are not
 * "the next business day after a Friday holiday": 5 Jan, 16 Nov and 30 Nov
 * replace a Friday that was itself a business day. The published list is the
 * source for 2026. Other years use the Friday business-day rule below until
 * CFTC posts that year's table.
 */
const CFTC_COT_RELEASES_2026 = [
  "2026-01-05",
  "2026-01-09",
  "2026-01-16",
  "2026-01-23",
  "2026-01-30",
  "2026-02-06",
  "2026-02-13",
  "2026-02-20",
  "2026-02-27",
  "2026-03-06",
  "2026-03-13",
  "2026-03-20",
  "2026-03-27",
  "2026-04-03",
  "2026-04-10",
  "2026-04-17",
  "2026-04-24",
  "2026-05-01",
  "2026-05-08",
  "2026-05-15",
  "2026-05-22",
  "2026-05-29",
  "2026-06-05",
  "2026-06-12",
  "2026-06-22",
  "2026-06-26",
  "2026-07-06",
  "2026-07-10",
  "2026-07-17",
  "2026-07-24",
  "2026-07-31",
  "2026-08-07",
  "2026-08-14",
  "2026-08-21",
  "2026-08-28",
  "2026-09-04",
  "2026-09-11",
  "2026-09-18",
  "2026-09-25",
  "2026-10-02",
  "2026-10-09",
  "2026-10-16",
  "2026-10-23",
  "2026-10-30",
  "2026-11-06",
  "2026-11-16",
  "2026-11-20",
  "2026-11-30",
  "2026-12-04",
  "2026-12-11",
  "2026-12-18",
  "2026-12-28",
] as const;

const CFTC_COT_BY_YEAR = new Map<number, Set<string>>([[2026, new Set(CFTC_COT_RELEASES_2026)]]);

/**
 * Baker Hughes North America rig-count days posted on
 * https://rigcount.bakerhughes.com/rig-count-overview/ (read 23 Nov 2026).
 * The page says noon Central on the last workday, and names these holiday weeks:
 * Wednesday 25 Nov 2026 instead of Friday 27 Nov 2026; Wednesday 23 Dec 2026
 * instead of the Christmas Friday (the page writes "December 25, 2025", which
 * was a Thursday — Christmas Day 2026 is the Friday); Wednesday 30 Dec 2026
 * instead of Friday 1 Jan 2027. Noon Central is 13:00 Eastern all year.
 */
const BAKER_HUGHES_POSTED: { on: string; insteadOf: string }[] = [
  { on: "2026-11-25", insteadOf: "2026-11-27" },
  { on: "2026-12-23", insteadOf: "2026-12-25" },
  { on: "2026-12-30", insteadOf: "2027-01-01" },
];

const RIG_MAY_SHIFT = "may shift — check Baker Hughes";

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

function releaseEvent(
  id: ReleaseEvent["id"],
  title: string,
  instant: Date,
  href: string,
  detail: string,
): ReleaseEvent {
  return {
    id,
    title,
    at: instant.toISOString(),
    whenEt: clock(instant, NEW_YORK, "ET"),
    whenUk: clock(instant, LONDON, "UK"),
    href,
    detail,
  };
}

const WPSR_DETAIL =
  "Wednesday 10:30 ET, or Thursday when a US federal holiday falls on the Monday or the Wednesday of that week.";
const RIGS_DETAIL = "Friday 1:00pm ET, noon Central. Link only. This note does not republish rig-count figures.";
const RIGS_SHIFTED_DETAIL =
  "1:00pm ET, noon Central. Baker Hughes posted this holiday-week day on its rig-count page. Link only. This note does not republish rig-count figures.";
const RIGS_UNCONFIRMED_DETAIL =
  "Baker Hughes publishes at noon Central on the last workday of the week and moves earlier in some holiday weeks. No substitute day is posted here, so the time may shift — check Baker Hughes. Link only. This note does not republish rig-count figures.";
const COT_FRIDAY_DETAIL = "Friday 3:30pm ET. Positions are as of the previous Tuesday.";
const COT_SCHEDULE_URL = "https://www.cftc.gov/MarketReports/CommitmentsofTraders/ReleaseSchedule/index.htm";

interface DatedInstant {
  ymd: Ymd;
  instant: Date;
}

function nextDated(now: Date, matches: (ymd: Ymd) => boolean, hour: number, minute: number): DatedInstant {
  const start = zonedParts(now, NEW_YORK);
  const startYmd = { year: start.year, month: start.month, day: start.day };
  for (let i = 0; i < 21; i++) {
    const ymd = addDays(startYmd, i);
    if (!matches(ymd)) continue;
    const instant = zonedTimeToUtc(ymd, hour, minute, NEW_YORK);
    if (instant.getTime() >= now.getTime() - 60_000) return { ymd, instant };
  }
  throw new Error("No release found in the next three weeks");
}

/** Friday, unless that Friday is a US holiday, in which case the next business day. */
function inferredCotDate(ymd: Ymd): boolean {
  const day = weekday(ymd);
  if (day === 0 || day === 6) return false;
  const friday = addDays(ymd, -((day + 2) % 7));
  if (weekday(friday) !== 5) return false;
  if (isBusinessDay(friday)) return day === 5;
  return iso(nextBusinessDay(friday)) === iso(ymd);
}

function isCotDate(ymd: Ymd): boolean {
  const published = CFTC_COT_BY_YEAR.get(ymd.year);
  if (published) return published.has(iso(ymd));
  return inferredCotDate(ymd);
}

interface RigHit {
  ymd: Ymd;
  shifted: boolean;
  unconfirmed: boolean;
}

function rigHit(ymd: Ymd): RigHit | null {
  const key = iso(ymd);
  if (BAKER_HUGHES_POSTED.some((row) => row.on === key)) return { ymd, shifted: true, unconfirmed: false };
  if (weekday(ymd) !== 5) return null;
  if (BAKER_HUGHES_POSTED.some((row) => row.insteadOf === key)) return null;
  const holidayWeek = !isBusinessDay(ymd) || isThanksgiving(addDays(ymd, -1));
  if (holidayWeek) return { ymd, shifted: false, unconfirmed: true };
  return { ymd, shifted: false, unconfirmed: false };
}

function wpsrEvent(instant: Date): ReleaseEvent {
  return releaseEvent(
    "eia-wpsr",
    "EIA Weekly Petroleum Status Report",
    instant,
    "https://www.eia.gov/petroleum/supply/weekly/",
    WPSR_DETAIL,
  );
}

function rigsEvent(hit: RigHit): ReleaseEvent {
  const instant = zonedTimeToUtc(hit.ymd, 13, 0, NEW_YORK);
  const event = releaseEvent(
    "baker-hughes",
    "Baker Hughes rig count",
    instant,
    "https://rigcount.bakerhughes.com/",
    hit.unconfirmed ? RIGS_UNCONFIRMED_DETAIL : hit.shifted ? RIGS_SHIFTED_DETAIL : RIGS_DETAIL,
  );
  if (!hit.unconfirmed) return event;
  return { ...event, whenEt: RIG_MAY_SHIFT, whenUk: RIG_MAY_SHIFT };
}

function cotDetail(ymd: Ymd): string {
  if (weekday(ymd) === 5) return COT_FRIDAY_DETAIL;
  const published = CFTC_COT_BY_YEAR.has(ymd.year);
  const why = published
    ? "CFTC's published schedule moves this report off Friday because of a federal holiday."
    : "That week's Friday is a US federal holiday, so this uses the next business day. CFTC's own schedule can differ by a further day.";
  return `3:30pm ET. ${why} Positions are as of the previous Tuesday.`;
}

function cotEvent(dated: DatedInstant): ReleaseEvent {
  return releaseEvent(
    "cftc-cot",
    "CFTC Commitments of Traders",
    dated.instant,
    COT_SCHEDULE_URL,
    cotDetail(dated.ymd),
  );
}

export function upcomingReleases(now: Date): ReleaseEvent[] {
  const eia = nextDated(now, isWpsrDate, 10, 30);
  const rigs = nextDated(now, (ymd) => rigHit(ymd) !== null, 13, 0);
  const cot = nextDated(now, isCotDate, 15, 30);
  const rig = rigHit(rigs.ymd);
  if (!rig) throw new Error("No Baker Hughes release found in the next three weeks");
  return [wpsrEvent(eia.instant), rigsEvent(rig), cotEvent(cot)];
}

/**
 * Next day EIA posts the Brent (RBRTE) and WTI (RWTC) daily spots.
 * Those series are daily observations released in a weekly batch with the
 * Weekly Petroleum Status Report. Checked 23 Nov 2026 on FRED series
 * DCOILBRENTEU and DCOILWTICO (EIA source): observations through 17 Nov,
 * updated 18 Nov, next release 25 Nov, which is the next WPSR Wednesday.
 * Henry Hub (RNGWHHD) carried the same next release date that day. The label
 * is the report's New York calendar day. Holiday weeks follow the same
 * Wednesday-or-Thursday rule as the petroleum report.
 */
export function nextEiaSpotUpdate(now: Date): { date: string; label: string } {
  const dated = nextDated(now, isWpsrDate, 10, 30);
  const label = clock(dated.instant, NEW_YORK, "ET").split(",")[0] ?? iso(dated.ymd);
  return { date: iso(dated.ymd), label };
}

/**
 * Coming WPSR, Baker Hughes and CFTC releases inside a horizon.
 * Times come from the same rules as `upcomingReleases`. The Short-Term
 * Energy Outlook is monthly and is not given a clock time here.
 */
function daysAfter(start: Ymd, ymd: Ymd): number {
  const from = Date.UTC(start.year, start.month - 1, start.day);
  const to = Date.UTC(ymd.year, ymd.month - 1, ymd.day);
  return Math.round((to - from) / 86_400_000);
}

function inHorizon(start: Ymd, ymd: Ymd, horizonDays: number): boolean {
  const delta = daysAfter(start, ymd);
  return delta >= 0 && delta < horizonDays;
}

/** Friday of the week containing `ymd`, for a Mon–Fri release. */
function fridayOf(ymd: Ymd): Ymd {
  return addDays(ymd, -((weekday(ymd) + 2) % 7));
}

export function calendarReleases(now: Date, horizonDays = 35): ReleaseEvent[] {
  const start = zonedParts(now, NEW_YORK);
  const startYmd = { year: start.year, month: start.month, day: start.day };
  const events: ReleaseEvent[] = [];
  const cutoff = now.getTime() - 60_000;
  // A Friday inside the window can be published the following Monday. Scan those extra days
  // and keep the Monday only when the Friday it replaces is still inside the window.
  for (let i = 0; i < horizonDays + 4; i++) {
    const ymd = addDays(startYmd, i);
    const inside = i < horizonDays;
    if (inside && isWpsrDate(ymd)) {
      const instant = zonedTimeToUtc(ymd, 10, 30, NEW_YORK);
      if (instant.getTime() >= cutoff) events.push(wpsrEvent(instant));
    }
    const rig = rigHit(ymd);
    if (rig) {
      const posted = BAKER_HUGHES_POSTED.find((row) => row.on === iso(ymd));
      const anchor = posted ? fromIso(posted.insteadOf) : ymd;
      if (inside || inHorizon(startYmd, anchor, horizonDays)) {
        const event = rigsEvent(rig);
        if (new Date(event.at).getTime() >= cutoff) events.push(event);
      }
    }
    if (isCotDate(ymd)) {
      const anchor = weekday(ymd) === 5 ? ymd : fridayOf(ymd);
      if (inside || inHorizon(startYmd, anchor, horizonDays)) {
        const instant = zonedTimeToUtc(ymd, 15, 30, NEW_YORK);
        if (instant.getTime() >= cutoff) events.push(cotEvent({ ymd, instant }));
      }
    }
  }
  return events.sort((a, b) => a.at.localeCompare(b.at));
}

export function formatLondonTimestamp(iso: string): string {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return iso;
  return clock(instant, LONDON, "UK");
}
