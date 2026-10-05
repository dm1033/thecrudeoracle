import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import portfolioData from "../../../data/virtual-portfolio.json";
import type { FundFile } from "@/lib/paper-fund";
import PageHeader from "@/components/PageHeader";
import PaperTradingDisclaimer from "@/components/PaperTradingDisclaimer";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import { TradingDesk, OpportunityTable, FundChart } from "@/components/paper-fund/DeskSections";

const fund = portfolioData as FundFile;

export const metadata: Metadata = pageMeta(
  "The Crude Oracle $10,000,000 Paper Fund",
  "A simulated $10,000,000 energy portfolio. Weekly decisions, confidence scores and a permanent ledger. Virtual capital only — not financial advice.",
  "/portfolio",
);

export default function PortfolioPublicPage() {
  const report = fund.weekly_reports[0];
  const journal = fund.trade_log[0];

  return (
    <>
      <PageHeader
        eyebrow="Paper trading · Virtual capital only · Inception 5 October 2026"
        title="The $10,000,000 quantitative paper fund"
        intro="A simulated book that turns The Crude Oracle's energy, shipping, macro, geopolitical and quantitative work into a weekly portfolio. No real capital. Wins and losses stay on the record."
      />
      <div className="container-site space-y-10 py-10">
        <PaperTradingDisclaimer />
        <TradingDesk fund={fund} />
        <FundChart fund={fund} />

        <section className="card border-gold-600/40">
          <h2 className="h3">Week 41 decision</h2>
          <p className="mt-2 text-sm leading-relaxed text-steel-300">{journal.thesis}</p>
          <p className="mt-2 text-sm leading-relaxed text-steel-400">{report.loss_analysis}</p>
          <p className="mt-3 font-mono text-xs text-gold-400">{journal.trade_id}</p>
        </section>

        <OpportunityTable rows={fund.opportunities} detailed={false} />

        <section className="grid gap-4 sm:grid-cols-3">
          <Link href="/portfolio/dashboard" className="card card-hover">
            <h2 className="h3">Trading desk</h2>
            <p className="mt-2 text-sm text-steel-400">Committee, factor scores, rules and the weekly report.</p>
          </Link>
          <Link href="/portfolio/report" className="card card-hover">
            <h2 className="h3">Week 41 report</h2>
            <p className="mt-2 text-sm text-steel-400">The formal inception report. NAV {report.ending_nav.toLocaleString("en-US")}.</p>
          </Link>
          <Link href="/portfolio/archive" className="card card-hover">
            <h2 className="h3">Trade archive</h2>
            <p className="mt-2 text-sm text-steel-400">Every decision, including the ones that made no money and the ones that lost it.</p>
          </Link>
        </section>

        <section className="card">
          <h2 className="h3">The objective</h2>
          <p className="mt-2 text-sm leading-relaxed text-steel-300">{fund.meta.objective}</p>
          <p className="mt-2 text-sm leading-relaxed text-steel-400">
            The Crude Oracle does not promise profits. The July 2026 $1,000,000 sample book is archived and is not part of this NAV.
          </p>
        </section>

        <PaperTradingDisclaimer />
        <DisclaimerBlock />
      </div>
    </>
  );
}
