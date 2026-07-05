import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import curveData from "../../../../data/curve-monitor.json";
import PageHeader from "@/components/PageHeader";
import SpreadTable, { type SpreadRow } from "@/components/SpreadTable";
import CurveChart from "@/components/charts/CurveChart";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import PremiumGate from "@/components/PremiumGate";
import { formatUpdated } from "@/lib/data";

export const metadata: Metadata = pageMeta(
  "Futures Curve & Spread Dashboard — Timespreads, Differentials, Cracks & Arbs",
  "Module 3 of The Crude Oracle trader toolkit: Brent and WTI curves, M1/M2 and 6-month timespreads, Brent-WTI, Brent-Dubai, Midland-Cushing, gasoline/diesel/jet cracks and freight-adjusted arbitrage — each marked cheap/fair/expensive, tightening/loosening, and supported or contradicted by physical data.",
  "/tools/curve-monitor"
);

const flatPrice = curveData.flat_price as SpreadRow[];
const timespreads = curveData.timespreads as SpreadRow[];
const differentials = curveData.differentials as SpreadRow[];
const cracks = curveData.cracks as SpreadRow[];
const arbitrage = curveData.arbitrage as SpreadRow[];
const summary = curveData.curve_summary;

function CurveSummaryBar() {
  return (
    <div className="rounded-lg border border-gold-600/40 bg-gradient-to-r from-navy-900 to-ink-900 p-5">
      <p className="eyebrow">Curve State</p>
      <h2 className="mt-1 text-lg font-bold text-white">{summary.headline}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-ink-700 bg-ink-900 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">Brent</div>
          <div className="num mt-0.5 text-sm font-semibold text-gain">{summary.brent_state}</div>
        </div>
        <div className="rounded border border-ink-700 bg-ink-900 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">WTI</div>
          <div className="num mt-0.5 text-sm font-semibold text-gain">{summary.wti_state}</div>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-steel-400">{summary.comment}</p>
      <p className="mt-3 border-t border-ink-700 pt-2 text-[11px] text-steel-500">
        Source: {summary.source} · Updated: {formatUpdated(summary.last_updated)} ·{" "}
        <span className="rounded bg-steel-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-steel-400">
          {summary.data_type}
        </span>
      </p>
    </div>
  );
}

function VerdictLegend() {
  return (
    <div className="card grid gap-4 text-xs leading-relaxed text-steel-500 sm:grid-cols-3">
      <div>
        <span className="font-bold uppercase tracking-wide text-steel-300">Valuation</span>
        <p className="mt-1">
          <span className="text-gain">Cheap</span> / <span className="text-steel-400">fair</span> /{" "}
          <span className="text-loss">expensive</span> versus the instrument&apos;s 5-year seasonal
          range.
        </p>
      </div>
      <div>
        <span className="font-bold uppercase tracking-wide text-steel-300">Momentum</span>
        <p className="mt-1">
          <span className="text-gain">Tightening</span> / <span className="text-loss">loosening</span>{" "}
          / <span className="text-steel-400">stable</span> over the last 20 sessions.
        </p>
      </div>
      <div>
        <span className="font-bold uppercase tracking-wide text-steel-300">Physical check</span>
        <p className="mt-1">
          <span className="text-gain">✓ Supported</span> / <span className="text-risk">✗ contradicted</span>{" "}
          / <span className="text-steel-400">◆ mixed</span> against the Balance Engine and Flow Map.
          Contradictions are where the trade — or the trap — lives.
        </p>
      </div>
    </div>
  );
}

function CurveContent() {
  return (
    <div className="space-y-10">
      <CurveSummaryBar />
      <div className="grid gap-4 lg:grid-cols-2">
        <CurveChart />
        <div className="flex flex-col gap-4">
          <VerdictLegend />
          <div className="card flex-1 text-xs leading-relaxed text-steel-500">
            <p>
              <strong className="text-steel-300">Reading the board:</strong> structure before flat
              price. Backwardation with drawing stocks is an earned bull structure; backwardation
              against building physical length (see Brent 6-month) is borrowed strength. Cracks
              tell you which product is pulling crude; freight-adjusted arbs tell you whether the
              price map can physically clear. Marks are indicative desk values — verify with
              licensed exchange data before trading.
            </p>
          </div>
        </div>
      </div>
      <SpreadTable title="Flat price" accent="bg-gold-500" rows={flatPrice} />
      <SpreadTable title="Timespreads" accent="bg-gain" rows={timespreads} />
      <SpreadTable title="Quality & location differentials" accent="bg-risk" rows={differentials} />
      <SpreadTable title="Product cracks" accent="bg-navy-700" rows={cracks} />
      <SpreadTable title="Freight-adjusted arbitrage" accent="bg-loss" rows={arbitrage} />
    </div>
  );
}

export default function CurveMonitorPage() {
  return (
    <>
      <PageHeader
        eyebrow="Trader Toolkit · Module 3 · Premium"
        title="Futures Curve & Spread Dashboard"
        intro="Every spread that matters, marked three ways: cheap / fair / expensive, tightening / loosening, and supported or contradicted by the physical data in Modules 1 and 2. Structure first, flat price second."
      />
      <div className="container-site space-y-10 py-10">
        <PremiumGate
          title="The Curve & Spread Dashboard is for premium subscribers"
          preview={<SpreadTable title="Timespreads" accent="bg-gain" rows={timespreads.slice(0, 3)} />}
        >
          <CurveContent />
        </PremiumGate>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm">
          <span className="text-steel-400">
            The physical checks reference Module 1 (Balance Engine) and Module 2 (Flow Map).
          </span>
          <div className="flex gap-4">
            <Link href="/tools/balance-engine" className="font-semibold text-gold-400 hover:text-gold-300">
              Balance Engine →
            </Link>
            <Link href="/tools/flow-map" className="font-semibold text-gold-400 hover:text-gold-300">
              Flow Map →
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
