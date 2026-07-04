import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { pageMeta } from "@/lib/seo";
import { SITE, STRIPE_SUBSCRIPTION_LINK, STRIPE_LINK_IS_PLACEHOLDER } from "@/lib/site";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import FAQ from "@/components/FAQ";

export const metadata: Metadata = pageMeta(
  "Subscribe — The Crude Oracle Premium at £299.99/month",
  "Subscribe to The Crude Oracle Premium: terminal-grade oil and gas dashboard, daily crude briefings, investment watchlists, company intelligence and the research archive. £299.99 per month via Stripe.",
  "/subscribe"
);

const FEATURES = [
  "Premium terminal-grade dashboard",
  "Daily crude oil briefing — every trading day",
  "Crude and gas market intelligence",
  "Investment watchlist across 12 segments",
  "Company intelligence notes",
  "Supply and demand alerts",
  "OPEC / geopolitical risk monitoring",
  "Research archive access",
  "Premium subscriber-only analysis",
];

const FAQ_ITEMS = [
  {
    q: "How does billing work?",
    a: "Subscriptions are billed monthly at £299.99 via Stripe, our payment processor. Your card details are handled entirely by Stripe — The Crude Oracle never sees or stores them.",
  },
  {
    q: "Can I cancel?",
    a: "Yes, at any time from your Stripe-hosted billing portal or by contacting us. Access continues to the end of the period already paid. See Subscription Terms for details.",
  },
  {
    q: "Is this financial advice?",
    a: "No. Membership provides market commentary, research and education for information purposes only. It is not financial advice or a recommendation to transact. Capital at risk.",
  },
  {
    q: "Do you offer team or enterprise access?",
    a: "Contact us via the contact page for multi-seat arrangements.",
  },
];

const subscribeSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "The Crude Oracle Premium",
  description:
    "Premium oil and gas intelligence subscription: daily briefings, terminal-grade dashboard, watchlists, company intelligence and research archive.",
  offers: {
    "@type": "Offer",
    price: "299.99",
    priceCurrency: "GBP",
    url: `${SITE.url}/subscribe`,
  },
};

export default function SubscribePage() {
  return (
    <>
      <PageHeader
        eyebrow="Membership"
        title="The Crude Oracle Premium"
        intro="One plan. Everything included. Daily oil, gas, supply-risk and investment intelligence for people who take energy markets seriously."
      />
      <div className="container-site py-10">
        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-xl border border-gold-600/50 bg-gradient-to-b from-ink-800 to-ink-900">
              <div className="relative aspect-[21/9]">
                <Image
                  src="/images/operations-room.png"
                  alt="Professional energy intelligence operations room with global market screens"
                  fill
                  priority
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink-900 to-transparent" />
              </div>
              <div className="p-8 pt-4">
              <h2 className="text-xl font-bold text-white">What&apos;s included</h2>
              <ul className="mt-5 space-y-3 text-sm text-steel-300">
                {FEATURES.map((f) => (
                  <li key={f} className="flex gap-3">
                    <span aria-hidden className="mt-0.5 text-gold-500">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs leading-relaxed text-steel-500">
                Members also receive priority responses to research questions and early access to
                new coverage areas as the platform expands.
              </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-xl border border-ink-600 bg-ink-850 p-8 text-center">
              <p className="eyebrow">Single Plan</p>
              <div className="mt-3">
                <span className="text-5xl font-bold tracking-tight text-white">{SITE.price}</span>
                <span className="text-base text-steel-500">{SITE.priceSuffix}</span>
              </div>
              <p className="mt-2 text-xs text-steel-500">Billed monthly via Stripe · Cancel any time</p>

              <a
                href={STRIPE_SUBSCRIPTION_LINK}
                className="btn-primary mt-6 w-full"
                rel="noopener noreferrer"
              >
                Subscribe — {SITE.price}
                {SITE.priceSuffix}
              </a>

              {STRIPE_LINK_IS_PLACEHOLDER && (
                <p className="mt-3 rounded border border-risk/40 bg-risk/10 p-2 text-[11px] text-risk">
                  Setup note: the Stripe Payment Link is still a placeholder. Replace{" "}
                  <code className="font-mono">STRIPE_SUBSCRIPTION_LINK</code> in{" "}
                  <code className="font-mono">src/lib/site.ts</code> with your live £299.99/month
                  Payment Link (see README_DEPLOYMENT.md).
                </p>
              )}

              <p className="mt-4 text-[11px] leading-relaxed text-steel-500">
                Payments are processed by Stripe. After payment you&apos;ll land on the{" "}
                <Link href="/payment/success" className="underline">
                  success page
                </Link>
                ; if you cancel checkout you&apos;ll return to the{" "}
                <Link href="/payment/cancelled" className="underline">
                  cancelled page
                </Link>
                .
              </p>
              <p className="mt-3 text-[11px] text-steel-500">
                Already a member?{" "}
                <Link href="/login" className="text-gold-400 underline">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-4xl space-y-10">
          <FAQ items={FAQ_ITEMS} />
          <DisclaimerBlock />
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(subscribeSchema) }} />
    </>
  );
}
