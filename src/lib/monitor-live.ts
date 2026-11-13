import {
  EIA_SERIES,
  buildEiaDataUrl,
  fetchWithRetry,
  getDailySpotSeries,
  parseEiaResponse,
  readEiaApiKey,
  redactApiKey,
  type EiaObservation,
  type EiaSeriesDef,
} from "@/lib/eia";
import { getMonitorFeed, type MonitorFeed, type MonitorModule } from "@/lib/oracle-intelligence";

/**
 * Fills the monitor's EIA cards from the site's own EIA connection when the
 * scheduled file has no EIA data. The numbers are computed exactly as
 * scripts/build_oracle_intelligence.py computes them, from the same series,
 * and under the same rule: a figure that cannot be computed from fetched
 * observations is left out. Nothing is estimated.
 */

const SOURCE_PRICES = "U.S. Energy Information Administration, Open Data API v2";
const SOURCE_STOCKS = "EIA Weekly Petroleum Status Report";

/** New York Harbor spot products, in $/gal. Used only for the 3-2-1 crack. */
const PRODUCT = (key: string, seriesId: string, description: string): EiaSeriesDef => ({
  key,
  route: "petroleum/pri/spt",
  seriesId,
  frequency: "daily",
  description,
  expectedUnits: "$/GAL",
  outputUnit: "USD/gal",
  sourcePageUrl: "https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm",
  confidence: "medium",
  verificationNote: "Series id not yet confirmed against a live response; the crack is omitted if it does not load.",
});
const NYH_GASOLINE = PRODUCT("NYH_GASOLINE_SPOT", "EER_EPMRU_PF4_Y35NY_DPG", "New York Harbor conventional gasoline regular spot");
const NYH_DIESEL = PRODUCT("NYH_ULSD_SPOT", "EER_EPD2DXL0_PF4_Y35NY_DPG", "New York Harbor ultra-low sulfur No 2 diesel spot");

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function sampleStd(values: number[]): number {
  const m = mean(values);
  return Math.sqrt(values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1));
}

function note(what: string, error: unknown): void {
  console.warn(`[monitor] ${what}: ${redactApiKey(error instanceof Error ? error.message : String(error))}`);
}

export function pricesFromObservations(input: {
  brent: EiaObservation[];
  wti: EiaObservation[];
  hub?: EiaObservation[];
  gasoline?: EiaObservation[];
  diesel?: EiaObservation[];
}): { asOf: string; values: Record<string, unknown> } | null {
  const brent = input.brent[0];
  const wti = input.wti[0];
  if (!brent || !wti) return null;
  const values: Record<string, unknown> = {
    brent_usd_bbl: round(brent.value, 2),
    brent_date: brent.date,
    wti_usd_bbl: round(wti.value, 2),
    wti_date: wti.date,
  };
  // A spread only means something when both prints are for the same day.
  if (brent.date === wti.date) values.brent_wti_spread_usd_bbl = round(brent.value - wti.value, 2);

  const closes = input.wti.map((o) => o.value);
  if (closes.length >= 50) values.wti_50d_average_usd_bbl = round(mean(closes.slice(0, 50)), 2);
  if (closes.length >= 200) values.wti_200d_average_usd_bbl = round(mean(closes.slice(0, 200)), 2);
  if (closes.length >= 31) {
    const moves = Array.from({ length: 30 }, (_, i) => Math.abs(closes[i] - closes[i + 1]));
    values.wti_30d_average_daily_move_usd_bbl = round(mean(moves), 2);
  }

  const hub = input.hub?.[0];
  if (hub) {
    values.henry_hub_usd_mmbtu = round(hub.value, 2);
    values.henry_hub_date = hub.date;
  }

  const gasoline = input.gasoline?.[0];
  const diesel = input.diesel?.[0];
  if (gasoline && diesel && gasoline.date === wti.date && diesel.date === wti.date) {
    values.crack_321_usd_bbl = round((2 * gasoline.value * 42 + diesel.value * 42 - 3 * wti.value) / 3, 2);
    values.crack_321_date = wti.date;
  }
  return { asOf: brent.date > wti.date ? brent.date : wti.date, values };
}

/** `observations` are newest first, already in million barrels. */
export function stockBlock(observations: EiaObservation[]): Record<string, unknown> | null {
  const latest = observations[0];
  if (!latest) return null;
  const block: Record<string, unknown> = { week_ending: latest.date, million_barrels: round(latest.value, 3) };
  const previous = observations[1];
  if (previous) {
    block.change_million_barrels = round(latest.value - previous.value, 3);
    block.previous_week_ending = previous.date;
  }
  const history = observations.slice(0, 52).map((o) => o.value);
  if (history.length >= 26) {
    const spread = sampleStd(history);
    block.weeks_in_comparison = history.length;
    block.average_million_barrels = round(mean(history), 3);
    if (spread > 0) block.z_score = round((latest.value - mean(history)) / spread, 2);
  }
  return block;
}

async function weeklyHistory(seriesDef: EiaSeriesDef): Promise<EiaObservation[]> {
  const json = await fetchWithRetry(buildEiaDataUrl(seriesDef, { length: 60 }));
  return parseEiaResponse(json, seriesDef);
}

async function optional<T>(what: string, run: () => Promise<T>): Promise<T | undefined> {
  try {
    return await run();
  } catch (error) {
    note(`${what} left out`, error);
    return undefined;
  }
}

async function livePrices(fetchedUtc: string): Promise<MonitorModule | null> {
  const [brent, wti, hub, gasoline, diesel] = await Promise.all([
    getDailySpotSeries(EIA_SERIES.BRENT_SPOT, { length: 260 }),
    getDailySpotSeries(EIA_SERIES.WTI_SPOT, { length: 260 }),
    optional("Henry Hub", () => getDailySpotSeries(EIA_SERIES.HENRY_HUB_SPOT, { length: 10 })),
    optional("NY Harbor gasoline", () => getDailySpotSeries(NYH_GASOLINE, { length: 10 })),
    optional("NY Harbor diesel", () => getDailySpotSeries(NYH_DIESEL, { length: 10 })),
  ]);
  const built = pricesFromObservations({
    brent: brent.observations,
    wti: wti.observations,
    hub: hub?.observations,
    gasoline: gasoline?.observations,
    diesel: diesel?.observations,
  });
  if (!built) return null;
  return {
    status: "ok",
    asOf: built.asOf,
    fetchedUtc,
    sourceName: SOURCE_PRICES,
    sourceUrl: "https://www.eia.gov/opendata/",
    values: built.values,
  };
}

async function liveInventories(fetchedUtc: string): Promise<MonitorModule | null> {
  const crude = stockBlock(await weeklyHistory(EIA_SERIES.US_COMMERCIAL_CRUDE_STOCKS));
  if (!crude) return null;
  const values: Record<string, unknown> = { us_commercial_crude: crude };
  const cushing = await optional("Cushing", () => weeklyHistory(EIA_SERIES.CUSHING_CRUDE_STOCKS));
  const cushingBlock = cushing ? stockBlock(cushing) : null;
  if (cushingBlock) values.cushing = cushingBlock;
  return {
    status: "ok",
    asOf: String(crude.week_ending),
    fetchedUtc,
    sourceName: SOURCE_STOCKS,
    sourceUrl: "https://www.eia.gov/petroleum/supply/weekly/",
    values,
  };
}

/**
 * The feed the page renders: the scheduled file, with each EIA module that
 * has not loaded there replaced by a live read when the site has an EIA key.
 */
export async function getMonitorFeedWithLiveEia(): Promise<MonitorFeed> {
  const feed = getMonitorFeed();
  if ((feed.prices.status === "ok" && feed.inventories.status === "ok") || !readEiaApiKey()) return feed;
  const fetchedUtc = new Date().toISOString();
  const [prices, inventories] = await Promise.all([
    feed.prices.status === "ok" ? null : optional("prices", () => livePrices(fetchedUtc)),
    feed.inventories.status === "ok" ? null : optional("inventories", () => liveInventories(fetchedUtc)),
  ]);
  return {
    ...feed,
    prices: prices ?? feed.prices,
    inventories: inventories ?? feed.inventories,
  };
}
