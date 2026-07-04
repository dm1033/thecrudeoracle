import Link from "next/link";
import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { marketPrices, riskSignals, supplySignals } from "@/lib/data";
import MarketCard from "@/components/MarketCard";
import SignalCardView from "@/components/SignalCardView";
import BottomLineCard from "@/components/BottomLineCard";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import SubscribeCTA from "@/components/SubscribeCTA";
import FAQ from "@/components/FAQ";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta(
  "Crude Oil Intelligence Without the Noise",
  "Professional oil and gas intelligence platform: daily crude oil market dashboard, Brent and WTI analysis, gas and LNG signals, OPEC monitoring, UK energy security and investor-focused research. £299.99/month.",
  "/"
);

const MEMBER_BENEFITS = [
  ["Daily market briefings", "Concise, source-backed crude oil and gas briefings every trading day — what moved, why, and what matters next."],
  ["Oil and gas watchlists", "Curated watchlists across upstream, LNG, midstream, services, shipping and North Sea names. Monitored, never recommended."],
  ["Supply risk alerts", "OPEC+ decisions, inventory surprises, shipping disruption and geopolitical risk flagged as they develop."],
  ["Company intelligence", "Structured notes on production, reserves, balance sheets, valuation context and catalysts."],
  ["Investment themes", "Multi-week themes across the energy complex, explained in plain English with the evidence behind them."],
  ["Concise explanations", "Terminal-grade data, explained clearly — no noise, no filler, no jargon walls."],
  ["Research library", "A growing archive of deep-dive notes on supply, demand, LNG, shipping and UK energy security."],
  ["Oil market education", "From inventory reports to spare capacity: learn to read the oil market like a professional."],
  ["UK energy security analysis", "Dedicated coverage of the North Sea, UKCS fiscal policy and Britain's import dependency."],
] as const;

const PRICING_FEATURES = [
  "Premium terminal-grade dashboard",
  "Daily crude oil briefing",
  "Crude and gas market intelligence",
  "Investment watchlist",
  "Company intelligence",
  "Supply and demand alerts",
  "OPEC / geopolitical risk monitoring",
  "Research archive",
  "Premium subscriber-only analysis",
];

const FAQ_ITEMS = [
  {
    q: "Is The Crude Oracle financial advice?",
    a: "No. The Crude Oracle provides market commentary, educational content and investment research for information purposes only. It is not financial advice, investment advice or a recommendation to buy, sell or hold any security or commodity. Always do your own research and consult a regulated financial adviser where appropriate.",
  },
  {
    q: "Who is the platform for?",
    a: "Investors, traders and energy professionals who want daily crude oil, gas and energy-security intelligence presented clearly and concisely, without the noise of general financial media.",
  },
  {
    q: "Is the market data live?",
    a: "No. Data is labelled on every card as manual, delayed, indicative or an API placeholder, with its source and last-updated time. We do not display unlicensed real-time exchange data. Verify all figures with primary sources before trading.",
  },
  {
    q: "How much does it cost and can I cancel?",
    a: "The Crude Oracle Premium is £299.99 per month, billed via Stripe. You can cancel at any time and retain access until the end of the paid period. See the Subscription Terms for details.",
  },
  {
    q: "How often is the intelligence updated?",
    a: "The daily briefing, dashboard signals and bottom line are updated every trading day. Watchlist and company intelligence notes are refreshed as events warrant, each stamped with its last-updated date.",
  },
];

export default function HomePage() {
  const heroPrices = marketPrices.slice(0, 6);
  const previewSignals = [...riskSignals.slice(0, 2), supplySignals[1], supplySignals[2]];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink-700 bg-gradient-to-b from-navy-900 via-ink-950 to-ink-950">
        <div className="container-site py-16 text-center sm:py-24">
          <p className="eyebrow">Professional Oil &amp; Gas Intelligence Platform</p>
          <h1 className="h1 mx-auto mt-4 max-w-4xl">
            Crude Oil Intelligence <span className="text-gold-400">Without the Noise</span>
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-steel-400 sm:text-lg">
            Daily oil, gas, supply-risk and investment intelligence for investors, traders and
            energy professionals — presented clearly, concisely and with source-backed data.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/subscribe" className="btn-primary">
              Subscribe — {SITE.price}
              {SITE.priceSuffix}
            </Link>
            <Link href="/dashboard" className="btn-secondary">
              View Today&apos;s Free Market Snapshot
            </Link>
            <Link href="/oil-truth" className="btn-ghost">
              Read Oil Truth →
            </Link>
          </div>
          <p className="mt-6 text-xs text-steel-500">
            Terminal-grade market dashboard · Daily briefings · Not financial advice
          </p>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="container-site py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Terminal-Grade Market Dashboard</p>
            <h2 className="h2 mt-1">Today&apos;s market picture, at a glance</h2>
          </div>
          <Link href="/dashboard" className="text-sm font-semibold text-gold-400 hover:text-gold-300">
            Full free snapshot →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {heroPrices.map((p) => (
            <MarketCard key={p.ticker} price={p} />
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {previewSignals.map((s) => (
            <SignalCardView key={s.id} card={s} />
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <BottomLineCard />
          </div>
          <div className="card flex flex-col justify-between border-navy-700 bg-navy-900/40">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-gold-500">
                Premium unlocks
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-steel-400">
                <li>· Full price complex: Brent, WTI, Dubai, NBP, TTF, Henry Hub, LNG marker</li>
                <li>· Supply, demand and risk signal grids</li>
                <li>· Daily briefing and bottom line</li>
                <li>· Investment watchlist and company intelligence</li>
                <li>· Research archive and charts</li>
              </ul>
            </div>
            <Link href="/subscribe" className="btn-primary mt-6 w-full">
              Unlock Premium
            </Link>
          </div>
        </div>
        <div className="mt-6">
          <DisclaimerBlock />
        </div>
      </section>

      {/* Why subscribe */}
      <section className="border-y border-ink-700 bg-ink-900">
        <div className="container-site py-14">
          <p className="eyebrow">Why Subscribe</p>
          <h2 className="h2 mt-1">What members receive</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MEMBER_BENEFITS.map(([title, body]) => (
              <div key={title} className="card card-hover">
                <h3 className="h3">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container-site py-14" id="pricing">
        <div className="mx-auto max-w-xl">
          <div className="rounded-xl border border-gold-600/50 bg-gradient-to-b from-ink-800 to-ink-900 p-8 text-center shadow-2xl shadow-gold-600/5">
            <p className="eyebrow">Single Plan · No Tiers · No Upsells</p>
            <h2 className="mt-3 text-2xl font-bold text-white">The Crude Oracle Premium</h2>
            <div className="mt-4">
              <span className="text-5xl font-bold tracking-tight text-white">{SITE.price}</span>
              <span className="text-base text-steel-500">{SITE.priceSuffix}</span>
            </div>
            <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-steel-400">
              {PRICING_FEATURES.map((f) => (
                <li key={f} className="flex gap-2">
                  <span aria-hidden className="text-gold-500">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/subscribe" className="btn-primary mt-8 w-full">
              Subscribe Now — {SITE.price}
              {SITE.priceSuffix}
            </Link>
            <p className="mt-4 text-xs text-steel-500">
              Billed monthly via Stripe. Cancel any time. Not financial advice — capital at risk.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-site pb-14">
        <FAQ items={FAQ_ITEMS} />
      </section>

      <section className="container-site pb-14">
        <SubscribeCTA />
      </section>
    </>
  );
}
