import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import portfolioData from "../../../data/virtual-portfolio.json";
import PageHeader from "@/components/PageHeader";
import PaperTradingDisclaimer from "@/components/PaperTradingDisclaimer";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMeta(
  "Follow The Crude Oracle $1,000,000 Virtual Oil Portfolio",
  "A transparent paper-trading demonstration showing how daily oil, gas and energy intelligence can be turned into a disciplined investment process. Virtual capital only — not financial advice.",
  "/portfolio"
);

const account = portfolioData.account;
const meta = portfolioData.meta;

const VALUE_POINTS = [
  ["Structured daily oil intelligence", "One process every trading day: prices, supply, demand, inventories, risk — then decisions."],
  ["Fewer emotional decisions", "Every paper trade is journaled with thesis, risk and invalidation before entry — no hindsight edits."],
  ["Risk-controlled trade ideas", "Position caps, 1–2% risk per trade, a drawdown ladder and a minimum cash reserve, enforced in writing."],
  ["Transparent trade journaling", "Wins and losses both published. No hidden losses, no cherry-picked results."],
  ["Faster market understanding", "Each decision links to the module that produced it — balance, flows, curve, positioning, news."],
  ["Visible performance tracking", "Benchmarked monthly against Brent, WTI and a broad energy ETF, drawdowns included."],
] as const;

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="card text-center">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">{label}</div>
      <div className={`num mt-1 text-2xl font-bold ${accent ?? "text-white"}`}>{value}</div>
    </div>
  );
}

export default function PortfolioPublicPage() {
  const example = portfolioData.trade_log[2]; // the capped speculative example
  const closed = portfolioData.closed_trades[0];

  return (
    <>
      <PageHeader
        eyebrow="Paper Trading Demonstration · Virtual Capital Only"
        title="Follow The Crude Oracle $1,000,000 Virtual Oil Portfolio"
        intro="A transparent paper-trading demonstration showing how daily oil, gas and energy intelligence can be turned into a disciplined investment process."
      />
      <div className="container-site space-y-10 py-10">
        <PaperTradingDisclaimer />

        <section aria-labelledby="snap-h">
          <h2 id="snap-h" className="sr-only">
            Portfolio snapshot
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Virtual starting capital" value="$1,000,000" />
            <Stat label="Current value (sample)" value={`$${account.current_value.toLocaleString("en-US")}`} />
            <Stat label="Return since inception" value={`+${account.return_pct.toFixed(2)}%`} accent="text-gain" />
            <Stat label="Max drawdown" value={`${account.max_drawdown_pct.toFixed(1)}%`} accent="text-risk" />
          </div>
          <p className="mt-2 text-[11px] text-steel-500">
            Inception {meta.inception} · Updated {account.last_updated.slice(0, 10)} · All values
            simulated and indicative. Simulated performance does not guarantee future results.
          </p>
        </section>

        <section aria-labelledby="obj-h" className="card border-gold-600/40">
          <h2 id="obj-h" className="h3">
            The objective
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-steel-300">{meta.objective}</p>
          <p className="mt-2 text-sm leading-relaxed text-steel-400">
            {SITE.name} does not promise profits. It gives oil investors and traders a clearer
            intelligence process.
          </p>
        </section>

        <section aria-labelledby="themes-h">
          <h2 id="themes-h" className="h2">
            Current major themes
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {portfolioData.exposure.by_theme
              .filter((t) => t.label !== "Cash / optionality")
              .slice(0, 4)
              .map((t) => (
                <div key={t.label} className="card">
                  <div className="num text-xl font-bold text-gold-400">{t.pct.toFixed(1)}%</div>
                  <div className="mt-1 text-sm text-steel-300">{t.label}</div>
                </div>
              ))}
          </div>
        </section>

        <section aria-labelledby="extrade-h">
          <h2 id="extrade-h" className="h2">
            Example journaled decisions
          </h2>
          <p className="mt-1 text-sm text-steel-500">
            Two entries from the public journal — one open hypothesis trade, one closed trade with
            its lesson. Full rationale, sizing and risk levels are in the premium dashboard.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <article className="card">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded bg-navy-800 px-2 py-0.5 text-[10px] font-bold uppercase text-steel-300">
                  Open · {example.trade_id}
                </span>
                <span className="rounded bg-risk/15 px-2 py-0.5 text-[10px] font-bold uppercase text-risk">
                  Speculative — capped at 3%
                </span>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-white">{example.asset}</h3>
              <p className="mt-2 text-xs leading-relaxed text-steel-400">{example.thesis}</p>
              <p className="mt-2 text-xs text-steel-500">
                <span className="font-semibold text-loss">Invalidation: </span>
                {example.invalidation}
              </p>
            </article>
            <article className="card">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded bg-navy-800 px-2 py-0.5 text-[10px] font-bold uppercase text-steel-300">
                  Closed · {closed.id}
                </span>
                <span className="rounded bg-gain/15 px-2 py-0.5 text-[10px] font-bold uppercase text-gain">
                  +{closed.return_pct}% realised (simulated)
                </span>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-white">{closed.asset}</h3>
              <p className="mt-2 text-xs leading-relaxed text-steel-400">{closed.reason_closed}</p>
              <p className="mt-2 text-xs text-steel-500">
                <span className="font-semibold text-gold-500">Lesson: </span>
                {closed.lesson}
              </p>
            </article>
          </div>
        </section>

        <section aria-labelledby="value-h">
          <h2 id="value-h" className="h2">
            What this demonstrates for subscribers
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VALUE_POINTS.map(([title, body]) => (
              <div key={title} className="card card-hover">
                <h3 className="h3">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel-500">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-gold-600/40 bg-gradient-to-br from-navy-900 to-ink-900 p-8 text-center sm:p-10">
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            The full portfolio, journal and daily briefs are in Premium
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-steel-400">
            Detailed trade rationale, full watchlist, position sizing, risk levels, daily updates,
            benchmark comparison, source links, company notes and upcoming catalysts.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/subscribe" className="btn-primary">
              Subscribe for Full Daily Intelligence — {SITE.price}
              {SITE.priceSuffix}
            </Link>
            <Link href="/portfolio/dashboard" className="btn-secondary">
              View the Premium Portfolio Dashboard
            </Link>
          </div>
        </section>

        <PaperTradingDisclaimer />
        <DisclaimerBlock />
      </div>
    </>
  );
}
