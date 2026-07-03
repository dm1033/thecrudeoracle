import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMeta(
  "Data Disclaimer",
  "The Crude Oracle data disclaimer: data sources may be public, licensed, delayed, manual or indicative. Verify before trading. No liability for errors or omissions.",
  "/data-disclaimer"
);

export default function DataDisclaimerPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Data Disclaimer" />
      <div className="container-site py-10">
        <div className="prose-dark max-w-3xl">
          <h2>1. Nature of the data</h2>
          <p>
            Data displayed on {SITE.name} may be <strong>public, licensed, delayed, manual or
            indicative</strong>. Each data card is labelled with its source, its last-updated
            date/time and a data-type badge (live, delayed, manual, indicative or API
            placeholder). Where a value is marked &ldquo;manual&rdquo; or
            &ldquo;indicative&rdquo;, it is an editorial estimate or a manually transcribed figure
            and must not be treated as a market quotation.
          </p>

          <h2>2. No real-time exchange data</h2>
          <p>
            We do not display live or real-time exchange data unless properly licensed or lawfully
            sourced through an authorised API. Values shown are not suitable for trade execution,
            pricing, settlement or valuation purposes.
          </p>

          <h2>3. Verify before trading</h2>
          <p>
            You must verify all figures against primary sources (for example EIA, IEA, OPEC
            publications, official exchange feeds or your broker&apos;s licensed data) before
            making any trading or investment decision. Never rely on this site as your sole or
            primary source of market data.
          </p>

          <h2>4. No liability for errors or omissions</h2>
          <p>
            To the maximum extent permitted by law, {SITE.name} accepts no liability for errors,
            omissions, delays, interruptions or inaccuracies in any data, or for any loss arising
            from reliance on it.
          </p>

          <h2>5. Third-party and licensed data</h2>
          <p>
            Some data referenced on this site originates from third-party providers and paid
            publications. Paid or licensed data must not be reproduced, redistributed or scraped
            from this site without the relevant licence from its owner. References to sources such
            as EIA, IEA, OPEC, the Energy Institute, UK DESNZ, the North Sea Transition Authority,
            ONS or National Grid ESO identify the origin of public information and do not imply
            endorsement.
          </p>

          <h2>6. Attribution and takedown</h2>
          <p>
            We aim to attribute all sources accurately. If you are a rights holder and believe any
            content is used in error, contact us at {SITE.contactEmail} and we will review it
            promptly.
          </p>

          <p className="text-sm text-steel-500">Last updated: 3 July 2026</p>
        </div>
      </div>
    </>
  );
}
