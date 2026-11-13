import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { watchlistCompanies } from "@/lib/data";
import MarketCard from "@/components/MarketCard";
import { DataCardGrid } from "@/components/DataCardView";
import { getDashboardCards } from "@/lib/dashboard-cards";
import BottomLineCard from "@/components/BottomLineCard";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import PriceFreshness from "@/components/PriceFreshness";
import { getPublishedPrices } from "@/lib/published-prices";
import { isSampleInstrument } from "@/lib/sample-marks";
import { BrentWtiChart, HenryHubChart } from "@/components/charts/Charts";

export const revalidate = 7200;

export const metadata: Metadata = pageMeta(
  "Daily oil market dashboard",
  "Free daily crude oil market snapshot: Brent, WTI and Henry Hub from the EIA daily spot, with sources, trade dates and update times.",
  "/dashboard"
);

const INTEL_GROUPS = [
  "Upstream Oil Producers",
  "High-Dividend Oil Equities",
  "LNG",
  "Tanker / Shipping",
  "Oilfield Services",
  "Refiners",
  "North Sea / UKCS",
  "Exploration Upside",
];

export default async function DashboardPage() {
  const [feed, cards] = await Promise.all([getPublishedPrices(), getDashboardCards()]);
  const intelRows = INTEL_GROUPS.flatMap((group) => {
    const company = watchlistCompanies.find(
      (row) =>
        row.category === group &&
        !isSampleInstrument([row.ticker, row.company, row.market_cap, row.investment_theme, row.catalyst])
    );
    return company ? [{ group, company }] : [];
  });

  return (
    <>
      <PageHeader
        eyebrow="Full Dashboard · Free For Everyone"
        title="Daily Oil Dashboard"
        intro="Brent, WTI and Henry Hub from the EIA daily spot, plus supply, demand, news and positioning figures from public data. Dubai, NBP and TTF are not on this board."
      />
      <div className="container-site space-y-10 py-10">
        <section aria-labelledby="mp-h">
          <h2 id="mp-h" className="h2">
            Market prices
          </h2>
          <PriceFreshness feed={feed} />
          <p className="mt-1 text-sm text-steel-500">
            Brent, WTI and Henry Hub show the EIA source and trade date. The site does not display live or
            real-time prices.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {feed.prices.map((p) => (
              <MarketCard key={p.ticker} price={p} />
            ))}
          </div>
        </section>

        <section aria-labelledby="supply-h">
          <h2 id="supply-h" className="h2">
            Supply
          </h2>
          <p className="mt-1 text-sm text-steel-500">
            US stocks from the EIA weekly report; production and spare capacity from EIA&apos;s monthly outlook.
          </p>
          <DataCardGrid cards={cards.supply} empty="Supply figures: not loaded. No stored figure is shown in their place." />
        </section>

        <section aria-labelledby="demand-h">
          <h2 id="demand-h" className="h2">
            Demand
          </h2>
          <p className="mt-1 text-sm text-steel-500">
            Consumption from EIA&apos;s monthly outlook, and the refining spread from EIA daily spot prices.
          </p>
          <DataCardGrid cards={cards.demand} empty="Demand figures: not loaded. No stored figure is shown in their place." />
        </section>

        <section aria-labelledby="context-h">
          <h2 id="context-h" className="h2">
            News, positioning and macro
          </h2>
          <p className="mt-1 text-sm text-steel-500">
            Counts and published figures only. The site does not publish a geopolitical risk rating or an OPEC alert.
          </p>
          <DataCardGrid cards={cards.context} empty="News, positioning and macro figures: not loaded." />
        </section>

        <section aria-labelledby="charts-h">
          <h2 id="charts-h" className="h2">
            Chart pack
          </h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <BrentWtiChart points={feed.brentWtiHistory} />
            <HenryHubChart points={feed.henryHubHistory.map((point) => ({ date: point.date, hh: point.value }))} />
          </div>
        </section>

        <section aria-labelledby="intel-h">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="intel-h" className="h2">
              Investment intelligence
            </h2>
            <Link href="/watchlist" className="text-sm font-semibold text-gold-400 hover:text-gold-300">
              Full watchlist →
            </Link>
          </div>
          <p className="mt-1 text-sm text-steel-500">Monitored names by segment — watchlist, not recommendations.</p>
          {intelRows.length === 0 ? (
            <p className="mt-4 text-sm leading-relaxed text-steel-400">
              No investment names are published. Sample and placeholder tickers are withheld.
            </p>
          ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-ink-700">
            <table className="table-dark min-w-[760px]">
              <caption className="sr-only">
                Monitored oil and gas equities by segment, with investment theme and catalyst
              </caption>
              <thead>
                <tr>
                  <th scope="col">Segment</th>
                  <th scope="col">Name</th>
                  <th scope="col">Ticker</th>
                  <th scope="col">Theme</th>
                  <th scope="col">Catalyst</th>
                  <th scope="col">Updated</th>
                </tr>
              </thead>
              <tbody>
                {intelRows.map(({ group, company }) => (
                    <tr key={group}>
                      <td className="whitespace-nowrap font-medium text-steel-300">{group}</td>
                      <td>{company.company}</td>
                      <td className="font-mono text-xs">{company.ticker}</td>
                      <td>{company.investment_theme}</td>
                      <td>{company.catalyst}</td>
                      <td className="whitespace-nowrap text-xs">{company.last_updated}</td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </section>

        <section aria-labelledby="bl-h">
          <h2 id="bl-h" className="sr-only">
            Daily bottom line
          </h2>
          <BottomLineCard feed={feed} />
        </section>

        <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold-600/40 bg-navy-900/30 p-5">
          <div>
            <p className="eyebrow">Trader Toolkit · Module 1</p>
            <h2 className="mt-1 text-base font-semibold text-white">
              Global Balance Engine — supply, demand and stocks on one screen
            </h2>
          </div>
          <Link href="/tools/balance-engine" className="btn-primary">
            Open the Balance Engine →
          </Link>
        </section>

        <DisclaimerBlock />
      </div>
    </>
  );
}
