/**
 * Desk geometry for the homepage earth.
 * Lanes are schematic sea routes, not AIS tracks and not a fleet feed.
 * The watched hull is a separate delayed position passed in at runtime.
 */

export type Vec = { x: number; y: number; z: number };

export type SeaLane = {
  id: string;
  color: "gold" | "cyan";
  kind: "tanker" | "lng";
  /** Seconds for one ship to travel the lane once. */
  duration: number;
  ships: number;
  phase: number;
  waypoints: ReadonlyArray<readonly [number, number]>;
};

export type LaneFrame = {
  points: Vec[];
  cum: number[];
  total: number;
};

export type GlobeShip = {
  name: string;
  imo: string;
  lat: number;
  lon: number;
  cogDeg: number | null;
  speedKn: number | null;
  observedAt: string;
  shareUrl: string;
};

export const LANES: readonly SeaLane[] = [
  {
    id: "gulf-malacca-china",
    color: "gold",
    kind: "tanker",
    duration: 96,
    ships: 3,
    phase: 0.08,
    waypoints: [
      [26.4, 56.5],
      [22.0, 61.0],
      [15.5, 68.5],
      [8.2, 77.0],
      [6.0, 88.0],
      [4.2, 96.5],
      [1.4, 103.2],
      [6.5, 109.0],
      [14.0, 114.0],
      [21.0, 118.5],
      [28.5, 123.0],
    ],
  },
  {
    id: "gulf-cape-rotterdam",
    color: "gold",
    kind: "tanker",
    duration: 128,
    ships: 3,
    phase: 0.37,
    waypoints: [
      [26.4, 56.5],
      [16.0, 58.0],
      [8.0, 52.5],
      [1.0, 48.0],
      [-12.0, 43.0],
      [-24.0, 36.0],
      [-34.2, 24.0],
      [-34.8, 18.2],
      [-30.0, 8.0],
      [-18.0, -2.0],
      [-4.0, -12.0],
      [12.0, -18.0],
      [28.0, -18.0],
      [40.0, -12.0],
      [47.5, -6.5],
      [51.2, 2.8],
    ],
  },
  {
    id: "gulf-suez-rotterdam",
    color: "gold",
    kind: "tanker",
    duration: 110,
    ships: 2,
    phase: 0.62,
    waypoints: [
      [26.4, 56.5],
      [18.0, 58.0],
      [13.2, 50.0],
      [12.6, 44.2],
      [18.0, 40.0],
      [24.0, 36.5],
      [29.6, 32.6],
      [32.4, 30.5],
      [33.8, 26.0],
      [34.6, 20.0],
      [35.8, 14.0],
      [37.2, 8.0],
      [38.8, 2.5],
      [42.5, -2.0],
      [47.0, -5.5],
      [51.2, 2.8],
    ],
  },
  {
    id: "waf-europe",
    color: "gold",
    kind: "tanker",
    duration: 84,
    ships: 2,
    phase: 0.21,
    waypoints: [
      [4.0, 6.2],
      [4.2, 1.5],
      [7.5, -8.0],
      [14.0, -18.0],
      [24.0, -18.5],
      [34.0, -14.0],
      [42.0, -10.5],
      [48.0, -6.0],
      [51.2, 2.5],
    ],
  },
  {
    id: "usg-rotterdam",
    color: "gold",
    kind: "tanker",
    duration: 90,
    ships: 2,
    phase: 0.48,
    waypoints: [
      [28.2, -89.5],
      [26.5, -83.0],
      [28.5, -72.0],
      [32.0, -58.0],
      [38.0, -42.0],
      [43.5, -25.0],
      [47.5, -12.0],
      [50.2, -2.0],
      [51.4, 2.6],
    ],
  },
  {
    id: "brazil-cape-china",
    color: "gold",
    kind: "tanker",
    duration: 132,
    ships: 2,
    phase: 0.73,
    waypoints: [
      [-24.0, -43.5],
      [-30.0, -28.0],
      [-34.5, -8.0],
      [-35.0, 12.0],
      [-34.6, 18.4],
      [-26.0, 36.0],
      [-12.0, 52.0],
      [-2.0, 72.0],
      [1.0, 92.0],
      [1.4, 103.2],
      [10.0, 112.0],
      [20.0, 118.0],
      [28.0, 123.0],
    ],
  },
  {
    id: "baltic-rotterdam",
    color: "gold",
    kind: "tanker",
    duration: 72,
    ships: 1,
    phase: 0.15,
    waypoints: [
      [60.0, 28.2],
      [59.6, 23.5],
      [58.6, 20.4],
      [56.8, 18.8],
      [55.2, 16.2],
      [54.6, 12.2],
      [54.8, 7.5],
      [53.0, 4.2],
      [51.6, 3.4],
    ],
  },
  {
    id: "qatar-japan-lng",
    color: "cyan",
    kind: "lng",
    duration: 108,
    ships: 2,
    phase: 0.29,
    waypoints: [
      [25.9, 51.7],
      [26.3, 56.6],
      [16.0, 64.0],
      [8.0, 78.0],
      [4.5, 94.0],
      [1.4, 103.4],
      [10.0, 116.0],
      [20.0, 124.0],
      [30.0, 132.0],
      [34.2, 139.2],
    ],
  },
  {
    id: "sabine-milford-lng",
    color: "cyan",
    kind: "lng",
    duration: 92,
    ships: 2,
    phase: 0.55,
    waypoints: [
      [29.4, -93.6],
      [27.2, -84.0],
      [28.0, -68.0],
      [34.0, -48.0],
      [42.0, -28.0],
      [48.0, -12.0],
      [51.4, -5.4],
    ],
  },
  {
    id: "nws-japan-lng",
    color: "cyan",
    kind: "lng",
    duration: 100,
    ships: 2,
    phase: 0.81,
    waypoints: [
      [-20.4, 116.6],
      [-14.5, 122.5],
      [-8.0, 128.5],
      [-2.0, 133.0],
      [6.0, 137.0],
      [16.0, 140.0],
      [26.0, 140.5],
      [33.5, 139.5],
    ],
  },
  {
    id: "trinidad-europe-lng",
    color: "cyan",
    kind: "lng",
    duration: 88,
    ships: 1,
    phase: 0.44,
    waypoints: [
      [10.5, -61.4],
      [16.0, -48.0],
      [26.0, -32.0],
      [36.0, -18.0],
      [43.0, -10.0],
      [36.8, -7.5],
    ],
  },
];

export function toVec(lat: number, lon: number): Vec {
  const φ = (lat * Math.PI) / 180;
  const λ = (lon * Math.PI) / 180;
  const c = Math.cos(φ);
  return { x: c * Math.sin(λ), y: Math.sin(φ), z: c * Math.cos(λ) };
}

export function slerp(a: Vec, b: Vec, t: number): Vec {
  let dot = a.x * b.x + a.y * b.y + a.z * b.z;
  dot = Math.max(-1, Math.min(1, dot));
  const omega = Math.acos(dot);
  if (omega < 1e-4) return a;
  const so = Math.sin(omega);
  const p = Math.sin((1 - t) * omega) / so;
  const q = Math.sin(t * omega) / so;
  return { x: a.x * p + b.x * q, y: a.y * p + b.y * q, z: a.z * p + b.z * q };
}

export function buildLaneFrame(waypoints: ReadonlyArray<readonly [number, number]>): LaneFrame {
  const points = waypoints.map(([lat, lon]) => toVec(lat, lon));
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const next = points[i];
    const dot = Math.max(-1, Math.min(1, prev.x * next.x + prev.y * next.y + prev.z * next.z));
    cum.push(cum[i - 1] + Math.acos(dot));
  }
  return { points, cum, total: cum[cum.length - 1] ?? 0 };
}

export function lanePosition(frame: LaneFrame, t: number): Vec {
  if (frame.points.length === 0) return { x: 0, y: 0, z: 1 };
  const wrapped = ((t % 1) + 1) % 1;
  if (frame.total < 1e-6 || wrapped === 0) return frame.points[0];
  const dist = wrapped * frame.total;
  let i = 1;
  while (i < frame.cum.length - 1 && frame.cum[i] < dist) i += 1;
  const i1 = Math.min(frame.points.length - 1, Math.max(1, i));
  const i0 = i1 - 1;
  const span = frame.cum[i1] - frame.cum[i0];
  const local = span < 1e-6 ? 0 : (dist - frame.cum[i0]) / span;
  return slerp(frame.points[i0], frame.points[i1], Math.max(0, Math.min(1, local)));
}

/** Move a fix along a reported course. Distance is speed × hours, in nautical miles. */
export function offsetByCourse(
  lat: number,
  lon: number,
  cogDeg: number,
  speedKn: number,
  hours: number
): { lat: number; lon: number } {
  const nm = Math.max(0, speedKn) * hours;
  const cog = (cogDeg * Math.PI) / 180;
  const dLat = (nm / 60) * Math.cos(cog);
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const dLon = Math.abs(cosLat) < 0.02 ? 0 : ((nm / 60) * Math.sin(cog)) / cosLat;
  return { lat: lat + dLat, lon: lon + dLon };
}

export function unwrapRing(ring: ReadonlyArray<readonly [number, number]>): Array<[number, number]> {
  if (ring.length === 0) return [];
  const out: Array<[number, number]> = [[ring[0][0], ring[0][1]]];
  for (let i = 1; i < ring.length; i++) {
    let lon = ring[i][0];
    const prev = out[out.length - 1][0];
    while (lon - prev > 180) lon -= 360;
    while (prev - lon > 180) lon += 360;
    out.push([lon, ring[i][1]]);
  }
  return out;
}

export function maskPixel(
  lon: number,
  lat: number,
  width: number,
  height: number
): { x: number; y: number } {
  let u = (lon + 180) / 360;
  u -= Math.floor(u);
  const x = Math.min(width - 1, Math.max(0, Math.floor(u * width)));
  const v = Math.min(1, Math.max(0, (90 - lat) / 180));
  const y = Math.min(height - 1, Math.max(0, Math.floor(v * height)));
  return { x, y };
}

export function parseGlobeShip(payload: unknown): GlobeShip | null {
  if (!payload || typeof payload !== "object") return null;
  const ship = (payload as { ship?: unknown }).ship;
  if (!ship || typeof ship !== "object") return null;
  const row = ship as Record<string, unknown>;
  if (typeof row.name !== "string" || row.name.trim() === "") return null;
  if (typeof row.imo !== "string" || !/^\d{7}$/.test(row.imo)) return null;
  if (typeof row.lat !== "number" || !Number.isFinite(row.lat)) return null;
  if (typeof row.lon !== "number" || !Number.isFinite(row.lon)) return null;
  if (typeof row.observedAt !== "string" || !row.observedAt.includes("T")) return null;
  if (typeof row.shareUrl !== "string" || !row.shareUrl.startsWith("https://tankermap.com/")) return null;
  const cogDeg = typeof row.cogDeg === "number" && Number.isFinite(row.cogDeg) ? row.cogDeg : null;
  const speedKn = typeof row.speedKn === "number" && Number.isFinite(row.speedKn) ? row.speedKn : null;
  return {
    name: row.name.trim(),
    imo: row.imo,
    lat: row.lat,
    lon: row.lon,
    cogDeg,
    speedKn,
    observedAt: row.observedAt,
    shareUrl: row.shareUrl,
  };
}
