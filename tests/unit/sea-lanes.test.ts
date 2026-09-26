import { describe, expect, it } from "vitest";
import {
  LANES,
  buildLaneFrame,
  lanePosition,
  maskPixel,
  offsetByCourse,
  parseGlobeShip,
  toVec,
  unwrapRing,
} from "@/lib/sea-lanes";

describe("sea lanes", () => {
  it("keeps every waypoint on the globe and every lane moving", () => {
    expect(LANES.length).toBeGreaterThanOrEqual(8);
    for (const lane of LANES) {
      expect(lane.waypoints.length).toBeGreaterThanOrEqual(2);
      expect(lane.ships).toBeGreaterThanOrEqual(1);
      expect(lane.duration).toBeGreaterThan(30);
      for (const [lat, lon] of lane.waypoints) {
        expect(lat).toBeGreaterThanOrEqual(-75);
        expect(lat).toBeLessThanOrEqual(75);
        expect(lon).toBeGreaterThanOrEqual(-180);
        expect(lon).toBeLessThanOrEqual(180);
      }
    }
  });

  it("places a ship at the start of a lane and further along as time advances", () => {
    const frame = buildLaneFrame([
      [0, 0],
      [0, 90],
    ]);
    const start = lanePosition(frame, 0);
    const mid = lanePosition(frame, 0.5);
    const origin = toVec(0, 0);
    expect(start.x).toBeCloseTo(origin.x, 5);
    expect(start.z).toBeCloseTo(origin.z, 5);
    expect(mid.x).toBeGreaterThan(start.x);
    expect(mid.z).toBeLessThan(start.z);
    const len = Math.hypot(mid.x, mid.y, mid.z);
    expect(len).toBeCloseTo(1, 5);
  });

  it("unwraps a dateline jump into a continuous ring", () => {
    const ring = unwrapRing([
      [179, 0],
      [-179, 0],
      [-179, 1],
      [179, 1],
    ]);
    for (let i = 1; i < ring.length; i++) {
      expect(Math.abs(ring[i][0] - ring[i - 1][0])).toBeLessThanOrEqual(180);
    }
    expect(ring[1][0]).toBeGreaterThan(180);
  });

  it("maps longitude into the land-mask column", () => {
    expect(maskPixel(0, 0, 360, 180)).toEqual({ x: 180, y: 90 });
    expect(maskPixel(179.5, 90, 360, 180).x).toBe(359);
    expect(maskPixel(180, 0, 360, 180).x).toBe(0);
    expect(maskPixel(-180, -90, 360, 180)).toEqual({ x: 0, y: 179 });
  });

  it("steps a course by nautical miles without inventing a second heading", () => {
    const north = offsetByCourse(0, 10, 0, 12, 5);
    expect(north.lat).toBeCloseTo(1, 5);
    expect(north.lon).toBeCloseTo(10, 5);
    const east = offsetByCourse(0, 10, 90, 60, 1);
    expect(east.lat).toBeCloseTo(0, 5);
    expect(east.lon).toBeCloseTo(11, 5);
  });

  it("accepts one delayed hull and rejects a payload with no timestamp", () => {
    const ship = parseGlobeShip({
      ship: {
        name: "GEM DARCY",
        imo: "1076599",
        lat: 5.86,
        lon: 62.13,
        cogDeg: 221,
        speedKn: 12,
        observedAt: "2026-09-25T19:29:41Z",
        shareUrl: "https://tankermap.com/?vessel=1076599",
      },
    });
    expect(ship?.name).toBe("GEM DARCY");
    expect(parseGlobeShip({ ship: { name: "GEM DARCY", imo: "1076599", lat: 1, lon: 2 } })).toBeNull();
    expect(parseGlobeShip({ ship: null })).toBeNull();
  });
});
