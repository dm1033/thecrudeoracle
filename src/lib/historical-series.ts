/** Oldest-first daily print. Nothing here is filled or carried forward. */
export interface HistoryPoint {
  date: string;
  value: number;
}

export const HISTORY_RANGES = ["1W", "1M", "3M", "1Y", "5Y", "MAX"] as const;
export type HistoryRange = (typeof HISTORY_RANGES)[number];

const RANGE_DAYS: Record<Exclude<HistoryRange, "MAX">, number> = {
  "1W": 7,
  "1M": 31,
  "3M": 92,
  "1Y": 366,
  "5Y": 1828,
};

export interface SpotHistory {
  brent: HistoryPoint[];
  wti: HistoryPoint[];
  henryHub: HistoryPoint[];
  /** Shared dates only. Brent minus WTI. */
  spread: HistoryPoint[];
  fetchedAt: string;
}

function shiftDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Keeps prints on or after the window that ends on the newest date. */
export function sliceRange(points: readonly HistoryPoint[], range: HistoryRange): HistoryPoint[] {
  if (!points.length || range === "MAX") return [...points];
  const end = points[points.length - 1].date;
  const start = shiftDays(end, -RANGE_DAYS[range]);
  return points.filter((point) => point.date >= start);
}

/** Rebases the first point in the window to 100. Empty input stays empty. */
export function rebase(points: readonly HistoryPoint[]): HistoryPoint[] {
  const base = points[0]?.value;
  if (!base) return [];
  return points.map((point) => ({ date: point.date, value: (point.value / base) * 100 }));
}

/** Simple moving average. A point is omitted until the window is full. */
export function movingAverage(points: readonly HistoryPoint[], window: number): HistoryPoint[] {
  if (window < 1) return [];
  const out: HistoryPoint[] = [];
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    sum += points[i].value;
    if (i >= window) sum -= points[i - window].value;
    if (i >= window - 1) out.push({ date: points[i].date, value: sum / window });
  }
  return out;
}

/** Brent minus WTI on dates both series actually printed. */
export function brentWtiSpread(brent: readonly HistoryPoint[], wti: readonly HistoryPoint[]): HistoryPoint[] {
  const wtiByDate = new Map(wti.map((point) => [point.date, point.value]));
  const out: HistoryPoint[] = [];
  for (const point of brent) {
    const other = wtiByDate.get(point.date);
    if (other == null) continue;
    out.push({ date: point.date, value: point.value - other });
  }
  return out;
}
