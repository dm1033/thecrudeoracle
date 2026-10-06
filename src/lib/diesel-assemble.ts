import {
  buildForecast,
  crack,
  daysOfCover,
  isoWeek,
  last,
  median,
  percentile,
  seasonalSample,
  windowYears,
  withBand,
  yearOf,
  type BandPoint,
  type Forecast,
  type ForecastInput,
  type Point,
} from "./diesel-model";

export interface RawSeries {
  id: string;
  title: string;
  sourceUrl: string;
  releaseDate: string | null;
  nextReleaseDate: string | null;
  points: [string, number][];
}

export interface DarkRow {
  id: string;
  label: string;
  reason: string;
}

export interface NewsItem {
  title: string;
  url: string;
  time: string;
  source: string;
}

export interface DieselCache {
  fetchedAt: string;
  fail: string | null;
  method: string;
  dark: DarkRow[];
  series: Record<string, RawSeries>;
  news: NewsItem[];
}

export interface ForecastFile {
  runAt: string;
  runAtUtc: string;
  runAtLondon: string;
  nextWindow: string;
  cacheFetchedAt: string;
  staleDays: number;
  pullFailed: boolean;
  sources: string[];
  input: ForecastInput;
  forecast: Forecast;
}

export interface PaddRow {
  id: string;
  name: string;
  stress: boolean;
  asOf: string | null;
  stocksMb: number | null;
  wowMb: number | null;
  yearAgoMb: number | null;
  yearAgoPeriod: string | null;
  sourceUrl: string | null;
}

export interface SulfurRow {
  id: string;
  label: string;
  thousand: number | null;
  mb: number | null;
  share: number | null;
}

export interface Quote {
  id: string;
  value: number;
  period: string;
  unit: string;
  sourceUrl: string;
}

export interface StockChartPoint {
  period: string;
  stocks: number;
  avg: number | null;
  low: number | null;
  high: number | null;
}

export interface CrackChartPoint {
  period: string;
  wti: number | null;
  brent: number | null;
}

export interface UtilPoint {
  period: string;
  utilization: number;
}

export interface FlowPoint {
  period: string;
  value: number;
}

export interface DieselView {
  fetchedAt: string;
  fail: string | null;
  asOf: string | null;
  releaseDate: string | null;
  nextReleaseDate: string | null;
  stocksMb: number | null;
  fiveYearAvgMb: number | null;
  belowFiveYear: boolean;
  wowMb: number | null;
  yearAgoMb: number | null;
  daysOfCover: number | null;
  coverMedian: number | null;
  stocksThousand: number | null;
  suppliedAvg4: number | null;
  productSupplied: number | null;
  exportsKb: number | null;
  productionKb: number | null;
  grossInputsKb: number | null;
  utilization: number | null;
  operableKb: number | null;
  yieldPct: number | null;
  padd1SeasonalLow: boolean;
  stocksDrawing: boolean;
  crackWti: number | null;
  crackBrent: number | null;
  crackAsOf: string | null;
  crackUsgcWti: number | null;
  nyh: Quote | null;
  usgc: Quote | null;
  wti: Quote | null;
  brent: Quote | null;
  retail: Quote | null;
  retailNext: string | null;
  spotsNext: string | null;
  padd: PaddRow[];
  subPadd: PaddRow[];
  sulfur: SulfurRow[];
  sulfurSumThousand: number | null;
  suppliedRecent: FlowPoint[];
  charts: {
    stocks: StockChartPoint[];
    crack1y: CrackChartPoint[];
    crack5y: CrackChartPoint[];
    utilization: UtilPoint[];
  };
  dark: DarkRow[];
  news: NewsItem[];
}

const CORE = [
  "WDISTUS1",
  "WDIUPUS2",
  "WDISTP11",
  "WPULEUS3",
  "WDIRPUS2",
  "WGIRIUS2",
  "EER_EPD2DXL0_PF4_Y35NY_DPG",
  "RWTC",
];

const PADDS: { id: string; name: string; stress: boolean }[] = [
  { id: "WDISTP11", name: "PADD 1 East Coast", stress: true },
  { id: "WDISTP21", name: "PADD 2 Midwest", stress: false },
  { id: "WDISTP31", name: "PADD 3 Gulf Coast", stress: false },
  { id: "WDISTP41", name: "PADD 4 Rocky Mountain", stress: false },
  { id: "WDISTP51", name: "PADD 5 West Coast", stress: false },
];

const SUB_PADDS: { id: string; name: string }[] = [
  { id: "WDIST1A1", name: "New England" },
  { id: "WDIST1B1", name: "Central Atlantic" },
  { id: "WDIST1C1", name: "Lower Atlantic" },
];

const SULFUR: { id: string; label: string }[] = [
  { id: "WD0ST_NUS_1", label: "15 ppm and under" },
  { id: "WD1ST_NUS_1", label: "Greater than 15 to 500 ppm" },
  { id: "WDGSTUS1", label: "Greater than 500 ppm" },
];

export function pointsOf(cache: DieselCache, id: string): Point[] {
  const series = cache.series[id];
  if (!series) return [];
  return series.points.map(([period, value]) => ({ period, value }));
}

export function addDays(period: string, days: number): string {
  return new Date(Date.parse(`${period}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}

export function valueOn(points: Point[], period: string, slackDays = 4): Point | null {
  const exact = points.find((point) => point.period === period);
  if (exact) return exact;
  const target = Date.parse(`${period}T00:00:00Z`);
  let best: Point | null = null;
  let bestAbs = Infinity;
  for (const point of points) {
    const delta = Math.abs(Date.parse(`${point.period}T00:00:00Z`) - target);
    if (delta < bestAbs) {
      bestAbs = delta;
      best = point;
    }
  }
  if (best && bestAbs <= slackDays * 86400000) return best;
  return null;
}

export function coverHistory(stocks: Point[], supplied: Point[]): Point[] {
  const index = new Map(supplied.map((point, i) => [point.period, i]));
  const out: Point[] = [];
  for (const stock of stocks) {
    const i = index.get(stock.period);
    if (i == null || i < 3) continue;
    const window = supplied.slice(i - 3, i + 1);
    const avg = window.reduce((sum, point) => sum + point.value, 0) / window.length;
    const cover = daysOfCover(stock.value, avg);
    if (cover != null) out.push({ period: stock.period, value: cover });
  }
  return out;
}

export function alignedCrack(product: Point[], crude: Point[]): Point[] {
  const map = new Map(crude.map((point) => [point.period, point.value]));
  const out: Point[] = [];
  for (const point of product) {
    const crudePx = map.get(point.period);
    if (crudePx == null) continue;
    out.push({ period: point.period, value: crack(point.value, crudePx) });
  }
  return out;
}

function ratioSeries(numerator: Point[], denominator: Point[]): Point[] {
  const map = new Map(denominator.map((point) => [point.period, point.value]));
  const out: Point[] = [];
  for (const point of numerator) {
    const den = map.get(point.period);
    if (den == null || !(den > 0)) continue;
    out.push({ period: point.period, value: point.value / den });
  }
  return out;
}

function withinYears(points: Point[], end: string, years: number): number[] {
  if (!end) return [];
  return windowYears(points, years, end).map((point) => point.value);
}

export function weeklyLast<T extends { period: string }>(rows: T[]): T[] {
  const map = new Map<string, T>();
  for (const row of rows) {
    map.set(`${yearOf(row.period)}-W${isoWeek(row.period)}`, row);
  }
  return Array.from(map.values()).sort((a, b) => a.period.localeCompare(b.period));
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function formatStamp(iso: string, zone: "UTC" | "London"): string {
  const timeZone = zone === "UTC" ? "UTC" : "Europe/London";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
  }).format(new Date(iso));
}

function quote(cache: DieselCache, id: string, unit: string): Quote | null {
  const series = cache.series[id];
  const point = last(pointsOf(cache, id));
  if (!series || !point) return null;
  return { id, value: point.value, period: point.period, unit, sourceUrl: series.sourceUrl };
}

function paddRow(cache: DieselCache, id: string, name: string, stress: boolean): PaddRow {
  const points = pointsOf(cache, id);
  const latest = last(points);
  const prev = points.length >= 2 ? points[points.length - 2] : undefined;
  const yearAgo = latest ? valueOn(points, addDays(latest.period, -364)) : null;
  return {
    id,
    name,
    stress,
    asOf: latest?.period ?? null,
    stocksMb: latest ? latest.value / 1000 : null,
    wowMb: latest && prev ? (latest.value - prev.value) / 1000 : null,
    yearAgoMb: yearAgo ? yearAgo.value / 1000 : null,
    yearAgoPeriod: yearAgo?.period ?? null,
    sourceUrl: cache.series[id]?.sourceUrl ?? null,
  };
}

interface DeskMath {
  asOf: string;
  stocks: Point[];
  band: BandPoint[];
  covers: Point[];
  coverNow: number | null;
  coverMedian: number | null;
  suppliedAvg4: number | null;
  fiveYearAvgMb: number | null;
  padd1SeasonalLow: boolean;
  stocksDrawing: boolean;
  utilization: number | null;
  yieldLatest: number | null;
  yieldPrior: number | null;
  cracksWti: Point[];
  cracksBrent: Point[];
  crackNow: number | null;
  crackAsOf: string | null;
  crackMedian: number | null;
  crackP90: number | null;
  release: string | null;
}

function deskMath(cache: DieselCache): DeskMath {
  const stocks = pointsOf(cache, "WDISTUS1");
  const supplied = pointsOf(cache, "WDIUPUS2");
  const padd1 = pointsOf(cache, "WDISTP11");
  const util = pointsOf(cache, "WPULEUS3");
  const yields = ratioSeries(pointsOf(cache, "WDIRPUS2"), pointsOf(cache, "WGIRIUS2"));
  const cracksWti = alignedCrack(pointsOf(cache, "EER_EPD2DXL0_PF4_Y35NY_DPG"), pointsOf(cache, "RWTC"));
  const cracksBrent = alignedCrack(pointsOf(cache, "EER_EPD2DXL0_PF4_Y35NY_DPG"), pointsOf(cache, "RBRTE"));
  const latest = last(stocks);
  const asOf = latest?.period ?? "";
  const band = withBand(stocks);
  const bandLast = last(band);
  const covers = coverHistory(stocks, supplied);
  const coverPoint = last(covers);
  const coverNow = coverPoint && coverPoint.period === asOf ? coverPoint.value : null;
  const suppliedIndex = new Map(supplied.map((point, i) => [point.period, i]));
  const suppliedAt = asOf ? suppliedIndex.get(asOf) : undefined;
  const suppliedAvg4 =
    suppliedAt != null && suppliedAt >= 3
      ? supplied.slice(suppliedAt - 3, suppliedAt + 1).reduce((sum, point) => sum + point.value, 0) / 4
      : null;
  const sample = asOf ? seasonalSample(padd1, asOf) : [];
  const padd1Now = last(padd1);
  const crackPoint = last(cracksWti);
  const crackWindow = crackPoint ? withinYears(cracksWti, crackPoint.period, 1) : [];
  const prev = stocks.length >= 2 ? stocks[stocks.length - 2] : undefined;
  return {
    asOf,
    stocks,
    band,
    covers,
    coverNow,
    coverMedian: asOf ? median(withinYears(covers, asOf, 3)) : null,
    suppliedAvg4,
    fiveYearAvgMb: bandLast?.avg != null ? bandLast.avg / 1000 : null,
    padd1SeasonalLow: sample.length >= 3 && padd1Now != null && padd1Now.value <= Math.min(...sample),
    stocksDrawing: latest != null && prev != null && latest.value < prev.value,
    utilization: last(util)?.value ?? null,
    yieldLatest: last(yields)?.value ?? null,
    yieldPrior: yields.length >= 5 ? yields[yields.length - 5].value : null,
    cracksWti,
    cracksBrent,
    crackNow: crackPoint?.value ?? null,
    crackAsOf: crackPoint?.period ?? null,
    crackMedian: median(crackWindow),
    crackP90: percentile(crackWindow, 90),
    release: cache.series.WDISTUS1?.releaseDate ?? null,
  };
}

function staleDays(release: string | null, runAt: string): number {
  if (!release) return 99;
  const runDay = Date.parse(`${runAt.slice(0, 10)}T00:00:00Z`);
  const releaseDay = Date.parse(`${release}T00:00:00Z`);
  return Math.round((runDay - releaseDay) / 86400000);
}

export function assembleForecast(cache: DieselCache, runAt: string): ForecastFile {
  const math = deskMath(cache);
  const latest = last(math.stocks);
  const stocksMb = latest ? latest.value / 1000 : 0;
  const missing = CORE.some((id) => pointsOf(cache, id).length === 0);
  const pullFailed = Boolean(cache.fail) || missing;
  const input: ForecastInput = {
    asOf: math.asOf,
    stocksMb,
    fiveYearAvgMb: math.fiveYearAvgMb,
    belowBand: math.fiveYearAvgMb != null && stocksMb < math.fiveYearAvgMb,
    daysOfCover: math.coverNow,
    coverMedian: math.coverMedian,
    padd1SeasonalLow: math.padd1SeasonalLow,
    utilization: math.utilization,
    yieldLatest: math.yieldLatest,
    yieldPrior: math.yieldPrior,
    crack: math.crackNow,
    crackMedian: math.crackMedian,
    crackP90: math.crackP90,
    stocksDrawing: math.stocksDrawing,
    wpsrRelease: math.release,
    runAt,
    staleDays: staleDays(math.release, runAt),
    pullFailed,
  };
  return {
    runAt,
    runAtUtc: formatStamp(runAt, "UTC"),
    runAtLondon: formatStamp(runAt, "London"),
    nextWindow: "Wednesday 10:30 ET",
    cacheFetchedAt: cache.fetchedAt,
    staleDays: input.staleDays,
    pullFailed,
    sources: [
      "WDISTUS1",
      "WDIUPUS2",
      "WDISTP11",
      "WPULEUS3",
      "WDIRPUS2",
      "WGIRIUS2",
      "EER_EPD2DXL0_PF4_Y35NY_DPG",
      "RWTC",
    ],
    input,
    forecast: buildForecast(input),
  };
}

function mergeCracks(wti: Point[], brent: Point[]): CrackChartPoint[] {
  const brentMap = new Map(brent.map((point) => [point.period, point.value]));
  return wti.map((point) => ({
    period: point.period,
    wti: round(point.value, 2),
    brent: brentMap.has(point.period) ? round(brentMap.get(point.period) as number, 2) : null,
  }));
}

export function buildDieselView(cache: DieselCache): DieselView {
  const math = deskMath(cache);
  const latest = last(math.stocks);
  const stocksMb = latest ? latest.value / 1000 : null;
  const prev = math.stocks.length >= 2 ? math.stocks[math.stocks.length - 2] : undefined;
  const yearAgo = math.asOf ? valueOn(math.stocks, addDays(math.asOf, -364)) : null;
  const usgcCrack = last(alignedCrack(pointsOf(cache, "EER_EPD2DXL0_PF4_RGC_DPG"), pointsOf(cache, "RWTC")));
  const brentCrack = last(math.cracksBrent);
  const supplied = pointsOf(cache, "WDIUPUS2");
  const exports = pointsOf(cache, "WDIEXUS2");
  const production = pointsOf(cache, "WDIRPUS2");
  const inputs = pointsOf(cache, "WGIRIUS2");
  const operable = pointsOf(cache, "WOCLEUS2");
  const sulfurRaw = SULFUR.map((row) => {
    const point = last(pointsOf(cache, row.id));
    return { ...row, thousand: point?.value ?? null };
  });
  const sulfurSum = sulfurRaw.every((row) => row.thousand != null)
    ? sulfurRaw.reduce((sum, row) => sum + (row.thousand as number), 0)
    : null;
  const stockChart: StockChartPoint[] = (math.asOf ? windowYears(math.band, 5, math.asOf) : []).map((point) => ({
    period: point.period,
    stocks: round(point.value / 1000, 3),
    avg: point.avg == null ? null : round(point.avg / 1000, 3),
    low: point.low == null ? null : round(point.low / 1000, 3),
    high: point.high == null ? null : round(point.high / 1000, 3),
  }));
  const crackEnd = math.crackAsOf ?? "";
  const crack5yDaily = crackEnd ? mergeCracks(windowYears(math.cracksWti, 5, crackEnd), windowYears(math.cracksBrent, 5, crackEnd)) : [];
  const crack1y = crackEnd ? mergeCracks(windowYears(math.cracksWti, 1, crackEnd), windowYears(math.cracksBrent, 1, crackEnd)) : [];
  const utilPoints = math.asOf ? windowYears(pointsOf(cache, "WPULEUS3"), 1, math.asOf) : [];
  return {
    fetchedAt: cache.fetchedAt,
    fail: cache.fail,
    asOf: math.asOf || null,
    releaseDate: math.release,
    nextReleaseDate: cache.series.WDISTUS1?.nextReleaseDate ?? null,
    stocksMb,
    fiveYearAvgMb: math.fiveYearAvgMb,
    belowFiveYear: math.fiveYearAvgMb != null && stocksMb != null && stocksMb < math.fiveYearAvgMb,
    wowMb: latest && prev ? (latest.value - prev.value) / 1000 : null,
    yearAgoMb: yearAgo ? yearAgo.value / 1000 : null,
    daysOfCover: math.coverNow,
    coverMedian: math.coverMedian,
    stocksThousand: latest?.value ?? null,
    suppliedAvg4: math.suppliedAvg4,
    productSupplied: last(supplied)?.value ?? null,
    exportsKb: last(exports)?.value ?? null,
    productionKb: last(production)?.value ?? null,
    grossInputsKb: last(inputs)?.value ?? null,
    utilization: math.utilization,
    operableKb: last(operable)?.value ?? null,
    yieldPct: math.yieldLatest == null ? null : math.yieldLatest * 100,
    padd1SeasonalLow: math.padd1SeasonalLow,
    stocksDrawing: math.stocksDrawing,
    crackWti: math.crackNow,
    crackBrent: brentCrack?.value ?? null,
    crackAsOf: math.crackAsOf,
    crackUsgcWti: usgcCrack?.value ?? null,
    nyh: quote(cache, "EER_EPD2DXL0_PF4_Y35NY_DPG", "$/gal"),
    usgc: quote(cache, "EER_EPD2DXL0_PF4_RGC_DPG", "$/gal"),
    wti: quote(cache, "RWTC", "$/bbl"),
    brent: quote(cache, "RBRTE", "$/bbl"),
    retail: quote(cache, "EMD_EPD2D_PTE_NUS_DPG", "$/gal"),
    retailNext: cache.series.EMD_EPD2D_PTE_NUS_DPG?.nextReleaseDate ?? null,
    spotsNext: cache.series.EER_EPD2DXL0_PF4_Y35NY_DPG?.nextReleaseDate ?? null,
    padd: PADDS.map((row) => paddRow(cache, row.id, row.name, row.stress)),
    subPadd: SUB_PADDS.map((row) => paddRow(cache, row.id, row.name, false)),
    sulfur: sulfurRaw.map((row) => ({
      id: row.id,
      label: row.label,
      thousand: row.thousand,
      mb: row.thousand == null ? null : row.thousand / 1000,
      share: row.thousand != null && sulfurSum ? row.thousand / sulfurSum : null,
    })),
    sulfurSumThousand: sulfurSum,
    suppliedRecent: supplied.slice(-8).map((point) => ({ period: point.period, value: point.value })),
    charts: {
      stocks: stockChart,
      crack1y,
      crack5y: weeklyLast(crack5yDaily),
      utilization: utilPoints.map((point) => ({ period: point.period, utilization: point.value })),
    },
    dark: cache.dark,
    news: cache.news,
  };
}
