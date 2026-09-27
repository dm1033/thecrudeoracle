/**
 * Homepage trading tape.
 * The path is the published indicative Brent/WTI series. The playhead replays
 * those prints. It does not invent a live quote.
 */

export type TapePrint = { date: string; brent: number; wti: number };

export type TapePlayhead = {
  brent: number;
  wti: number;
  date: string;
  /** Move traced since the print on the left of this segment, in USD/bbl. */
  brentStep: number;
  wtiStep: number;
};

export const BARREL_MARKS = [
  { id: "brent" as const, name: "Brent", lat: 58.2, lon: 1.2 },
  { id: "wti" as const, name: "WTI", lat: 27.8, lon: -90.5 },
];

export function priceBounds(series: readonly TapePrint[]): { min: number; max: number } {
  if (series.length === 0) return { min: 0, max: 1 };
  let min = Infinity;
  let max = -Infinity;
  for (const print of series) {
    min = Math.min(min, print.brent, print.wti);
    max = Math.max(max, print.brent, print.wti);
  }
  const pad = Math.max(0.35, (max - min) * 0.14);
  return { min: min - pad, max: max + pad };
}

export function playheadAt(series: readonly TapePrint[], t: number): TapePlayhead {
  if (series.length === 0) {
    return { brent: 0, wti: 0, date: "", brentStep: 0, wtiStep: 0 };
  }
  const span = Math.max(1, series.length - 1);
  const clamped = Math.max(0, Math.min(span, t));
  const index = Math.min(series.length - 1, Math.floor(clamped));
  const next = Math.min(series.length - 1, index + 1);
  const frac = next === index ? 0 : clamped - index;
  const left = series[index];
  const right = series[next];
  const brent = left.brent + (right.brent - left.brent) * frac;
  const wti = left.wti + (right.wti - left.wti) * frac;
  return {
    brent,
    wti,
    date: frac < 0.5 ? left.date : right.date,
    brentStep: brent - left.brent,
    wtiStep: wti - left.wti,
  };
}

export function seriesLine(
  values: readonly number[],
  width: number,
  height: number,
  min: number,
  max: number
): string {
  if (values.length === 0 || max <= min) return "";
  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / (max - min)) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}
