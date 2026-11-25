import { describe, expect, it } from "vitest";
import {
  buildMovingTankerFeed,
  headingTick,
  isUnderway,
  parseLiveFleet,
  tankerClassFor,
} from "@/lib/moving-tankers";
import { SATELLITE_BASEMAPS } from "@/lib/satellite-basemaps";

function hull(overrides: Record<string, unknown> = {}) {
  return {
    name: "ANNA KNUTSEN",
    imo: 9769221,
    vessel_type: "Crude Oil Tanker",
    latitude: -22.32957,
    longitude: -40.78748,
    speed_knots: 8.4,
    cog_degrees: 46.3,
    nav_status: "Under way using engine",
    observed_at: "2026-11-25T20:20:21+00:00",
    destination: "ANGRA DOS REIS ANCH",
    ...overrides,
  };
}

describe("moving tanker key", () => {
  it("keeps underway hulls and drops anchored, slow, unknown and broken rows", () => {
    const fleet = parseLiveFleet([
      hull(),
      hull({ name: "QUIET", imo: 1234567, speed_knots: 2.2, nav_status: "At anchor" }),
      hull({ name: "SLOW", imo: 1234568, speed_knots: 0.4, nav_status: "Under way" }),
      hull({ name: "MOORED", imo: 1234569, speed_knots: 6, nav_status: "Moored" }),
      hull({ name: "DRIFT", imo: 1234570, speed_knots: 1.4, nav_status: "Drifting" }),
      hull({ name: "ORFEOS", imo: 9344166, vessel_type: "Oil Products Tanker", speed_knots: 10.9, cog_degrees: 12 }),
      hull({ name: "AL SLAIMI", imo: 9990001, vessel_type: "LNG Tanker", speed_knots: 12, latitude: 29.1, longitude: -90.2 }),
      hull({ name: "STOLT", imo: 9990002, vessel_type: "Chemical/Oil Products Tanker", speed_knots: 11.2 }),
      hull({ name: "OTHER", imo: 9990003, vessel_type: "Bulk Carrier", speed_knots: 12 }),
      hull({ name: "BAD", imo: 9990004, latitude: 95, speed_knots: 12 }),
      hull({ name: "", imo: 9990005 }),
      hull({ name: "NO TIME", imo: 9990006, observed_at: "2026-11-25" }),
    ]);
    expect(fleet?.map((item) => item.name)).toEqual(["AL SLAIMI", "STOLT", "ORFEOS", "ANNA KNUTSEN"]);
    expect(fleet?.[0]).toMatchObject({ tankerClass: "lng", speedKn: 12, imo: "9990001" });
    expect(fleet?.[3].destination).toBe("ANGRA DOS REIS ANCH");
    expect(fleet?.[3].lat).toBeCloseTo(-22.32957, 5);
  });

  it("keeps the later fix when the same IMO appears twice", () => {
    const fleet = parseLiveFleet([
      hull({ observed_at: "2026-11-25T18:00:00+00:00", speed_knots: 4 }),
      hull({ observed_at: "2026-11-25T20:20:21+00:00", speed_knots: 9.2, name: "ANNA KNUTSEN" }),
    ]);
    expect(fleet).toHaveLength(1);
    expect(fleet?.[0].speedKn).toBe(9.2);
  });

  it("treats a non-array payload as unavailable and an empty array as zero moving", () => {
    expect(parseLiveFleet({ vessels: [] })).toBeNull();
    expect(parseLiveFleet([])).toEqual([]);
    const broken = buildMovingTankerFeed({ nope: true }, "2026-11-25T20:25:00Z");
    expect(broken.status).toBe("unavailable");
    expect(broken.tankers).toEqual([]);
    expect(broken.counts).toEqual({ crude: 0, products: 0, chemical: 0, lng: 0 });
    const empty = buildMovingTankerFeed([], "2026-11-25T20:25:00Z");
    expect(empty.status).toBe("ok");
    expect(empty.sourceUrl).toBe("https://tankermap.com/api/vessels/live");
    expect(empty.rule).toMatch(/1 knot/);
  });

  it("counts classes and draws a northbound course tick", () => {
    const feed = buildMovingTankerFeed(
      [
        hull(),
        hull({ name: "GAS", imo: 1000001, vessel_type: "LNG Tanker", speed_knots: 14 }),
      ],
      "2026-11-25T20:25:00Z",
    );
    expect(feed.counts).toEqual({ crude: 1, products: 0, chemical: 0, lng: 1 });
    const tick = headingTick({ lat: 0, lon: 10, cogDeg: 0 });
    expect(tick?.[0]).toEqual([10, 0]);
    expect(tick?.[1][0]).toBeCloseTo(10, 5);
    expect(tick?.[1][1]).toBeCloseTo(1, 5);
    expect(headingTick({ lat: 0, lon: 10, cogDeg: null })).toBeNull();
    expect(isUnderway(1, "Under way")).toBe(true);
    expect(isUnderway(0.9, "Under way")).toBe(false);
    expect(tankerClassFor("LNG Tanker")).toBe("lng");
    expect(tankerClassFor("Ore carrier")).toBeNull();
  });

  it("names two NASA satellite mosaics with attribution", () => {
    expect(SATELLITE_BASEMAPS.day.tiles).toContain("BlueMarble_ShadedRelief_Bathymetry");
    expect(SATELLITE_BASEMAPS.night.tiles).toContain("VIIRS_Black_Marble");
    expect(SATELLITE_BASEMAPS.day.attribution).toMatch(/NASA GIBS/);
    expect(SATELLITE_BASEMAPS.night.note).toMatch(/Not a live picture/);
    expect(SATELLITE_BASEMAPS.day.maxZoom).toBe(8);
  });
});
