"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dashboardJson from "../../paper-book/report/dashboard.json";

type Stats = { trading_days?: number; total_return_pct?: number; annualised_vol_pct?: number; sharpe?: number | null; max_drawdown_pct?: number; hit_rate_days_pct?: number };
type Position = { id: string; sleeve: string; opened: string; closed: string | null; legs: string[]; entry: number; stop: number; target: number; thesis: string; kill_criteria: string; risk_usd: number | null };
type LogRow = { run_id: string; date: string; run: string; status: string; model: string | null; approved: number; rejected: number; no_trade_reason: string; theses: string[]; rejections: string[]; commit: string | null; ots: string | null; grade: string | null };
type CallRow = { week: string; forecast_kbbl: number; range_kbbl: number[]; actual_kbbl: number; error_kbbl: number; within_range: boolean };
interface Dashboard {
  generated_at: string; book_name: string; disclaimer: string; inception: string | null; trading_days: number;
  min_days_for_stats: number; show_performance: boolean; model_pinned: string;
  stats: { total?: Stats; ai?: Stats; baseline?: Stats; ai_minus_baseline_pct?: number };
  curve: { date: string; total_net: number; ai_net: number; baseline_net: number; total_gross: number }[];
  risk_used: { open_ai_trades: number; max_open_ai_trades: number; drawdown_pct: number; drawdown_stepdown_pct: number; drawdown_stop_pct: number; gross_exposure_x_nav: number; gross_exposure_max_x_nav: number };
  open_positions: Position[]; trades: Position[]; decision_log: LogRow[]; calls_vs_prints: CallRow[]; costs_note: string;
}
// Empty arrays in the committed JSON infer as never[]; the shape is fixed by report/tearsheet.py.
const dashboard = dashboardJson as unknown as Dashboard;
import ChartDataTable from "./charts/ChartDataTable";

const GOLD = "#dcb54e";
const STEEL = "#8b98a9";
const GRID = "#212936";
const AXIS = { fill: STEEL, fontSize: 11 };

const tooltipStyle = {
  contentStyle: { backgroundColor: "#10141b", border: "1px solid #2e3948", borderRadius: 6, fontSize: 12 },
  labelStyle: { color: "#c3ccd8" },
};

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="card text-center">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">{label}</div>
      <div className={`num mt-1 text-2xl font-bold ${accent ?? "text-white"}`}>{value}</div>
    </div>
  );
}

function pct(n: number | undefined | null, signed = true) {
  if (n === undefined || n === null) return "—";
  const s = n.toFixed(2);
  return signed && n > 0 ? `+${s}%` : `${s}%`;
}

export default function PaperBookDashboard() {
  const d = dashboard;
  const stats = d.stats;
  const total = stats.total ?? {};
  const ai = stats.ai ?? {};
  const base = stats.baseline ?? {};
  const curve = d.curve;
  const risk = d.risk_used;

  return (
    <div className="space-y-10">
      <section aria-labelledby="pb-status-h">
        <h2 id="pb-status-h" className="sr-only">Book status</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Inception" value={d.inception ?? "Pre-launch"} />
          <Stat label="NYMEX trading days live" value={String(d.trading_days)} />
          <Stat label="Model (pinned)" value={d.model_pinned} />
          <Stat label="Performance stats" value={d.show_performance ? "Published" : `After ${d.min_days_for_stats} days`} accent={d.show_performance ? "text-gain" : "text-steel-300"} />
        </div>
        <p className="mt-2 text-[11px] text-steel-500">
          Updated {d.generated_at.slice(0, 16).replace("T", " ")} UTC · {d.costs_note} · Sample size is labelled on every figure.
        </p>
      </section>

      {d.show_performance ? (
        <section aria-labelledby="pb-stats-h" className="card">
          <h2 id="pb-stats-h" className="h3">AI sleeves versus baseline — net of costs ({total.trading_days} trading days, simulated)</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-steel-500">
                <tr><th className="py-1 pr-4">Sleeve</th><th className="py-1 pr-4">Return</th><th className="py-1 pr-4">Vol (ann.)</th><th className="py-1 pr-4">Sharpe</th><th className="py-1 pr-4">Max drawdown</th><th className="py-1">Hit rate (days)</th></tr>
              </thead>
              <tbody className="num text-steel-200">
                {([["AI sleeves", ai], ["Baseline (no AI)", base], ["Whole book", total]] as [string, Stats][]).map(([name, st]) => {
                  return (
                    <tr key={name} className="border-t border-steel-800">
                      <td className="py-2 pr-4 font-semibold text-white">{name}</td>
                      <td className={`py-2 pr-4 ${(st.total_return_pct ?? 0) >= 0 ? "text-gain" : "text-risk"}`}>{pct(st.total_return_pct)}</td>
                      <td className="py-2 pr-4">{pct(st.annualised_vol_pct, false)}</td>
                      <td className="py-2 pr-4">{st.sharpe ?? "—"}</td>
                      <td className="py-2 pr-4 text-risk">{pct(st.max_drawdown_pct, false)}</td>
                      <td className="py-2">{pct(st.hit_rate_days_pct, false)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-steel-300">
            AI minus baseline: <span className="num font-semibold text-white">{pct(stats.ai_minus_baseline_pct)}</span> points. Simulated performance. Past performance, actual or simulated, is not a reliable indicator of future results.
          </p>
        </section>
      ) : (
        <section className="card border-gold-600/40">
          <h2 className="h3">Performance figures are withheld until 60 NYMEX trading days</h2>
          <p className="mt-2 text-sm leading-relaxed text-steel-300">
            The process is public from day one: every run, its frozen inputs, the PM proposal, the risk check and the timestamp proof. Numbers follow only once the sample is large enough to mean something, and they are labelled with the sample size every time.
          </p>
        </section>
      )}

      <section aria-labelledby="pb-curve-h" className="card">
        <h2 id="pb-curve-h" className="h3">NAV, net of costs (100 = inception)</h2>
        {curve.length ? (
          <>
            <div className="mt-4 h-64" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={curve} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={AXIS} minTickGap={32} />
                  <YAxis tick={AXIS} domain={["auto", "auto"]} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="ai_net" name="AI sleeves" stroke={GOLD} dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="baseline_net" name="Baseline (no AI)" stroke={STEEL} dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="total_net" name="Whole book" stroke="#2ecc71" dot={false} strokeWidth={1} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <ChartDataTable caption="NAV by sleeve, net of costs, 100 = inception" columns={[{ key: "date", label: "Date" }, { key: "ai_net", label: "AI sleeves" }, { key: "baseline_net", label: "Baseline" }, { key: "total_net", label: "Whole book" }]} rows={curve} />
          </>
        ) : (
          <p className="mt-2 text-sm text-steel-400">No marks yet. The curve starts on the first settlement after go-live.</p>
        )}
      </section>

      <section aria-labelledby="pb-risk-h" className="card">
        <h2 id="pb-risk-h" className="h3">Risk used against each limit</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Stat label="Open AI trades" value={`${risk.open_ai_trades} / ${risk.max_open_ai_trades}`} />
          <Stat label="Drawdown from peak" value={`${risk.drawdown_pct.toFixed(2)}%`} accent={risk.drawdown_pct <= risk.drawdown_stepdown_pct ? "text-risk" : "text-white"} />
          <Stat label="Gross exposure" value={`${risk.gross_exposure_x_nav.toFixed(2)}× / ${risk.gross_exposure_max_x_nav}×`} />
        </div>
        <p className="mt-2 text-[11px] text-steel-500">Step-down at {risk.drawdown_stepdown_pct}% (sizes halved), stop at {risk.drawdown_stop_pct}% (AI sleeves flattened). Limits are code, not discretion: paper-book/risk/limits.yaml.</p>
      </section>

      <section aria-labelledby="pb-positions-h" className="card">
        <h2 id="pb-positions-h" className="h3">Open positions</h2>
        {d.open_positions.length ? (
          <ul className="mt-3 divide-y divide-steel-800 text-sm">
            {d.open_positions.map((p) => (
              <li key={p.id} className="py-2">
                <span className="num font-semibold text-white">{p.legs.join(" / ")}</span>
                <span className="ml-2 rounded bg-steel-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-steel-300">{p.sleeve}</span>
                <div className="num text-[12px] text-steel-400">entry {p.entry} · stop {p.stop} · target {p.target} · risk ${Number(p.risk_usd).toLocaleString("en-US")}</div>
                <div className="text-[12px] text-steel-300">{p.thesis}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-steel-400">Flat.</p>
        )}
      </section>

      <section aria-labelledby="pb-calls-h" className="card">
        <h2 id="pb-calls-h" className="h3">Calls versus prints — EIA crude stocks (kbbl, negative = draw)</h2>
        {d.calls_vs_prints.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-steel-500">
                <tr><th className="py-1 pr-4">Week</th><th className="py-1 pr-4">Forecast</th><th className="py-1 pr-4">Range</th><th className="py-1 pr-4">Actual</th><th className="py-1 pr-4">Error</th><th className="py-1">In range</th></tr>
              </thead>
              <tbody className="num text-steel-200">
                {d.calls_vs_prints.map((c) => (
                  <tr key={c.week} className="border-t border-steel-800">
                    <td className="py-1.5 pr-4">{c.week}</td><td className="py-1.5 pr-4">{c.forecast_kbbl}</td><td className="py-1.5 pr-4">{c.range_kbbl[0]}..{c.range_kbbl[1]}</td>
                    <td className="py-1.5 pr-4">{c.actual_kbbl}</td><td className={`py-1.5 pr-4 ${Math.abs(c.error_kbbl) <= 1000 ? "text-gain" : "text-risk"}`}>{c.error_kbbl}</td><td className="py-1.5">{c.within_range ? "yes" : "no"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-steel-400">The first forecast is graded on the first EIA Wednesday after go-live.</p>
        )}
      </section>

      <section aria-labelledby="pb-log-h" className="card">
        <h2 id="pb-log-h" className="h3">Decision log — every run, misses included</h2>
        {d.decision_log.length ? (
          <ul className="mt-3 divide-y divide-steel-800 text-sm">
            {d.decision_log.map((r) => (
              <li key={r.run_id} className="py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="num font-semibold text-white">{r.date}</span>
                  <span className="rounded bg-steel-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-steel-300">{r.run}</span>
                  <span className={`text-[11px] uppercase tracking-wider ${r.status === "ok" ? "text-gain" : "text-steel-400"}`}>{r.status.replace("_", " ")}</span>
                  {r.grade && <span className="text-[11px] text-gold-500">{r.grade.replace("_", " / ")}</span>}
                  {r.commit && <span className="num text-[11px] text-steel-500">commit {r.commit}</span>}
                  {r.ots && <span className="text-[11px] text-steel-500">· OTS proof</span>}
                </div>
                {r.theses.map((t, i) => (<div key={i} className="text-[12px] text-steel-300">▸ {t}</div>))}
                {r.rejections.map((t, i) => (<div key={i} className="text-[12px] text-risk/80">✕ risk check: {t}</div>))}
                {r.no_trade_reason && <div className="text-[12px] text-steel-500">{r.no_trade_reason}</div>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-steel-400">No runs yet. The first scheduled run writes the first entry here, committed and timestamped before any order is sent.</p>
        )}
      </section>
    </div>
  );
}
