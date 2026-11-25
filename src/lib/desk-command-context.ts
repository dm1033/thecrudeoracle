import { resolveDeskCommand, type DeskCommandResult } from "@/lib/desk-bot-artifacts";
import { getMarketSnapshot } from "@/lib/market-snapshot";
import { getMonitorFeed, newsTimeline, num } from "@/lib/oracle-intelligence";
import { priceFigureShown } from "@/lib/price-stamp";
import { getPublishedPrices } from "@/lib/published-prices";
import { getSteoFeed } from "@/lib/steo";

const EMPTY: DeskCommandResult = { command: null, trace: [], citations: [], artifact: null };

/** Additive slash-command payload. A normal question carries empty arrays. */
export async function deskCommandFor(message: string): Promise<DeskCommandResult> {
  if (!message.trim().startsWith("/")) return EMPTY;
  try {
    const [feed, steo] = await Promise.all([getPublishedPrices(), getSteoFeed()]);
    const snapshot = getMarketSnapshot();
    const monitor = getMonitorFeed();
    const row = snapshot.cftc.rows[0] ?? null;
    const positioning = monitor.positioning.status === "ok" ? monitor.positioning.values : {};
    const newsValues = monitor.news.status === "ok" ? monitor.news.values : {};
    return resolveDeskCommand(message, {
      prices: feed.prices.filter((item) => priceFigureShown(item)).map((item) => ({
        ticker: item.ticker,
        price: item.price,
        last_updated: item.last_updated,
        source: item.source,
        source_url: item.source_url,
      })),
      cftc: row
        ? { reportDate: row.reportDate, long: row.long, short: row.short, net: row.net, netChange: row.netChange }
        : null,
      cftcPercentile: num(positioning, "net_position_in_range_pct"),
      news: newsTimeline(newsValues),
      steoRows: (steo?.rows ?? []).map((item) => ({
        id: item.id,
        description: item.description,
        unit: item.unit,
        period: item.latest.period,
        value: item.latest.value,
      })),
    });
  } catch {
    return {
      command: message.trim().split(/\s+/)[0] ?? null,
      trace: [{ step: "Read the desk", detail: "The command could not be resolved.", status: "unavailable", ms: 0 }],
      citations: [],
      artifact: null,
    };
  }
}
