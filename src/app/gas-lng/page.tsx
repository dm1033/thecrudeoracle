import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { riskSignals } from "@/lib/data";
import { getPublishedPrices } from "@/lib/published-prices";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import SubscribeCTA from "@/components/SubscribeCTA";
import MarketCard from "@/components/MarketCard";
import SignalCardView from "@/components/SignalCardView";
import FAQ from "@/components/FAQ";
import { HenryHubChart } from "@/components/charts/Charts";
import UnlicensedMarks from "@/components/UnlicensedMarks";

export const metadata: Metadata = pageMeta(
  "Gas & LNG — Henry Hub from the EIA",
  "Henry Hub natural gas daily spot from the U.S. EIA (series RNGWHHD), with the trade date and source. UK NBP and Dutch TTF are not shown.",
  "/gas-lng"
);

const FAQ_ITEMS = [
  {
    q: "Why are NBP and TTF not on this page?",
    a: "UK NBP and Dutch TTF are ICE prices. This site does not republish licensed exchange marks. Henry Hub is shown because the U.S. EIA publishes that spot in the public domain.",
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

export const revalidate = 7200;

export default async function GasLngPage() {
  const feed = await getPublishedPrices();
  const gas = feed.prices.filter((p) => ["HH", "JKM*"].includes(p.ticker));
  const gasUpdated = gas.reduce((best, price) => (price.last_updated > best ? price.last_updated : best), gas[0]?.last_updated ?? "");
  const lngSignal = riskSignals.find((s) => s.id === "lng-signal");

  return (
    <>
      <PageHeader
        eyebrow="Market Data · Indicative"
        title="Gas / LNG Dashboard"
        intro="Henry Hub from the EIA daily spot. UK NBP and Dutch TTF are licensed ICE marks and are not shown. The Asian LNG marker, when present, is a labelled placeholder."
      />
      <div className="container-site space-y-10 py-10">
        <section aria-labelledby="gas-h">
          <h2 id="gas-h" className="h2">
            Hub prices
          </h2>
          {gasUpdated && (
            <p className="mt-2 text-sm text-steel-300">
              Each card carries its own trade date. Henry Hub uses the EIA print when that feed is loaded. Information
              only, not investment advice.
            </p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {gas.map((p) => (
              <MarketCard key={p.ticker} price={p} />
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <HenryHubChart points={feed.henryHubHistory.map((point) => ({ date: point.date, hh: point.value }))} />
          </div>
          {lngSignal && <SignalCardView card={lngSignal} />}
        </section>

        <section className="prose-dark max-w-3xl">
          <h2>The global gas system in one paragraph</h2>
          <p>
            US Henry Hub, published by the EIA, is the public price this page can show. European
            hub prices are exchange marks and are not republished here. The daily briefing stays
            factual and does not recommend gas equities.
          </p>
        </section>

        <UnlicensedMarks />
        <FAQ items={FAQ_ITEMS} />
        <SubscribeCTA />
        <DisclaimerBlock />
      </div>
    </>
  );
}
