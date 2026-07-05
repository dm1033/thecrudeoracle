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
    title: "Futures Curve & Spread Dashboard",
    approach: "Curve / relative-value traders",
    description:
      "Brent and WTI forward curves, M1/M2 through 6-month timespreads, Brent–WTI, Brent–Dubai and Midland–Cushing differentials, gasoline/diesel/jet cracks and freight-adjusted arbs — each marked cheap/fair/expensive, tightening/loosening, and supported or contradicted by the physical data.",
    href: "/tools/curve-monitor",
    status: "live",
  },
  {
    id: 4,
    title: "News-to-Barrels AI",
    approach: "News / event-driven traders",
    description:
      "AI-assisted analysis that converts headlines into estimated barrel impact: affected capacity in kb/d, the impact chain across crude demand, product flows, cracks and differentials, and an honest confidence grade with watchpoints.",
    href: "/tools/news-to-barrels",
    status: "live",
  },
  {
    id: 5,
    title: "Positioning & Crowd-Risk Engine",
    approach: "Flow / momentum traders",
    description:
      "Managed-money positioning from public CFTC and ICE COT reports, graded through a three-part crowding checklist — stretched positioning, structure confirmation, physical support — into an explicit liquidation-risk call.",
    href: "/tools/positioning",
    status: "live",
  },
  {
    id: 6,
    title: "Trade Hypothesis Builder",
    approach: "Systematic / discretionary researchers",
    description:
      "Structured, falsifiable research hypotheses built from dislocations between the modules: evidence with strength grades, explicit invalidation conditions, an evidence-weight confidence score and instruments to research. Never buy/sell signals.",
    href: "/tools/hypothesis-builder",
    status: "live",
  },
  {
    id: 7,
    title: "Geopolitical Risk Matrix",
    approach: "Event / macro traders",
    description:
      "Chokepoints, sanction regimes, election and OPEC+ event calendar with scenario impact ranges — the risk premium, mapped and monitored.",
    href: "/tools",
    status: "in development",
  },
  {
    id: 8,
    title: "What Changed Today?",
    approach: "Everyone — the decision screen",
    description:
      "One screen that answers the only question that matters each morning: what changed, why, and which module saw it first. Dashboards report; this decides what deserves your attention.",
    href: "/tools",
    status: "in development",
  },
  {
    id: 9,
    title: "Nowcast Engine",
    approach: "Fundamental traders who can't wait for the EIA",
    description:
      "Inventory and demand nowcasts ahead of official EIA/IEA/OPEC releases, plus an IEA-vs-OPEC disagreement tracker — with the nowcast error history published honestly.",
    href: "/tools",
    status: "in development",
  },
  {
    id: 10,
    title: "Scenario & Backtest Lab",
    approach: "Risk managers / systematic researchers",
    description:
      "Monte Carlo scenarios for supply disruption, demand shocks and OPEC decisions, plus event studies: how did spreads, cracks and positioning actually behave around past inventory surprises, meetings and hurricanes?",
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
        intro="An oil market intelligence toolkit that converts physical flows, inventories, positioning and news into explainable market scenarios — decision intelligence, not another wall of dashboards. Pick the module that matches how you take risk."
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
