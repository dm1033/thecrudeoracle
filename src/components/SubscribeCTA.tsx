import Link from "next/link";
import { SITE } from "@/lib/site";

export default function SubscribeCTA({
  heading = "Get the full intelligence picture",
  body = "Premium members receive the complete dashboard, daily briefings, investment watchlists, company intelligence and the research archive — updated every trading day.",
}: {
  heading?: string;
  body?: string;
}) {
  return (
    <section className="rounded-lg border border-gold-600/40 bg-gradient-to-br from-navy-900 to-ink-900 p-8 text-center sm:p-10">
      <h2 className="text-xl font-bold text-white sm:text-2xl">{heading}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm text-steel-400">{body}</p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/subscribe" className="btn-primary">
          Subscribe Now — {SITE.price}
          {SITE.priceSuffix}
        </Link>
        <Link href="/contact" className="btn-secondary">
          Ask About Premium Intelligence
        </Link>
      </div>
      <p className="mt-4 text-xs text-steel-500">
        Cancel any time. Not financial advice — capital at risk.
      </p>
    </section>
  );
}
