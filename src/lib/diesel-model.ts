/**
 * Diesel desk model. Every number is computed from cached EIA prints.
 * The rule is disclosed on the page. It is a model, not a prophecy.
 */

export interface Point {
  period: string;
  value: number;
}

export interface BandPoint extends Point {
  avg: number | null;
  low: number | null;
  high: number | null;
}

export type Bias = "Tight" | "Balanced" | "Loose";
export type CrackBias = "supported" | "fading" | "two-way";
export type Confidence = "low" | "standard";

export interface ForecastInput {
  asOf: string;
  stocksMb: number;
  fiveYearAvgMb: number | null;
  belowBand: boolean;
  daysOfCover: number | null;
  coverMedian: number | null;
  padd1SeasonalLow: boolean;
  utilization: number | null;
  yieldLatest: number | null;
  yieldPrior: number | null;
  crack: number | null;
  crackMedian: number | null;
  crackP90: number | null;
  stocksDrawing: boolean;
  wpsrRelease: string | null;
  runAt: string;
  staleDays: number;
  pullFailed: boolean;
}

export interface Forecast {
  bias: Bias;
  crackBias: CrackBias;
  confidence: Confidence;
  rule: string;
  flip: string;
  supply: string;
  demand: string;
  refining: string;
  line: string;
}

export function isoWeek(period: string): number {
  const date = new Date(`${period}T00:00:00Z`);
  const target = new Date(date);
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function yearOf(period: string): number {
  return Number(period.slice(0, 4));
}

/** Prior five calendar years, same ISO week. Current year is excluded. */
export function seasonalSample(points: Point[], period: string): number[] {
  const week = isoWeek(period);
  const year = yearOf(period);
  const out: number[] = [];
  for (const point of points) {
    const y = yearOf(point.period);
    if (y >= year - 5 && y <= year - 1 && isoWeek(point.period) === week) {
      out.push(point.value);
    }
  }
  return out;
}

export function withBand(points: Point[]): BandPoint[] {
  return points.map((point) => {
    const sample = seasonalSample(points, point.period);
    if (sample.length < 3) {
      return { ...point, avg: null, low: null, high: null };
    }
    const avg = sample.reduce((sum, n) => sum + n, 0) / sample.length;
    return { ...point, avg, low: Math.min(...sample), high: Math.max(...sample) };
  });
}

export function daysOfCover(stocksThousandBarrels: number, productSuppliedKbPerDay: number): number | null {
  if (!(productSuppliedKbPerDay > 0)) return null;
  return stocksThousandBarrels / productSuppliedKbPerDay;
}

export function trailingAverage(values: number[], n: number): number | null {
  if (values.length < n) return null;
  const slice = values.slice(-n);
  return slice.reduce((sum, v) => sum + v, 0) / n;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export function crack(ulsdDollarsPerGallon: number, crudeDollarsPerBarrel: number): number {
  return ulsdDollarsPerGallon * 42 - crudeDollarsPerBarrel;
}

export function gasoilCrack(gasoilDollarsPerTonne: number, brentDollarsPerBarrel: number): number {
  return gasoilDollarsPerTonne / 7.45 - brentDollarsPerBarrel;
}

export function buildForecast(input: ForecastInput): Forecast {
  const belowAvg = input.fiveYearAvgMb != null && input.stocksMb < input.fiveYearAvgMb;
  const coverTight = input.daysOfCover != null && input.coverMedian != null && input.daysOfCover < input.coverMedian;
  const yieldNotRising =
    input.yieldLatest != null && input.yieldPrior != null && input.yieldLatest <= input.yieldPrior;
  const utilHigh = input.utilization != null && input.utilization > 90;

  let bias: Bias = "Balanced";
  let rule = "Balanced. The tight rule and the loose rule both missed.";
  if (belowAvg && (coverTight || input.padd1SeasonalLow)) {
    bias = "Tight";
    rule = coverTight
      ? "Tight. Stocks are under the five-year average for this week and days of cover are under the trailing three-year median."
      : "Tight. Stocks are under the five-year average for this week and PADD 1 is at a seasonal low.";
  } else if (!belowAvg && input.daysOfCover != null && input.coverMedian != null && input.daysOfCover > input.coverMedian && utilHigh && yieldNotRising) {
    bias = "Loose";
    rule = "Loose. Stocks are above the five-year average, days of cover are above the median, and utilization is above 90% without the distillate yield rising.";
  }

  const crackElevated = input.crack != null && input.crackP90 != null && input.crack >= input.crackP90;
  const crackCheap = input.crack != null && input.crackMedian != null && input.crack < input.crackMedian;
  let crackBias: CrackBias = "two-way";
  if (bias === "Loose" || (bias === "Tight" && crackElevated)) crackBias = "fading";
  else if (bias === "Tight" && (crackCheap || input.stocksDrawing)) crackBias = "supported";

  const confidence: Confidence = input.pullFailed || input.staleDays > 8 ? "low" : "standard";

  const stocks = input.stocksMb.toFixed(1);
  const avg = input.fiveYearAvgMb == null ? "TBC" : input.fiveYearAvgMb.toFixed(1);
  const cover = input.daysOfCover == null ? "TBC" : input.daysOfCover.toFixed(1);
  const crackText = input.crack == null ? "TBC" : input.crack.toFixed(1);

  const supply = input.asOf
    ? `US distillate stocks ${stocks} mb for the week ending ${input.asOf}. Five-year average for this week ${avg} mb. Source WDISTUS1.`
    : "US distillate stocks TBC. WDISTUS1 did not print.";
  const demand = `Days of cover ${cover}. Ending stocks divided by the trailing four-week average of product supplied (WDIUPUS2). Product supplied is a proxy, not metered end-use.`;
  const refining =
    input.utilization == null
      ? "Refinery utilization TBC. Series WPULEUS3 did not print."
      : `Utilization ${input.utilization.toFixed(1)}% (WPULEUS3). Distillate yield ${
          input.yieldLatest == null ? "TBC" : `${(input.yieldLatest * 100).toFixed(1)}%`
        }, production over gross inputs.`;

  const flip =
    bias === "Tight"
      ? "Flips if the next WPSR rebuilds stocks back through the five-year average, or days of cover rise through the median."
      : bias === "Loose"
        ? "Flips if stocks drop back under the five-year average or utilization falls through 90%."
        : "Flips to tight if stocks are under the five-year average and cover breaks the median. Flips to loose if stocks, cover and a high, unresponsive utilization all line up.";

  const line = `${bias}. Stocks ${stocks} mb, ${belowAvg ? "under" : "not under"} the five-year for this week. Days of cover ${cover}. Crack ${crackText} $/bbl, bias ${crackBias}. ${input.padd1SeasonalLow ? "PADD 1 is the stress book." : "PADD 1 is not at a seasonal low."} ${flip} Model, not a ticket.`;

  return { bias, crackBias, confidence, rule, flip, supply, demand, refining, line };
}

export function last<T>(rows: T[]): T | undefined {
  return rows.length ? rows[rows.length - 1] : undefined;
}

export function windowYears<T extends Point>(points: T[], years: number, end: string): T[] {
  const endMs = Date.parse(`${end}T00:00:00Z`);
  const start = endMs - years * 365.25 * 86400000;
  return points.filter((p) => Date.parse(`${p.period}T00:00:00Z`) >= start);
}
