import { describe, expect, it } from "vitest";
import { loadWatchedVessel } from "@/lib/tankermap-feed";
import {
  CRUDE_BBL_PER_TONNE,
  type AisVessel,
  buildVesselMapModel,
  cargoRule,
  compassPoint,
  findAttachment,
  formatLatLon,
  hullClass,
  nameplateBarrels,
  parseSearchHit,
  parseTrack,
  parseVessel,
  readAttachments,
  resolveVesselQuery,
  seaRegion,
  tankermapShareUrl,
} from "@/lib/tankermap";
import { loadJson } from "../data/helpers";

const GEM: AisVessel = {
  id: 38941,
  name: "GEM DARCY",
  imo: 1076599,
  mmsi: 538011795,
  flag: "Marshall Islands",
  vesselType: "Crude Oil Tanker",
  builtYear: 2026,
  grossTonnage: 42697,
  deadweight: 74706,
  sizeMeters: "228 / 32",
  lat: 5.86167,
  lon: 62.12833,
  speedKn: 12,
  cogDeg: 221.3,
  observedAt: "2026-09-25T19:29:41+00:00",
  destination: null,
  draughtMeters: 12.6,
  draughtObservedAt: "2026-09-22T10:48:00+00:00",
  cargoState: "loaded",
  cargoConfidence: 0.58,
  cargoReason: "class_default:small_tanker:hysteresis_loaded",
};

const SEARCH = [
  {
    id: 38941,
    name: "GEM DARCY",
    imo: 1076599,
    mmsi: 538011795,
    flag: "Marshall Islands",
    vessel_type: "Crude Oil Tanker",
    deadweight: 74706,
    last_lat: 5.86167,
    last_lon: 62.12833,
    last_speed: 12,
    last_observed_at: "2026-09-25T19:29:41+00:00",
    kind: "vessel",
    url: "/vessel/1076599",
  },
];

const VESSEL_PAYLOAD = {
  id: 38941,
  name: "GEM DARCY",
  imo: 1076599,
  mmsi: 538011795,
  flag: "Marshall Islands",
  vessel_type: "Crude Oil Tanker",
  built_year: 2026,
  gross_tonnage: 42697,
  deadweight: 74706,
  size_meters: "228 / 32",
  last_lat: 5.86167,
  last_lon: 62.12833,
  last_speed: 12,
  last_observed_at: "2026-09-25T19:29:41+00:00",
  last_destination: null,
  last_draught_meters: 12.6,
  draught_observed_at: "2026-09-22T10:48:00+00:00",
  cargo_state: "loaded",
  cargo_state_confidence: 0.58,
  cargo_state_reason: "class_default:small_tanker:hysteresis_loaded",
  last_cog_degrees: 221.3,
};

describe("TankerMap vessel layer", () => {
  it("defaults the share link to IMO 1076599 and rejects anything else as an IMO", () => {
    expect(resolveVesselQuery(undefined)).toEqual({ imo: "1076599", notice: null });
    expect(resolveVesselQuery("1076599").imo).toBe("1076599");
    expect(tankermapShareUrl("1076599")).toBe("https://tankermap.com/?vessel=1076599");
    const rejected = resolveVesselQuery("gem-darcy");
    expect(rejected.imo).toBe("1076599");
    expect(rejected.notice).toMatch(/7-digit IMO/);
  });

  it("parses the public search, vessel and track payloads", () => {
    expect(parseSearchHit(SEARCH, 1076599)).toEqual({ id: 38941 });
    expect(parseSearchHit(SEARCH, 1234567)).toBeNull();
    expect(parseVessel(null)).toBeNull();

    const vessel = parseVessel(VESSEL_PAYLOAD);
    expect(vessel?.name).toBe("GEM DARCY");
    expect(vessel?.destination).toBeNull();
    expect(vessel?.cogDeg).toBe(221.3);
    expect(formatLatLon(vessel!.lat, vessel!.lon)).toBe("5.8617° N, 62.1283° E");

    const track = parseTrack([
      { observed_at: "2026-09-25T19:29:41+00:00", latitude: 5.86167, longitude: 62.12833, speed_knots: 12 },
      { observed_at: "2026-09-25T16:26:41+00:00", latitude: 6.33667, longitude: 62.54833, speed_knots: 12 },
      { observed_at: "bad" },
    ]);
    expect(track.map((fix) => fix.lat)).toEqual([6.33667, 5.86167]);
  });

  it("keeps the desk reading separate from the AIS fields", () => {
    expect(hullClass(74706)).toBe("Panamax-size");
    expect(nameplateBarrels(74706)).toBeCloseTo(74706 * CRUDE_BBL_PER_TONNE, 5);
    expect(seaRegion(5.86167, 62.12833)).toBe("central Indian Ocean");
    expect(compassPoint(221.3)).toBe("SW");
    expect(cargoRule("class_default:small_tanker:hysteresis_loaded")).toMatch(/not a bill of lading/i);

    const attachments = readAttachments(loadJson("vessel-attachments.json"));
    const note = findAttachment(attachments, "1076599");
    expect(note?.data_type).toBe("indicative");
    expect(note?.source_url).toBe("https://tankermap.com/?vessel=1076599");
    expect(findAttachment(attachments, "0000000")).toBeNull();
  });

  it("draws the AIS track, a southwest heading ray and the attached places", () => {
    const attachment = findAttachment(readAttachments(loadJson("vessel-attachments.json")), "1076599");
    const coast = [
      [
        [60, 20],
        [70, 20],
        [70, 10],
        [60, 10],
        [60, 20],
      ],
      [
        [-150, 10],
        [-140, 10],
        [-140, 0],
        [-150, 0],
        [-150, 10],
      ],
    ] as const;

    const map = buildVesselMapModel({
      vessel: GEM,
      track: [
        { observedAt: "2026-09-25T16:26:41+00:00", lat: 6.33667, lon: 62.54833, speedKn: 12 },
        { observedAt: "2026-09-25T19:29:41+00:00", lat: 5.86167, lon: 62.12833, speedKn: 12 },
      ],
      places: attachment?.places ?? [],
      coast,
    });

    const pacificOnly = buildVesselMapModel({
      vessel: GEM,
      track: [],
      places: attachment?.places ?? [],
      coast: [coast[1]],
    });

    expect(map.trackD.startsWith("M")).toBe(true);
    expect(map.coastD.length).toBeGreaterThan(0);
    expect(pacificOnly.coastD).toBe("");
    expect(map.headingRay).not.toBeNull();
    expect(map.headingRay!.x2).toBeLessThan(map.vessel.x);
    expect(map.headingRay!.y2).toBeGreaterThan(map.vessel.y);
    expect(map.places.map((place) => place.id).sort()).toEqual(["bab", "cape", "hormuz", "malacca"]);
    expect(map.vessel.x).toBeGreaterThan(0);
    expect(map.vessel.x).toBeLessThan(map.width);
    expect(map.vessel.y).toBeGreaterThan(0);
    expect(map.vessel.y).toBeLessThan(map.height);
    expect(map.inset?.trackD.startsWith("M")).toBe(true);
  });

  it.skipIf(process.env.TANKERMAP_LIVE !== "1")("reads GEM DARCY from the public API", async () => {
    const view = await loadWatchedVessel("1076599");
    expect(view.status).toBe("ok");
    expect(view.vessel?.name).toMatch(/DARCY/i);
    expect(view.vessel?.imo).toBe(1076599);
    expect(view.attachment?.headline).toBeTruthy();
    expect(view.map?.vesselName).toMatch(/DARCY/i);
    expect(view.shareUrl).toBe("https://tankermap.com/?vessel=1076599");
  });
});
