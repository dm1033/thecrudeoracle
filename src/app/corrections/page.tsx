import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMeta(
  "Corrections policy",
  "How to report an error on The Crude Oracle, what gets corrected, and how an EIA revision differs from a correction of our own. Not financial advice.",
  "/corrections"
);

export default function CorrectionsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Corrections policy"
        intro="How an error on The Crude Oracle is reported, corrected and marked."
      />
      <div className="container-site py-10">
        <div className="prose-dark max-w-3xl">
          <h2>1. What this covers</h2>
          <p>
            A correction is a fix to something {SITE.name} published that was wrong: a mistyped figure, a wrong date,
            a mislabelled series, or a statement the sources do not support. It is not a change of view, and it is not
            financial advice.
          </p>

          <h2>2. How to report one</h2>
          <p>
            Email <a href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Correction")}`}>{SITE.contactEmail}</a>{" "}
            with the page address, the text or figure you believe is wrong, and the source you are comparing it with.
            EIA series pages and the Weekly Petroleum Status Report are the right comparison for the morning note and
            the Wednesday stocks page.
          </p>

          <h2>3. What we change</h2>
          <p>
            If the report is right, the page is updated and the correction is noted on that page or in the commit that
            changed it: what was wrong, what it was changed to, and when. A figure is not quietly replaced. Sample and
            placeholder data stay labelled as sample or placeholder. They are not rewritten into a real mark.
          </p>

          <h2>4. EIA revisions</h2>
          <p>
            EIA sometimes revises a published print. The next successful read of the Open Data API shows EIA&apos;s
            revised figure and EIA&apos;s date. That is EIA&apos;s revision, not a correction of a number we calculated
            differently. If we displayed the wrong series, the wrong unit or the wrong date, that is our error and it
            is corrected under section 3.
          </p>

          <h2>5. What we do not do</h2>
          <p>
            We do not backfill a missing EIA read with a desk estimate. We do not add a testimonial, a traffic figure
            or a credential in order to answer a complaint. A disagreement with a conclusion, where the cited figures
            are right, is not corrected as if it were a factual error. The{" "}
            <Link href="/editorial-policy">editorial policy</Link> still applies: sponsors do not review corrections
            before they are published.
          </p>

          <h2>6. Not a regulated complaint scheme</h2>
          <p>
            {SITE.name} is not authorised or regulated by the Financial Conduct Authority. This page is not a
            complaints procedure under FCA rules, and nothing on the site is financial advice. For the status of the
            commentary itself, see the <Link href="/financial-disclaimer">financial disclaimer</Link>.
          </p>
        </div>
        <div className="mt-10">
          <DisclaimerBlock />
        </div>
      </div>
    </>
  );
}