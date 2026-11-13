import type { Metadata } from "next";
import Image from "next/image";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import SubscribeCTA from "@/components/SubscribeCTA";
import { DataCardGrid } from "@/components/DataCardView";
import { getDashboardCards } from "@/lib/dashboard-cards";
import FAQ from "@/components/FAQ";

export const metadata: Metadata = pageMeta(
  "OPEC & Supply Risk Monitor",
  "OPEC crude production and spare capacity as EIA estimates them, US crude stocks and a count of supply-route news coverage. Public data with sources and dates. Not financial advice.",
  "/opec-supply-risk"
);

const FAQ_ITEMS = [
  {
    q: "Why does OPEC+ matter so much for oil prices?",
    a: "OPEC+ controls the majority of the world's effective spare production capacity. Its decisions to withhold or return barrels set the marginal balance of the market, which is why ministerial meetings and compliance data are first-order price events.",
  },
  {
    q: "What is spare capacity and why watch it?",
    a: "Spare capacity is production that can be brought online quickly and sustained. When it is thin or concentrated in few countries, any supply disruption forces prices to do the rationing — which is why low spare capacity raises the geopolitical risk premium.",
  },
  {
    q: "How do you track supply risk?",
    a: "This page shows published figures only: US crude stocks from the EIA weekly report, OPEC production and spare capacity from the EIA Short-Term Energy Outlook, and a count of news coverage of supply routes from the GDELT Project. It does not publish a risk rating. Rig counts and tanker tracking are not shown because no free feed that may be republished is connected.",
  },
];

export const revalidate = 7200;

export default async function OpecSupplyRiskPage() {
  const cards = await getDashboardCards();
  const news = cards.context.filter((card) => card.id === "supply-news");
  return (
    <>
      <PageHeader
        eyebrow="Supply Side · Risk Monitor"
        title="OPEC / Supply Risk"
        intro="The supply side from public data: US crude stocks, OPEC production and spare capacity as EIA estimates them, and how much news coverage oil supply routes are getting. Each figure carries its source and date."
      />
      <div className="container-site space-y-10 py-10">
        <figure className="overflow-hidden rounded-lg border border-ink-700">
          <div className="relative aspect-[21/9]">
            <Image
              src="/images/tanker-intelligence.png"
              alt="Crude oil tanker under way with global trade-route and chokepoint data overlaid"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="border-t border-ink-700 bg-ink-900 p-3 text-xs text-steel-500">
            Physical flows are the truth serum of the oil market: tanker routings, chokepoint
            transit and freight rates reveal what press releases don&apos;t.
          </figcaption>
        </figure>

        <section aria-labelledby="supply-h">
          <h2 id="supply-h" className="h2">
            Supply figures
          </h2>
          <p className="mt-1 text-sm text-steel-500">
            US stocks from the EIA weekly report; OPEC production and spare capacity from EIA&apos;s monthly outlook.
          </p>
          <DataCardGrid cards={cards.supply} empty="Supply figures: not loaded. No stored figure is shown in their place." />
        </section>

        <section aria-labelledby="news-h">
          <h2 id="news-h" className="h2">
            Supply-route news coverage
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-steel-500">
            How much the world&apos;s online news is covering oil supply routes and OPEC quotas, against the last week.
            The site does not publish a geopolitical risk rating or an OPEC alert.
          </p>
          <DataCardGrid cards={news} empty="News coverage: not loaded." />
        </section>

        <p className="max-w-3xl text-sm leading-relaxed text-steel-400">
          OPEC production and rig-count charts are not shown. The previous charts were a sample
          series, not an EIA or Baker Hughes feed.
        </p>

        <FAQ items={FAQ_ITEMS} />
        <SubscribeCTA
          heading="Get the morning note"
          body="The latest EIA prices and stock figures, what changed and what is due next. Facts with sources, no trading calls."
        />
        <DisclaimerBlock />
      </div>
    </>
  );
}
