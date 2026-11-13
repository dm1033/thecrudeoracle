import { EIA_API_BASE, fetchWithRetry, readEiaApiKey, redactApiKey } from "@/lib/eia";

/**
 * Curve and spread data for /tools/curve-monitor, read from the EIA Open Data
 * API. Two public EIA tables are used: daily spot prices and the NYMEX
 * futures contracts 1 to 4 that EIA publishes for WTI.
 *
 * Series names and units are the ones EIA returns with the data. A series
 * that does not load, or whose unit is not the one expected, is left out.
 * The spreads are subtractions of EIA's figures on a shared date; nothing is
 * estimated, filled forward or carried over from an earlier day.
 */

export const GALLONS_PER_BARREL = 42;

/** EIA futures figures older than this are treated as no longer published. */
export const FUTURES_MAX_AGE_DAYS = 10;

type Unit = "bbl" | "gal";

export const SPOT_SERIES = [
  { id: "RBRTE", role: "brent", unit: "bbl" },
  { id: "RWTC", role: "wti", unit: "bbl" },
  { id: "EER_EPMRU_PF4_Y35NY_DPG", role: "gasoline", unit: "gal" },
  { id: "EER_EPD2DXL0_PF4_Y35NY_DPG", role: "diesel", unit: "gal" },
] as const;

export const FUTURES_SERIES = [
  { id: "RCLC1", contract: 1, unit: "bbl" },
  { id: "RCLC2", contract: 2, unit: "bbl" },
  { id: "RCLC3", contract: 3, unit: "bbl" },
  { id: "RCLC4", contract: 4, unit: "bbl" },
] as const;

export type SpotRole = (typeof SPOT_SERIES)[number]["role"];

export interface CurvePoint {
  /** YYYY-MM-DD */
  date: string;
  value: number;
}

export interface CurveSeries {
  id: string;
  /** EIA's own name for the series. */
  description: string;
  /** EIA's own unit for the series. */
  unit: string;
  /** Newest first. */
  points: CurvePoint[];
}

export interface CurveRow {
  id: string;
  description: string;
  unit: string;
  latest: CurvePoint;
  /** The observation before the latest one. */
  previous: CurvePoint | null;
  change: number | null;
  /** The observation on or just before 30 days ahead of the latest. */
  monthAgo: CurvePoint | null;
}

export interface SpreadRow {
  key: "brent_wti" | "gasoline_crack" | "diesel_crack" | "crack_321";
  label: string;
  /** How the figure is worked out, in words. */
  method: string;
  latest: CurvePoint;
  previous: CurvePoint | null;
  change: number | null;
  monthAgo: CurvePoint | null;
}

export interface SpreadHistoryRow {
  date: string;
  brent_wti?: number;
  gasoline_crack?: number;
  diesel_crack?: number;
  crack_321?: number;
}

export interface FuturesCurve {
  /** The one date every contract shown shares. */
  date: string;
  contracts: { contract: number; id: string; description: string; unit: string; value: number; change: number | null }[];
  /** Contract 1 minus the furthest contract shown. Positive: near contract priced above the later one. */
  nearMinusFar: number | null;
  farContract: number | null;
}

export interface CurveFeed {
  spots: CurveRow[];
  spreads: SpreadRow[];
  /** Oldest first, for the chart. */
  history: SpreadHistoryRow[];
  futures: FuturesCurve | null;
  /** Set when EIA returned futures figures that are too old to show. */
  futuresLastDate: string | null;
  /** Newest date across everything shown. */
  asOf: string;
  fetchedAt: string;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function unitMatches(expected: Unit, reported: string): boolean {
  const normalized = reported.toUpperCase().replace(/[^A-Z]/g, "");
  return expected === "bbl" ? normalized.includes("BBL") || normalized.includes("BARREL") : normalized.includes("GAL");
}

/**
 * Groups an EIA v2 price response into the requested series, newest first.
 * Rows without a date, a finite positive value, EIA's own name and the
 * expected unit are dropped.
 */
export function parsePriceResponse(json: unknown, wanted: readonly { id: string; unit: Unit }[]): CurveSeries[] {
  const rows = isRecord(json) && isRecord(json.response) && Array.isArray(json.response.data) ? json.response.data : [];
  const byId = new Map<string, CurveSeries>();
  for (const row of rows) {
    if (!isRecord(row)) continue;
    const def = wanted.find((series) => series.id === row.series);
    const period = row.period;
    const description = row["series-description"];
    const units = row.units;
    const value =
      typeof row.value === "number" ? row.value : typeof row.value === "string" && row.value.trim() !== "" ? Number(row.value) : NaN;
    if (!def || typeof period !== "string" || !DATE.test(period) || !Number.isFinite(value) || value <= 0) continue;
    if (typeof description !== "string" || !description.trim() || typeof units !== "string" || !unitMatches(def.unit, units)) continue;
    let series = byId.get(def.id);
    if (!series) {
      series = { id: def.id, description: description.trim(), unit: units.trim(), points: [] };
      byId.set(def.id, series);
    }
    if (!series.points.some((point) => point.date === period)) series.points.push({ date: period, value });
  }
  const order = wanted.map((series) => series.id);
  return Array.from(byId.values())
    .map((series) => ({ ...series, points: series.points.sort((a, b) => b.date.localeCompare(a.date)) }))
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}

function shiftDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** Latest, previous and month-ago points from a newest-first list. */
function summarise(points: CurvePoint[], digits: number) {
  const latest = points[0];
  const previous = points[1] ?? null;
  const target = shiftDays(latest.date, -30);
  const monthAgo = points.find((point) => point.date <= target) ?? null;
  return { latest, previous, change: previous ? round(latest.value - previous.value, digits) : null, monthAgo };
}

/** Newest-first points for a calculation over dates that every input series has. */
function combine(inputs: CurvePoint[][], compute: (values: number[]) => number): CurvePoint[] {
  if (inputs.some((points) => !points.length)) return [];
  const maps = inputs.map((points) => new Map(points.map((point) => [point.date, point.value])));
  return inputs[0]
    .filter((point) => maps.every((map) => map.has(point.date)))
    .map((point) => ({ date: point.date, value: round(compute(maps.map((map) => map.get(point.date)!)), 2) }));
}

/**
 * Builds the page's feed. `today` (YYYY-MM-DD) is only used to decide whether
 * EIA's futures figures are recent enough to show.
 */
export function buildCurveFeed(
  spotSeries: CurveSeries[],
  futuresSeries: CurveSeries[],
  today: string,
  fetchedAt: string,
  historyLength = 60
): CurveFeed | null {
  const spots: CurveRow[] = spotSeries
    .filter((series) => series.points.length)
    .map((series) => ({
      id: series.id,
      description: series.description,
      unit: series.unit,
      ...summarise(series.points, series.unit.toUpperCase().includes("GAL") ? 3 : 2),
    }));

  const pointsOf = (role: SpotRole) => {
    const id = SPOT_SERIES.find((series) => series.role === role)!.id;
    return spotSeries.find((series) => series.id === id)?.points ?? [];
  };
  const brent = pointsOf("brent");
  const wti = pointsOf("wti");
  const gasoline = pointsOf("gasoline");
  const diesel = pointsOf("diesel");

  const definitions: { key: SpreadRow["key"]; label: string; method: string; points: CurvePoint[] }[] = [
    {
      key: "brent_wti",
      label: "Brent minus WTI",
      method: "Brent spot minus WTI spot, same day.",
      points: combine([brent, wti], ([b, w]) => b - w),
    },
    {
      key: "gasoline_crack",
      label: "New York Harbor gasoline minus WTI",
      method: "Gasoline spot in $/gal × 42, minus WTI spot, same day.",
      points: combine([gasoline, wti], ([g, w]) => g * GALLONS_PER_BARREL - w),
    },
    {
      key: "diesel_crack",
      label: "New York Harbor diesel minus WTI",
      method: "Diesel spot in $/gal × 42, minus WTI spot, same day.",
      points: combine([diesel, wti], ([d, w]) => d * GALLONS_PER_BARREL - w),
    },
    {
      key: "crack_321",
      label: "3-2-1 crack against WTI",
      method: "Two barrels of gasoline plus one of diesel, divided by three, minus WTI spot, same day.",
      points: combine([gasoline, diesel, wti], ([g, d, w]) => ((2 * g + d) * GALLONS_PER_BARREL) / 3 - w),
    },
  ];
  const live = definitions.filter((definition) => definition.points.length);
  const spreads: SpreadRow[] = live.map(({ key, label, method, points }) => ({ key, label, method, ...summarise(points, 2) }));

  const byDate = new Map<string, SpreadHistoryRow>();
  for (const { key, points } of live) {
    for (const point of points.slice(0, historyLength)) {
      const row = byDate.get(point.date) ?? { date: point.date };
      row[key] = point.value;
      byDate.set(point.date, row);
    }
  }
  const history = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Futures: only the contracts that share the newest date, and only if recent.
  const withData = futuresSeries.filter((series) => series.points.length);
  const futuresLastDate = withData.map((series) => series.points[0].date).sort().at(-1) ?? null;
  let futures: FuturesCurve | null = null;
  if (futuresLastDate && daysBetween(futuresLastDate, today) <= FUTURES_MAX_AGE_DAYS) {
    const contracts = FUTURES_SERIES.flatMap((def) => {
      const series = withData.find((item) => item.id === def.id);
      if (!series || series.points[0].date !== futuresLastDate) return [];
      const previous = series.points[1] ?? null;
      return [
        {
          contract: def.contract,
          id: series.id,
          description: series.description,
          unit: series.unit,
          value: series.points[0].value,
          change: previous ? round(series.points[0].value - previous.value, 2) : null,
        },
      ];
    });
    if (contracts.length >= 2 && contracts[0].contract === 1) {
      const far = contracts.at(-1)!;
      futures = {
        date: futuresLastDate,
        contracts,
        nearMinusFar: round(contracts[0].value - far.value, 2),
        farContract: far.contract,
      };
    }
  }

  if (!spots.length && !futures) return null;
  const dates = [...spots.map((row) => row.latest.date), ...(futures ? [futures.date] : [])];
  return {
    spots,
    spreads,
    history,
    futures,
    futuresLastDate: futures ? null : futuresLastDate,
    asOf: dates.sort().at(-1)!,
    fetchedAt,
  };
}

export function buildPriceUrl(apiKey: string, route: string, seriesIds: readonly string[], length: number): string {
  const url = new URL(`${EIA_API_BASE}/${route}/data/`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("frequency", "daily");
  url.searchParams.append("data[0]", "value");
  for (const id of seriesIds) url.searchParams.append("facets[series][]", id);
  url.searchParams.set("sort[0][column]", "period");
  url.searchParams.set("sort[0][direction]", "desc");
  url.searchParams.set("offset", "0");
  url.searchParams.set("length", String(length));
  return url.toString();
}

async function read(what: string, url: string, wanted: readonly { id: string; unit: Unit }[]): Promise<CurveSeries[]> {
  try {
    return parsePriceResponse(await fetchWithRetry(url), wanted);
  } catch (error) {
    console.warn(`[curve] ${what} not loaded: ${redactApiKey(error instanceof Error ? error.message : String(error))}`);
    return [];
  }
}

/** The curve feed, or null when the site has no EIA key or nothing loads. Never throws. */
export async function getCurveFeed(now = new Date()): Promise<CurveFeed | null> {
  const apiKey = readEiaApiKey();
  if (!apiKey) return null;
  const [spots, futures] = await Promise.all([
    read("spot prices", buildPriceUrl(apiKey, "petroleum/pri/spt", SPOT_SERIES.map((s) => s.id), 400), SPOT_SERIES),
    read("futures", buildPriceUrl(apiKey, "petroleum/pri/fut", FUTURES_SERIES.map((s) => s.id), 40), FUTURES_SERIES),
  ]);
  return buildCurveFeed(spots, futures, now.toISOString().slice(0, 10), now.toISOString());
}
