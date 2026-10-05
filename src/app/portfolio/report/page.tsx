import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import portfolioData from "../../../../data/virtual-portfolio.json";
import type { FundFile } from "@/lib/paper-fund";
import { usd } from "@/lib/paper-fund";
import PageHeader from "@/components/PageHeader";
import PaperTradingDisclaimer from "@/components/PaperTradingDisclaimer";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import { Committee, OpportunityTable, WeeklyReportBlock } from "@/components/paper-fund/DeskSections";

const fund = portfolioData as FundFile;

export const metadata: Metadata = pageMeta(
  "Week 41 Paper Fund Report — Inception",
  "The Crude Oracle $10,000,000 paper fund, week 41. Inception NAV, the no-trade decision, and the committee record. Virtual capital only.",
  "/portfolio/report",
);

export default function WeeklyReportPage() {
  const report = fund.weekly_reports[0];
  return (
    <>
      <PageHeader
        eyebrow="The Crude Oracle · $10M quantitative paper fund"
        title={`Weekly report ${report.id}`}
        intro={`${report.title}. Starting NAV ${usd(report.starting_nav)}. Ending NAV ${usd(report.ending_nav)}. Decision: ${report.decision}.`}
      />
      <div className="container-site space-y-12 py-10">
        <PaperTradingDisclaimer />
        <WeeklyReportBlock fund={fund} />
        <OpportunityTable rows={fund.opportunities} />
        <Committee fund={fund} />
        <p className="text-sm text-steel-400">
          Total P&L since inception {usd(fund.account.current_value - fund.account.starting_value, true)}. Total return {fund.account.return_pct.toFixed(2)}%.
          Open positions {fund.account.open_positions}. Realised {usd(fund.account.realised_pl, true)}. Unrealised {usd(fund.account.unrealised_pl, true)}.
        </p>
        <Link href="/portfolio/dashboard" className="inline-block text-sm font-semibold text-gold-400 hover:text-gold-300">
          Open the trading desk →
        </Link>
        <PaperTradingDisclaimer />
        <DisclaimerBlock />
      </div>
    </>
  );
}
