import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import HeroGlobe from "@/components/HeroGlobe";
import { marketPrices, riskSignals, supplySignals } from "@/lib/data";
import portfolioData from "../../data/virtual-portfolio.json";
import MarketCard from "@/components/MarketCard";
import SignalCardView from "@/components/SignalCardView";
import BottomLineCard from "@/components/BottomLineCard";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import SubscribeCTA from "@/components/SubscribeCTA";
import FAQ from "@/components/FAQ";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta(
  "Crude Oil Intelligence Without the Noise",
  "Professional oil and gas intelligence platform — now 100% free: daily crude oil market dashboard, Brent and WTI analysis, gas and LNG signals, OPEC monitoring, UK energy security, investor-focused research and a transparent $1M virtual portfolio.",
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
  "Full terminal-grade dashboard",
  "Daily crude oil briefing",
  "Crude and gas market intelligence",
  "Investment watchlist",
  "Company intelligence",
  "Supply and demand alerts",
  "OPEC / geopolitical risk monitoring",
  "Research archive",
  "$1M virtual portfolio with full trade journal",
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
    q: "How much does it cost?",
    a: "Nothing. The Crude Oracle is now completely free — the former £299.99/month subscription has been retired and the paywall removed. Every dashboard, briefing, watchlist, tool and the $1M virtual portfolio is open to everyone.",
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
      <section className="relative overflow-hidden border-b border-ink-700 bg-ink-950">
        <div className="pointer-events-none relative h-72 sm:absolute sm:inset-y-0 sm:right-0 sm:h-auto sm:w-[62%] lg:w-[54%]" aria-hidden>
          <HeroGlobe />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,#07090c_0%,rgba(7,9,12,0.78)_34%,rgba(7,9,12,0.08)_58%,transparent_72%)] sm:block"
        />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-24 bg-gradient-to-b from-transparent to-ink-950 sm:block" />
        <div className="container-site relative py-16 text-center sm:py-24 lg:py-28 lg:text-left">
          <div className="mx-auto max-w-xl lg:mx-0">
            <p className="eyebrow">Professional Oil &amp; Gas Intelligence Platform</p>
            <h1 className="h1 mt-4">
              Crude Oil Intelligence <span className="text-gold-400">Without the Noise</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-steel-400 sm:text-lg">
              Daily oil, gas, supply-risk and investment intelligence for investors, traders and
              energy professionals — presented clearly, concisely and with source-backed data.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href="/premium-dashboard" className="btn-primary">
                Open the Full Dashboard — 100% Free
              </Link>
              <Link href="/portfolio/dashboard" className="btn-secondary">
                $1M Portfolio Performance
              </Link>
              <Link href="/oil-truth" className="btn-ghost">
                Read Oil Truth →
              </Link>
            </div>
            <p className="mt-6 text-xs text-steel-500">
              Now 100% free · Terminal-grade dashboard · Daily briefings · Not financial advice
            </p>
          </div>
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
                All free — no paywall
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-steel-400">
                <li>· Full price complex: Brent, WTI, Dubai, NBP, TTF, Henry Hub, LNG marker</li>
                <li>· Supply, demand and risk signal grids</li>
                <li>· Daily briefing and bottom line</li>
                <li>· Investment watchlist and company intelligence</li>
                <li>· Research archive and charts</li>
              </ul>
            </div>
            <Link href="/premium-dashboard" className="btn-primary mt-6 w-full">
              Open the Full Dashboard
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
          <p className="eyebrow">What You Get — Free</p>
          <h2 className="h2 mt-1">Everything below is free for everyone</h2>
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

      {/* Inside the Oracle */}
      <section className="container-site py-14">
        <p className="eyebrow">Inside The Crude Oracle</p>
        <h2 className="h2 mt-1">Built like a professional intelligence desk</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-steel-400">
          Every briefing starts the way a trading desk starts its day: prices, flows, inventories,
          shipping, positioning — cross-checked against primary sources, then distilled into the
          few paragraphs that actually matter.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <figure className="group overflow-hidden rounded-lg border border-ink-700">
            <div className="relative aspect-video">
              <Image
                src="/images/operations-room.png"
                alt="Energy market operations room with global supply maps and price screens"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <figcaption className="border-t border-ink-700 bg-ink-900 p-3 text-xs text-steel-500">
              Global supply, demand and risk — monitored continuously, summarised daily.
            </figcaption>
          </figure>
          <figure className="group overflow-hidden rounded-lg border border-ink-700">
            <div className="relative aspect-video">
              <Image
                src="/images/terminal-desk.png"
                alt="Terminal-grade dual-screen desk showing oil volatility charts and a global supply heatmap"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <figcaption className="border-t border-ink-700 bg-ink-900 p-3 text-xs text-steel-500">
              Terminal-grade clarity — without the terminal-grade noise.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Free access + portfolio performance */}
      <section className="container-site py-14" id="pricing">
        <div className="mx-auto max-w-xl">
          <div className="rounded-xl border border-gold-600/50 bg-gradient-to-b from-ink-800 to-ink-900 p-8 text-center shadow-2xl shadow-gold-600/5">
            <p className="eyebrow">No Plans · No Tiers · No Paywall</p>
            <h2 className="mt-3 text-2xl font-bold text-white">The Crude Oracle is Free</h2>
            <div className="mt-4">
              <span className="text-5xl font-bold tracking-tight text-white">£0</span>
              <span className="text-base text-steel-500">/forever</span>
            </div>
            <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-steel-400">
              {PRICING_FEATURES.map((f) => (
                <li key={f} className="flex gap-2">
                  <span aria-hidden className="text-gold-500">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/premium-dashboard" className="btn-primary mt-8 w-full">
              Open the Full Dashboard — Free
            </Link>
            <p className="mt-4 text-xs text-steel-500">
              The former £299.99/month subscription has been retired. Not financial advice —
              capital at risk.
            </p>
          </div>
        </div>
      </section>

      {/* Free $1M portfolio performance */}
      <section className="border-y border-ink-700 bg-ink-900">
        <div className="container-site py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Free Virtual Trading Account · Paper Trading</p>
              <h2 className="h2 mt-1">The $1,000,000 portfolio — performance in the open</h2>
            </div>
            <Link href="/portfolio/dashboard" className="text-sm font-semibold text-gold-400 hover:text-gold-300">
              Full portfolio dashboard →
            </Link>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-steel-400">
            A transparent paper-trading account run on The Crude Oracle&apos;s own daily
            intelligence — every position journaled with thesis, risk and stop before entry, wins
            and losses both published. Virtual capital only; simulated performance is not a promise
            of future results.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card text-center">
              <p className="text-xs uppercase tracking-widest text-steel-500">Account value</p>
              <p className="mt-2 text-2xl font-bold text-white">
                ${portfolioData.account.current_value.toLocaleString("en-US")}
              </p>
              <p className="mt-1 text-xs text-steel-500">from $1,000,000 virtual start</p>
            </div>
            <div className="card text-center">
              <p className="text-xs uppercase tracking-widest text-steel-500">Return since inception</p>
              <p className={`mt-2 text-2xl font-bold ${portfolioData.account.return_pct >= 0 ? "text-gain" : "text-loss"}`}>
                {portfolioData.account.return_pct >= 0 ? "+" : ""}
                {portfolioData.account.return_pct}%
              </p>
              <p className="mt-1 text-xs text-steel-500">since {portfolioData.meta.inception}</p>
            </div>
            <div className="card text-center">
              <p className="text-xs uppercase tracking-widest text-steel-500">Open positions</p>
              <p className="mt-2 text-2xl font-bold text-white">{portfolioData.account.open_positions}</p>
              <p className="mt-1 text-xs text-steel-500">{portfolioData.account.cash_pct}% held in cash</p>
            </div>
            <div className="card text-center">
              <p className="text-xs uppercase tracking-widest text-steel-500">Max drawdown</p>
              <p className="mt-2 text-2xl font-bold text-white">{portfolioData.account.max_drawdown_pct}%</p>
              <p className="mt-1 text-xs text-steel-500">{portfolioData.account.risk_level}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-steel-500">
            PAPER TRADING — virtual capital only. Educational demonstration, not financial advice.
            Data last updated {portfolioData.account.last_updated.slice(0, 10)} (
            {portfolioData.account.data_type}).
          </p>
        </div>
      </section>

      <section className="border-y border-ink-700 bg-ink-900">
        <div className="container-site flex flex-col items-start justify-between gap-4 py-10 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <p className="eyebrow">Cayman · Bermuda · British Virgin Islands</p>
            <h2 className="h2 mt-1">Offshore asset desks can hire this AI from the UK</h2>
            <p className="mt-2 text-sm leading-relaxed text-steel-400">
              The globe, the desk and the tools on this site are the work. Open to employment
              and relocation from the United Kingdom.
            </p>
          </div>
          <Link href="/offshore" className="btn-primary shrink-0">
            See the hire page
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-site py-14">
        <FAQ items={FAQ_ITEMS} />
      </section>

      <section className="container-site pb-14">
        <SubscribeCTA />
      </section>
    </>
  );
}
