/**
 * Moving tankers from TankerMap's documented public live endpoint.
 * A hull is moving at 1 knot or more, and not when TankerMap says it is
 * anchored, moored or drifting. Class labels are TankerMap vessel types.
 */

import { offsetByCourse } from "@/lib/sea-lanes";

export const MOVING_SPEED_KN = 1;
/** One hour at 60 knots: a short course tick, not a forecast. */
export const HEADING_TICK_KN = 60;
export const HEADING_TICK_HOURS = 1;
export const TANKERMAP_LIVE_URL = "https://tankermap.com/api/vessels/live";

export const TANKER_CLASSES = {
  crude: { label: "Crude oil", color: [217, 119, 36] as const },
  products: { label: "Oil products", color: [200, 155, 60] as const },
  chemical: { label: "Chemical / oil", color: [31, 157, 139] as const },
  lng: { label: "LNG", color: [56, 189, 248] as const },
} as const;

export type TankerClass = keyof typeof TANKER_CLASSES;

export type MovingTanker = {
  name: string;
  imo: string;
  lat: number;
  lon: number;
  cogDeg: number | null;
  speedKn: number;
  vesselType: string;
  tankerClass: TankerClass;
  observedAt: string;
  destination: string | null;
};

export type MovingTankerCounts = Record<TankerClass, number>;

export type MovingTankerFeed = {
  status: "ok" | "unavailable";
  tankers: MovingTanker[];
  counts: MovingTankerCounts;
  rule: string;
  source: string;
  sourceUrl: string;
  retrievedAt: string;
};

const RULE = "At least 1 knot, excluding anchored, moored and drifting hulls.";

const TYPE_TO_CLASS: Record<string, TankerClass> = {
  "crude oil tanker": "crude",
  "oil products tanker": "products",
  "chemical/oil products tanker": "chemical",
  "lng tanker": "lng",
};

const STOPPED = ["at anchor", "moored", "drifting", "aground", "not under command"];

export function emptyTankerCounts(): MovingTankerCounts {
  return { crude: 0, products: 0, chemical: 0, lng: 0 };
}

export function tankerClassFor(vesselType: string | null): TankerClass | null {
  if (!vesselType) return null;
  return TYPE_TO_CLASS[vesselType.trim().toLowerCase()] ?? null;
}

export function isUnderway(speedKn: number, navStatus: string | null): boolean {
  if (!Number.isFinite(speedKn) || speedKn < MOVING_SPEED_KN) return false;
  const status = (navStatus ?? "").trim().toLowerCase();
  if (!status) return true;
  return !STOPPED.some((item) => status === item || status.startsWith(`${item} `));
}

function round(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function imoOf(value: unknown): string | null {
  const raw = typeof value === "number" && Number.isInteger(value) ? String(value) : text(value);
  return raw && /^\d{7}$/.test(raw) ? raw : null;
}

function countClasses(tankers: readonly MovingTanker[]): MovingTankerCounts {
  const counts = emptyTankerCounts();
  for (const tanker of tankers) counts[tanker.tankerClass] += 1;
  return counts;
}

export function parseLiveFleet(payload: unknown): MovingTanker[] | null {
  if (!Array.isArray(payload)) return null;
  const byImo = new Map<string, MovingTanker>();
  for (const row of payload) {
    if (!row || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const name = text(record.name);
    const imo = imoOf(record.imo);
    const tankerClass = tankerClassFor(text(record.vessel_type));
    const observedAt = text(record.observed_at);
    const lat = typeof record.latitude === "number" ? record.latitude : null;
    const lon = typeof record.longitude === "number" ? record.longitude : null;
    const speed = typeof record.speed_knots === "number" ? record.speed_knots : null;
    const navStatus = text(record.nav_status);
    if (!name || !imo || !tankerClass || !observedAt || !observedAt.includes("T")) continue;
    if (lat == null || lon == null || speed == null) continue;
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -80 || lat > 80 || lon < -180 || lon > 180) continue;
    if (!isUnderway(speed, navStatus)) continue;
    const cog = typeof record.cog_degrees === "number" && Number.isFinite(record.cog_degrees) ? round(record.cog_degrees, 1) : null;
    const next: MovingTanker = {
      name,
      imo,
      lat: round(lat, 5),
      lon: round(lon, 5),
      cogDeg: cog,
      speedKn: round(speed, 1),
      vesselType: text(record.vessel_type) ?? "",
      tankerClass,
      observedAt,
      destination: text(record.destination),
    };
    const prior = byImo.get(imo);
    if (!prior || next.observedAt > prior.observedAt) byImo.set(imo, next);
  }
  return Array.from(byImo.values()).sort((a, b) => b.speedKn - a.speedKn || a.name.localeCompare(b.name));
}

export function headingTick(tanker: Pick<MovingTanker, "lat" | "lon" | "cogDeg">): [number, number][] | null {
  if (tanker.cogDeg == null || !Number.isFinite(tanker.cogDeg)) return null;
  const end = offsetByCourse(tanker.lat, tanker.lon, tanker.cogDeg, HEADING_TICK_KN, HEADING_TICK_HOURS);
  if (Math.abs(end.lat) > 80 || Math.abs(end.lon - tanker.lon) > 20) return null;
  return [
    [tanker.lon, tanker.lat],
    [end.lon, end.lat],
  ];
}

function envelope(status: MovingTankerFeed["status"], tankers: MovingTanker[], retrievedAt: string): MovingTankerFeed {
  return {
    status,
    tankers,
    counts: countClasses(tankers),
    rule: RULE,
    source: "TankerMap",
    sourceUrl: TANKERMAP_LIVE_URL,
    retrievedAt,
  };
}

export function buildMovingTankerFeed(payload: unknown, retrievedAt: string): MovingTankerFeed {
  const tankers = parseLiveFleet(payload);
  if (!tankers) return envelope("unavailable", [], retrievedAt);
  return envelope("ok", tankers, retrievedAt);
}

export function unavailableMovingTankerFeed(retrievedAt: string): MovingTankerFeed {
  return envelope("unavailable", [], retrievedAt);
}

/** Server fetch of the documented live endpoint. Kept off the coastline module so the route stays small. */
export async function loadMovingTankerFeed(): Promise<MovingTankerFeed> {
  const retrievedAt = new Date().toISOString();
  try {
    const response = await fetch(TANKERMAP_LIVE_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent": "TheCrudeOracle/1.0 (+https://www.thecrudeoracle.com; vessel watch)",
      },
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return unavailableMovingTankerFeed(retrievedAt);
    return buildMovingTankerFeed(await response.json(), retrievedAt);
  } catch {
    return unavailableMovingTankerFeed(retrievedAt);
  }
}
