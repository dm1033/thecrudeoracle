import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import SubscribeCTA from "@/components/SubscribeCTA";

export const metadata: Metadata = pageMeta(
  "About — The Crude Oracle",
  "The Crude Oracle is a professional oil and gas intelligence platform: daily crude, gas and energy-security intelligence for investors, traders and energy professionals — clear, concise and source-backed.",
  "/about"
);

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Who We Are"
        title="About The Crude Oracle"
        intro="A professional oil and gas intelligence platform built on one belief: serious investors deserve terminal-grade data, explained clearly, without the noise."
      />
      <div className="container-site space-y-10 py-10">
        <div className="prose-dark max-w-3xl">
          <h2>What we do</h2>
          <p>
            The Crude Oracle publishes daily crude oil, gas, energy-security and investment
            intelligence for investors, traders and energy professionals. Every trading day we
            distil the oil and gas complex into a briefing you can read in minutes: what moved,
            why it moved, what matters next.
          </p>

          <h2>How we work</h2>
          <ul>
            <li>
              <strong>Source-backed:</strong> every data card cites its source, timestamp and
              licence status. We draw on public agencies (EIA, IEA, OPEC publications, UK DESNZ,
              the North Sea Transition Authority, ONS, the Energy Institute) and primary company
              disclosures.
            </li>
            <li>
              <strong>Clear over clever:</strong> we write for decision-makers. Short sections,
              plain English, no jargon walls, no filler.
            </li>
            <li>
              <strong>Independent:</strong> we monitor companies; we never recommend them. Every
              watchlist entry carries a &ldquo;watchlist, not recommendation&rdquo; label.
            </li>
            <li>
              <strong>Honest about data:</strong> we do not display unlicensed real-time exchange
              data. Values are labelled live, delayed, manual or indicative — always.
            </li>
          </ul>

          <h2>What we are not</h2>
          <p>
            The Crude Oracle is not a regulated financial adviser and does not provide financial
            advice, investment advice or recommendations to buy, sell or hold anything. We provide
            market commentary, research and education so you can make your own decisions — with a
            regulated adviser where appropriate. See our{" "}
            <Link href="/financial-disclaimer">Financial Disclaimer</Link>.
          </p>

          <h2>Coverage</h2>
          <p>
            Crude benchmarks (Brent, WTI, Dubai) · European and UK gas (TTF, NBP) · US gas (Henry
            Hub) · LNG and shipping · OPEC+ and supply risk · demand signals · energy equities
            across twelve segments · UK energy security and the North Sea.
          </p>
        </div>
        <SubscribeCTA />
        <DisclaimerBlock />
      </div>
    </>
  );
}
