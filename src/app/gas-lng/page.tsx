import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { marketPrices, riskSignals } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import SubscribeCTA from "@/components/SubscribeCTA";
import MarketCard from "@/components/MarketCard";
import SignalCardView from "@/components/SignalCardView";
import FAQ from "@/components/FAQ";
import { GasTrendChart } from "@/components/charts/Charts";

export const metadata: Metadata = pageMeta(
  "Gas & LNG Dashboard — NBP, TTF, Henry Hub Intelligence",
  "UK NBP, European TTF, US Henry Hub and Asian LNG marker signals with trends, sources and LNG investment intelligence for investors and energy professionals.",
  "/gas-lng"
);

const FAQ_ITEMS = [
  {
    q: "Why do UK and European gas prices track each other?",
    a: "Britain and continental Europe are physically connected by interconnectors and compete for the same LNG cargoes. NBP and TTF therefore usually move together, with spreads reflecting interconnector capacity, storage and local weather.",
  },
  {
    q: "What is the JKM LNG marker?",
    a: "JKM (Japan-Korea Marker) is the benchmark spot price for LNG delivered into North-East Asia. It sets the arbitrage against European hubs and drives where flexible cargoes flow. Licensed assessments are required to display live values, so we show a labelled placeholder.",
  },
  {
    q: "How does LNG affect UK energy security?",
    a: "As UKCS production declines, Britain increasingly relies on imported LNG competing in a global market. That links UK household and industrial energy costs to Asian demand and global shipping conditions — a core theme in our UK Energy Security coverage.",
  },
];

export default function GasLngPage() {
  const gas = marketPrices.filter((p) => ["NBP", "TTF", "HH", "JKM*"].includes(p.ticker));
  const lngSignal = riskSignals.find((s) => s.id === "lng-signal");

  return (
    <>
      <PageHeader
        eyebrow="Market Data · Indicative"
        title="Gas / LNG Dashboard"
        intro="UK NBP, European TTF, US Henry Hub and the Asian LNG marker — the four prices that set the global gas balance, with the signals that connect them."
      />
      <div className="container-site space-y-10 py-10">
        <section aria-labelledby="gas-h">
          <h2 id="gas-h" className="h2">
            Hub prices
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {gas.map((p) => (
              <MarketCard key={p.ticker} price={p} />
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <GasTrendChart />
          </div>
          {lngSignal && <SignalCardView card={lngSignal} />}
        </section>

        <section className="prose-dark max-w-3xl">
          <h2>The global gas system in one paragraph</h2>
          <p>
            Gas is now a globally arbitraged market: US Henry Hub sets the cost of new LNG supply,
            European hubs (TTF, NBP) set the price of security, and Asian demand sets the
            competition for cargoes. The spreads between these hubs — minus freight and
            regasification — decide where every flexible cargo sails. Premium members get this
            arbitrage picture, storage trajectories and LNG equity implications in the daily
            briefing.
          </p>
        </section>

        <FAQ items={FAQ_ITEMS} />
        <SubscribeCTA />
        <DisclaimerBlock />
      </div>
    </>
  );
}
