/**
 * TankerMap public-API shapes and the Flow Map vessel layer.
 *
 * Position data is read from documented public endpoints and labelled delayed.
 * The desk attachment is a separate, indicative note — it never overwrites AIS.
 */

export const DEFAULT_VESSEL_IMO = "1076599";
export const TANKERMAP_ORIGIN = "https://tankermap.com";
/** Crude barrels per tonne, as published in the TankerMap data dictionary. */
export const CRUDE_BBL_PER_TONNE = 7.37;
export const HEADING_RAY_HOURS = 48;
export const MAP_WIDTH = 760;
export const MAP_HEIGHT = 480;

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

export type LonLatRing = ReadonlyArray<readonly [number, number]>;

export type VesselFactor = { factor: string; detail: string };

export type VesselPlace = { id: string; name: string; lat: number; lon: number };

export type VesselAttachment = {
  imo: number;
  headline: string;
  read: string;
  factors: VesselFactor[];
  implication: string;
  source: string;
  source_url: string;
  last_updated: string;
  data_type: string;
  places: VesselPlace[];
};

export type TrackFix = {
  observedAt: string;
  lat: number;
  lon: number;
  speedKn: number | null;
};

export type AisVessel = {
  id: number;
  name: string;
  imo: number;
  mmsi: number | null;
  flag: string | null;
  vesselType: string | null;
  builtYear: number | null;
  grossTonnage: number | null;
  deadweight: number | null;
  sizeMeters: string | null;
  lat: number;
  lon: number;
  speedKn: number | null;
  cogDeg: number | null;
  observedAt: string;
  destination: string | null;
  draughtMeters: number | null;
  draughtObservedAt: string | null;
  cargoState: string | null;
  cargoConfidence: number | null;
  cargoReason: string | null;
};

export type MapPoint = { x: number; y: number };
export type MapSegment = { x1: number; y1: number; x2: number; y2: number };
export type MapMarker = {
  id: string;
  name: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  anchor: "start" | "end";
};

export type VesselInset = {
  x: number;
  y: number;
  width: number;
  height: number;
  coastD: string;
  trackD: string;
  vessel: MapPoint;
};

export type VesselMapModel = {
  width: number;
  height: number;
  coastD: string;
  graticule: MapSegment[];
  trackD: string;
  vessel: MapPoint;
  vesselName: string;
  courseTick: MapSegment | null;
  headingRay: MapSegment | null;
  places: MapMarker[];
  inset: VesselInset | null;
};

export type VesselWatchStatus = "ok" | "missing" | "unavailable";

export type VesselWatchView = {
  imo: string;
  status: VesselWatchStatus;
  notice: string | null;
  shareUrl: string;
  profileUrl: string;
  vessel: AisVessel | null;
  track: TrackFix[];
  attachment: VesselAttachment | null;
  map: VesselMapModel | null;
  retrievedAt: string;
};

export function tankermapShareUrl(imo: string): string {
  return `${TANKERMAP_ORIGIN}/?vessel=${imo}`;
}

export function tankermapProfileUrl(imo: string): string {
  return `${TANKERMAP_ORIGIN}/vessel/${imo}`;
}

export function isImo(value: string): boolean {
  return /^\d{7}$/.test(value);
}

export function resolveVesselQuery(rawQuery: string | undefined): { imo: string; notice: string | null } {
  const query = rawQuery?.trim() ?? "";
  if (query === "") return { imo: DEFAULT_VESSEL_IMO, notice: null };
  if (!isImo(query)) {
    return {
      imo: DEFAULT_VESSEL_IMO,
      notice: `${query.slice(0, 32)} is not a 7-digit IMO, so the watch stays on ${DEFAULT_VESSEL_IMO}.`,
    };
  }
  return { imo: query, notice: null };
}

export function formatUtc(iso: string): string {
  if (!iso.includes("T")) return iso;
  const [date, time] = iso.split("T");
  return `${date} ${time.slice(0, 5)} UTC`;
}

export function formatLatLon(lat: number, lon: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lon).toFixed(4)}° ${ew}`;
}

export function compassPoint(cogDeg: number): string {
  const wrapped = ((cogDeg % 360) + 360) % 360;
  return COMPASS[Math.round(wrapped / 45) % 8];
}

export function hullClass(deadweight: number | null): string | null {
  if (deadweight == null || !Number.isFinite(deadweight) || deadweight <= 0) return null;
  if (deadweight < 55_000) return "Handysize / MR";
  if (deadweight < 85_000) return "Panamax-size";
  if (deadweight < 125_000) return "Aframax-size";
  if (deadweight < 200_000) return "Suezmax-size";
  return "VLCC-size";
}

/** Nameplate crude capacity. A ceiling from deadweight, not a measured cargo. */
export function nameplateBarrels(deadweight: number | null): number | null {
  if (deadweight == null || !Number.isFinite(deadweight) || deadweight <= 0) return null;
  return deadweight * CRUDE_BBL_PER_TONNE;
}

/**
 * Coarse desk grid so the card can name the water without pretending to be a chart.
 * Boxes are checked from the specific straits outward.
 */
export function seaRegion(lat: number, lon: number): string {
  if (lat >= 24 && lat <= 30 && lon >= 54 && lon <= 58) return "Strait of Hormuz";
  if (lat >= 12 && lat <= 14 && lon >= 42 && lon <= 45) return "Bab el-Mandeb";
  if (lat >= -2 && lat <= 6 && lon >= 98 && lon <= 105) return "Strait of Malacca";
  if (lat >= -36 && lat <= -32 && lon >= 16 && lon <= 22) return "Cape of Good Hope";
  if (lat >= 8 && lat <= 26 && lon >= 56 && lon <= 75) return "Arabian Sea";
  if (lat >= -8 && lat <= 10 && lon >= 50 && lon <= 80) return "central Indian Ocean";
  if (lat >= -40 && lat <= -10 && lon >= 20 && lon <= 70) return "south-west Indian Ocean";
  if (lat >= 0 && lat <= 25 && lon >= 80 && lon <= 100) return "Bay of Bengal";
  return "open ocean";
}

export function cargoRule(reason: string | null): string {
  if (reason?.includes("hysteresis")) {
    return "Class draught hysteresis — not a bill of lading.";
  }
  return "TankerMap estimate — not a bill of lading.";
}

type Bounds = { minLat: number; maxLat: number; minLon: number; maxLon: number };

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function rhumb(lat: number, lon: number, cogDeg: number, nauticalMiles: number): { lat: number; lon: number } | null {
  if (!Number.isFinite(cogDeg) || !Number.isFinite(nauticalMiles) || nauticalMiles <= 0) return null;
  const cog = (cogDeg * Math.PI) / 180;
  const dLat = (nauticalMiles * Math.cos(cog)) / 60;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  if (Math.abs(cosLat) < 0.2) return null;
  const dLon = (nauticalMiles * Math.sin(cog)) / (60 * cosLat);
  const nextLat = lat + dLat;
  if (nextLat > 80 || nextLat < -80) return null;
  return { lat: nextLat, lon: lon + dLon };
}

function mercY(lat: number): number {
  const phi = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + phi / 2));
}

function expandBounds(points: Array<{ lat: number; lon: number }>, minLatSpan: number, minLonSpan: number, pad: number): Bounds {
  let minLat = 90;
  let maxLat = -90;
  let minLon = 180;
  let maxLon = -180;
  for (const point of points) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLon = Math.min(minLon, point.lon);
    maxLon = Math.max(maxLon, point.lon);
  }
  const latMid = (minLat + maxLat) / 2;
  const lonMid = (minLon + maxLon) / 2;
  if (maxLat - minLat < minLatSpan) {
    minLat = latMid - minLatSpan / 2;
    maxLat = latMid + minLatSpan / 2;
  }
  if (maxLon - minLon < minLonSpan) {
    minLon = lonMid - minLonSpan / 2;
    maxLon = lonMid + minLonSpan / 2;
  }
  return {
    minLat: Math.max(-70, minLat - pad),
    maxLat: Math.min(75, maxLat + pad),
    minLon: Math.max(-180, minLon - pad),
    maxLon: Math.min(180, maxLon + pad),
  };
}

function projector(bounds: Bounds, width: number, height: number) {
  const yTop = mercY(bounds.maxLat);
  const yBot = mercY(bounds.minLat);
  return (lat: number, lon: number): MapPoint => ({
    x: ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * width,
    y: ((yTop - mercY(lat)) / (yTop - yBot)) * height,
  });
}

function ringBounds(ring: LonLatRing): Bounds {
  let minLat = 90;
  let maxLat = -90;
  let minLon = 180;
  let maxLon = -180;
  for (const [lon, lat] of ring) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
  }
  return { minLat, maxLat, minLon, maxLon };
}

function overlaps(a: Bounds, b: Bounds): boolean {
  return a.minLon <= b.maxLon && a.maxLon >= b.minLon && a.minLat <= b.maxLat && a.maxLat >= b.minLat;
}

function coastPath(coast: ReadonlyArray<LonLatRing>, bounds: Bounds, project: (lat: number, lon: number) => MapPoint, frame: { x: number; y: number; width: number; height: number } | null): string {
  const pad = 8;
  const parts: string[] = [];
  for (const ring of coast) {
    if (ring.length < 2 || !overlaps(ringBounds(ring), bounds)) continue;
    let penDown = false;
    let path = "";
    for (const [lon, lat] of ring) {
      const inside =
        lon >= bounds.minLon - pad &&
        lon <= bounds.maxLon + pad &&
        lat >= bounds.minLat - pad &&
        lat <= bounds.maxLat + pad;
      if (!inside) {
        penDown = false;
        continue;
      }
      const point = project(lat, lon);
      const x = frame ? frame.x + (point.x / MAP_WIDTH) * frame.width : point.x;
      const y = frame ? frame.y + (point.y / MAP_HEIGHT) * frame.height : point.y;
      path += `${penDown ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
      penDown = true;
    }
    if (path) parts.push(path);
  }
  return parts.join(" ");
}

function trackPath(points: MapPoint[]): string {
  if (points.length < 2) return "";
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join("");
}

function screenSegment(origin: MapPoint, probe: MapPoint, pixels: number): MapSegment | null {
  const dx = probe.x - origin.x;
  const dy = probe.y - origin.y;
  const length = Math.hypot(dx, dy);
  if (length < 0.5) return null;
  return {
    x1: origin.x,
    y1: origin.y,
    x2: origin.x + (dx / length) * pixels,
    y2: origin.y + (dy / length) * pixels,
  };
}

export function readAttachments(raw: unknown): VesselAttachment[] {
  if (!raw || typeof raw !== "object" || !("attachments" in raw) || !Array.isArray(raw.attachments)) return [];
  const attachments: VesselAttachment[] = [];
  for (const item of raw.attachments) {
    const parsed = parseAttachment(item);
    if (parsed) attachments.push(parsed);
  }
  return attachments;
}

function parseAttachment(item: unknown): VesselAttachment | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const imo = finiteNumber(record.imo);
  const headline = cleanString(record.headline);
  const read = cleanString(record.read);
  const implication = cleanString(record.implication);
  const source = cleanString(record.source);
  const sourceUrl = cleanString(record.source_url);
  const lastUpdated = cleanString(record.last_updated);
  const dataType = cleanString(record.data_type);
  if (imo == null || !headline || !read || !implication || !source || !sourceUrl || !lastUpdated || !dataType) return null;
  if (!Array.isArray(record.factors) || record.factors.length === 0) return null;
  const factors: VesselFactor[] = [];
  for (const factor of record.factors) {
    if (!factor || typeof factor !== "object") return null;
    const row = factor as Record<string, unknown>;
    const name = cleanString(row.factor);
    const detail = cleanString(row.detail);
    if (!name || !detail) return null;
    factors.push({ factor: name, detail });
  }
  if (!Array.isArray(record.places)) return null;
  const places: VesselPlace[] = [];
  for (const place of record.places) {
    if (!place || typeof place !== "object") return null;
    const row = place as Record<string, unknown>;
    const id = cleanString(row.id);
    const name = cleanString(row.name);
    const lat = finiteNumber(row.lat);
    const lon = finiteNumber(row.lon);
    if (!id || !name || lat == null || lon == null) return null;
    places.push({ id, name, lat, lon });
  }
  return {
    imo,
    headline,
    read,
    factors,
    implication,
    source,
    source_url: sourceUrl,
    last_updated: lastUpdated,
    data_type: dataType,
    places,
  };
}

export function findAttachment(attachments: VesselAttachment[], imo: string): VesselAttachment | null {
  const numeric = Number(imo);
  return attachments.find((attachment) => attachment.imo === numeric) ?? null;
}

export function parseSearchHit(payload: unknown, imo: number): { id: number } | null {
  if (!Array.isArray(payload)) return null;
  for (const item of payload) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const id = finiteNumber(record.id);
    const hitImo = finiteNumber(record.imo);
    if (id != null && hitImo === imo) return { id };
  }
  return null;
}

export function parseVessel(payload: unknown): AisVessel | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const id = finiteNumber(record.id);
  const imo = finiteNumber(record.imo);
  const name = cleanString(record.name);
  const lat = finiteNumber(record.last_lat);
  const lon = finiteNumber(record.last_lon);
  const observedAt = cleanString(record.last_observed_at);
  if (id == null || imo == null || !name || lat == null || lon == null || !observedAt) return null;
  const confidence = finiteNumber(record.cargo_state_confidence);
  return {
    id,
    name,
    imo,
    mmsi: finiteNumber(record.mmsi),
    flag: cleanString(record.flag),
    vesselType: cleanString(record.vessel_type),
    builtYear: finiteNumber(record.built_year),
    grossTonnage: finiteNumber(record.gross_tonnage),
    deadweight: finiteNumber(record.deadweight),
    sizeMeters: cleanString(record.size_meters),
    lat,
    lon,
    speedKn: finiteNumber(record.last_speed),
    cogDeg: finiteNumber(record.last_cog_degrees),
    observedAt,
    destination: cleanString(record.last_destination),
    draughtMeters: finiteNumber(record.last_draught_meters),
    draughtObservedAt: cleanString(record.draught_observed_at),
    cargoState: cleanString(record.cargo_state),
    cargoConfidence: confidence,
    cargoReason: cleanString(record.cargo_state_reason),
  };
}

export function parseTrack(payload: unknown): TrackFix[] {
  if (!Array.isArray(payload)) return [];
  const fixes: TrackFix[] = [];
  for (const item of payload) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const lat = finiteNumber(record.latitude);
    const lon = finiteNumber(record.longitude);
    const observedAt = cleanString(record.observed_at);
    if (lat == null || lon == null || !observedAt) continue;
    fixes.push({
      observedAt,
      lat,
      lon,
      speedKn: finiteNumber(record.speed_knots),
    });
  }
  fixes.sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));
  return fixes;
}

export function buildVesselMapModel(args: {
  vessel: AisVessel;
  track: TrackFix[];
  places: VesselPlace[];
  coast: ReadonlyArray<LonLatRing>;
}): VesselMapModel {
  const { vessel, track, places, coast } = args;
  const speed = vessel.speedKn ?? 0;
  const rayPoint =
    vessel.cogDeg != null && speed >= 0.5 ? rhumb(vessel.lat, vessel.lon, vessel.cogDeg, speed * HEADING_RAY_HOURS) : null;
  const framePoints = [
    { lat: vessel.lat, lon: vessel.lon },
    ...track.map((fix) => ({ lat: fix.lat, lon: fix.lon })),
    ...places.map((place) => ({ lat: place.lat, lon: place.lon })),
    ...(rayPoint ? [rayPoint] : []),
  ];
  const bounds = expandBounds(framePoints, places.length > 0 ? 8 : 18, places.length > 0 ? 8 : 22, places.length > 0 ? 8 : 2);
  const project = projector(bounds, MAP_WIDTH, MAP_HEIGHT);
  const vesselPoint = project(vessel.lat, vessel.lon);
  const trackPoints = track.map((fix) => project(fix.lat, fix.lon));
  const probe = vessel.cogDeg != null ? rhumb(vessel.lat, vessel.lon, vessel.cogDeg, 40) : null;
  const courseTick = probe ? screenSegment(vesselPoint, project(probe.lat, probe.lon), 18) : null;
  const headingRay = rayPoint
    ? { x1: vesselPoint.x, y1: vesselPoint.y, x2: project(rayPoint.lat, rayPoint.lon).x, y2: project(rayPoint.lat, rayPoint.lon).y }
    : null;

  const graticule: MapSegment[] = [];
  for (let lat = Math.ceil(bounds.minLat / 15) * 15; lat < bounds.maxLat; lat += 15) {
    const left = project(lat, bounds.minLon);
    const right = project(lat, bounds.maxLon);
    graticule.push({ x1: left.x, y1: left.y, x2: right.x, y2: right.y });
  }
  for (let lon = Math.ceil(bounds.minLon / 15) * 15; lon < bounds.maxLon; lon += 15) {
    const top = project(bounds.maxLat, lon);
    const bottom = project(bounds.minLat, lon);
    graticule.push({ x1: top.x, y1: top.y, x2: bottom.x, y2: bottom.y });
  }

  const insetWidth = 188;
  const insetHeight = 128;
  const inset = {
    x: MAP_WIDTH - insetWidth - 14,
    y: MAP_HEIGHT - insetHeight - 14,
    width: insetWidth,
    height: insetHeight,
  };
  const insetPoints = [{ lat: vessel.lat, lon: vessel.lon }, ...track.map((fix) => ({ lat: fix.lat, lon: fix.lon }))];
  const insetBounds = expandBounds(insetPoints, 1.4, 1.6, 0.25);
  const insetProject = projector(insetBounds, MAP_WIDTH, MAP_HEIGHT);
  const insetVessel = insetProject(vessel.lat, vessel.lon);
  const insetVesselPoint = {
    x: inset.x + (insetVessel.x / MAP_WIDTH) * inset.width,
    y: inset.y + (insetVessel.y / MAP_HEIGHT) * inset.height,
  };
  const insetTrack = trackPath(
    track.map((fix) => {
      const point = insetProject(fix.lat, fix.lon);
      return {
        x: inset.x + (point.x / MAP_WIDTH) * inset.width,
        y: inset.y + (point.y / MAP_HEIGHT) * inset.height,
      };
    }),
  );

  return {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    coastD: coastPath(coast, bounds, project, null),
    graticule,
    trackD: trackPath(trackPoints),
    vessel: vesselPoint,
    vesselName: vessel.name,
    courseTick,
    headingRay,
    places: places.map((place) => {
      const point = project(place.lat, place.lon);
      const nearTop = point.y < 48;
      const nearBottom = point.y > MAP_HEIGHT - 56;
      const nearRight = point.x > MAP_WIDTH - 140;
      return {
        id: place.id,
        name: place.name,
        x: point.x,
        y: point.y,
        labelX: nearRight ? point.x - 8 : point.x + 8,
        labelY: nearTop ? point.y + 16 : nearBottom ? point.y - 12 : point.y - 8,
        anchor: nearRight ? "end" : "start",
      };
    }),
    inset: {
      ...inset,
      coastD: coastPath(coast, insetBounds, insetProject, inset),
      trackD: insetTrack,
      vessel: insetVesselPoint,
    },
  };
}
