import Link from "next/link";
import type { FundFile, Opportunity, Position } from "@/lib/paper-fund";
import { pct, performanceOf, toneClass, usd } from "@/lib/paper-fund";
import EquityCurve from "@/components/paper-fund/EquityCurve";

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="card">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">{label}</div>
      <div className={`num mt-1 text-xl font-bold ${accent ?? "text-white"}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] leading-snug text-steel-500">{sub}</div>}
    </div>
  );
}

function statusClass(status: string): string {
  if (status === "TRADE") return "bg-gain/15 text-gain";
  if (status === "SMALL POSITION") return "bg-gold-500/15 text-gold-400";
  return "bg-navy-800 text-steel-300";
}

export function TradingDesk({ fund }: { fund: FundFile }) {
  const { account } = fund;
  const totalPl = account.realised_pl + account.unrealised_pl;
  const index =
    account.oracle_confidence_index == null ? "—" : String(account.oracle_confidence_index);

  return (
    <section aria-labelledby="desk-h">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Oracle Trading Desk</p>
          <h2 id="desk-h" className="h2 mt-1">
            $10M paper fund
          </h2>
        </div>
        <p className="max-w-md text-right text-[11px] text-steel-500">{account.oracle_confidence_note}</p>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Current NAV" value={usd(account.current_value)} sub={`Started ${usd(account.starting_value)} on ${fund.meta.inception}`} />
        <Stat label="Weekly P&L" value={usd(account.weekly_pnl, true)} accent={toneClass(account.weekly_pnl)} sub={pct(account.weekly_return_pct)} />
        <Stat label="Total return" value={pct(account.return_pct)} accent={toneClass(account.return_pct)} sub={`Total P&L ${usd(totalPl, true)}`} />
        <Stat label="Cash" value={usd(account.cash_balance)} sub={`${account.cash_pct.toFixed(1)}% of NAV`} />
        <Stat label="Realised P&L" value={usd(account.realised_pl, true)} accent={toneClass(account.realised_pl)} sub={`${account.closed_trades} closed`} />
        <Stat label="Unrealised P&L" value={usd(account.unrealised_pl, true)} accent={toneClass(account.unrealised_pl)} sub={`${account.open_positions} open`} />
        <Stat label="Gross exposure" value={usd(account.gross_exposure)} sub={`${account.gross_exposure_pct.toFixed(1)}% of NAV`} />
        <Stat
          label="Oracle Confidence Index"
          value={index}
          sub={`Best idea: ${account.best_opportunity} · ${account.best_opportunity_confidence}`}
        />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-steel-400">{account.largest_risk}</p>
    </section>
  );
}

export function OpportunityTable({ rows, detailed = true }: { rows: Opportunity[]; detailed?: boolean }) {
  return (
    <section aria-labelledby="rank-h">
      <h2 id="rank-h" className="h2">
        Week ranking
      </h2>
      <p className="mt-1 text-sm text-steel-500">
        Confidence is the sum of six scored families. Below 60 stays on the watchlist. Illustrative risk/reward is the payoff of the levels written down before any fill. It is not a result.
      </p>
      <div className="mt-4 overflow-x-auto rounded-lg border border-ink-700">
        <table className="table-dark min-w-[760px]">
          <caption className="sr-only">Ranked opportunities for the current paper-fund week</caption>
          <thead className="bg-ink-900">
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Market</th>
              <th scope="col">Direction</th>
              <th scope="col" className="text-right">Confidence</th>
              <th scope="col" className="text-right">Risk/Reward</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.rank}>
                <td className="num">{r.rank}</td>
                <td className="font-medium text-steel-300">{r.market}</td>
                <td>{r.direction}</td>
                <td className="num text-right text-white">{r.confidence}</td>
                <td className="num text-right">{r.risk_reward}</td>
                <td>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${statusClass(r.status)}`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {detailed && (
      <div className="mt-4 space-y-4">
        {rows.map((r) => (
          <article key={r.market} className="card">
            <header className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">
                {r.rank}. {r.market} · {r.direction}
              </h3>
              <span className="font-mono text-xs text-steel-400">
                {r.confidence}/100 · {r.risk_reward} · {r.status}
              </span>
            </header>
            <p className="mt-2 text-sm leading-relaxed text-steel-300">{r.summary}</p>
            <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
              <div>
                <dt className="uppercase tracking-wide text-steel-500">Entry considered</dt>
                <dd className="text-steel-300">{r.entry_label}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide text-steel-500">Stop</dt>
                <dd className="text-steel-300">{r.stop_label}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide text-steel-500">Target</dt>
                <dd className="text-steel-300">{r.target_label}</dd>
              </div>
            </dl>
            <ul className="mt-3 space-y-1.5">
              {r.factors.map((f) => (
                <li key={f.family} className="text-xs leading-relaxed text-steel-400">
                  <span className={f.effect === "increased" ? "font-semibold text-gain" : "font-semibold text-loss"}>
                    {f.score}/{f.max} {f.family} — {f.effect === "increased" ? "supports the idea" : "works against it"}.
                  </span>{" "}
                  {f.note}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-steel-400">
              <span className="font-semibold text-loss">Why this could be wrong. </span>
              {r.why_it_could_be_wrong}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-steel-500">
              <span className="font-semibold text-steel-300">Invalidation. </span>
              {r.invalidation}
            </p>
          </article>
        ))}
      </div>
      )}
    </section>
  );
}

export function ActiveTrades({ positions }: { positions: Position[] }) {
  if (positions.length === 0) {
    return (
      <section aria-labelledby="live-h">
        <h2 id="live-h" className="h2">
          Active trades
        </h2>
        <div className="mt-4 card border-dashed">
          <p className="text-sm font-semibold text-white">No open paper position</p>
          <p className="mt-2 text-sm leading-relaxed text-steel-400">
            Week 41 did not clear the confidence gate. Cards appear here when a trade is opened, with direction, entry, live mark, size, P&L, stop, target, confidence, thesis and trade id. Entries are not rewritten after the fact.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="live-h">
      <h2 id="live-h" className="h2">
        Active trades
      </h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {positions.map((p) => (
          <article key={p.id} className="card">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${p.direction === "short" ? "bg-loss/15 text-loss" : "bg-gain/15 text-gain"}`}>
                {p.direction}
              </span>
              <span className="font-mono text-[11px] text-gold-400">{p.trade_id ?? p.id}</span>
              <span className="ml-auto font-mono text-sm font-semibold text-white">{p.confidence ?? "—"}</span>
            </div>
            <h3 className="mt-2 text-base font-semibold text-white">{p.asset}</h3>
            <p className="font-mono text-xs text-steel-500">{p.ticker}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div><dt className="text-steel-500">Entry</dt><dd className="text-steel-300">{p.entry_price}</dd></div>
              <div><dt className="text-steel-500">Current</dt><dd className="text-white">{p.current_price}</dd></div>
              <div><dt className="text-steel-500">Size</dt><dd className="text-steel-300">{p.size}</dd></div>
              <div><dt className="text-steel-500">P&L</dt><dd className={toneClass(p.unrealised_pl)}>{usd(p.unrealised_pl, true)}</dd></div>
              <div><dt className="text-steel-500">Stop</dt><dd className="text-steel-300">{p.stop_loss}</dd></div>
              <div><dt className="text-steel-500">Target</dt><dd className="text-steel-300">{p.target}</dd></div>
            </dl>
            {p.thesis && <p className="mt-3 text-sm leading-relaxed text-steel-300">{p.thesis}</p>}
            <p className="mt-2 text-[11px] text-steel-500">Opened {p.opened_at ?? p.last_updated}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function WeeklyReportBlock({ fund }: { fund: FundFile }) {
  const report = fund.weekly_reports[0];
  return (
    <section aria-labelledby="week-h">
      <h2 id="week-h" className="h2">
        Weekly trading report
      </h2>
      <p className="mt-1 text-sm text-steel-500">
        {report.id} · {report.title} · Published {report.published.slice(0, 16).replace("T", " ")} UTC
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Starting NAV" value={usd(report.starting_nav)} />
        <Stat label="Current NAV" value={usd(report.ending_nav)} />
        <Stat label="Weekly P&L" value={usd(report.weekly_pnl, true)} accent={toneClass(report.weekly_pnl)} />
        <Stat label="Weekly return" value={pct(report.weekly_return_pct)} accent={toneClass(report.weekly_return_pct)} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="text-xs font-bold uppercase tracking-widest text-steel-500">Trades opened</h3>
          <p className="mt-2 text-sm text-steel-300">{report.trades_opened.length ? report.trades_opened.join(", ") : "None."}</p>
          <h3 className="mt-4 text-xs font-bold uppercase tracking-widest text-steel-500">Trades closed</h3>
          <p className="mt-2 text-sm text-steel-300">{report.trades_closed.length ? report.trades_closed.join(", ") : "None."}</p>
        </div>
        <div className="card">
          <h3 className="text-xs font-bold uppercase tracking-widest text-steel-500">Decision</h3>
          <p className="mt-2 text-sm font-semibold text-white">{report.decision}</p>
          <p className="mt-2 text-sm leading-relaxed text-steel-400">{report.what_worked}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="card">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gain">Winners</h3>
          <p className="mt-2 text-sm leading-relaxed text-steel-300">
            {report.winners.length ? report.winners.join(" ") : "No winning trade. Nothing has been identified correctly in a position, because no position was opened."}
          </p>
        </article>
        <article className="card">
          <h3 className="text-xs font-bold uppercase tracking-widest text-loss">Losses</h3>
          <p className="mt-2 text-sm leading-relaxed text-steel-300">{report.loss_analysis}</p>
        </article>
      </div>
      <article className="card mt-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gold-500">Process note</h3>
        <p className="mt-2 text-sm leading-relaxed text-steel-300">{report.process_review}</p>
        <p className="mt-2 text-[11px] text-steel-500">
          A post-trade review is written only after a close. This note is a process review. It does not rewrite the ledger.
        </p>
      </article>
    </section>
  );
}

export function Committee({ fund }: { fund: FundFile }) {
  const report = fund.weekly_reports[0];
  return (
    <section aria-labelledby="ic-h">
      <h2 id="ic-h" className="h2">
        Weekly investment committee
      </h2>
      <p className="mt-1 text-sm text-steel-500">
        Independent leans, then one decision. Weights are the committee&apos;s own, published with the week.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {report.committee.map((m) => (
          <article key={m.role} className="card">
            <header className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">{m.role}</h3>
              <span className="font-mono text-[11px] text-steel-500">Weight {m.weight}</span>
            </header>
            <p className="mt-2 text-sm leading-relaxed text-steel-300">{m.view}</p>
            <p className="mt-2 text-xs font-semibold text-gold-400">{m.lean}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PerformanceBlock({ fund }: { fund: FundFile }) {
  const stats = performanceOf(fund);
  const { account, benchmarks } = fund;
  const cells: { label: string; value: string; note?: string }[] = [
    { label: "NAV", value: usd(account.current_value) },
    { label: "Total return", value: pct(account.return_pct) },
    { label: "Weekly return", value: pct(account.weekly_return_pct) },
    { label: "Realised P&L", value: usd(account.realised_pl, true) },
    { label: "Unrealised P&L", value: usd(account.unrealised_pl, true) },
    { label: "Max drawdown", value: `${account.max_drawdown_pct.toFixed(1)}%` },
    { label: "Closed trades", value: String(stats.closedCount) },
    { label: "Open positions", value: String(account.open_positions) },
    { label: "Win rate", value: stats.winRate == null ? "Not shown" : pct(stats.winRate * 100, 1), note: "Needs a real sample" },
    { label: "Profit factor", value: stats.profitFactor == null ? "Not shown" : stats.profitFactor.toFixed(2) },
    { label: "Expectancy", value: stats.expectancy == null ? "Not shown" : usd(stats.expectancy, true) },
    { label: "Sharpe", value: stats.sharpe == null ? "Not shown" : stats.sharpe.toFixed(2) },
    { label: "Sortino", value: stats.sortino == null ? "Not shown" : stats.sortino.toFixed(2) },
  ];

  return (
    <section aria-labelledby="perf-h">
      <h2 id="perf-h" className="h2">
        Performance since inception
      </h2>
      {stats.limitation && (
        <p className="mt-2 rounded border border-gold-600/40 bg-gold-500/5 p-3 text-sm leading-relaxed text-steel-300">
          {stats.limitation}
        </p>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cells.map((c) => (
          <div key={c.label} className="rounded-lg border border-ink-700 bg-ink-900 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">{c.label}</div>
            <div className="num mt-1 text-lg font-semibold text-white">{c.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Bucket title="Long versus short" rows={stats.byDirection.map((r) => ({ label: r.direction, pnl: r.pnl, count: r.count }))} empty="No open or closed risk yet." />
        <Bucket title="By strategy" rows={stats.byStrategy.map((r) => ({ label: r.strategy, pnl: r.pnl, count: r.count }))} empty="No strategy has capital." />
        <Bucket title="By market" rows={stats.byAsset.map((r) => ({ label: r.asset, pnl: r.pnl, count: r.count }))} empty="No market has a position." />
      </div>
      <h3 className="mt-8 text-sm font-semibold text-white">Benchmarks</h3>
      <p className="mt-1 text-sm text-steel-500">{benchmarks.period}</p>
      <div className="mt-3 overflow-x-auto rounded-lg border border-ink-700">
        <table className="table-dark min-w-[760px]">
          <caption className="sr-only">Paper fund against Brent, WTI and an energy equity benchmark</caption>
          <thead className="bg-ink-900">
            <tr>
              <th scope="col">Metric</th>
              <th scope="col" className="text-right">Paper fund</th>
              <th scope="col" className="text-right">Brent</th>
              <th scope="col" className="text-right">WTI</th>
              <th scope="col" className="text-right">Energy equities</th>
              <th scope="col">Notes</th>
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
  );
}

function Bucket({ title, rows, empty }: { title: string; rows: { label: string; pnl: number; count: number }[]; empty: string }) {
  return (
    <div className="card">
      <h3 className="text-xs font-bold uppercase tracking-widest text-steel-500">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-steel-400">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {rows.map((r) => (
            <li key={r.label} className="flex justify-between gap-2">
              <span className="text-steel-300">{r.label}</span>
              <span className={`num ${toneClass(r.pnl)}`}>{usd(r.pnl, true)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function FundChart({ fund }: { fund: FundFile }) {
  return (
    <section aria-labelledby="curve-h">
      <h2 id="curve-h" className="h2">
        Equity curve
      </h2>
      <div className="mt-4">
        <EquityCurve points={fund.equity_curve} starting={fund.account.starting_value} />
      </div>
    </section>
  );
}

export function RulesAndBrief({ fund }: { fund: FundFile }) {
  return (
    <section aria-labelledby="rules-h" className="grid gap-4 lg:grid-cols-2">
      <div className="card">
        <h2 id="rules-h" className="h3">
          Risk rules
        </h2>
        <ul className="mt-3 space-y-1.5 text-sm text-steel-400">
          {fund.rules.position_limits.map((r) => (
            <li key={r}>· {r}</li>
          ))}
          <li>· {fund.rules.risk_per_trade}</li>
          <li>· {fund.rules.confidence_gate}</li>
          <li>· {fund.rules.cash_reserve}</li>
        </ul>
        <h3 className="mt-4 text-xs font-bold uppercase tracking-widest text-steel-500">Drawdown ladder</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {fund.rules.drawdown_ladder.map((d) => (
            <li key={d.level} className="flex justify-between gap-2 text-steel-400">
              <span>
                <span className="num font-semibold text-risk">{d.level}</span> — {d.action}
              </span>
              <span className="text-[11px] uppercase text-steel-500">{d.status}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h2 className="h3">Next checks</h2>
        <ul className="mt-3 space-y-2">
          {fund.next_events.map((e) => (
            <li key={e.date} className="rounded border border-ink-700 bg-ink-950 p-3 text-sm">
              <span className="num font-mono text-xs text-gold-400">{e.date}</span>
              <span className="ml-2 font-semibold text-steel-300">{e.event}</span>
              <p className="mt-0.5 text-xs text-steel-500">{e.relevance}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-steel-500">
          The July 2026 $1,000,000 sample book is kept, unedited, in the repository archive. Its P&L is not in this NAV.
        </p>
        <Link href="/portfolio/archive" className="mt-3 inline-block text-sm font-semibold text-gold-400 hover:text-gold-300">
          Open the trade archive →
        </Link>
      </div>
    </section>
  );
}
