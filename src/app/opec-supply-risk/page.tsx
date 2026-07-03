import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { supplySignals, riskSignals } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import SubscribeCTA from "@/components/SubscribeCTA";
import SignalCardView from "@/components/SignalCardView";
import FAQ from "@/components/FAQ";
import { OpecProductionChart, RigCountChart } from "@/components/charts/Charts";

export const metadata: Metadata = pageMeta(
  "OPEC & Supply Risk Monitor",
  "OPEC and OPEC+ monitoring, spare capacity, inventories, rig counts, tanker disruption and geopolitical supply risk for crude oil investors — with sources and update times.",
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
    a: "We monitor OPEC communications, public agency data (EIA, IEA), rig counts, tanker routing disruptions and export infrastructure news, and summarise the investment-relevant signal daily for premium members. Sources are cited on every card.",
  },
];

export default function OpecSupplyRiskPage() {
  return (
    <>
      <PageHeader
        eyebrow="Supply Side · Risk Monitor"
        title="OPEC / Supply Risk"
        intro="The supply side of the ledger: OPEC+ policy, inventories, rig activity, spare capacity, shipping disruption and the geopolitical risk premium — monitored continuously, summarised daily."
      />
      <div className="container-site space-y-10 py-10">
        <section aria-labelledby="supply-h">
          <h2 id="supply-h" className="h2">
            Supply signals
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {supplySignals.map((s) => (
              <SignalCardView key={s.id} card={s} />
            ))}
          </div>
        </section>

        <section aria-labelledby="georisk-h">
          <h2 id="georisk-h" className="h2">
            Risk premium
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {riskSignals.map((s) => (
              <SignalCardView key={s.id} card={s} />
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <OpecProductionChart />
          <RigCountChart />
        </section>

        <FAQ items={FAQ_ITEMS} />
        <SubscribeCTA
          heading="Get supply risk alerts as they develop"
          body="Premium members receive OPEC+ decisions, inventory surprises and disruption alerts in context — what changed, why it matters, and what it means for the names on the watchlist."
        />
        <DisclaimerBlock />
      </div>
    </>
  );
}
