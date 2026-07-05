import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import hypoData from "../../../../data/hypothesis-builder.json";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import PremiumGate from "@/components/PremiumGate";

export const metadata: Metadata = pageMeta(
  "Trade Hypothesis Builder — Structured, Falsifiable Market Scenarios",
  "Module 6 of The Crude Oracle trader toolkit: structured research hypotheses assembled from physical flows, inventories, curve structure, positioning and news — each with evidence, explicit invalidation conditions and an evidence-weight confidence score. Never buy/sell signals.",
  "/tools/hypothesis-builder"
);

interface Evidence {
  point: string;
  module_ref: string;
  module_href: string;
  strength: string;
}

interface Hypothesis {
  id: string;
  title: string;
  thesis_type: string;
  status: string;
  opened: string;
  evidence: Evidence[];
  invalidation: string[];
  confidence_pct: number;
  confidence_note: string;
  instruments_to_research: string[];
  risk_note: string;
  sources: string[];
  last_updated: string;
  data_type: string;
}

const hypotheses = hypoData.hypotheses as Hypothesis[];

const STRENGTH_STYLE: Record<string, string> = {
  strong: "bg-gain/15 text-gain",
  moderate: "bg-risk/15 text-risk",
  weak: "bg-steel-500/15 text-steel-400",
};

const STATUS_STYLE: Record<string, string> = {
  active: "bg-gain/15 text-gain",
  monitoring: "bg-steel-500/15 text-steel-400",
  invalidated: "bg-loss/15 text-loss",
};

function ConfidenceMeter({ pct }: { pct: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">
          Confidence (evidence weight)
        </span>
        <span className="num text-xl font-bold text-gold-400">{pct}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink-700" role="img" aria-label={`Evidence-weight score ${pct} percent`}>
        <div className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[10px] text-steel-500">
        Evidence-weight score — not a probability of profit, not a signal.
      </p>
    </div>
  );
}

function HypothesisCard({ h }: { h: Hypothesis }) {
  const status = STATUS_STYLE[h.status] ?? STATUS_STYLE.monitoring;
  return (
    <article className="card p-6">
      <header className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-navy-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-steel-300">
          {h.thesis_type}
        </span>
        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status}`}>
          {h.status}
        </span>
        <span className="ml-auto font-mono text-[11px] text-steel-500">Opened {h.opened}</span>
      </header>

      <h3 className="mt-3 text-lg font-bold text-white">
        <span className="text-gold-500">Hypothesis:</span> {h.title}
      </h3>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">Evidence</div>
          <ol className="mt-2 space-y-2">
            {h.evidence.map((e, i) => (
              <li key={e.point} className="flex gap-2 text-sm leading-relaxed">
                <span className="num mt-0.5 text-xs font-bold text-gold-500">{i + 1}.</span>
                <span>
                  <span className="text-steel-300">{e.point}</span>{" "}
                  <Link href={e.module_href} className="whitespace-nowrap text-xs text-gold-400 underline decoration-gold-600/40 hover:text-gold-300">
                    {e.module_ref}
                  </Link>{" "}
                  <span className={`inline-block rounded px-1 py-0.5 text-[9px] font-semibold uppercase ${STRENGTH_STYLE[e.strength] ?? STRENGTH_STYLE.weak}`}>
                    {e.strength}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">
              Invalidation — this hypothesis is wrong if:
            </div>
            <ul className="mt-2 space-y-1.5">
              {h.invalidation.map((inv) => (
                <li key={inv} className="flex gap-2 text-sm leading-relaxed">
                  <span aria-hidden className="mt-0.5 text-loss">✗</span>
                  <span className="text-steel-400">{inv}</span>
                </li>
              ))}
            </ul>
          </div>
          <ConfidenceMeter pct={h.confidence_pct} />
          <p className="text-xs leading-relaxed text-steel-500">{h.confidence_note}</p>
        </div>
      </div>

      <div className="mt-4 rounded border border-ink-700 bg-ink-900 p-3">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">
          Instruments to research <span className="normal-case">(not recommendations)</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {h.instruments_to_research.map((inst) => (
            <span key={inst} className="rounded border border-ink-600 bg-ink-850 px-2 py-1 text-xs text-steel-300">
              {inst}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-steel-500">
          <span className="font-semibold text-risk">Risk note: </span>
          {h.risk_note}
        </p>
      </div>

      <footer className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink-700 pt-2 text-[11px] text-steel-500">
        <span>Sources: {h.sources.join(" · ")}</span>
        <span>Updated: {h.last_updated}</span>
        <span className="rounded bg-steel-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-steel-400">
          {h.data_type}
        </span>
      </footer>
    </article>
  );
}

function BuilderContent() {
  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-risk/40 bg-risk/5 p-4 text-sm leading-relaxed text-steel-300">
        <strong className="text-risk">This tool never says buy or sell.</strong> It produces
        structured, falsifiable research hypotheses: the claim, the evidence, the exact conditions
        that would prove it wrong, and an evidence-weight score. What you do with a hypothesis —
        including nothing — is your decision, made with your own research and, where appropriate, a
        regulated adviser.
      </div>

      {hypotheses.map((h) => (
        <HypothesisCard key={h.id} h={h} />
      ))}

      <div className="card text-xs leading-relaxed text-steel-500">
        <p>
          <strong className="text-steel-300">Methodology:</strong> {hypoData.meta.methodology}
        </p>
        <p className="mt-2">
          Hypotheses are retired when invalidated — and the invalidation is recorded, because a
          framework you can&apos;t falsify is marketing, not research.
        </p>
      </div>
    </div>
  );
}

export default function HypothesisBuilderPage() {
  return (
    <>
      <PageHeader
        eyebrow="Trader Toolkit · Module 6 · Premium"
        title="Trade Hypothesis Builder"
        intro="Not signals — scenarios. When the modules disagree, this tool turns the dislocation into a structured hypothesis: evidence, explicit invalidation conditions and an honest confidence score."
      />
      <div className="container-site space-y-10 py-10">
        <PremiumGate
          title="The Hypothesis Builder is for premium subscribers"
          preview={<HypothesisCard h={hypotheses[0]} />}
        >
          <BuilderContent />
        </PremiumGate>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm">
          <span className="text-steel-400">
            Every evidence line links back to the module that produced it.
          </span>
          <Link href="/tools" className="font-semibold text-gold-400 hover:text-gold-300">
            All tools →
          </Link>
        </div>

        <DisclaimerBlock />
      </div>
    </>
  );
}
