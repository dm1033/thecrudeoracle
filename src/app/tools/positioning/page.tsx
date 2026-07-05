import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import posData from "../../../../data/positioning-engine.json";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import PremiumGate from "@/components/PremiumGate";

export const metadata: Metadata = pageMeta(
  "Positioning & Crowd-Risk Engine — CFTC COT Intelligence",
  "Module 5 of The Crude Oracle trader toolkit: managed-money positioning from CFTC and ICE COT reports with a three-part crowding checklist — stretched positioning, structure confirmation and physical support — graded into liquidation risk.",
  "/tools/positioning"
);

interface PositionRow {
  instrument: string;
  net_position: string;
  change: string;
  percentile: string;
  stance: string;
  note: string;
  source: string;
  source_url: string;
  last_updated: string;
  data_type: string;
}

interface ChecklistItem {
  condition: string;
  status: string;
  detail: string;
}

interface CrowdRisk {
  id: string;
  instrument: string;
  direction_of_risk: string;
  checklist: ChecklistItem[];
  liquidation_risk: string;
  explanation: string;
  watch: string;
  source: string;
  last_updated: string;
  data_type: string;
}

const positioning = posData.positioning as PositionRow[];
const crowdRisk = posData.crowd_risk as CrowdRisk[];

const STANCE_STYLE: Record<string, string> = {
  "heavily long": "bg-gain/15 text-gain",
  long: "bg-gain/10 text-gain",
  neutral: "bg-steel-500/15 text-steel-400",
  short: "bg-loss/10 text-loss",
  "heavily short": "bg-loss/15 text-loss",
};

const RISK_STYLE: Record<string, string> = {
  elevated: "bg-loss/15 text-loss",
  moderate: "bg-risk/15 text-risk",
  low: "bg-gain/15 text-gain",
};

const CHECK_STYLE: Record<string, { glyph: string; cls: string }> = {
  yes: { glyph: "✓", cls: "text-loss" },
  partial: { glyph: "◐", cls: "text-risk" },
  no: { glyph: "✗", cls: "text-gain" },
};

function PositioningTable() {
  return (
    <div className="overflow-x-auto rounded-lg border border-ink-700">
      <table className="table-dark min-w-[860px]">
        <thead className="bg-ink-900">
          <tr>
            <th>Instrument</th>
            <th className="text-right">Net position</th>
            <th className="text-right">Δ w/w</th>
            <th className="text-center">3-yr percentile</th>
            <th className="text-center">Stance</th>
            <th>Desk note</th>
            <th className="whitespace-nowrap">Updated</th>
          </tr>
        </thead>
        <tbody>
          {positioning.map((row) => (
            <tr key={row.instrument} className="transition-colors hover:bg-ink-800/60">
              <td className="font-medium text-steel-300">{row.instrument}</td>
              <td className="num whitespace-nowrap text-right font-semibold text-white">{row.net_position}</td>
              <td className="num whitespace-nowrap text-right">{row.change}</td>
              <td className="num whitespace-nowrap text-center">{row.percentile}</td>
              <td className="text-center">
                <span className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${STANCE_STYLE[row.stance] ?? STANCE_STYLE.neutral}`}>
                  {row.stance}
                </span>
              </td>
              <td className="max-w-[280px] text-xs">
                {row.note}{" "}
                <a href={row.source_url} target="_blank" rel="noopener noreferrer" className="text-steel-500 underline decoration-ink-600 underline-offset-2 hover:text-gold-400">
                  {row.source}
                </a>
                <span className="ml-1 rounded bg-risk/15 px-1 py-0.5 text-[9px] font-semibold uppercase text-risk">
                  {row.data_type}
                </span>
              </td>
              <td className="whitespace-nowrap text-xs">{row.last_updated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CrowdRiskCard({ c }: { c: CrowdRisk }) {
  const risk = RISK_STYLE[c.liquidation_risk] ?? RISK_STYLE.moderate;
  return (
    <article className="card">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-white">{c.instrument}</h3>
        <span className={`rounded px-2 py-1 text-xs font-bold uppercase tracking-wide ${risk}`}>
          Liquidation risk: {c.liquidation_risk}
        </span>
      </header>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-steel-500">
        {c.direction_of_risk}
      </p>
      <ul className="mt-3 space-y-2">
        {c.checklist.map((item) => {
          const check = CHECK_STYLE[item.status] ?? CHECK_STYLE.partial;
          return (
            <li key={item.condition} className="flex gap-2 text-sm leading-relaxed">
              <span aria-hidden className={`mt-0.5 font-bold ${check.cls}`}>{check.glyph}</span>
              <span>
                <span className="font-semibold text-steel-300">{item.condition}</span>{" "}
                <span className="text-steel-500">— {item.detail}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 border-l-2 border-gold-600/60 pl-3 text-sm leading-relaxed text-steel-300">
        {c.explanation}
      </p>
      <p className="mt-3 rounded border border-ink-700 bg-ink-900 p-3 text-xs leading-relaxed text-steel-400">
        <span className="font-semibold text-gold-500">Watch: </span>
        {c.watch}
      </p>
      <footer className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink-700 pt-2 text-[11px] text-steel-500">
        <span>Source: {c.source}</span>
        <span>Updated: {c.last_updated}</span>
        <span className="rounded bg-steel-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-steel-400">
          {c.data_type}
        </span>
      </footer>
    </article>
  );
}

function PositioningContent() {
  return (
    <div className="space-y-10">
      <section aria-labelledby="pos-h">
        <h2 id="pos-h" className="h2">
          Managed-money positioning
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-steel-500">
          From the public CFTC Commitments of Traders and ICE COT reports. Published with a lag
          (Tuesday data, Friday release) — directional, not real-time.
        </p>
        <div className="mt-4">
          <PositioningTable />
        </div>
      </section>

      <section aria-labelledby="crowd-h">
        <h2 id="crowd-h" className="h2">
          Crowd-risk checks
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-steel-500">
          Three questions per market: is positioning stretched, is structure confirming, do
          physical flows support it? A ✓ marks a crowding condition that is live.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {crowdRisk.map((c) => (
            <CrowdRiskCard key={c.id} c={c} />
          ))}
        </div>
      </section>

      <div className="card text-xs leading-relaxed text-steel-500">
        <p>
          <strong className="text-steel-300">Methodology:</strong> {posData.meta.methodology}
        </p>
      </div>
    </div>
  );
}

export default function PositioningPage() {
  return (
    <>
      <PageHeader
        eyebrow="Trader Toolkit · Module 5 · Premium"
        title="Positioning & Crowd-Risk Engine"
        intro="Where the speculative money sits, and when it's stretched. CFTC and ICE COT positioning graded through a three-part crowding checklist — because crowded trades don't need bad news to unwind, just an exit rush."
      />
      <div className="container-site space-y-10 py-10">
        <PremiumGate
          title="Positioning intelligence is for premium subscribers"
          preview={<CrowdRiskCard c={crowdRisk[0]} />}
        >
          <PositioningContent />
        </PremiumGate>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm">
          <span className="text-steel-400">
            Crowding checks read structure from Module 3 and physical flows from Modules 1–2.
          </span>
          <div className="flex gap-4">
            <Link href="/tools/curve-monitor" className="font-semibold text-gold-400 hover:text-gold-300">
              Curve Dashboard →
            </Link>
            <Link href="/tools/hypothesis-builder" className="font-semibold text-gold-400 hover:text-gold-300">
              Hypothesis Builder →
            </Link>
            <Link href="/tools" className="font-semibold text-gold-400 hover:text-gold-300">
              All tools →
            </Link>
          </div>
        </div>

        <DisclaimerBlock />
      </div>
    </>
  );
}
