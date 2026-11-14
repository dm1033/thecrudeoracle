import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import SubscribeCTA from "@/components/SubscribeCTA";

export const metadata: Metadata = pageMeta(
  "Tools by trading approach",
  "Free oil market tools built on public data: world balance, spreads and cracks, WTI positioning, what changed, supply-route news coverage and a stock report event study. Sourced and dated. Not financial advice.",
  "/tools"
);

const MODULES = [
  {
    id: 1,
    title: "Global Balance Engine",
    approach: "Fundamental / balance traders",
    description:
      "World oil supply, demand and stocks from the EIA Short-Term Energy Outlook: OPEC and non-OPEC production, US crude output, OPEC spare capacity, OECD and non-OECD consumption and OECD commercial stocks. Each line shows the latest estimated month, a year earlier and EIA's forecast.",
    href: "/tools/balance-engine",
    status: "live",
  },
  {
    id: 2,
    title: "Physical Flow Map",
    approach: "Physical / flow traders",
    description:
      "July 2026 archive, not current. Sample tables of tanker loadings, discharges and flow anomalies that show the method. Tanker tracking at this level needs a licensed feed, which is not connected, so the tables are not updated.",
    href: "/tools/flow-map",
    status: "archive",
  },
  {
    id: 3,
    title: "Curve, Spreads & Cracks",
    approach: "Curve / relative-value traders",
    description:
      "Brent and WTI spot prices, the Brent–WTI spread, New York Harbor gasoline and diesel cracks and the 3-2-1 crack, worked from EIA daily prices with a 60-day chart. Every figure carries its own date.",
    href: "/tools/curve-monitor",
    status: "live",
  },
  {
    id: 4,
    title: "News-to-Barrels AI",
    approach: "News / event-driven traders",
    description:
      "July 2026 archive, not current. Sample events showing how a headline is sized in barrels: affected capacity, the impact chain and a confidence grade. The site has no licensed news or outage feed, so no new events are added.",
    href: "/tools/news-to-barrels",
    status: "archive",
  },
  {
    id: 5,
    title: "Positioning & Crowd-Risk Engine",
    approach: "Flow / momentum traders",
    description:
      "NYMEX WTI managed-money positioning from the CFTC Commitments of Traders report, loaded automatically with twelve weeks of history. Desk notes on other markets are from July and are marked as not current on the page.",
    href: "/tools/positioning",
    status: "live",
  },
  {
    id: 6,
    title: "Trade Hypothesis Builder",
    approach: "Systematic / discretionary researchers",
    description:
      "July 2026 archive, not current. Sample research hypotheses with evidence and explicit invalidation conditions, built on July sample figures the site no longer publishes. Never buy or sell signals.",
    href: "/tools/hypothesis-builder",
    status: "archive",
  },
  {
    id: 11,
    title: "Public Data Monitor",
    approach: "Everyone — the free public record",
    description:
      "EIA spot prices and stocks, CFTC futures positioning, the Federal Reserve dollar index and real yields, EU gas storage and oil-supply news volume on one screen. Fetched automatically from free public sources, each card dated and sourced, with no estimate filled in where a feed has not loaded.",
    href: "/tools/public-data-monitor",
    status: "live",
  },
  {
    id: 7,
    title: "Supply-Route News Monitor",
    approach: "Event / macro watchers",
    description:
      "How much of the world's online news mentions Hormuz, the Red Sea, Suez, OPEC quotas and Libyan oilfields, against the last seven days, with a chart, a breakdown by search term and recent headlines. A count of coverage from the GDELT Project. It is not a risk rating: no free feed measures risk.",
    href: "/tools/supply-news",
    status: "live",
  },
  {
    id: 8,
    title: "What Changed",
    approach: "Everyone — the decision screen",
    description:
      "The latest move in oil prices, US crude stocks, futures positioning, the dollar and real yields on one screen, ranked by how unusual each is against that series' own history. Delayed public data, each line dated and sourced, with nothing estimated.",
    href: "/tools/what-changed",
    status: "live",
  },
  {
    id: 10,
    title: "Stock Report Event Study",
    approach: "Researchers / anyone asking what happened last time",
    description:
      "What WTI and the Brent–WTI spread did in the days after the largest weekly builds and draws in US crude stocks, from about five years of EIA data, with the sample size on every line and the weeks listed. A description of the past, not a forecast. The site runs no simulations or scenarios.",
    href: "/tools/event-study",
    status: "live",
  },
] as const;

export default function ToolsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Trader Toolkit"
        title="Tools, matched to your trading approach"
        intro="Oil market tools built on public data from EIA, the CFTC, the Federal Reserve and the GDELT Project. Each one shows published figures with their source and date. None gives a forecast or a trading signal. Tools marked July archive are not updated."
      />
      <div className="container-site space-y-10 py-10">
        <div className="grid gap-4 md:grid-cols-2">
          {MODULES.map((m) => {
            const live = m.status === "live";
            const archive = m.status === "archive";
            return (
              <div
                key={m.id}
                className={`card flex flex-col ${live ? "border-gold-600/50" : archive ? "border-risk/40" : "opacity-80"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="eyebrow">Module {m.id}</span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      live ? "bg-gain/15 text-gain" : archive ? "bg-risk/15 text-risk" : "bg-steel-500/15 text-steel-400"
                    }`}
                  >
                    {archive ? "July archive" : m.status}
                  </span>
                </div>
                <h2 className="mt-2 text-lg font-bold text-white">{m.title}</h2>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-steel-500">
                  {m.approach}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-steel-400">{m.description}</p>
                {live ? (
                  <Link href={m.href} className="btn-primary mt-5 w-full">
                    Open {m.title} →
                  </Link>
                ) : archive ? (
                  <Link href={m.href} className="btn-secondary mt-5 w-full">
                    Open the archive →
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="btn-secondary mt-5 w-full cursor-not-allowed opacity-60"
                  >
                    In development
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <SubscribeCTA
          heading="The toolkit is 100% free"
          body="Every tool is free, alongside the dashboard, the morning note and the watchlist."
        />
        <DisclaimerBlock />
      </div>
    </>
  );
}
