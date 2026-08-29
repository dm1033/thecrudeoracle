import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { FREE_ANNOUNCEMENT } from "@/lib/site";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import FAQ from "@/components/FAQ";

export const metadata: Metadata = pageMeta(
  "Free Access — The Crude Oracle is now 100% free",
  "The Crude Oracle has removed its paywall. The full oil and gas intelligence dashboard, daily briefings, investment watchlist, company intelligence, analysis tools and the $1M virtual portfolio are free for everyone.",
  "/subscribe"
);

const INCLUDED = [
  ["Full terminal-grade dashboard", "/premium-dashboard", "The complete price complex — Brent, WTI, Dubai, NBP, TTF, Henry Hub, LNG marker — with supply, demand and risk signal grids."],
  ["Daily crude oil briefing", "/daily-briefing", "What moved, why, and what matters next — every trading day, source-backed."],
  ["Investment watchlist", "/watchlist", "Monitored names across 12 energy segments. Monitored, never recommended."],
  ["Company intelligence", "/company-intelligence", "Structured notes on production, reserves, balance sheets and catalysts."],
  ["Analysis tools", "/tools", "Balance engine, curve monitor, flow map, positioning, news-to-barrels and hypothesis builder."],
  ["$1M virtual portfolio", "/portfolio/dashboard", "A transparent paper-trading account with full journal, risk rules and published performance — wins and losses both."],
  ["Research library", "/research-library", "Deep-dive notes on supply, demand, LNG, shipping and UK energy security."],
  ["UK energy security", "/uk-energy-security", "Dedicated North Sea, UKCS fiscal and import-dependency coverage."],
] as const;

const FAQ_ITEMS = [
  {
    q: "Is it really all free?",
    a: "Yes. The former £299.99/month premium subscription has been retired and the paywall removed. Every page, dashboard, tool and dataset on The Crude Oracle is now open to everyone, with no card and no account required.",
  },
  {
    q: "What happened to existing paid subscriptions?",
    a: "No new subscriptions are being taken and the payment flow has been removed from the site. Anyone with a historic billing question can reach us via the contact page and we will resolve it directly.",
  },
  {
    q: "Do I still need to log in?",
    a: "No. Content is no longer gated. The login remains only as an optional way to keep an account identity for future features.",
  },
  {
    q: "Is this financial advice?",
    a: "No. The Crude Oracle provides market commentary, research and education for information purposes only. It is not financial advice or a recommendation to transact. The $1M portfolio is paper trading with virtual capital. Capital at risk.",
  },
  {
    q: "How is the site funded if it's free?",
    a: "The Crude Oracle is currently run as an open intelligence project. If that ever changes, it will be announced clearly here first — the data and the disclaimers stay honest either way.",
  },
];

export default function FreeAccessPage() {
  return (
    <>
      <PageHeader
        eyebrow="Free Access"
        title="The paywall is gone. Everything is free."
        intro={FREE_ANNOUNCEMENT}
      />
      <div className="container-site space-y-12 pb-16">
        <section className="mx-auto max-w-xl">
          <div className="rounded-xl border border-gold-600/50 bg-gradient-to-b from-ink-800 to-ink-900 p-8 text-center shadow-2xl shadow-gold-600/5">
            <p className="eyebrow">No Plans · No Tiers · No Card</p>
            <h2 className="mt-3 text-2xl font-bold text-white">Full access for everyone</h2>
            <div className="mt-4">
              <span className="text-5xl font-bold tracking-tight text-white">£0</span>
              <span className="text-base text-steel-500">/forever</span>
            </div>
            <p className="mt-4 text-sm text-steel-400">
              The former £299.99/month subscription has been retired. There is nothing to buy,
              nothing to unlock and nothing to cancel.
            </p>
            <Link href="/premium-dashboard" className="btn-primary mt-6 w-full">
              Open the Full Dashboard — Free
            </Link>
          </div>
        </section>

        <section aria-labelledby="included-h">
          <h2 id="included-h" className="h2">
            What&apos;s included (everything)
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INCLUDED.map(([title, href, body]) => (
              <Link key={href} href={href} className="card card-hover block">
                <h3 className="h3 text-gold-400">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel-500">{body}</p>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="faq-h">
          <h2 id="faq-h" className="sr-only">
            Frequently asked questions
          </h2>
          <FAQ items={FAQ_ITEMS} />
        </section>

        <DisclaimerBlock />
      </div>
    </>
  );
}
