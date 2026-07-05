import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import flowData from "../../../../data/flow-map.json";
import PageHeader from "@/components/PageHeader";
import BalanceTable, { type BalanceRow } from "@/components/BalanceTable";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import PremiumGate from "@/components/PremiumGate";
import { formatUpdated } from "@/lib/data";

export const metadata: Metadata = pageMeta(
  "Physical Flow Map — Tanker Flows with Explainable Anomaly Detection",
  "Module 2 of The Crude Oracle trader toolkit: tanker loadings and discharges, destination changes, dark AIS gaps, floating storage, port congestion and freight — with every anomaly explained in plain English, sigma by sigma.",
  "/tools/flow-map"
);

interface AnomalyFactor {
  factor: string;
  direction: string;
  detail: string;
}

interface Anomaly {
  id: string;
  severity: string;
  sigma: number;
  title: string;
  observed: string;
  baseline: string;
  explanation: string;
  factors: AnomalyFactor[];
  implication: string;
  source: string;
  last_updated: string;
  data_type: string;
}

const anomalies = flowData.anomalies as Anomaly[];
const loadings = flowData.loadings as BalanceRow[];
const discharges = flowData.discharges as BalanceRow[];
const signals = flowData.signals as BalanceRow[];
const summary = flowData.flow_summary;

const SEVERITY_STYLE: Record<string, { border: string; badge: string; label: string }> = {
  alert: { border: "border-loss/50", badge: "bg-loss/15 text-loss", label: "Alert" },
  watch: { border: "border-risk/50", badge: "bg-risk/15 text-risk", label: "Watch" },
  info: { border: "border-ink-600", badge: "bg-steel-500/15 text-steel-400", label: "Info" },
};

const DIRECTION_GLYPH: Record<string, { glyph: string; cls: string }> = {
  up: { glyph: "▲", cls: "text-gain" },
  down: { glyph: "▼", cls: "text-loss" },
  flat: { glyph: "—", cls: "text-steel-500" },
};

function AnomalyCard({ a }: { a: Anomaly }) {
  const style = SEVERITY_STYLE[a.severity] ?? SEVERITY_STYLE.info;
  return (
    <article className={`card ${style.border}`}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}>
          {style.label}
        </span>
        <span className="num rounded bg-navy-800 px-2 py-0.5 font-mono text-xs font-bold text-gold-400">
          {a.sigma.toFixed(1)}σ vs 30-day norm
        </span>
      </header>
      <h3 className="mt-3 text-base font-semibold text-white">{a.title}</h3>
      <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-steel-500">Observed</div>
          <div className="num font-semibold text-white">{a.observed}</div>
        </div>
        <div>
          <div className="text-steel-500">Baseline</div>
          <div className="num text-steel-300">{a.baseline}</div>
        </div>
      </div>
      <p className="mt-3 border-l-2 border-gold-600/60 pl-3 text-sm leading-relaxed text-steel-300">
        {a.explanation}
      </p>
      <div className="mt-3">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">
          Contributing factors
        </div>
        <ul className="mt-1.5 space-y-1.5">
          {a.factors.map((f) => {
            const d = DIRECTION_GLYPH[f.direction] ?? DIRECTION_GLYPH.flat;
            return (
              <li key={f.factor} className="flex gap-2 text-xs leading-relaxed">
                <span aria-hidden className={`mt-0.5 ${d.cls}`}>{d.glyph}</span>
                <span>
                  <span className="font-semibold text-steel-300">{f.factor}:</span>{" "}
                  <span className="text-steel-500">{f.detail}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="mt-3 rounded border border-ink-700 bg-ink-900 p-3 text-xs leading-relaxed text-steel-400">
        <span className="font-semibold text-gold-500">So what: </span>
        {a.implication}
      </p>
      <footer className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink-700 pt-2 text-[11px] text-steel-500">
        <span>Source: {a.source}</span>
        <span>Updated: {a.last_updated}</span>
        <span className="rounded bg-steel-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-steel-400">
          {a.data_type}
        </span>
      </footer>
    </article>
  );
}

function FlowContent() {
  return (
    <div className="space-y-10">
      <div className="rounded-lg border border-gold-600/40 bg-gradient-to-r from-navy-900 to-ink-900 p-5">
        <p className="eyebrow">Flow Read of the Day</p>
        <h2 className="mt-1 text-lg font-bold text-white">{summary.headline}</h2>
        <p className="mt-2 text-sm leading-relaxed text-steel-400">{summary.comment}</p>
        <p className="mt-3 border-t border-ink-700 pt-2 text-[11px] text-steel-500">
          Source: {summary.source} · Updated: {formatUpdated(summary.last_updated)} ·{" "}
          <span className="rounded bg-steel-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-steel-400">
            {summary.data_type}
          </span>
        </p>
      </div>

      <section aria-labelledby="radar-h">
        <h2 id="radar-h" className="h2">
          Anomaly radar
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-steel-500">
          Every flagged flow is explained, not just scored: what deviated, by how many standard
          deviations, which factors moved with it, and what it means for positioning.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {anomalies.map((a) => (
            <AnomalyCard key={a.id} a={a} />
          ))}
        </div>
      </section>

      <BalanceTable title="Tankers loaded — by origin" accent="bg-gold-500" rows={loadings} />
      <BalanceTable title="Tankers discharged — by destination" accent="bg-gain" rows={discharges} />
      <BalanceTable title="Flow signals — routing, storage, congestion & freight" accent="bg-risk" rows={signals} />

      <div className="card text-xs leading-relaxed text-steel-500">
        <p>
          <strong className="text-steel-300">Methodology:</strong> {flowData.meta.methodology}
        </p>
        <p className="mt-2">
          Commercial-grade tanker tracking (Kpler, Vortexa class) requires licensing; until a
          licensed feed is connected, values here are desk estimates from public summaries and are
          labelled accordingly. The anomaly framework — baseline, sigma, factors, implication — is
          feed-agnostic and carries over unchanged when live data lands.
        </p>
      </div>
    </div>
  );
}

export default function FlowMapPage() {
  return (
    <>
      <PageHeader
        eyebrow="Trader Toolkit · Module 2 · Premium"
        title="Physical Flow Map"
        intro="Tankers loaded and discharged, destination changes, dark AIS gaps, floating storage, congestion and freight — with explainable anomaly detection that tells you why a flow is unusual, not just that it is."
      />
      <div className="container-site space-y-10 py-10">
        <PremiumGate
          title="The Physical Flow Map is for premium subscribers"
          preview={
            <div className="grid gap-4 lg:grid-cols-2">
              {anomalies.slice(0, 2).map((a) => (
                <AnomalyCard key={a.id} a={a} />
              ))}
            </div>
          }
        >
          <FlowContent />
        </PremiumGate>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm">
          <span className="text-steel-400">
            Pair with Module 1 — the Balance Engine — to see where these flows land in stocks.
          </span>
          <div className="flex gap-4">
            <Link href="/tools/balance-engine" className="font-semibold text-gold-400 hover:text-gold-300">
              Balance Engine →
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
