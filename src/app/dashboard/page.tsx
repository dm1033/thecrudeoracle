import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { marketPrices, riskSignals } from "@/lib/data";
import MarketCard from "@/components/MarketCard";
import SignalCardView from "@/components/SignalCardView";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import SubscribeCTA from "@/components/SubscribeCTA";
import { BrentWtiChart } from "@/components/charts/Charts";

export const metadata: Metadata = pageMeta(
  "Daily Oil Dashboard — Free Market Snapshot",
  "Free daily crude oil market snapshot: Brent and WTI indicative prices, UK and European gas, OPEC alerts and geopolitical risk signals with sources and update times.",
  "/dashboard"
);

export default function DashboardPage() {
  const freePrices = marketPrices.filter((p) =>
    ["BRN", "WTI", "NBP", "TTF"].includes(p.ticker)
  );

  return (
    <>
      <PageHeader
        eyebrow="Free Market Snapshot"
        title="Daily Oil Dashboard"
        intro="A free daily snapshot of the crude oil and gas complex. Premium members receive the full price complex, supply and demand signal grids, the daily bottom line, watchlists and company intelligence."
      />
      <div className="container-site space-y-10 py-10">
        <section aria-labelledby="prices-h">
          <h2 id="prices-h" className="h2">
            Headline prices
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {freePrices.map((p) => (
              <MarketCard key={p.ticker} price={p} />
            ))}
          </div>
        </section>

        <section aria-labelledby="risk-h">
          <h2 id="risk-h" className="h2">
            Risk signals
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {riskSignals.map((s) => (
              <SignalCardView key={s.id} card={s} />
            ))}
          </div>
        </section>

        <section aria-labelledby="chart-h">
          <h2 id="chart-h" className="h2">
            Brent vs WTI
          </h2>
          <div className="mt-4">
            <BrentWtiChart />
          </div>
        </section>

        <section className="card border-gold-600/40 bg-navy-900/30 text-center">
          <h2 className="text-lg font-semibold text-white">
            This is the free snapshot — premium members see the full picture
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-steel-400">
            Dubai crude, Henry Hub, the LNG Asia marker, full supply and demand grids, refinery
            margins, the daily bottom line and the complete chart pack are on the{" "}
            <Link href="/premium-dashboard" className="text-gold-400 underline">
              Premium Dashboard
            </Link>
            .
          </p>
        </section>

        <SubscribeCTA />
        <DisclaimerBlock />
      </div>
    </>
  );
}
