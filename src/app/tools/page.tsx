import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import SubscribeCTA from "@/components/SubscribeCTA";

export const metadata: Metadata = pageMeta(
  "Trader Toolkit — Tools by Trading Approach",
  "The Crude Oracle trader toolkit: purpose-built oil market tools matched to your approach — fundamental balance, curve and spreads, positioning and risk. Module 1: the Global Balance Engine.",
  "/tools"
);

const MODULES = [
  {
    id: 1,
    title: "Global Balance Engine",
    approach: "Fundamental / balance traders",
    description:
      "The entire oil balance on one screen: OPEC and non-OPEC supply, sanctioned barrels, outages and SPR flows against refinery runs, China/India imports and OECD demand — reconciled through US, OECD and floating stocks, with an implied surplus/deficit read.",
    href: "/tools/balance-engine",
    status: "live",
  },
  {
    id: 2,
    title: "Physical Flow Map",
    approach: "Physical / flow traders",
    description:
      "Tankers loaded and discharged, destination changes, dark AIS gaps, floating storage, port congestion and freight — with explainable anomaly detection: why a flow is unusual (in σ vs its 30-day norm), which factors moved with it, and what it means.",
    href: "/tools/flow-map",
    status: "live",
  },
  {
    id: 3,
    title: "Spread & Curve Monitor",
    approach: "Curve / relative-value traders",
    description:
      "Timespreads, Brent–WTI and Brent–Dubai differentials, contango/backwardation state and crack spreads — the market structure signals behind the flat price.",
    href: "/tools",
    status: "in development",
  },
  {
    id: 4,
    title: "Positioning & Sentiment Tracker",
    approach: "Flow / momentum traders",
    description:
      "Managed-money net length, options skew and crowded-trade warnings from public COT-style data — where the speculative money sits and when it's stretched.",
    href: "/tools",
    status: "in development",
  },
  {
    id: 5,
    title: "Geopolitical Risk Matrix",
    approach: "Event / macro traders",
    description:
      "Chokepoints, sanction regimes, election and OPEC+ event calendar with scenario impact ranges — the risk premium, mapped and monitored.",
    href: "/tools",
    status: "in development",
  },
] as const;

export default function ToolsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Premium · Trader Toolkit"
        title="Tools, matched to your trading approach"
        intro="No two desks trade oil the same way. The toolkit is built in modules — pick the one that matches how you take risk: fundamentals, curve structure, positioning or events."
      />
      <div className="container-site space-y-10 py-10">
        <div className="grid gap-4 md:grid-cols-2">
          {MODULES.map((m) => {
            const live = m.status === "live";
            return (
              <div
                key={m.id}
                className={`card flex flex-col ${live ? "border-gold-600/50" : "opacity-80"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="eyebrow">Module {m.id}</span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      live ? "bg-gain/15 text-gain" : "bg-steel-500/15 text-steel-400"
                    }`}
                  >
                    {m.status}
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
                ) : (
                  <button
                    type="button"
                    disabled
                    className="btn-secondary mt-5 w-full cursor-not-allowed opacity-60"
                  >
                    Coming to premium members
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <SubscribeCTA
          heading="The toolkit is part of Premium"
          body="Every module — current and future — is included in The Crude Oracle Premium at £299.99/month, alongside the dashboard, daily briefings, watchlist and research archive."
        />
        <DisclaimerBlock />
      </div>
    </>
  );
}
