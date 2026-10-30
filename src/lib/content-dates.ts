import marketPrices from "../../data/market-prices.json";
import dashboardSignals from "../../data/dashboard-signals.json";
import dailyBriefing from "../../data/daily-briefing.json";
import chartData from "../../data/chart-data.json";
import balanceEngine from "../../data/balance-engine.json";
import flowMap from "../../data/flow-map.json";
import curveMonitor from "../../data/curve-monitor.json";
import newsToBarrels from "../../data/news-to-barrels.json";
import positioning from "../../data/positioning-engine.json";
import hypothesis from "../../data/hypothesis-builder.json";
import portfolio from "../../data/virtual-portfolio.json";
import watchlist from "../../data/investment-watchlist.json";
import companyIntel from "../../data/company-intelligence.json";
import research from "../../data/research-library.json";
import vesselAttachments from "../../data/vessel-attachments.json";
import paperBook from "../../paper-book/report/dashboard.json";

function latest(...values: Array<string | undefined>): string | undefined {
  let best = -Infinity;
  let iso: string | undefined;
  for (const value of values) {
    if (!value) continue;
    const parsed = Date.parse(value.includes("T") ? value : `${value}T00:00:00Z`);
    if (Number.isNaN(parsed) || parsed <= best) continue;
    best = parsed;
    iso = value.includes("T") ? value : `${value}T00:00:00Z`;
  }
  return iso;
}

const prices = marketPrices.meta.last_published;
const signals = dashboardSignals.meta.last_published;
const briefing = dailyBriefing.briefings[0]?.last_updated;
const charts = chartData.meta.last_published;
const balance = balanceEngine.meta.last_published;
const flows = latest(flowMap.meta.last_published, vesselAttachments.meta.last_published);
const curve = curveMonitor.meta.last_published;
const news = newsToBarrels.meta.last_published;
const positioningAt = positioning.meta.last_published;
const hypothesisAt = hypothesis.meta.last_published;
const fund = portfolio.meta.last_published;
const watch = watchlist.meta.last_published;
const companies = companyIntel.meta.last_published;
const notes = research.meta.last_published;
const tools = latest(balance, flows, curve, news, positioningAt, hypothesisAt);

/**
 * Content timestamps for sitemap lastmod. Pages with no dataset are omitted
 * so they are not stamped with the build clock.
 */
export const ROUTE_LASTMOD: Record<string, string> = {
  "/": latest(prices, charts, fund)!,
  "/dashboard": latest(prices, signals, charts, watch)!,
  "/desk-agent": latest(prices, signals, balance, positioningAt, news)!,
  "/daily-briefing": briefing,
  "/watchlist": watch,
  "/company-intelligence": companies,
  "/tools": tools!,
  "/tools/balance-engine": balance,
  "/tools/flow-map": flows!,
  "/tools/curve-monitor": curve,
  "/tools/news-to-barrels": news,
  "/tools/positioning": positioningAt,
  "/tools/hypothesis-builder": hypothesisAt,
  "/portfolio": fund,
  "/portfolio/dashboard": fund,
  "/paper-book": paperBook.generated_at,
  "/crude-oil-prices": prices,
  "/gas-lng": latest(prices, charts)!,
  "/opec-supply-risk": latest(signals, charts)!,
  "/research-library": notes,
  "/about": "2026-10-29T00:00:00Z",
  "/advertise": "2026-10-29T00:00:00Z",
  "/media-kit": "2026-10-29T00:00:00Z",
  "/corrections": "2026-10-29T00:00:00Z",
};
