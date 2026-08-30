import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Shared helpers for the data/*.json integrity suite.
 *
 * The data files are hand-edited daily by a non-engineer, so every check
 * here reads the raw file from disk with fs + JSON.parse (never a static
 * `import`) — a malformed file then fails as a normal, readable test
 * assertion instead of aborting the whole Vitest collection step.
 */

const DATA_DIR = path.resolve(__dirname, "../../data");

export function readDataFile(name: string): string {
  return readFileSync(path.join(DATA_DIR, name), "utf-8");
}

export function loadJson<T = unknown>(name: string): T {
  return JSON.parse(readDataFile(name)) as T;
}

/**
 * The full set of data_type values the UI actually knows how to style —
 * taken from BADGE_STYLES in src/components/DataMeta.tsx (the ground
 * truth; the `DataType` type alias in src/lib/data.ts is stale and
 * missing "indicative", so it is NOT used here). Any other value silently
 * falls back to the "manual" style, which is exactly the kind of typo a
 * hand-edit could introduce without anyone noticing.
 */
export const ALLOWED_DATA_TYPES = ["live", "delayed", "manual", "API placeholder", "indicative"] as const;

/** Signal type used across dashboard-signals.json (src/lib/data.ts `Signal`). */
export const ALLOWED_SIGNALS = ["bullish", "bearish", "neutral", "risk"] as const;

/** BalanceTable trend glyphs (src/components/BalanceTable.tsx TREND_GLYPH). */
export const ALLOWED_TRENDS = ["up", "down", "flat", "mixed"] as const;

/** BalanceTable impact badge (src/components/BalanceTable.tsx IMPACT_STYLE). */
export const ALLOWED_IMPACTS = ["bullish", "bearish", "neutral"] as const;

/** SpreadTable badges (src/components/SpreadTable.tsx). */
export const ALLOWED_VALUATIONS = ["cheap", "fair", "expensive"] as const;
export const ALLOWED_MOMENTUM = ["tightening", "loosening", "stable"] as const;
export const ALLOWED_PHYSICAL_CHECK = ["supported", "contradicted", "mixed"] as const;

/** Positioning page (src/app/tools/positioning/page.tsx). */
export const ALLOWED_STANCE = ["heavily long", "long", "neutral", "short", "heavily short"] as const;
export const ALLOWED_LIQUIDATION_RISK = ["elevated", "moderate", "low"] as const;

/** Flow map anomaly severity (src/app/tools/flow-map/page.tsx SEVERITY_STYLE). */
export const ALLOWED_SEVERITY = ["alert", "watch", "info"] as const;

/** News-to-barrels event status / confidence (src/app/tools/news-to-barrels/page.tsx). */
export const ALLOWED_NEWS_STATUS = ["confirmed", "developing", "resolved"] as const;
export const ALLOWED_CONFIDENCE = ["high", "medium", "low"] as const;

/** Hypothesis builder status (src/app/tools/hypothesis-builder/page.tsx STATUS_STYLE). */
export const ALLOWED_HYPOTHESIS_STATUS = ["active", "monitoring", "invalidated"] as const;

/**
 * A timestamp is "ISO-ish" if Date.parse can make sense of it — the site
 * uses plain Date.parse throughout (see FreshnessBadge.tsx), never a date
 * library, so that is the real contract to test against.
 */
export function isParsableDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

/** Asserts a date string parses and is not in the future (with a small clock-skew allowance). */
export function assertValidPastDate(value: unknown, label: string, skewMs = 5 * 60_000) {
  if (!isParsableDate(value)) {
    throw new Error(`${label}: "${value}" is not a parsable date`);
  }
  const parsed = Date.parse(value as string);
  if (parsed > Date.now() + skewMs) {
    throw new Error(`${label}: "${value}" is in the future`);
  }
}

/** Collects every key seen across an array of records — for uniform-shape checks. */
export function unionKeys(records: Record<string, unknown>[]): Set<string> {
  const keys = new Set<string>();
  for (const r of records) for (const k of Object.keys(r)) keys.add(k);
  return keys;
}

/**
 * Asserts every record in `records` has every key in `requiredKeys`, with a
 * non-null, non-empty (after trim, for strings) value — and reports exactly
 * which record and field failed, since these files run to dozens of records.
 */
export function assertRequiredFields(
  records: Record<string, unknown>[],
  requiredKeys: string[],
  idKey: string,
) {
  for (const record of records) {
    const id = String(record[idKey] ?? "<unknown>");
    for (const key of requiredKeys) {
      const value = record[key];
      if (value === undefined || value === null) {
        throw new Error(`record "${id}" is missing required field "${key}"`);
      }
      if (typeof value === "string" && value.trim() === "") {
        throw new Error(`record "${id}" has an empty string for required field "${key}"`);
      }
    }
  }
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
