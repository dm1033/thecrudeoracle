import Link from "next/link";

/**
 * Formerly the paid-subscription CTA. The Crude Oracle is now 100% free, so
 * this renders the free-access announcement instead. Props are accepted but
 * ignored so existing call sites keep working unchanged.
 */
export default function SubscribeCTA(_props: { heading?: string; body?: string }) {
  return (
    <section className="rounded-lg border border-gold-600/40 bg-gradient-to-br from-navy-900 to-ink-900 p-8 text-center sm:p-10">
      <p className="text-xs font-bold uppercase tracking-widest text-gold-500">Now 100% Free</p>
      <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
        Everything on The Crude Oracle is free
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm text-steel-400">
        The paywall has been removed. The full dashboard, daily briefings, investment watchlist,
        company intelligence, every analysis tool and the $1,000,000 virtual portfolio are open to
        everyone — no card, no account required.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/premium-dashboard" className="btn-primary">
          Open the Full Dashboard — Free
        </Link>
        <Link href="/portfolio/dashboard" className="btn-secondary">
          See the $1M Portfolio Performance
        </Link>
      </div>
      <p className="mt-4 text-xs text-steel-500">
        Not financial advice — capital at risk. All data labelled with source and freshness.
      </p>
    </section>
  );
}
