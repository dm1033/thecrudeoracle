import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { marketPrices } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import SubscribeCTA from "@/components/SubscribeCTA";
import MarketCard from "@/components/MarketCard";
import FAQ from "@/components/FAQ";
import { BrentWtiChart, InventoriesChart } from "@/components/charts/Charts";

export const metadata: Metadata = pageMeta(
  "Crude Oil Prices — Brent, WTI & Dubai Analysis",
  "Indicative Brent, WTI and Dubai crude oil prices with daily, weekly and monthly moves, 30-day trends, inventory context and clear source labelling. Brent crude analysis for investors.",
  "/crude-oil-prices"
);

const FAQ_ITEMS = [
  {
    q: "What is the difference between Brent and WTI?",
    a: "Brent is the waterborne North Sea benchmark used to price most internationally traded crude. WTI (West Texas Intermediate) is the US benchmark, delivered at Cushing, Oklahoma. The Brent–WTI spread reflects freight, US export economics and regional supply-demand balances.",
  },
  {
    q: "Are these live prices?",
    a: "No. Prices on this page are indicative and manually updated, with the source and last-updated time shown on every card. We do not display unlicensed real-time exchange data. Always verify with primary sources before trading.",
  },
  {
    q: "What moves crude oil prices?",
    a: "The main drivers are OPEC+ supply decisions, non-OPEC production growth, inventories, demand growth (especially Asia), the US dollar, positioning, and geopolitical risk affecting supply routes and export infrastructure.",
  },
];

export default function CrudeOilPricesPage() {
  const crude = marketPrices.filter((p) => ["BRN", "WTI", "DUB"].includes(p.ticker));
  const dxy = marketPrices.find((p) => p.ticker === "DXY*");

  return (
    <>
      <PageHeader
        eyebrow="Market Data · Indicative"
        title="Crude Oil Prices"
        intro="Brent, WTI and Dubai benchmarks with daily, weekly and monthly moves — plus the dollar and inventory context that drives them. All values are indicative and source-labelled."
      />
      <div className="container-site space-y-10 py-10">
        <section aria-labelledby="benchmarks-h">
          <h2 id="benchmarks-h" className="h2">
            Benchmark prices
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {crude.map((p) => (
              <MarketCard key={p.ticker} price={p} />
            ))}
            {dxy && <MarketCard price={dxy} />}
          </div>
        </section>

        <section aria-labelledby="trend-h" className="grid gap-4 lg:grid-cols-2">
          <h2 id="trend-h" className="sr-only">
            Price trends
          </h2>
          <BrentWtiChart />
          <InventoriesChart />
        </section>

        <section className="prose-dark max-w-3xl">
          <h2>Reading the crude complex</h2>
          <p>
            Benchmark prices are only the headline. Professionals read them alongside timespreads
            (the shape of the futures curve), physical differentials, inventories against seasonal
            norms, and freight. A rising flat price with weakening spreads tells a very different
            story from a rally led by the prompt.
          </p>
          <p>
            Premium members receive this context every trading day in the Daily Briefing, together
            with the supply, demand and positioning signals behind the move.
          </p>
        </section>

        <FAQ items={FAQ_ITEMS} />
        <SubscribeCTA />
        <DisclaimerBlock />
      </div>
    </>
  );
}
