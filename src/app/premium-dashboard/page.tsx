import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import {
  marketPrices,
  supplySignals,
  demandSignals,
  riskSignals,
  watchlistCompanies,
} from "@/lib/data";
import MarketCard from "@/components/MarketCard";
import SignalCardView from "@/components/SignalCardView";
import BottomLineCard from "@/components/BottomLineCard";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import PremiumGate from "@/components/PremiumGate";
import {
  BrentWtiChart,
  GasTrendChart,
  InventoriesChart,
  RigCountChart,
  OpecProductionChart,
  SectorHeatmapChart,
} from "@/components/charts/Charts";

export const metadata: Metadata = pageMeta(
  "Premium Dashboard — Terminal-Grade Oil & Gas Intelligence",
  "The full Crude Oracle premium dashboard: complete crude and gas price complex, supply data, demand signals, investment intelligence and the daily bottom line.",
  "/premium-dashboard"
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

function PremiumContent() {
  return (
    <div className="space-y-12">
      <section aria-labelledby="mp-h">
        <h2 id="mp-h" className="h2">
          Market prices
        </h2>
        <p className="mt-1 text-sm text-steel-500">
          Indicative / manually updated values. Every card shows its source, timestamp and licence
          status — no unlicensed real-time exchange data is displayed.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {marketPrices.map((p) => (
            <MarketCard key={p.ticker} price={p} />
          ))}
        </div>
      </section>

      <section aria-labelledby="supply-h">
        <h2 id="supply-h" className="h2">
          Supply data
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {supplySignals.map((s) => (
            <SignalCardView key={s.id} card={s} />
          ))}
        </div>
      </section>

      <section aria-labelledby="demand-h">
        <h2 id="demand-h" className="h2">
          Demand signals
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {demandSignals.map((s) => (
            <SignalCardView key={s.id} card={s} />
          ))}
        </div>
      </section>

      <section aria-labelledby="riskgrid-h">
        <h2 id="riskgrid-h" className="h2">
          Risk monitor
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {riskSignals.map((s) => (
            <SignalCardView key={s.id} card={s} />
          ))}
        </div>
      </section>

      <section aria-labelledby="charts-h">
        <h2 id="charts-h" className="h2">
          Chart pack
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <BrentWtiChart />
          <GasTrendChart />
          <InventoriesChart />
          <RigCountChart />
          <OpecProductionChart />
          <SectorHeatmapChart />
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
        <p className="mt-1 text-sm text-steel-500">
          Monitored names by segment — watchlist, not recommendations.
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-ink-700">
          <table className="table-dark min-w-[760px]">
            <thead>
              <tr>
                <th>Segment</th>
                <th>Name</th>
                <th>Ticker</th>
                <th>Theme</th>
                <th>Catalyst</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {INTEL_GROUPS.map((group) => {
                const c = watchlistCompanies.find((w) => w.category === group);
                if (!c) return null;
                return (
                  <tr key={group}>
                    <td className="whitespace-nowrap font-medium text-steel-300">{group}</td>
                    <td>{c.company}</td>
                    <td className="font-mono text-xs">{c.ticker}</td>
                    <td>{c.investment_theme}</td>
                    <td>{c.catalyst}</td>
                    <td className="whitespace-nowrap text-xs">{c.last_updated}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="bl-h">
        <h2 id="bl-h" className="sr-only">
          Daily bottom line
        </h2>
        <BottomLineCard />
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
    </div>
  );
}

function GatePreview() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {marketPrices.slice(0, 4).map((p) => (
        <MarketCard key={p.ticker} price={p} />
      ))}
    </div>
  );
}

export default function PremiumDashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Premium · Subscriber Only"
        title="Premium Dashboard"
        intro="The complete terminal-grade view: full price complex, supply data, demand signals, risk monitor, chart pack, investment intelligence and the daily bottom line."
      />
      <div className="container-site space-y-10 py-10">
        <PremiumGate title="The Premium Dashboard is for subscribers" preview={<GatePreview />}>
          <PremiumContent />
        </PremiumGate>
        <DisclaimerBlock />
      </div>
    </>
  );
}
