import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMeta(
    "Payment Cancelled",
    "Your checkout was cancelled — no payment was taken.",
    "/payment/cancelled"
  ),
  robots: { index: false, follow: false },
};

export default function PaymentCancelledPage() {
  return (
    <div className="container-site flex min-h-[60vh] items-center justify-center py-16">
      <div className="card max-w-lg p-10 text-center">
        <div aria-hidden className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-risk/15 text-risk">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="mt-5 text-2xl font-bold text-white">Checkout cancelled</h1>
        <p className="mt-3 text-sm leading-relaxed text-steel-400">
          No payment was taken. Your card has not been charged and no subscription was created.
        </p>
        <p className="mt-3 text-sm text-steel-400">
          If something went wrong during checkout, or you have a question before subscribing,
          we&apos;re happy to help.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/subscribe" className="btn-primary">
            Try again — {SITE.price}
            {SITE.priceSuffix}
          </Link>
          <Link href="/contact" className="btn-secondary">
            Contact us
          </Link>
        </div>
        <p className="mt-6 text-[11px] text-steel-500">
          You can keep using the free snapshot, Oil Truth and free research primers meanwhile.
        </p>
      </div>
    </div>
  );
}
