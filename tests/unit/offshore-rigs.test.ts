import { describe, expect, it } from "vitest";
import { BARREL_MARKS } from "@/lib/desk-tape";
import { OFFSHORE_RIGS } from "@/lib/offshore-rigs";

describe("offshore rigs", () => {
  it("marks the main basins as schematic symbols, clear of the barrel tags", () => {
    expect(OFFSHORE_RIGS.length).toBeGreaterThanOrEqual(10);
    const ids = new Set(OFFSHORE_RIGS.map((rig) => rig.id));
    expect(ids.size).toBe(OFFSHORE_RIGS.length);
    for (const rig of OFFSHORE_RIGS) {
      expect(rig.name.trim().length).toBeGreaterThan(1);
      expect(rig.basin.trim().length).toBeGreaterThan(1);
      expect(rig.lat).toBeGreaterThanOrEqual(-60);
      expect(rig.lat).toBeLessThanOrEqual(75);
      expect(rig.lon).toBeGreaterThanOrEqual(-180);
      expect(rig.lon).toBeLessThanOrEqual(180);
      for (const mark of BARREL_MARKS) {
        const gap = Math.hypot(rig.lat - mark.lat, rig.lon - mark.lon);
        expect(gap).toBeGreaterThan(2.5);
      }
    }
  });
});
