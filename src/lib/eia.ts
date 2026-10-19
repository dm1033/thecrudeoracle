/**
 * src/lib/eia.ts
 * ----------------------------------------------------------------------------
 * Typed, dependency-free client for the US Energy Information Administration
 * (EIA) Open Data API v2 (https://api.eia.gov/v2). Public-domain data, free
 * API key, no licence restriction — see https://www.eia.gov/opendata/.
 *
 * This file has THREE layers, kept deliberately separate so the middle two
 * can be unit-tested from fixtures with zero network access:
 *
 *   1. Network:    fetchWithRetry()            — timeout + retry/backoff, I/O only
 *   2. Parsing:    parseEiaResponse()           — untrusted JSON -> validated EiaObservation[]
 *   3. Transform:  buildDailySeriesResult() /
 *                  buildWeeklySeriesResult()    — pure arithmetic over validated observations
 *
 * High-level functions (getWtiSpot, getBrentSpot, getUsCommercialCrudeStocks,
 * getCushingStocks) wire all three layers together for the update script.
 *
 * IMPORTANT — series identifiers were written from training-data recollection
 * of the EIA v2 API; this development environment has no outbound internet
 * access to confirm them live against https://www.eia.gov/opendata/browser/.
 * Each entry in EIA_SERIES below carries a `confidence` rating and a
 * `verificationNote` — read them before the first production run. A wrong
 * route or series id fails LOUDLY (HTTP error or zero-rows validation error),
 * not silently — this module never invents a fallback value.
 * ----------------------------------------------------------------------------
 */

// ============================================================================
// Errors
// ============================================================================

/** Thrown when required configuration (the API key) is missing or invalid. */
export class EiaConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EiaConfigError";
  }
}

/** Thrown when the HTTP request to EIA fails (network, timeout, non-2xx after retries). */
export class EiaFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EiaFetchError";
  }
}

/** Thrown when an EIA response does not match the shape this module trusts. */
export class EiaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EiaValidationError";
  }
}

// ============================================================================
// Configuration
// ============================================================================

export const EIA_API_BASE = "https://api.eia.gov/v2";

/** Default per-attempt network timeout. */
export const DEFAULT_TIMEOUT_MS = 15_000;

/** Hard cap on retry attempts (in addition to the initial attempt). */
export const DEFAULT_MAX_RETRIES = 3;

/** Base delay for exponential backoff between retries (doubles each attempt, plus jitter). */
export const DEFAULT_RETRY_BASE_DELAY_MS = 1_000;

const PLACEHOLDER_KEYS = new Set(["replace_me"]);

/**
 * Strips surrounding whitespace and one pair of matching quotes. Netlify and
 * Vercel sometimes store the value with a trailing newline or wrapped quotes,
 * and EIA then rejects the request as an invalid key.
 */
function normalizeEiaKey(raw: string | undefined): string | null {
  if (raw == null) return null;
  let key = raw.trim();
  if (
    key.length >= 2 &&
    ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'")))
  ) {
    key = key.slice(1, -1).trim();
  }
  if (!key || PLACEHOLDER_KEYS.has(key)) return null;
  return key;
}

/**
 * EIA_API_KEY is the canonical name. EIA_API is accepted when that is unset
 * (missing, blank, quoted-empty, or the example placeholder).
 */
export function readEiaApiKey(): string | null {
  return normalizeEiaKey(process.env.EIA_API_KEY) ?? normalizeEiaKey(process.env.EIA_API);
}

/**
 * Reads and validates the EIA API key from the environment. Never hardcode a
 * key in source — this throws loudly rather than silently proceeding keyless
 * (EIA's API rejects keyless requests, but we fail before even making the
 * network call so the error message is actionable).
 */
export function getApiKey(): string {
  const key = readEiaApiKey();
  if (!key) {
    throw new EiaConfigError(
      "EIA_API_KEY is not set (EIA_API is accepted when EIA_API_KEY is unset). " +
        "Get a free key at https://www.eia.gov/opendata/register.php " +
        "and set it in your environment (.env.local for local dev, a project env var in " +
        "Vercel/Netlify for production). See .env.example. Refusing to proceed without it."
    );
  }
  return key;
}

// ============================================================================
// Series identifiers
// ----------------------------------------------------------------------------
// Each series pins: the v2 API route, the `series` facet value, the frequency,
// unit handling, and a human-facing EIA page for attribution (used as
// `source_url` on the site — matches the existing convention in data/*.json).
// ============================================================================

export interface EiaSeriesDef {
  /** Stable key for this series within this module. */
  key: string;
  /** v2 API route, appended as `${EIA_API_BASE}/${route}/data/`. */
  route: string;
  /** The `facets[series][]` value that selects this exact series. */
  seriesId: string;
  /** EIA publication cadence for this series. */
  frequency: "daily" | "weekly";
  /** Human-readable description of what the series measures. */
  description: string;
  /** Units EIA is expected to report in the raw response (`units` field). */
  expectedUnits: string;
  /** Units this module reports after any conversion (matches data/*.json). */
  outputUnit: string;
  /** Optional conversion applied to the raw numeric value before use. */
  unitConversion?: (raw: number) => number;
  /** Human-facing EIA page used for on-site attribution (`source_url`). */
  sourcePageUrl: string;
  /** How confident this recollection is, absent live verification. */
  confidence: "high" | "medium";
  /** What a human should check before trusting this in production. */
  verificationNote: string;
}

function toMillionBarrels(rawThousandBarrels: number): number {
  return rawThousandBarrels / 1000;
}

export const EIA_SERIES = {
  WTI_SPOT: {
    key: "WTI_SPOT",
    route: "petroleum/pri/spt",
    seriesId: "RWTC",
    frequency: "daily",
    description: "Cushing, OK WTI Spot Price FOB ($/bbl)",
    expectedUnits: "$/BBL",
    outputUnit: "USD/bbl",
    sourcePageUrl: "https://www.eia.gov/dnav/pet/hist/RWTCD.htm",
    confidence: "high",
    verificationNote:
      "Checked against EIA APIv2 docs (https://www.eia.gov/opendata/documentation.php) and the " +
      "petroleum/pri/spt route: daily frequency, data column `value`, facet `series` = RWTC " +
      "(Cushing, OK WTI Spot Price FOB). Query uses frequency=daily, data[0]=value, facets[series][].",
  },
  BRENT_SPOT: {
    key: "BRENT_SPOT",
    route: "petroleum/pri/spt",
    seriesId: "RBRTE",
    frequency: "daily",
    description: "Europe Brent Spot Price FOB ($/bbl)",
    expectedUnits: "$/BBL",
    outputUnit: "USD/bbl",
    sourcePageUrl: "https://www.eia.gov/dnav/pet/hist/RBRTED.htm",
    confidence: "high",
    verificationNote:
      "Same petroleum/pri/spt route as WTI. RBRTE is the Europe Brent Spot Price FOB series id. " +
      "Docs use facets[series][] and data[0]=value (data[]=value is equivalent).",
  },
  US_COMMERCIAL_CRUDE_STOCKS: {
    key: "US_COMMERCIAL_CRUDE_STOCKS",
    route: "petroleum/stoc/wstk",
    seriesId: "WCESTUS1",
    frequency: "weekly",
    description: "Weekly U.S. Ending Stocks excluding SPR of Crude Oil (thousand barrels)",
    expectedUnits: "MBBL",
    outputUnit: "mb", // million barrels — matches data/balance-engine.json "unit": "mb"
    unitConversion: toMillionBarrels,
    sourcePageUrl: "https://www.eia.gov/petroleum/supply/weekly/",
    confidence: "high",
    verificationNote:
      "WCESTUS1 ('commercial', i.e. excluding SPR, US crude stocks) is the series id also mirrored " +
      "by FRED under the identical id, which corroborates it. Confirm the v2 route path " +
      "'petroleum/stoc/wstk' via https://www.eia.gov/opendata/browser/petroleum/stoc/wstk before " +
      "the first production run.",
  },
  CUSHING_CRUDE_STOCKS: {
    key: "CUSHING_CRUDE_STOCKS",
    route: "petroleum/stoc/wstk",
    seriesId: "WCESTOK1",
    frequency: "weekly",
    description: "Weekly Cushing, OK Ending Stocks of Crude Oil (thousand barrels)",
    expectedUnits: "MBBL",
    outputUnit: "mb",
    unitConversion: toMillionBarrels,
    sourcePageUrl: "https://www.eia.gov/petroleum/supply/weekly/",
    confidence: "medium",
    verificationNote:
      "WCESTOK1 is a best-recollection series id formed on the same WCEST{AREA}1 pattern as " +
      "WCESTUS1 (which is high-confidence). This one specifically MUST be checked in the EIA API " +
      "browser (https://www.eia.gov/opendata/browser/petroleum/stoc/wstk, filter area to Cushing) " +
      "before the first production run. If the id is wrong the request fails with a 4xx/empty " +
      "result and update-eia-data.mjs refuses to write rather than silently mislabelling a " +
      "different series as Cushing stock.",
  },
} as const satisfies Record<string, EiaSeriesDef>;

export type EiaSeriesKey = keyof typeof EIA_SERIES;

// ============================================================================
// Layer 1 — network (timeout + retry/backoff)
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Builds the fully-qualified EIA v2 API URL for a series, including the API key.
 *
 * Spot prices (petroleum/pri/spt, series RBRTE and RWTC) follow the current
 * APIv2 query shape from https://www.eia.gov/opendata/documentation.php:
 * frequency, data[0]=value, facets[series][], sort[0][column]=period desc.
 * `data[]=value` is documented as equivalent; this client sends `data[0]`.
 */
export function buildEiaDataUrl(seriesDef: EiaSeriesDef, opts: { length?: number } = {}): string {
  const apiKey = getApiKey();
  const length = opts.length ?? 10;
  const url = new URL(`${EIA_API_BASE}/${seriesDef.route}/data/`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("frequency", seriesDef.frequency === "daily" ? "daily" : "weekly");
  url.searchParams.append("data[0]", "value");
  url.searchParams.append("facets[series][]", seriesDef.seriesId);
  url.searchParams.set("sort[0][column]", "period");
  url.searchParams.set("sort[0][direction]", "desc");
  url.searchParams.set("offset", "0");
  url.searchParams.set("length", String(length));
  return url.toString();
}

/** Hides api_key query values, JSON echoes, and the live key itself. Safe to log. */
export function redactApiKey(text: string): string {
  let out = text.replace(/([?&]api_key=)[^&\s"'#]+/gi, "$1REDACTED");
  out = out.replace(/("api_key"\s*:\s*")[^"]*"/gi, '$1REDACTED"');
  const key = readEiaApiKey();
  if (key && key.length >= 8) out = out.split(key).join("REDACTED");
  return out;
}

export type EiaFallbackKind = "fetch error" | "non-200" | "empty data" | "stale data" | "out-of-range";

/** One console.error line per fallback. The detail is redacted before it is written. */
export function logEiaFallback(kind: EiaFallbackKind, detail: string): void {
  console.error(`[eia] fallback (${kind}): ${redactApiKey(detail)}`);
}

export interface FetchRetryOptions {
  timeoutMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
}

/**
 * An EiaFetchError that also carries whether the failure is worth retrying.
 * Kept internal — callers only ever see EiaFetchError (ClassifiedFetchError
 * IS an EiaFetchError), this subclass just lets fetchWithRetry's outer loop
 * decide retry-vs-fail-fast without re-deriving it from a caught exception
 * inside the same try that raised it (a bug caught by this module's own
 * fixture verification: raising inside a try was being re-caught by that
 * try's own catch and re-classified, silently turning "fail fast on 4xx"
 * into "retry every status". This split — classify in one place, decide
 * whether to retry in another — is what fixes that).
 */
class ClassifiedFetchError extends EiaFetchError {
  readonly transient: boolean;
  constructor(message: string, transient: boolean) {
    super(message);
    this.name = "ClassifiedFetchError";
    this.transient = transient;
  }
}

/** Makes exactly one HTTP attempt. Never retries — that's fetchWithRetry's job. */
async function attemptFetchOnce(url: string, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      // Don't let Next's default fetch cache freeze a spot print forever.
      // Page-level revalidate controls how often a render refetches.
      cache: "no-store",
    });

    if (res.ok) {
      try {
        return await res.json();
      } catch (parseErr) {
        // A malformed body on a 2xx is not a transport problem — don't retry it.
        throw new EiaValidationError(
          `EIA API returned ${res.status} but the body was not valid JSON: ${
            parseErr instanceof Error ? parseErr.message : String(parseErr)
          }`
        );
      }
    }

    const bodyText = await res.text().catch(() => "");
    const transient = res.status === 429 || res.status >= 500;
    throw new ClassifiedFetchError(
      redactApiKey(`EIA API responded ${res.status} ${res.statusText} for ${url}: ${bodyText.slice(0, 500)}`),
      transient
    );
  } catch (err) {
    if (err instanceof EiaValidationError || err instanceof ClassifiedFetchError) throw err;
    const isAbort = err instanceof Error && err.name === "AbortError";
    // Network errors and timeouts are transient by nature — always retriable.
    throw new ClassifiedFetchError(
      redactApiKey(
        `EIA API request failed for ${url}: ${
          isAbort ? `timed out after ${timeoutMs}ms` : err instanceof Error ? err.message : String(err)
        }`
      ),
      true
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetches a URL with a hard timeout and bounded exponential-backoff retry.
 * Retries only on transient failures: network errors, timeouts, HTTP 429,
 * and HTTP 5xx. Non-transient errors (4xx other than 429 — e.g. a bad api_key
 * or an unknown series id) fail immediately without burning retry budget.
 * Exported mainly so tests can monkey-patch globalThis.fetch and exercise
 * this path without a real network.
 */
export async function fetchWithRetry(url: string, opts: FetchRetryOptions = {}): Promise<unknown> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelayMs = opts.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;

  let lastError: EiaFetchError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await attemptFetchOnce(url, timeoutMs);
    } catch (err) {
      if (err instanceof EiaValidationError) {
        logEiaFallback("fetch error", err.message);
        throw err; // never retry a parse failure
      }
      const transient = err instanceof ClassifiedFetchError ? err.transient : true;
      const fetchErr = err instanceof EiaFetchError ? err : new EiaFetchError(err instanceof Error ? err.message : String(err));
      if (!transient || attempt === maxRetries) {
        const kind = /responded \d+/.test(fetchErr.message) ? "non-200" : "fetch error";
        logEiaFallback(kind, fetchErr.message);
        throw fetchErr;
      }
      lastError = fetchErr;
    }

    const jitter = Math.floor(Math.random() * 250);
    const delay = baseDelayMs * 2 ** attempt + jitter;
    await sleep(delay);
  }

  // Unreachable in practice (the loop always returns or throws), but keeps
  // the function's return type honest for TypeScript's control-flow analysis.
  throw lastError ?? new EiaFetchError("EIA API request failed after retries");
}

// ============================================================================
// Layer 2 — parsing / strict runtime validation
// ============================================================================

export interface EiaObservation {
  /** Observation date/period exactly as published by EIA (YYYY-MM-DD). */
  date: string;
  /** Value after any unit conversion — this is what gets written to data/*.json. */
  value: number;
  /** Value exactly as returned by the API, before conversion. */
  rawValue: number;
  /** Units as reported by EIA for the raw value (pre-conversion). */
  units: string;
  /** The series id this observation belongs to. */
  seriesId: string;
  /** Human-facing EIA page for attribution. */
  sourceUrl: string;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

/**
 * Validates an EIA v2 API response against the shape this module trusts, and
 * transforms it into typed, unit-converted observations sorted newest-first.
 * Never returns a value it could not verify — malformed rows are dropped
 * (not coerced), and a response with zero usable rows throws rather than
 * returning an empty/misleading result.
 */
export function parseEiaResponse(json: unknown, seriesDef: EiaSeriesDef): EiaObservation[] {
  if (!isRecord(json)) {
    throw new EiaValidationError(`EIA response for ${seriesDef.seriesId} was not a JSON object`);
  }

  if ("error" in json) {
    const detail = `EIA API error body for ${seriesDef.seriesId}: ${JSON.stringify(json["error"])}`;
    // Older gateway builds answered HTTP 200 with this envelope. The body is the signal.
    logEiaFallback("non-200", detail);
    throw new EiaValidationError(detail);
  }

  const response = json["response"];
  if (!isRecord(response)) {
    throw new EiaValidationError(`EIA response for ${seriesDef.seriesId} is missing a 'response' object`);
  }

  const data = response["data"];
  if (!Array.isArray(data)) {
    throw new EiaValidationError(`EIA response for ${seriesDef.seriesId} has a non-array 'response.data'`);
  }

  if (data.length === 0) {
    const detail = `EIA response for ${seriesDef.seriesId} contained zero observation rows`;
    logEiaFallback("empty data", detail);
    throw new EiaValidationError(detail);
  }

  const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;
  const observations: EiaObservation[] = [];

  for (const row of data) {
    if (!isRecord(row)) continue;

    const period = row["period"];
    if (typeof period !== "string" || !ISO_DATE.test(period)) continue;

    const rowSeriesId = row["series"];
    // Defensive: don't trust the facet filter blindly — if the API echoes a
    // series id back and it doesn't match what we asked for, drop the row.
    if (typeof rowSeriesId === "string" && rowSeriesId !== seriesDef.seriesId) continue;

    const rawValueField = row["value"];
    if (rawValueField === null || rawValueField === undefined || rawValueField === "") continue; // not yet published
    const rawValue = typeof rawValueField === "number" ? rawValueField : Number(rawValueField);
    if (!Number.isFinite(rawValue)) continue;

    const units = typeof row["units"] === "string" ? (row["units"] as string) : seriesDef.expectedUnits;

    observations.push({
      date: period.slice(0, 10),
      rawValue,
      value: seriesDef.unitConversion ? seriesDef.unitConversion(rawValue) : rawValue,
      units,
      seriesId: seriesDef.seriesId,
      sourceUrl: seriesDef.sourcePageUrl,
    });
  }

  if (observations.length === 0) {
    const detail =
      `EIA response for ${seriesDef.seriesId} had ${data.length} row(s) but none had a usable ` +
      `numeric value for a matching series id — refusing to guess`;
    logEiaFallback("empty data", detail);
    throw new EiaValidationError(detail);
  }

  // Sort newest-first regardless of what the API returned (defensive; we also
  // ask for this via sort[0] in the request).
  observations.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return observations;
}

// ============================================================================
// Layer 3 — pure transforms (arithmetic over already-validated observations)
// ============================================================================

function round(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return round(((current - previous) / Math.abs(previous)) * 100, 2);
}

function dateOnlyToUtc(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`);
}

/** Finds the newest observation whose date is <= targetDate, searching a newest-first list. */
function findAtOrBefore(obs: readonly EiaObservation[], targetDate: Date): EiaObservation | null {
  for (const o of obs) {
    if (dateOnlyToUtc(o.date).getTime() <= targetDate.getTime()) return o;
  }
  return null;
}

export interface DailySeriesResult {
  latest: EiaObservation;
  priorDay: EiaObservation | null;
  weekAgo: EiaObservation | null;
  monthAgo: EiaObservation | null;
  dailyChangePct: number | null;
  weeklyChangePct: number | null;
  monthlyChangePct: number | null;
}

/** Pure — derives d/w/m % changes from a newest-first list of daily observations. */
export function buildDailySeriesResult(observations: readonly EiaObservation[]): DailySeriesResult {
  if (observations.length === 0) {
    throw new EiaValidationError("buildDailySeriesResult called with zero observations");
  }
  const latest = observations[0];
  const latestDate = dateOnlyToUtc(latest.date);
  const rest = observations.slice(1);

  const priorDay = rest[0] ?? null;
  const weekTarget = new Date(latestDate);
  weekTarget.setUTCDate(weekTarget.getUTCDate() - 7);
  const monthTarget = new Date(latestDate);
  monthTarget.setUTCDate(monthTarget.getUTCDate() - 30);

  const weekAgo = findAtOrBefore(rest, weekTarget);
  const monthAgo = findAtOrBefore(rest, monthTarget);

  return {
    latest,
    priorDay,
    weekAgo,
    monthAgo,
    dailyChangePct: priorDay ? pctChange(latest.value, priorDay.value) : null,
    weeklyChangePct: weekAgo ? pctChange(latest.value, weekAgo.value) : null,
    monthlyChangePct: monthAgo ? pctChange(latest.value, monthAgo.value) : null,
  };
}

export interface WeeklySeriesResult {
  latest: EiaObservation;
  previous: EiaObservation | null;
  changeAbs: number | null; // in outputUnit (e.g. million barrels), one decimal
}

/** Pure — derives week-over-week absolute change from a newest-first list of weekly observations. */
export function buildWeeklySeriesResult(observations: readonly EiaObservation[]): WeeklySeriesResult {
  if (observations.length === 0) {
    throw new EiaValidationError("buildWeeklySeriesResult called with zero observations");
  }
  const latest = observations[0];
  const previous = observations[1] ?? null;
  return {
    latest,
    previous,
    changeAbs: previous ? round(latest.value - previous.value, 1) : null,
  };
}

// ============================================================================
// High-level convenience functions (network + parse + transform)
// ============================================================================

export async function getDailySpotSeries(
  seriesDef: EiaSeriesDef,
  opts: { length?: number } & FetchRetryOptions = {}
): Promise<DailySeriesResult> {
  const url = buildEiaDataUrl(seriesDef, { length: opts.length ?? 45 });
  const json = await fetchWithRetry(url, opts);
  const observations = parseEiaResponse(json, seriesDef);
  return buildDailySeriesResult(observations);
}

export async function getWeeklyStockSeries(
  seriesDef: EiaSeriesDef,
  opts: { length?: number } & FetchRetryOptions = {}
): Promise<WeeklySeriesResult> {
  const url = buildEiaDataUrl(seriesDef, { length: opts.length ?? 6 });
  const json = await fetchWithRetry(url, opts);
  const observations = parseEiaResponse(json, seriesDef);
  return buildWeeklySeriesResult(observations);
}

export function getWtiSpot(opts: FetchRetryOptions = {}): Promise<DailySeriesResult> {
  return getDailySpotSeries(EIA_SERIES.WTI_SPOT, opts);
}

export function getBrentSpot(opts: FetchRetryOptions = {}): Promise<DailySeriesResult> {
  return getDailySpotSeries(EIA_SERIES.BRENT_SPOT, opts);
}

export function getUsCommercialCrudeStocks(opts: FetchRetryOptions = {}): Promise<WeeklySeriesResult> {
  return getWeeklyStockSeries(EIA_SERIES.US_COMMERCIAL_CRUDE_STOCKS, opts);
}

export function getCushingStocks(opts: FetchRetryOptions = {}): Promise<WeeklySeriesResult> {
  return getWeeklyStockSeries(EIA_SERIES.CUSHING_CRUDE_STOCKS, opts);
}
