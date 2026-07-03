import marketPricesJson from "../../data/market-prices.json";
import dashboardSignalsJson from "../../data/dashboard-signals.json";
import dailyBriefingJson from "../../data/daily-briefing.json";
import watchlistJson from "../../data/investment-watchlist.json";
import companyIntelJson from "../../data/company-intelligence.json";
import chartDataJson from "../../data/chart-data.json";
import researchJson from "../../data/research-library.json";

export type DataType = "live" | "delayed" | "manual" | "API placeholder";
export type Trend = "up" | "down" | "flat" | "mixed";
export type Signal = "bullish" | "bearish" | "neutral" | "risk";

export interface MarketPrice {
  asset: string;
  ticker: string;
  price: number;
  currency: string;
  daily_change: number;
  weekly_change: number;
  monthly_change: number;
  trend: string;
  source: string;
  source_url: string;
  last_updated: string;
  data_type: string;
}

export interface SignalCard {
  id: string;
  label: string;
  value: string;
  signal: string;
  detail: string;
  source: string;
  source_url: string;
  last_updated: string;
  data_type: string;
}

export interface BottomLine {
  what_moved: string;
  why_it_moved: string;
  what_matters_next: string;
  biggest_risk: string;
  biggest_opportunity: string;
  watch_tomorrow: string;
  last_updated: string;
  source: string;
  data_type: string;
}

export interface Briefing {
  date: string;
  status: string;
  headline: string;
  oil_summary: string;
  gas_summary: string;
  supply_risk: string;
  demand_signal: string;
  opec_note: string;
  inventory_signal: string;
  geopolitical_risk: string;
  equities_to_watch: string;
  uk_energy_note: string;
  one_chart: string;
  bottom_line: string;
  sources: { name: string; url: string }[];
  last_updated: string;
}

export interface WatchlistCompany {
  company: string;
  ticker: string;
  exchange: string;
  country: string;
  sector: string;
  category: string;
  market_cap: string;
  dividend_yield: string;
  debt_note: string;
  commodity_exposure: string;
  investment_theme: string;
  catalyst: string;
  risk: string;
  status: string;
  source: string;
  source_url: string;
  last_updated: string;
}

export interface CompanyIntel {
  company: string;
  ticker: string;
  exchange: string;
  country: string;
  description: string;
  production_exposure: string;
  reserves_note: string;
  financial_health_note: string;
  valuation_note: string;
  management_note: string;
  catalyst: string;
  risk: string;
  latest_update: string;
  sources: { name: string; url: string }[];
  last_updated: string;
}

export interface ResearchNote {
  id: string;
  title: string;
  category: string;
  access: string;
  summary: string;
  date: string;
  reading_time: string;
  sources: string[];
  status: string;
}

export const marketPrices: MarketPrice[] = marketPricesJson.prices;
export const marketPricesMeta = marketPricesJson.meta;

export const supplySignals: SignalCard[] = dashboardSignalsJson.supply;
export const demandSignals: SignalCard[] = dashboardSignalsJson.demand;
export const riskSignals: SignalCard[] = dashboardSignalsJson.risk;
export const bottomLine: BottomLine = dashboardSignalsJson.bottom_line;

export const briefings: Briefing[] = dailyBriefingJson.briefings;
export const latestBriefing: Briefing = dailyBriefingJson.briefings[0];

export const watchlistCategories: string[] = watchlistJson.categories;
export const watchlistCompanies: WatchlistCompany[] = watchlistJson.companies;

export const companyIntel: CompanyIntel[] = companyIntelJson.companies;

export const chartData = chartDataJson;

export const researchNotes: ResearchNote[] = researchJson.notes;

export function getPrice(ticker: string): MarketPrice | undefined {
  return marketPrices.find((p) => p.ticker === ticker);
}

export function formatUpdated(iso: string): string {
  // Render ISO timestamps as a readable UTC stamp without pulling in a date lib.
  if (!iso.includes("T")) return iso;
  const [date, time] = iso.split("T");
  return `${date} ${time.slice(0, 5)} UTC`;
}
