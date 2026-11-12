import raw from "../../public/data/oracle_intelligence.json";

/**
 * Reader for public/data/oracle_intelligence.json, written by
 * scripts/build_oracle_intelligence.py on a GitHub Actions schedule.
 *
 * The file is machine-written, so it is read defensively. A module is only
 * "ok" when it says so and carries a parseable data date; a value is only
 * returned when it is a finite number. Anything else reads as not loaded or
 * absent, and the page then shows no figure for it.
 */

export const MONITOR_MODULES = ["prices", "inventories", "positioning", "macro", "news", "gas_storage"] as const;
export type MonitorModuleName = (typeof MONITOR_MODULES)[number];

export interface MonitorHeadline {
  title: string;
  domain: string;
  url: string;
  seenUtc: string;
}

export type MonitorModule =
  | {
      status: "ok";
      /** Date of the newest data point in the module. */
      asOf: string;
      /** When the module was last fetched successfully. */
      fetchedUtc: string | null;
      sourceName: string;
      sourceUrl: string | null;
      values: Record<string, unknown>;
    }
  | { status: "not_loaded"; reason: string };

export type MonitorFeed = Record<MonitorModuleName, MonitorModule> & { notice: string | null };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDateLike(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(Date.parse(value));
}

function httpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    return new URL(value).protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

function parseModule(value: unknown): MonitorModule {
  if (!isRecord(value) || value.status !== "ok") {
    const reason = isRecord(value) && typeof value.reason === "string" ? value.reason.slice(0, 200) : "no data in the file";
    return { status: "not_loaded", reason };
  }
  if (!isDateLike(value.as_of) || !isRecord(value.values) || typeof value.source_name !== "string") {
    return { status: "not_loaded", reason: "the module in the file is incomplete" };
  }
  return {
    status: "ok",
    asOf: value.as_of,
    fetchedUtc: isDateLike(value.fetched_utc) ? value.fetched_utc : null,
    sourceName: value.source_name,
    sourceUrl: httpsUrl(value.source_url),
    values: value.values,
  };
}

export function parseMonitorFeed(input: unknown): MonitorFeed {
  const modules = isRecord(input) && isRecord(input.modules) ? input.modules : {};
  const feed = { notice: isRecord(input) && typeof input.notice === "string" ? input.notice : null } as MonitorFeed;
  for (const name of MONITOR_MODULES) feed[name] = parseModule(modules[name]);
  return feed;
}

export function getMonitorFeed(): MonitorFeed {
  return parseMonitorFeed(raw);
}

/** A finite number at a dotted path inside a module's values, or null. */
export function num(values: Record<string, unknown>, path: string): number | null {
  let current: unknown = values;
  for (const key of path.split(".")) {
    if (!isRecord(current)) return null;
    current = current[key];
  }
  return typeof current === "number" && Number.isFinite(current) ? current : null;
}

/** A date string at a dotted path, or null. */
export function dateAt(values: Record<string, unknown>, path: string): string | null {
  let current: unknown = values;
  for (const key of path.split(".")) {
    if (!isRecord(current)) return null;
    current = current[key];
  }
  return isDateLike(current) ? current : null;
}

export function headlines(values: Record<string, unknown>): MonitorHeadline[] {
  const list = Array.isArray(values.headlines) ? values.headlines : [];
  return list.flatMap((item) => {
    if (!isRecord(item)) return [];
    const url = httpsUrl(item.url);
    if (!url || typeof item.title !== "string" || typeof item.domain !== "string" || !isDateLike(item.seen_utc)) return [];
    const title = item.title.trim();
    return title ? [{ title, domain: item.domain, url, seenUtc: item.seen_utc }] : [];
  });
}

/** The newest data date across loaded modules, for the sitemap. Null when none has loaded. */
export function monitorLastData(feed: MonitorFeed = getMonitorFeed()): string | null {
  const dates = MONITOR_MODULES.flatMap((name) => {
    const entry = feed[name];
    return entry.status === "ok" ? [new Date(entry.asOf).toISOString()] : [];
  });
  return dates.sort().at(-1) ?? null;
}
