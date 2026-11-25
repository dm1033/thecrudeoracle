import Link from "next/link";
import type { Metadata } from "next";
import DataCardView from "@/components/DataCardView";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import FAQ from "@/components/FAQ";
import BeehiivSignup from "@/components/BeehiivSignup";
import PresentedBy from "@/components/PresentedBy";
import SeaborneTerminalMap from "@/components/viz/SeaborneTerminalMap";
import SpotSpreadTerminal from "@/components/viz/SpotSpreadTerminal";
import SeasonalChart from "@/components/viz/SeasonalChart";
import { getDashboardCards, pickCards } from "@/lib/dashboard-cards";
import { briefings } from "@/lib/data";
import { getEiaSeasonalSuite } from "@/lib/eia-seasonal";
import { getHistoricalSpotSeries } from "@/lib/historical-series";
import { pageMeta } from "@/lib/seo";
import { upcomingReleases } from "@/lib/release-calendar";

export const revalidate = 7200;

export const metadata: Metadata = pageMeta(
  "The Crude Oracle — Daily Brent & WTI Oil Intelligence (Free)",
  "Professional oil and gas intelligence platform — now 100% free: daily crude oil market dashboard, Brent and WTI analysis, gas and LNG signals, OPEC monitoring, UK energy security and investor-focused research.",
  "/",
  { dynamicImage: true }
);

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
    a: "No. Brent, WTI and Henry Hub are delayed public EIA spot prints, with the trade date and source on each card. The site does not display live or real-time prices. Series that need a licence are left without a figure.",
  },
  {
    q: "How much does it cost?",
    a: "Nothing. The Crude Oracle is free. Every dashboard, briefing, watchlist and tool is open.",
  },
  {
    q: "How often is the intelligence updated?",
    a: "Prices, stocks and the dashboard figures are read from public sources such as the EIA and refresh as those sources publish, each with its own date. They are delayed. The watchlist and company-note pages are open, and they currently publish no names or notes.",
  },
];

export default async function HomePage() {
  const [cards, history, seasonal] = await Promise.all([
    getDashboardCards(),
    getHistoricalSpotSeries(),
    getEiaSeasonalSuite(),
  ]);
  const signals = pickCards(cards, ["us-crude", "steo-cops_opec", "wti-positioning", "supply-news", "cushing"], 5);
  const note = briefings[0];
  const releases = upcomingReleases(new Date()).slice(0, 3);

  return (
    <>
      <SeaborneTerminalMap />
      <div className="container-site space-y-px bg-border-hairline py-px">
        <div className="hairline-grid lg:grid-cols-12">
          <section className="bg-canvas lg:col-span-8">
            <header className="flex items-center justify-between border-b border-border-hairline px-4 py-3">
              <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">Brent, WTI, spread, Henry Hub</h2>
              <Link href="/crude-oil-prices" className="font-mono text-[10px] tracking-[0.08em] text-brass">
                PRICES
              </Link>
            </header>
            <SpotSpreadTerminal data={history} />
          </section>
          <aside className="bg-surface-1 p-4 lg:col-span-4">
            <p className="eyebrow">Archive note · {note?.date ?? "—"}</p>
            <h2 className="mt-2 font-serif text-2xl text-ink-primary">{note?.headline ?? "Daily note"}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
              {note?.oil_summary} This briefing is the archived {note?.date} note. It is not a description of today&apos;s prices.
            </p>
            <Link href="/daily" className="mt-4 inline-block font-mono text-[10px] tracking-[0.08em] text-brass">
              DAILY NOTE
            </Link>
            <ul className="mt-6 space-y-2 border-t border-border-hairline pt-4">
              {releases.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 font-mono text-[11px] text-ink-secondary">
                  <span>{item.title}</span>
                  <span className="num text-ink-muted">{item.whenUk}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
        <div className="hairline-grid lg:grid-cols-12">
          <section className="bg-canvas lg:col-span-7">
            <header className="flex items-center justify-between border-b border-border-hairline px-4 py-3">
              <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">EIA five-year stock band</h2>
              <Link href="/eia-weekly" className="font-mono text-[10px] tracking-[0.08em] text-brass">
                WPSR
              </Link>
            </header>
            <SeasonalChart suite={seasonal} />
          </section>
          <section className="bg-surface-1 p-4 lg:col-span-5">
            <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">Supply and demand</h2>
            <div className="mt-3 space-y-3">
              {signals.map((card) => (
                <DataCardView key={card.id} card={card} />
              ))}
            </div>
          </section>
        </div>
      </div>
      <section className="container-site flex flex-wrap gap-2 py-6">
        {["/eia-summary", "/spread brent-wti", "/cot-extremes", "/chokepoint hormuz", "/balance-global"].map((command) => (
          <Link key={command} href={`/desk-bot?cmd=${encodeURIComponent(command)}`} className="border border-border-strong px-3 py-2 font-mono text-[11px] text-brass">
            {command}
          </Link>
        ))}
      </section>
      <div className="container-site space-y-10 pb-16">
        <PresentedBy location="home_sponsor" enquireHref="/advertise" />
        <BeehiivSignup location="home" />
        <FAQ items={FAQ_ITEMS} />
        <DisclaimerBlock />
      </div>
    </>
  );
}
