import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMeta(
    "The Crude Oracle is now free",
    "The paid subscription has been retired. No payments are taken and everything on The Crude Oracle is free.",
    "/payment/success"
  ),
  robots: { index: false, follow: false },
};

/**
 * Retained only as a landing point for historic checkout redirects and old
 * receipt emails. No payment is taken anywhere on the site any more, so this
 * page must never imply a charge was made.
 */
export default function PaymentRetiredPage() {
  return (
    <div className="container-site flex min-h-[60vh] items-center justify-center py-16">
      <div className="card max-w-lg p-10 text-center">
        <div aria-hidden className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-5 text-2xl font-bold text-white">The Crude Oracle is now free</h1>
        <p className="mt-3 text-sm leading-relaxed text-steel-400">
          You have reached an old checkout page. The £299.99/month subscription has been retired,
          no payment has been taken, and the full dashboard, daily briefings, watchlists, company
          intelligence, tools and research archive are open to everyone.
        </p>
        <p className="mt-3 text-xs text-steel-500">
          No login or card is required. If you have a question about a historic charge from when
          the subscription was active, please contact us and we will resolve it directly.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/premium-dashboard" className="btn-primary">
            Open the Full Dashboard — Free
          </Link>
          <Link href="/contact" className="btn-secondary">
            Contact us
          </Link>
        </div>
        <p className="mt-6 text-[11px] text-steel-500">
          Not financial advice. Capital at risk. See Terms of Use.
        </p>
      </div>
    </div>
  );
}
