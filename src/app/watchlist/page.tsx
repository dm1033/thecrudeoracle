import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { watchlistCategories, watchlistCompanies, type WatchlistCompany } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import PremiumGate from "@/components/PremiumGate";
import { WatchlistPerformanceChart } from "@/components/charts/Charts";

export const metadata: Metadata = pageMeta(
  "Investment Watchlist — Oil & Gas Equities",
  "The Crude Oracle oil and gas investment watchlist: upstream producers, LNG, midstream, oilfield services, drillers, tankers, refiners and North Sea names. Monitored, not recommended.",
  "/watchlist"
);

function CompanyCard({ c }: { c: WatchlistCompany }) {
  return (
    <div className="card card-hover flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white">{c.company}</h3>
          <p className="mt-0.5 font-mono text-[11px] text-steel-500">
            {c.ticker} · {c.exchange} · {c.country}
          </p>
        </div>
        <span className="whitespace-nowrap rounded bg-navy-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-steel-300">
          {c.status}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div>
          <dt className="text-steel-500">Sector</dt>
          <dd className="text-steel-300">{c.sector}</dd>
        </div>
        <div>
          <dt className="text-steel-500">Market cap</dt>
          <dd className="text-steel-300">{c.market_cap}</dd>
        </div>
        <div>
          <dt className="text-steel-500">Dividend yield</dt>
          <dd className="text-steel-300">{c.dividend_yield}</dd>
        </div>
        <div>
          <dt className="text-steel-500">Commodity exposure</dt>
          <dd className="text-steel-300">{c.commodity_exposure}</dd>
        </div>
      </dl>
      <div className="mt-3 space-y-2 text-xs leading-relaxed">
        <p>
          <span className="font-semibold text-gold-500">Thesis: </span>
          <span className="text-steel-400">{c.investment_theme}</span>
        </p>
        <p>
          <span className="font-semibold text-steel-300">Catalyst: </span>
          <span className="text-steel-400">{c.catalyst}</span>
        </p>
        <p>
          <span className="font-semibold text-loss">Key risks: </span>
          <span className="text-steel-400">{c.risk}</span>
        </p>
        <p>
          <span className="font-semibold text-steel-300">Balance sheet: </span>
          <span className="text-steel-400">{c.debt_note}</span>
        </p>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink-700 pt-2 text-[11px] text-steel-500">
        <span>
          Source:{" "}
          <a href={c.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-gold-400">
            {c.source}
          </a>
        </span>
        <span>Updated: {c.last_updated}</span>
        <span className="rounded bg-risk/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-risk">
          Watchlist, not recommendation
        </span>
      </div>
    </div>
  );
}

function WatchlistContent() {
  return (
    <div className="space-y-10">
      <WatchlistPerformanceChart />
      {watchlistCategories.map((cat) => {
        const companies = watchlistCompanies.filter((c) => c.category === cat);
        if (companies.length === 0) return null;
        return (
          <section key={cat} aria-label={cat}>
            <h2 className="h2">{cat}</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {companies.map((c) => (
                <CompanyCard key={c.ticker} c={c} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function WatchlistPage() {
  return (
    <>
      <PageHeader
        eyebrow="Premium · Monitored Names, Not Recommendations"
        title="Investment Watchlist"
        intro="Curated oil and gas equities across twelve segments, each with thesis, catalyst, risks and sources. Every entry is a monitored name — never a recommendation to buy, sell or hold."
      />
      <div className="container-site space-y-10 py-10">
        <PremiumGate
          title="The full watchlist is for premium subscribers"
          preview={
            <div className="grid gap-4 lg:grid-cols-2">
              {watchlistCompanies.slice(0, 2).map((c) => (
                <CompanyCard key={c.ticker} c={c} />
              ))}
            </div>
          }
        >
          <WatchlistContent />
        </PremiumGate>
        <DisclaimerBlock />
      </div>
    </>
  );
}
