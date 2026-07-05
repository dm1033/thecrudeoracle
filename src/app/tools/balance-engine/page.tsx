import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import balanceData from "../../../../data/balance-engine.json";
import PageHeader from "@/components/PageHeader";
import BalanceTable, { type BalanceRow } from "@/components/BalanceTable";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import PremiumGate from "@/components/PremiumGate";
import { formatUpdated } from "@/lib/data";

export const metadata: Metadata = pageMeta(
  "Global Balance Engine — Oil Supply, Demand & Stocks Table",
  "Module 1 of The Crude Oracle trader toolkit: the global oil balance in one live table — OPEC and non-OPEC supply, sanctioned barrels, outages, refinery runs, China/India imports, OECD demand, US and OECD stocks, Cushing and floating storage.",
  "/tools/balance-engine"
);

const supply = balanceData.supply as BalanceRow[];
const demand = balanceData.demand as BalanceRow[];
const stocks = balanceData.stocks as BalanceRow[];
const summary = balanceData.balance_summary;

function BalanceSummaryBar() {
  const deficit = summary.implied_balance < 0;
  return (
    <div className="rounded-lg border border-gold-600/40 bg-gradient-to-r from-navy-900 to-ink-900 p-5">
      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">
            Total supply
          </div>
          <div className="num mt-1 text-2xl font-bold text-white">
            {summary.total_supply.toFixed(1)}
            <span className="ml-1 text-xs font-normal text-steel-500">{summary.unit}</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">
            Total demand
          </div>
          <div className="num mt-1 text-2xl font-bold text-white">
            {summary.total_demand.toFixed(1)}
            <span className="ml-1 text-xs font-normal text-steel-500">{summary.unit}</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">
            Implied balance
          </div>
          <div className={`num mt-1 text-2xl font-bold ${deficit ? "text-gain" : "text-loss"}`}>
            {summary.implied_balance > 0 ? "+" : ""}
            {summary.implied_balance.toFixed(1)}
            <span className="ml-1 text-xs font-normal text-steel-500">{summary.unit}</span>
          </div>
          <div className={`text-[10px] font-semibold uppercase ${deficit ? "text-gain" : "text-loss"}`}>
            {deficit ? "Deficit — stocks drawing" : "Surplus — stocks building"}
          </div>
        </div>
        <div className="sm:col-span-1">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">
            Desk read
          </div>
          <p className="mt-1 text-xs leading-relaxed text-steel-400">{summary.comment}</p>
        </div>
      </div>
      <p className="mt-4 border-t border-ink-700 pt-2 text-[11px] text-steel-500">
        Source: {summary.source} · Updated: {formatUpdated(summary.last_updated)} ·{" "}
        <span className="rounded bg-steel-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-steel-400">
          {summary.data_type}
        </span>
      </p>
    </div>
  );
}

function EngineContent() {
  return (
    <div className="space-y-10">
      <BalanceSummaryBar />
      <BalanceTable title="Supply" accent="bg-gold-500" rows={supply} />
      <BalanceTable title="Demand" accent="bg-gain" rows={demand} />
      <BalanceTable title="Stocks" accent="bg-risk" rows={stocks} />
      <div className="card text-xs leading-relaxed text-steel-500">
        <p>
          <strong className="text-steel-300">How to read this table:</strong> the oil price is set
          at the margin by the gap between supply and demand, which shows up — with a lag — in
          stocks. When the implied balance is negative, inventories draw and the curve tends to
          firm; when positive, they build and the front weakens. Price impact flags read each row
          from the price&apos;s perspective: less supply or more demand is bullish, and vice versa.
          Values are indicative and manually updated from the cited public sources — verify before
          trading.
        </p>
      </div>
    </div>
  );
}

export default function BalanceEnginePage() {
  return (
    <>
      <PageHeader
        eyebrow="Trader Toolkit · Module 1 · Premium"
        title="Global Balance Engine"
        intro="The entire oil balance on one screen: supply, demand and stocks with desk notes, price-impact flags, sources and timestamps. For traders whose edge is the fundamental balance."
      />
      <div className="container-site space-y-10 py-10">
        <PremiumGate
          title="The Balance Engine is for premium subscribers"
          preview={<BalanceTable title="Supply" accent="bg-gold-500" rows={supply.slice(0, 3)} />}
        >
          <EngineContent />
        </PremiumGate>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm">
          <span className="text-steel-400">
            More modules in the trader toolkit are in development.
          </span>
          <Link href="/tools" className="font-semibold text-gold-400 hover:text-gold-300">
            View all tools →
          </Link>
        </div>

        <DisclaimerBlock />
      </div>
    </>
  );
}
