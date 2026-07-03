import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMeta(
    "Payment Successful — Welcome to The Crude Oracle Premium",
    "Your Crude Oracle Premium subscription is active.",
    "/payment/success"
  ),
  robots: { index: false, follow: false },
};

export default function PaymentSuccessPage() {
  return (
    <div className="container-site flex min-h-[60vh] items-center justify-center py-16">
      <div className="card max-w-lg p-10 text-center">
        <div aria-hidden className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gain/15 text-gain">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-5 text-2xl font-bold text-white">Payment successful</h1>
        <p className="mt-3 text-sm leading-relaxed text-steel-400">
          Welcome to The Crude Oracle Premium. Your subscription is active and you now have access
          to the full dashboard, daily briefings, watchlists, company intelligence and the research
          archive.
        </p>
        <p className="mt-3 text-xs text-steel-500">
          A receipt has been sent to your email by Stripe. Your premium access code follows by
          email while automated account activation is being finalised.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/login" className="btn-primary">
            Activate access
          </Link>
          <Link href="/premium-dashboard" className="btn-secondary">
            Go to Premium Dashboard
          </Link>
        </div>
        <p className="mt-6 text-[11px] text-steel-500">
          Not financial advice. Capital at risk. See Terms of Use and Subscription Terms.
        </p>
      </div>
    </div>
  );
}
