import { EIA_API_BASE, fetchWithRetry, readEiaApiKey, redactApiKey } from "@/lib/eia";

/**
 * World oil balance from the EIA Short-Term Energy Outlook (STEO), read
 * through the EIA Open Data API. STEO is EIA's own monthly publication: past
 * months are EIA estimates, the current and later months are EIA forecasts.
 * Nothing here is measured or forecast by The Crude Oracle.
 *
 * Series labels and units shown on the site are the ones EIA returns with
 * the data, not ones typed here, so a wrong series id cannot be mislabelled:
 * it simply does not load.
 */

/** STEO series requested. `role` only decides where a series is used on the page. */
export const STEO_SERIES = [
  { id: "PAPR_WORLD", role: "world_supply" },
  { id: "PATC_WORLD", role: "world_demand" },
  { id: "PAPR_OPEC", role: "supply" },
  { id: "PAPR_NONOPEC", role: "supply" },
  { id: "COPR_OPEC", role: "supply" },
  { id: "COPRPUS", role: "supply" },
  { id: "COPS_OPEC", role: "supply" },
  { id: "PATC_OECD", role: "demand" },
  { id: "PATC_NON_OECD", role: "demand" },
  { id: "PASC_OECD_T3", role: "stocks" },
] as const;

export type SteoRole = (typeof STEO_SERIES)[number]["role"];

export interface SteoPoint {
  /** YYYY-MM */
  period: string;
  value: number;
}

export interface SteoSeries {
  id: string;
  role: SteoRole;
  /** EIA's own description of the series. */
  description: string;
  /** EIA's own unit for the series. */
  unit: string;
  /** Oldest first. */
  points: SteoPoint[];
}

export interface SteoRow {
  id: string;
  role: SteoRole;
  description: string;
  unit: string;
  /** Latest month that is an EIA estimate rather than a forecast. */
  latest: SteoPoint;
  yearAgo: SteoPoint | null;
  /** Latest minus the same month a year earlier. */
  changeOnYear: number | null;
  /** EIA forecast three months after `latest`, when published. */
  forecast: SteoPoint | null;
}

export interface SteoBalance {
  /** YYYY-MM of the latest estimated month shared by supply and demand. */
  period: string;
  supply: number;
  demand: number;
  /** Supply minus demand. Positive means supply exceeded demand. */
  balance: number;
  unit: string;
}

export interface SteoFeed {
  rows: SteoRow[];
  balance: SteoBalance | null;
  /** Newest estimated month across the rows, YYYY-MM. */
  asOf: string;
  fetchedAt: string;
}

const PERIOD = /^\d{4}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function shiftMonth(period: string, months: number): string {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Groups an EIA v2 STEO response into series. Rows that are not well-formed are dropped. */
export function parseSteoResponse(json: unknown): SteoSeries[] {
  const rows = isRecord(json) && isRecord(json.response) && Array.isArray(json.response.data) ? json.response.data : [];
  const byId = new Map<string, SteoSeries>();
  for (const row of rows) {
    if (!isRecord(row)) continue;
    const { seriesId, period, seriesDescription, unit } = row;
    const wanted = STEO_SERIES.find((series) => series.id === seriesId);
    const value = typeof row.value === "number" ? row.value : typeof row.value === "string" && row.value.trim() !== "" ? Number(row.value) : NaN;
    if (!wanted || typeof period !== "string" || !PERIOD.test(period) || !Number.isFinite(value)) continue;
    if (typeof seriesDescription !== "string" || !seriesDescription.trim() || typeof unit !== "string" || !unit.trim()) continue;
    let series = byId.get(wanted.id);
    if (!series) {
      series = { id: wanted.id, role: wanted.role, description: seriesDescription.trim(), unit: unit.trim(), points: [] };
      byId.set(wanted.id, series);
    }
    if (!series.points.some((point) => point.period === period)) series.points.push({ period, value });
  }
  const order = STEO_SERIES.map((series) => series.id as string);
  return Array.from(byId.values())
    .map((series) => ({ ...series, points: series.points.sort((a, b) => a.period.localeCompare(b.period)) }))
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}

/**
 * Builds the rows for the page. `currentPeriod` is the current calendar month
 * (YYYY-MM): months before it are treated as EIA estimates, the rest as EIA
 * forecasts, which is how STEO itself is laid out.
 */
export function buildSteoFeed(series: SteoSeries[], currentPeriod: string, fetchedAt: string): SteoFeed | null {
  const rows: SteoRow[] = [];
  for (const item of series) {
    const estimated = item.points.filter((point) => point.period < currentPeriod);
    const latest = estimated.at(-1);
    if (!latest) continue;
    const find = (period: string) => item.points.find((point) => point.period === period) ?? null;
    const yearAgo = find(shiftMonth(latest.period, -12));
    rows.push({
      id: item.id,
      role: item.role,
      description: item.description,
      unit: item.unit,
      latest,
      yearAgo,
      changeOnYear: yearAgo ? latest.value - yearAgo.value : null,
      forecast: find(shiftMonth(latest.period, 3)),
    });
  }
  if (!rows.length) return null;

  const supply = rows.find((row) => row.role === "world_supply");
  const demand = rows.find((row) => row.role === "world_demand");
  const balance =
    supply && demand && supply.latest.period === demand.latest.period && supply.unit === demand.unit
      ? {
          period: supply.latest.period,
          supply: supply.latest.value,
          demand: demand.latest.value,
          balance: supply.latest.value - demand.latest.value,
          unit: supply.unit,
        }
      : null;

  return {
    rows,
    balance,
    asOf: rows.map((row) => row.latest.period).sort().at(-1)!,
    fetchedAt,
  };
}

export function buildSteoUrl(apiKey: string, start: string, end: string): string {
  const url = new URL(`${EIA_API_BASE}/steo/data/`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("frequency", "monthly");
  url.searchParams.append("data[0]", "value");
  for (const series of STEO_SERIES) url.searchParams.append("facets[seriesId][]", series.id);
  url.searchParams.set("start", start);
  url.searchParams.set("end", end);
  url.searchParams.set("sort[0][column]", "period");
  url.searchParams.set("sort[0][direction]", "asc");
  url.searchParams.set("offset", "0");
  url.searchParams.set("length", "1000");
  return url.toString();
}

/** The STEO world balance, or null when the site has no EIA key or the read fails. Never throws. */
export async function getSteoFeed(now = new Date()): Promise<SteoFeed | null> {
  const apiKey = readEiaApiKey();
  if (!apiKey) return null;
  const current = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  try {
    const json = await fetchWithRetry(buildSteoUrl(apiKey, shiftMonth(current, -15), shiftMonth(current, 6)));
    return buildSteoFeed(parseSteoResponse(json), current, now.toISOString());
  } catch (error) {
    console.warn(`[steo] not loaded: ${redactApiKey(error instanceof Error ? error.message : String(error))}`);
    return null;
  }
}

export function formatSteoMonth(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 1))
  );
}
