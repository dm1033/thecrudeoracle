import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import portfolioData from "../../../data/virtual-portfolio.json";
import PageHeader from "@/components/PageHeader";
import PaperTradingDisclaimer from "@/components/PaperTradingDisclaimer";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMeta(
  "The Crude Oracle $100,000,000 Paper Fund",
  "The live published paper fund: every open line, the closed trade, and the profit on each. Virtual capital only. Last published desk marks. Not financial advice.",
  "/portfolio"
);

const account = portfolioData.account;
const meta = portfolioData.meta;
const positions = portfolioData.positions;
const closed = portfolioData.closed_trades;
const journal = portfolioData.trade_log;

function usd(n: number, signed = false) {
  const abs = Math.abs(Math.round(n)).toLocaleString("en-US");
  if (!signed) return `$${abs}`;
  if (n > 0) return `+$${abs}`;
  if (n < 0) return `−$${abs}`;
  return `$${abs}`;
}

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
  const totalPl = account.unrealised_pl + account.realised_pl;

  return (
    <>
      <PageHeader
        eyebrow="Live paper fund · Virtual capital only"
        title={meta.name}
        intro="Every open line, the closed trade, and the profit on each. Marks are the last published desk print — delayed and indicative. Virtual capital. Not an exchange feed and not financial advice."
      />
      <div className="container-site space-y-10 py-10">
        <PaperTradingDisclaimer />

        <section aria-labelledby="snap-h">
          <h2 id="snap-h" className="sr-only">
            Portfolio snapshot
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Stat label="Starting capital" value={usd(account.starting_value)} />
            <Stat label="Current value" value={usd(account.current_value)} />
            <Stat label="Total profit" value={usd(totalPl, true)} accent={totalPl >= 0 ? "text-gain" : "text-loss"} />
            <Stat label="Open profit" value={usd(account.unrealised_pl, true)} accent={account.unrealised_pl >= 0 ? "text-gain" : "text-loss"} />
            <Stat label="Realised profit" value={usd(account.realised_pl, true)} accent={account.realised_pl >= 0 ? "text-gain" : "text-loss"} />
            <Stat label="Return since inception" value={`${account.return_pct >= 0 ? "+" : ""}${account.return_pct.toFixed(2)}%`} accent="text-gain" />
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

        <section aria-labelledby="book-h">
          <h2 id="book-h" className="h2">
            Every open line
          </h2>
          <p className="mt-1 text-sm text-steel-500">
            {account.open_positions} positions still open. Profit is unrealised until the line is
            closed. Weights are percent of the {usd(account.starting_value)} starting capital.
          </p>
          <ul className="mt-4 space-y-3 md:hidden">
            {positions.map((p) => (
              <li key={p.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wide text-steel-500">{p.id} · {p.ticker}</p>
                    <h3 className="mt-1 text-sm font-semibold text-white">{p.asset}</h3>
                  </div>
                  <p className={`num text-sm font-bold ${p.unrealised_pl >= 0 ? "text-gain" : "text-loss"}`}>
                    {usd(p.unrealised_pl, true)}
                  </p>
                </div>
                <p className="mt-2 text-xs text-steel-400">
                  {p.size} · {usd(p.capital_allocated)} allocated ({p.weight_pct}%)
                </p>
                <p className="mt-1 text-xs text-steel-500">
                  Entry {p.entry_price} · Mark {p.current_price} · {p.decision}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-4 hidden overflow-x-auto rounded-lg border border-ink-700 md:block">
            <table className="table-dark min-w-[760px]">
              <caption className="sr-only">Open paper positions with capital and unrealised profit</caption>
              <thead className="bg-ink-900">
                <tr>
                  <th scope="col">Line</th>
                  <th scope="col">Size</th>
                  <th scope="col" className="text-right">Allocated</th>
                  <th scope="col" className="text-right">Weight</th>
                  <th scope="col" className="text-right">Entry</th>
                  <th scope="col" className="text-right">Mark</th>
                  <th scope="col" className="text-right">Open profit</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="font-mono text-xs text-steel-500">{p.id}</span>
                      <div className="font-medium text-steel-300">{p.asset}</div>
                      <div className="text-[10px] uppercase tracking-wide text-steel-500">{p.ticker}</div>
                    </td>
                    <td className="text-xs">{p.size}</td>
                    <td className="num text-right">{usd(p.capital_allocated)}</td>
                    <td className="num text-right">{p.weight_pct}%</td>
                    <td className="num text-right">{p.entry_price}</td>
                    <td className="num text-right text-white">{p.current_price}</td>
                    <td className={`num text-right font-semibold ${p.unrealised_pl >= 0 ? "text-gain" : "text-loss"}`}>
                      {usd(p.unrealised_pl, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="closed-h">
          <h2 id="closed-h" className="h2">
            Closed trades
          </h2>
          <p className="mt-1 text-sm text-steel-500">
            {account.closed_trades} closed. Realised profit {usd(account.realised_pl, true)}.
          </p>
          <div className="mt-4 space-y-3">
            {closed.map((t) => (
              <article key={t.id} className="card">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-steel-500">{t.id}</span>
                  <h3 className="text-sm font-semibold text-white">{t.asset}</h3>
                  <span className="font-mono text-xs text-steel-500">{t.ticker}</span>
                  <span className={`ml-auto rounded px-2 py-0.5 text-xs font-bold ${t.realised_pl >= 0 ? "bg-gain/15 text-gain" : "bg-loss/15 text-loss"}`}>
                    {usd(t.realised_pl, true)} ({t.return_pct}%)
                  </span>
                </div>
                <p className="mt-2 text-xs text-steel-400">
                  {t.date_opened} → {t.date_closed} · Entry {t.entry_price} · Exit {t.exit_price} · {usd(t.capital_allocated)} allocated
                </p>
                <p className="mt-2 text-sm text-steel-300">{t.reason_closed}</p>
                <p className="mt-1 text-xs text-steel-500">
                  <span className="font-semibold text-gold-500">Lesson: </span>
                  {t.lesson}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="journal-h">
          <h2 id="journal-h" className="h2">
            Journal — every decision on the book
          </h2>
          <p className="mt-1 text-sm text-steel-500">
            {journal.length} recorded decisions. Thesis, size and invalidation stay with the trade.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {journal.map((entry) => (
              <article key={entry.trade_id} className="card">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-navy-800 px-2 py-0.5 text-[10px] font-bold uppercase text-steel-300">
                    {entry.trade_id} · {entry.decision}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-steel-500">{entry.date}</span>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-white">{entry.asset}</h3>
                <p className="mt-2 text-xs text-steel-400">{entry.position_size}</p>
                <p className="mt-1 text-xs text-steel-500">{entry.capital_allocated}</p>
                <p className="mt-2 text-xs leading-relaxed text-steel-400">{entry.thesis}</p>
                <p className="mt-2 text-xs text-steel-500">
                  <span className="font-semibold text-loss">Invalidation: </span>
                  {entry.invalidation}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="value-h">
          <h2 id="value-h" className="h2">
            What this demonstrates
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
            The full portfolio, journal and daily briefs are free
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-steel-400">
            Detailed trade rationale, full watchlist, position sizing, risk levels, daily updates,
            benchmark comparison, source links, company notes and upcoming catalysts.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/portfolio/dashboard" className="btn-primary">
              Open the Full Portfolio Dashboard — Free
            </Link>
            <Link href="/daily-briefing" className="btn-secondary">
              Read Today&apos;s Free Briefing
            </Link>
          </div>
        </section>

        <PaperTradingDisclaimer />
        <DisclaimerBlock />
      </div>
    </>
  );
}
