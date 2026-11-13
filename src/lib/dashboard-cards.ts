import { num, type MonitorFeed } from "@/lib/oracle-intelligence";
import { getMonitorFeedWithLiveEia } from "@/lib/monitor-live";
import { formatSteoMonth, getSteoFeed, type SteoFeed, type SteoRow } from "@/lib/steo";
import { SIZE_LABEL, whatChanged, type ChangeItem } from "@/lib/what-changed";

/**
 * Supply, demand and context cards for the dashboard, home page and the OPEC
 * page. Every card is built from a public feed the site already reads (EIA
 * weekly stocks, the EIA Short-Term Energy Outlook, CFTC, the Federal Reserve
 * via FRED, GDELT). A card whose feed did not load is not produced: there is
 * no stored fallback text and no bullish/bearish label.
 */

export interface DataCard {
  id: string;
  label: string;
  /** The headline figure with its unit. */
  value: string;
  /** What the figure is and how it compares. Facts only. */
  detail: string;
  sourceName: string;
  sourceUrl: string | null;
  /** ISO date or timestamp of the figure itself. */
  asOf: string;
  dataType: "delayed";
  staleAfterHours: number;
  /** Page on this site with more. */
  href: string;
}

export interface DashboardCards {
  supply: DataCard[];
  demand: DataCard[];
  context: DataCard[];
}

const STEO_URL = "https://www.eia.gov/outlooks/steo/";
const WEEKLY_STALE = 24 * 10;
const DAILY_STALE = 24 * 12;
const MONTHLY_STALE = 24 * 75;

function amount(value: number): string {
  const digits = Math.abs(value) >= 1000 ? 0 : Math.abs(value) >= 100 ? 1 : 2;
  return value.toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function signed(value: number): string {
  const text = amount(Math.abs(value));
  return value > 0 ? `+${text}` : value < 0 ? `−${text}` : text;
}

function fromChange(item: ChangeItem, staleAfterHours: number): DataCard {
  const size = item.size === "unknown" ? "" : ` ${SIZE_LABEL[item.size]} for this series.`;
  return {
    id: item.id,
    label: item.label,
    value: item.level,
    detail: `Change on the previous ${item.cadence === "weekly" ? "report" : "day"}: ${item.change}.${size}`,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    asOf: item.asOf,
    dataType: "delayed",
    staleAfterHours,
    href: item.href,
  };
}

function fromSteo(row: SteoRow): DataCard {
  const year =
    row.yearAgo && row.changeOnYear != null
      ? ` A year earlier: ${amount(row.yearAgo.value)} (${signed(row.changeOnYear)}).`
      : "";
  const forecast = row.forecast ? ` EIA forecast for ${formatSteoMonth(row.forecast.period)}: ${amount(row.forecast.value)}.` : "";
  return {
    id: `steo-${row.id.toLowerCase()}`,
    label: row.description,
    value: `${amount(row.latest.value)} ${row.unit}`,
    detail: `EIA estimate for ${formatSteoMonth(row.latest.period)}.${year}${forecast}`,
    sourceName: "EIA Short-Term Energy Outlook",
    sourceUrl: STEO_URL,
    asOf: `${row.latest.period}-01T00:00:00Z`,
    dataType: "delayed",
    staleAfterHours: MONTHLY_STALE,
    href: "/tools/balance-engine",
  };
}

function newsCard(feed: MonitorFeed): DataCard | null {
  const news = feed.news;
  if (news.status !== "ok") return null;
  const share = num(news.values, "share_last_24h_vs_7d_average");
  if (share == null) return null;
  const terms = Array.isArray(news.values.search_terms)
    ? news.values.search_terms.filter((term): term is string => typeof term === "string")
    : [];
  const about = terms.length ? ` Search terms: ${terms.join(", ")}.` : "";
  return {
    id: "supply-news",
    label: "Oil supply-route news coverage",
    value: `${share.toFixed(2)}× its 7-day average`,
    detail: `Share of worldwide online news matching the search terms over the last 24 hours, against the same share over the last seven days. It counts coverage. It is not a measure of risk.${about}`,
    sourceName: news.sourceName,
    sourceUrl: news.sourceUrl,
    asOf: news.asOf,
    dataType: "delayed",
    staleAfterHours: 72,
    href: "/tools/public-data-monitor",
  };
}

function crackCard(feed: MonitorFeed): DataCard | null {
  const prices = feed.prices;
  if (prices.status !== "ok") return null;
  const crack = num(prices.values, "crack_321_usd_bbl");
  const date = typeof prices.values.crack_321_date === "string" ? prices.values.crack_321_date : null;
  if (crack == null || !date) return null;
  return {
    id: "crack-321",
    label: "3-2-1 crack against WTI",
    value: `$${crack.toFixed(2)}/bbl`,
    detail:
      "Two barrels of New York Harbor gasoline plus one of diesel, divided by three, minus WTI spot, same day. A rough guide to the pull on crude from refiners, not any refinery's actual margin.",
    sourceName: prices.sourceName,
    sourceUrl: prices.sourceUrl,
    asOf: date,
    dataType: "delayed",
    staleAfterHours: DAILY_STALE,
    href: "/tools/curve-monitor",
  };
}

/** Pure: builds the cards from feeds already read. */
export function buildDashboardCards(feed: MonitorFeed, steo: SteoFeed | null): DashboardCards {
  const changes = whatChanged(feed);
  const change = (id: string, stale: number) => {
    const item = changes.find((entry) => entry.id === id);
    return item ? [fromChange(item, stale)] : [];
  };
  const steoCards = (ids: string[]) =>
    ids.flatMap((id) => {
      const row = steo?.rows.find((entry) => entry.id === id);
      return row ? [fromSteo(row)] : [];
    });
  const present = (card: DataCard | null) => (card ? [card] : []);

  return {
    supply: [
      ...change("us-crude", WEEKLY_STALE),
      ...change("cushing", WEEKLY_STALE),
      ...steoCards(["COPR_OPEC", "COPS_OPEC", "COPRPUS", "PAPR_WORLD"]),
    ],
    demand: [...steoCards(["PATC_WORLD", "PATC_OECD", "PATC_NON_OECD"]), ...present(crackCard(feed))],
    context: [
      ...present(newsCard(feed)),
      ...change("wti-positioning", WEEKLY_STALE + 24 * 4),
      ...change("dollar", DAILY_STALE),
      ...change("real-yield", DAILY_STALE),
    ],
  };
}

/** Reads the feeds and builds the cards. Never throws; sections can be empty. */
export async function getDashboardCards(): Promise<DashboardCards> {
  const [feed, steo] = await Promise.all([getMonitorFeedWithLiveEia(), getSteoFeed()]);
  return buildDashboardCards(feed, steo);
}

/** Up to `count` cards for a preview, in the order of `ids`, skipping any that did not load. */
export function pickCards(cards: DashboardCards, ids: string[], count: number): DataCard[] {
  const all = [...cards.supply, ...cards.demand, ...cards.context];
  return ids.flatMap((id) => all.filter((card) => card.id === id)).slice(0, count);
}
