import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import portfolioData from "../../../../data/virtual-portfolio.json";
import type { FundFile } from "@/lib/paper-fund";
import { archiveEntries } from "@/lib/paper-fund";
import PageHeader from "@/components/PageHeader";
import PaperTradingDisclaimer from "@/components/PaperTradingDisclaimer";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import ArchiveBrowser from "@/components/paper-fund/ArchiveBrowser";

const fund = portfolioData as FundFile;

export const metadata: Metadata = pageMeta(
  "Paper Fund Trade Archive",
  "Every Crude Oracle paper-fund decision, including no-trade weeks, winners and losers. Virtual capital only.",
  "/portfolio/archive",
);

export default function ArchivePage() {
  const entries = archiveEntries(fund);
  return (
    <>
      <PageHeader
        eyebrow="Closed trade archive · Permanent"
        title="Every decision stays"
        intro="Search the ledger. Profitable trades, losing trades and weeks that did not trade are all kept. Exit notes are added when a position closes. The original entry is not rewritten."
      />
      <div className="container-site space-y-8 py-10">
        <PaperTradingDisclaimer />
        <ArchiveBrowser entries={entries} />
        <p className="text-xs text-steel-500">
          The retired July 2026 $1,000,000 sample book is stored separately at{" "}
          <span className="font-mono">{fund.meta.prior_fund_archive}</span> and is not mixed into this archive or this NAV.
        </p>
        <Link href="/portfolio/dashboard" className="inline-block text-sm font-semibold text-gold-400 hover:text-gold-300">
          Back to the desk →
        </Link>
        <DisclaimerBlock />
      </div>
    </>
  );
}
