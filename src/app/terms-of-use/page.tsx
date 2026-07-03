import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMeta(
  "Terms of Use",
  "Terms of use for The Crude Oracle: licence, acceptable use, intellectual property, subscriptions and limitation of liability.",
  "/terms-of-use"
);

export default function TermsOfUsePage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms of Use" />
      <div className="container-site py-10">
        <div className="prose-dark max-w-3xl">
          <h2>1. Agreement</h2>
          <p>
            These Terms of Use govern your access to and use of {SITE.name} at {SITE.domain} (the
            &ldquo;Site&rdquo;). By using the Site you agree to these terms, the{" "}
            <Link href="/privacy-policy">Privacy Policy</Link>, the{" "}
            <Link href="/financial-disclaimer">Financial Disclaimer</Link>, the{" "}
            <Link href="/data-disclaimer">Data Disclaimer</Link> and, if you subscribe, the{" "}
            <Link href="/subscription-terms">Subscription Terms</Link>.
          </p>

          <h2>2. Information only — no advice</h2>
          <p>
            The Site provides market commentary, educational content and investment research for
            information purposes only. It is not financial advice, investment advice, tax advice
            or a recommendation to buy, sell or hold any security, commodity, derivative, fund or
            financial product. Trading and investing involve risk, including loss of capital.
          </p>

          <h2>3. Licence and acceptable use</h2>
          <p>
            We grant you a personal, non-exclusive, non-transferable licence to access the Site
            and, if subscribed, member content, for your own internal use. You must not:
          </p>
          <ul>
            <li>share, resell, redistribute or republish member content without written permission;</li>
            <li>share login credentials or circumvent access controls;</li>
            <li>scrape, crawl or bulk-download content or data;</li>
            <li>use content to train commercial datasets or products without licence;</li>
            <li>use the Site unlawfully or to infringe third-party rights.</li>
          </ul>

          <h2>4. Intellectual property</h2>
          <p>
            All content, branding, design and compilations on the Site are owned by or licensed to{" "}
            {SITE.name} and protected by intellectual property laws. Third-party names, data and
            publications remain the property of their owners.
          </p>

          <h2>5. Subscriptions</h2>
          <p>
            Paid membership is provided under the <Link href="/subscription-terms">Subscription Terms</Link>.
            Payments are processed by Stripe; we do not store card details.
          </p>

          <h2>6. Availability and changes</h2>
          <p>
            We aim for high availability but do not guarantee uninterrupted access. We may modify,
            suspend or discontinue any part of the Site, and may update these terms by posting a
            revised version with a new date.
          </p>

          <h2>7. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, {SITE.name} shall not be liable for any
            indirect, incidental, special or consequential loss, loss of profits, loss of data or
            trading losses arising from use of, or inability to use, the Site or its content.
            Nothing in these terms excludes liability that cannot be excluded by law.
          </p>

          <h2>8. Governing law</h2>
          <p>
            These terms are governed by the laws of England and Wales, and the courts of England
            and Wales have exclusive jurisdiction.
          </p>

          <h2>9. Contact</h2>
          <p>
            Questions about these terms: {SITE.contactEmail} or via the{" "}
            <Link href="/contact">contact page</Link>.
          </p>

          <p className="text-sm text-steel-500">Last updated: 3 July 2026</p>
        </div>
      </div>
    </>
  );
}
