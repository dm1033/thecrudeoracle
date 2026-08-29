import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMeta(
  "Subscription Terms",
  "The paid subscription has been retired — The Crude Oracle is now 100% free. Historic terms are preserved below for reference.",
  "/subscription-terms"
);

export default function SubscriptionTermsPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Subscription Terms" />
      <div className="container-site py-10">
        <div className="prose-dark max-w-3xl">
          <div className="not-prose mb-8 rounded-lg border border-gold-600/40 bg-navy-900/40 p-6">
            <p className="text-sm font-semibold text-gold-400">
              Notice — the paid subscription has been retired
            </p>
            <p className="mt-2 text-sm text-steel-400">
              The Crude Oracle is now 100% free. No new subscriptions are taken and no payments are
              collected. The historic terms below are preserved for reference only and apply solely
              to any past paid period. Questions about a historic charge? Contact us and we will
              resolve it directly.
            </p>
          </div>
          <h2>1. The plan (historic)</h2>
          <p>
            The Crude Oracle Premium costs <strong>£299.99 per month</strong>, billed monthly in
            advance via Stripe. The plan includes the premium dashboard, daily briefings,
            investment watchlist, company intelligence, supply/demand alerts, OPEC and geopolitical
            risk monitoring, the research archive and premium subscriber-only analysis.
          </p>

          <h2>2. Billing</h2>
          <p>
            Payments are processed by Stripe. By subscribing you authorise recurring monthly
            charges to your payment method until you cancel. Prices include applicable VAT where
            required; your invoice from Stripe is your receipt. We never see or store your card
            details.
          </p>

          <h2>3. Cancellation</h2>
          <p>
            You may cancel at any time via the Stripe billing portal or by contacting{" "}
            {SITE.contactEmail}. Cancellation stops future renewals; access continues until the end
            of the period already paid. No minimum term.
          </p>

          <h2>4. Refunds</h2>
          <p>
            Monthly fees already charged are generally non-refundable once the billing period has
            begun, except where required by law or where we choose to refund at our discretion
            (for example, duplicate charges or extended service failure). Statutory rights are
            unaffected.
          </p>

          <h2>5. Fair use and account sharing</h2>
          <p>
            Membership is personal to you. Credential sharing, redistribution of member content or
            bulk downloading breaches these terms and may result in suspension or termination (see{" "}
            <Link href="/terms-of-use">Terms of Use</Link>).
          </p>

          <h2>6. Price changes</h2>
          <p>
            We may change the subscription price with at least 30 days&apos; notice by email;
            changes apply from your next renewal after the notice period. If you do not accept a
            change, cancel before it takes effect.
          </p>

          <h2>7. Service changes and availability</h2>
          <p>
            We continually develop the platform and may add, modify or retire features. We aim for
            daily updates each trading day but do not guarantee uninterrupted availability or a
            fixed publication schedule.
          </p>

          <h2>8. No advice</h2>
          <p>
            Membership provides market commentary, research and education for information purposes
            only — not financial advice or recommendations. See the{" "}
            <Link href="/financial-disclaimer">Financial Disclaimer</Link>. Capital at risk.
          </p>

          <p className="text-sm text-steel-500">Last updated: 3 July 2026</p>
        </div>
      </div>
    </>
  );
}
