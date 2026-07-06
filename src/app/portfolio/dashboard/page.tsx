import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import portfolioData from "../../../../data/virtual-portfolio.json";
import PageHeader from "@/components/PageHeader";
import PaperTradingDisclaimer from "@/components/PaperTradingDisclaimer";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import PremiumGate from "@/components/PremiumGate";

export const metadata: Metadata = pageMeta(
  "Virtual Portfolio Dashboard — Positions, Journal, Risk & Benchmarks",
  "The premium dashboard for The Crude Oracle $1,000,000 Oil Intelligence Portfolio: open paper positions with sources and risk levels, full trade journal, exposure, drawdown ladder, benchmarks and the daily trading brief.",
  "/portfolio/dashboard"
);

const { account, rules, allocation, positions, closed_trades, trade_log, exposure, contributors, detractors, benchmarks, daily_brief, next_events, meta } = portfolioData;

function Stat({ label, value, accent, sub }: { label: string; value: string; accent?: string; sub?: string }) {
  return (
    <div className="card">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">{label}</div>
      <div className={`num mt-1 text-xl font-bold ${accent ?? "text-white"}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-steel-500">{sub}</div>}
    </div>
  );
}

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="h2">
      {children}
    </h2>
  );
}

function PositionsTable() {
  return (
    <div className="overflow-x-auto rounded-lg border border-ink-700">
      <table className="table-dark min-w-[1150px]">
        <thead className="bg-ink-900">
          <tr>
            <th>ID</th>
            <th>Asset</th>
            <th>Ticker / Exch / Ccy</th>
            <th className="text-right">Size</th>
            <th className="text-right">Entry</th>
            <th className="text-right">Current</th>
            <th className="text-right">Allocated</th>
            <th className="text-right">Unrealised P/L</th>
            <th className="text-center">Risk</th>
            <th>Stop</th>
            <th>Source / Data</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr key={p.id} className="transition-colors hover:bg-ink-800/60">
              <td className="font-mono text-xs">{p.id}</td>
              <td className="max-w-[190px] font-medium text-steel-300">
                {p.asset}
                <div className="text-[10px] uppercase tracking-wide text-steel-500">{p.category}</div>
              </td>
              <td className="whitespace-nowrap font-mono text-xs">
                {p.ticker} · {p.exchange} · {p.currency}
              </td>
              <td className="num whitespace-nowrap text-right text-xs">{p.size}</td>
              <td className="num whitespace-nowrap text-right">{p.entry_price}</td>
              <td className="num whitespace-nowrap text-right text-white">{p.current_price}</td>
              <td className="num whitespace-nowrap text-right">
                ${p.capital_allocated.toLocaleString("en-US")}
                <span className="ml-1 text-[10px] text-steel-500">({p.weight_pct}%)</span>
              </td>
              <td className={`num whitespace-nowrap text-right font-semibold ${p.unrealised_pl >= 0 ? "text-gain" : "text-loss"}`}>
                {p.unrealised_pl >= 0 ? "+" : ""}${p.unrealised_pl.toLocaleString("en-US")}
              </td>
              <td className="whitespace-nowrap text-center text-xs">{p.risk_level.split("—")[0].trim()}</td>
              <td className="max-w-[150px] text-xs">{p.stop_loss}</td>
              <td className="max-w-[160px] text-[11px]">
                <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="underline decoration-ink-600 hover:text-gold-400">
                  {p.source}
                </a>
                <span className="ml-1 rounded bg-steel-500/15 px-1 py-0.5 text-[9px] font-semibold uppercase text-steel-400">{p.data_type}</span>
                <div className="text-steel-500">Updated {p.last_updated}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExposureList({ title, rows }: { title: string; rows: { label: string; pct: number }[] }) {
  return (
    <div className="card">
      <h3 className="text-xs font-bold uppercase tracking-widest text-steel-500">{title}</h3>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-steel-300">{r.label}</span>
              <span className="num font-semibold text-white">{r.pct.toFixed(1)}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
              <div className="h-full rounded-full bg-gold-500/70" style={{ width: `${Math.min(r.pct, 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DashboardContent() {
  return (
    <div className="space-y-12">
      {/* Account overview */}
      <section aria-labelledby="acct-h">
        <SectionTitle id="acct-h">Account overview</SectionTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Account value" value={`$${account.current_value.toLocaleString("en-US")}`} sub={`Started $${account.starting_value.toLocaleString("en-US")} on ${meta.inception}`} />
          <Stat label="Return since inception" value={`+${account.return_pct.toFixed(2)}%`} accent="text-gain" sub="Simulated — no guarantee of future results" />
          <Stat label="Cash balance" value={`$${account.cash_balance.toLocaleString("en-US")}`} sub={`${account.cash_pct}% — minimum rule 10%`} />
          <Stat label="Risk level" value={account.risk_level.split("—")[0].trim()} sub={account.risk_level.split("—")[1]?.trim()} />
          <Stat label="Unrealised P/L" value={`+$${account.unrealised_pl.toLocaleString("en-US")}`} accent="text-gain" />
          <Stat label="Realised P/L" value={`+$${account.realised_pl.toLocaleString("en-US")}`} accent="text-gain" sub={`${account.closed_trades} closed trade`} />
          <Stat label="Max drawdown" value={`${account.max_drawdown_pct.toFixed(1)}%`} accent="text-risk" sub="Ladder: -5% review · -10% de-risk · -15% pause · -20% failure review" />
          <Stat label="Open positions" value={String(account.open_positions)} sub={`Data: ${account.currency}`} />
        </div>
      </section>

      {/* Allocation */}
      <section aria-labelledby="alloc-h">
        <SectionTitle id="alloc-h">Allocation vs illustrative targets</SectionTitle>
        <div className="mt-4 overflow-x-auto rounded-lg border border-ink-700">
          <table className="table-dark min-w-[640px]">
            <thead className="bg-ink-900">
              <tr>
                <th>Category</th>
                <th className="text-right">Target</th>
                <th className="text-right">Actual</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {allocation.map((a) => (
                <tr key={a.category}>
                  <td className="font-medium text-steel-300">{a.category}</td>
                  <td className="num text-right">{a.target_pct}%</td>
                  <td className="num text-right text-white">{a.actual_pct}%</td>
                  <td className="text-xs">{a.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-steel-500">
          Targets are illustrative, not prescriptive — the system adjusts with market conditions,
          with changes journaled.
        </p>
      </section>

      {/* Open positions */}
      <section aria-labelledby="pos-h">
        <SectionTitle id="pos-h">Open paper positions</SectionTitle>
        <div className="mt-4">
          <PositionsTable />
        </div>
      </section>

      {/* Closed trades */}
      <section aria-labelledby="closed-h">
        <SectionTitle id="closed-h">Closed trades</SectionTitle>
        <div className="mt-4 space-y-4">
          {closed_trades.map((t) => (
            <article key={t.id} className="card">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-steel-500">{t.id}</span>
                <span className="text-sm font-semibold text-white">{t.asset}</span>
                <span className="font-mono text-xs text-steel-500">{t.ticker} · {t.exchange}</span>
                <span className={`ml-auto rounded px-2 py-0.5 text-xs font-bold ${t.realised_pl >= 0 ? "bg-gain/15 text-gain" : "bg-loss/15 text-loss"}`}>
                  {t.realised_pl >= 0 ? "+" : ""}${t.realised_pl.toLocaleString("en-US")} ({t.return_pct}%)
                </span>
              </div>
              <p className="mt-2 text-xs text-steel-400">
                {t.date_opened} → {t.date_closed} · Entry {t.entry_price} · Exit {t.exit_price} · ${t.capital_allocated.toLocaleString("en-US")} allocated
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

      {/* Trade journal */}
      <section aria-labelledby="journal-h">
        <SectionTitle id="journal-h">Trade journal — full decision records</SectionTitle>
        <p className="mt-1 text-sm text-steel-500">
          Every trade is recorded with this template before entry. Decision labels: Buy/Add · Hold ·
          Reduce · Exit · Watch only · No trade.
        </p>
        <div className="mt-4 space-y-4">
          {trade_log.map((t) => (
            <article key={t.trade_id} className="card p-6">
              <header className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-steel-500">{t.trade_id} · {t.date}</span>
                <span className="rounded bg-gain/15 px-2 py-0.5 text-[10px] font-bold uppercase text-gain">{t.decision}</span>
                <span className="rounded bg-navy-800 px-2 py-0.5 text-[10px] font-bold uppercase text-steel-300">{t.direction}</span>
                <span className="ml-auto rounded bg-steel-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-steel-400">Confidence: {t.confidence}</span>
              </header>
              <h3 className="mt-2 text-base font-semibold text-white">
                {t.asset} <span className="font-mono text-xs text-steel-500">({t.ticker})</span>
              </h3>
              <dl className="mt-3 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
                <div><dt className="font-semibold uppercase tracking-wide text-steel-500">Entry / Size</dt><dd className="text-steel-300">{t.entry_price} · {t.position_size}</dd></div>
                <div><dt className="font-semibold uppercase tracking-wide text-steel-500">Capital</dt><dd className="text-steel-300">{t.capital_allocated}</dd></div>
                <div className="sm:col-span-2"><dt className="font-semibold uppercase tracking-wide text-gold-500">Thesis</dt><dd className="text-steel-300">{t.thesis}</dd></div>
                <div><dt className="font-semibold uppercase tracking-wide text-steel-500">Catalyst</dt><dd className="text-steel-400">{t.catalyst}</dd></div>
                <div><dt className="font-semibold uppercase tracking-wide text-steel-500">Supporting data</dt><dd className="text-steel-400">{t.supporting_data}</dd></div>
                <div><dt className="font-semibold uppercase tracking-wide text-loss">Risk</dt><dd className="text-steel-400">{t.risk}</dd></div>
                <div><dt className="font-semibold uppercase tracking-wide text-loss">Invalidation</dt><dd className="text-steel-400">{t.invalidation}</dd></div>
                <div><dt className="font-semibold uppercase tracking-wide text-steel-500">Stop-loss</dt><dd className="text-steel-300">{t.stop_loss}</dd></div>
                <div><dt className="font-semibold uppercase tracking-wide text-steel-500">Target / Holding</dt><dd className="text-steel-300">{t.target} · {t.holding_period}</dd></div>
                <div className="sm:col-span-2"><dt className="font-semibold uppercase tracking-wide text-steel-500">Strategy fit</dt><dd className="text-steel-400">{t.strategy_fit}</dd></div>
              </dl>
              {t.special_risk_warning && (
                <p className="mt-3 rounded border border-loss/40 bg-loss/10 p-2 text-xs text-loss">
                  <strong>Special risk warning:</strong> {t.special_risk_warning}
                </p>
              )}
              <p className="mt-3 border-t border-ink-700 pt-2 text-[11px] text-steel-500">
                Sources: {t.sources.join(" · ")}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Exposure + contributors */}
      <section aria-labelledby="exp-h">
        <SectionTitle id="exp-h">Exposure & attribution</SectionTitle>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <ExposureList title="By asset type" rows={exposure.by_asset_type} />
          <ExposureList title="By region" rows={exposure.by_region} />
          <ExposureList title="By theme" rows={exposure.by_theme} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="card">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gain">Top contributors</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {contributors.map((c) => (
                <li key={c.asset} className="flex justify-between">
                  <span className="text-steel-300">{c.asset}</span>
                  <span className="num font-semibold text-gain">+${c.pl.toLocaleString("en-US")}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3 className="text-xs font-bold uppercase tracking-widest text-loss">Top detractors</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {detractors.map((d) => (
                <li key={d.asset} className="flex justify-between">
                  <span className="text-steel-300">{d.asset}</span>
                  <span className="num font-semibold text-loss">-${Math.abs(d.pl).toLocaleString("en-US")}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Benchmarks */}
      <section aria-labelledby="bench-h">
        <SectionTitle id="bench-h">Benchmark comparison</SectionTitle>
        <p className="mt-1 text-sm text-steel-500">{benchmarks.period}</p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-ink-700">
          <table className="table-dark min-w-[760px]">
            <thead className="bg-ink-900">
              <tr>
                <th>Metric</th>
                <th className="text-right">Crude Oracle Virtual Portfolio</th>
                <th className="text-right">Brent</th>
                <th className="text-right">WTI</th>
                <th className="text-right">Energy ETF</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {benchmarks.rows.map((r) => (
                <tr key={r.metric}>
                  <td className="font-medium text-steel-300">{r.metric}</td>
                  <td className="num text-right text-white">{r.portfolio}</td>
                  <td className="num text-right">{r.brent}</td>
                  <td className="num text-right">{r.wti}</td>
                  <td className="num text-right">{r.energy_etf}</td>
                  <td className="text-xs">{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-steel-500">{benchmarks.note}</p>
      </section>

      {/* Daily brief */}
      <section aria-labelledby="brief-h">
        <SectionTitle id="brief-h">{daily_brief.title}</SectionTitle>
        <div className="mt-4 card p-6">
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {daily_brief.sections.map((s) => (
              <div key={s.n}>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-gold-500">
                  {s.n} · {s.label}
                </h3>
                <p className="mt-0.5 text-sm leading-relaxed text-steel-400">{s.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-ink-700 pt-2 text-[11px] text-steel-500">
            Source: {daily_brief.source} · Updated {daily_brief.last_updated.slice(0, 10)} ·{" "}
            <span className="rounded bg-steel-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-steel-400">{daily_brief.data_type}</span>
          </p>
        </div>
      </section>

      {/* Rules + events */}
      <section aria-labelledby="rules-h" className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <SectionTitle id="rules-h">Portfolio rules</SectionTitle>
          <ul className="mt-3 space-y-1.5 text-sm text-steel-400">
            {rules.position_limits.map((r) => (
              <li key={r}>· {r}</li>
            ))}
            <li>· Cash: {rules.cash_reserve}</li>
            <li>· Risk: {rules.risk_per_trade}</li>
            {rules.conduct.map((r) => (
              <li key={r}>· {r}</li>
            ))}
          </ul>
          <h3 className="mt-4 text-xs font-bold uppercase tracking-widest text-steel-500">Drawdown ladder</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {rules.drawdown_ladder.map((d) => (
              <li key={d.level} className="flex justify-between text-steel-400">
                <span><span className="num font-semibold text-risk">{d.level}</span> — {d.action}</span>
                <span className="text-xs uppercase text-gain">{d.status}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="h2">Next major market events</h2>
          <ul className="mt-3 space-y-2">
            {next_events.map((e) => (
              <li key={e.date} className="rounded border border-ink-700 bg-ink-900 p-3 text-sm">
                <span className="num font-mono text-xs text-gold-400">{e.date}</span>
                <span className="ml-2 font-semibold text-steel-300">{e.event}</span>
                <p className="mt-0.5 text-xs text-steel-500">{e.relevance}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-steel-500">
            Monthly report format: &ldquo;The Crude Oracle $1,000,000 Virtual Portfolio Report —
            [Month]&rdquo; — 14 sections from starting balance to risk warning, first edition due{" "}
            {next_events[next_events.length - 1].date}. Template in docs/PORTFOLIO_PLAYBOOK.md.
          </p>
        </div>
      </section>
    </div>
  );
}

export default function PortfolioDashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Premium · Paper Trading · Virtual Capital Only"
        title={meta.name}
        intro={meta.objective}
      />
      <div className="container-site space-y-10 py-10">
        <PaperTradingDisclaimer />
        <PremiumGate
          title="The full virtual portfolio dashboard is for premium subscribers"
          preview={
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Account value" value={`$${account.current_value.toLocaleString("en-US")}`} />
              <Stat label="Return" value={`+${account.return_pct.toFixed(2)}%`} accent="text-gain" />
              <Stat label="Cash" value={`${account.cash_pct}%`} />
              <Stat label="Max drawdown" value={`${account.max_drawdown_pct.toFixed(1)}%`} accent="text-risk" />
            </div>
          }
        >
          <DashboardContent />
        </PremiumGate>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm">
          <span className="text-steel-400">
            Decisions reference the Trader Toolkit — balance, flows, curve, positioning, news and
            hypotheses.
          </span>
          <div className="flex gap-4">
            <Link href="/tools" className="font-semibold text-gold-400 hover:text-gold-300">
              All tools →
            </Link>
            <Link href="/portfolio" className="font-semibold text-gold-400 hover:text-gold-300">
              Public version →
            </Link>
          </div>
        </div>

        <PaperTradingDisclaimer />
        <DisclaimerBlock />
      </div>
    </>
  );
}
