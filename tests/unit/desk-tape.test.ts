import { describe, expect, it } from "vitest";
import { playheadAt, priceBounds, seriesLine, type TapePrint } from "@/lib/desk-tape";

const SERIES: TapePrint[] = [
  { date: "06-04", brent: 80, wti: 76 },
  { date: "06-06", brent: 78, wti: 74 },
  { date: "06-09", brent: 79, wti: 75 },
];

describe("desk tape", () => {
  it("starts on the first print and finishes on the last", () => {
    const start = playheadAt(SERIES, 0);
    expect(start.brent).toBe(80);
    expect(start.wti).toBe(76);
    expect(start.date).toBe("06-04");
    expect(start.brentStep).toBe(0);
    const end = playheadAt(SERIES, SERIES.length - 1);
    expect(end.brent).toBe(79);
    expect(end.wti).toBe(75);
    expect(end.date).toBe("06-09");
  });

  it("walks the published step instead of inventing a quote", () => {
    const mid = playheadAt(SERIES, 0.5);
    expect(mid.brent).toBe(79);
    expect(mid.wti).toBe(75);
    expect(mid.brentStep).toBe(-1);
    expect(mid.wtiStep).toBe(-1);
    expect(mid.date).toBe("06-06");
  });

  it("pads the graph around the prints", () => {
    const bounds = priceBounds(SERIES);
    expect(bounds.min).toBeLessThan(74);
    expect(bounds.max).toBeGreaterThan(80);
  });

  it("draws a line through every print", () => {
    const line = seriesLine([80, 78, 79], 100, 40, 70, 90);
    expect(line.startsWith("M")).toBe(true);
    expect(line.split("L")).toHaveLength(3);
  });
});
