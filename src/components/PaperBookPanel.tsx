"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import portfolioData from "../../data/virtual-portfolio.json";
import ChartDataTable from "./charts/ChartDataTable";

const GOLD = "#dcb54e";
const GRID = "#212936";
const GAIN = "#2ecc71";
const LOSS = "#ff6b5c";
const AXIS = { fill: "#8b98a9", fontSize: 11 };

const { account, meta, positions, closed_trades, benchmarks } = portfolioData;

const marks = [
  { date: "1 Jul", value: account.starting_value },
  { date: "4 Jul", value: account.current_value },
];

const earnings = [
  ...closed_trades.map((t) => ({
    name: `${t.ticker} closed`,
    pl: t.realised_pl,
  })),
  ...positions.map((p) => ({
    name: p.ticker,
    pl: p.unrealised_pl,
  })),
].sort((a, b) => b.pl - a.pl);

const totalPl = account.realised_pl + account.unrealised_pl;

function usd(n: number, signed = false) {
  const abs = Math.abs(n).toLocaleString("en-US");
  if (!signed) return `$${abs}`;
  if (n > 0) return `+$${abs}`;
  if (n < 0) return `−$${abs}`;
  return `$${abs}`;
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#10141b",
    border: "1px solid #2e3948",
    borderRadius: 6,
    fontSize: 12,
  },
  labelStyle: { color: "#c3ccd8" },
};

function GrowthChart() {
  return (
    <figure className="card">
      <figcaption className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-white">Account value</span>
        <span className="text-[10px] uppercase tracking-wide text-steel-500">Two published marks</span>
      </figcaption>
      <div aria-hidden className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={marks} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
            <YAxis
              domain={[998000, 1014000]}
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(v: number) => [usd(v), "Value"]}
            />
            <Area type="monotone" dataKey="value" stroke={GOLD} fill={GOLD} fillOpacity={0.18} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ChartDataTable
        caption="Published account value"
        columns={[
          { key: "date", label: "Date" },
          { key: "value", label: "Value (USD)" },
        ]}
        rows={marks}
      />
      <p className="mt-2 text-[11px] text-steel-500">
        Axis starts at $998,000 so the move is readable. Change {usd(totalPl, true)} ({account.return_pct >= 0 ? "+" : ""}
        {account.return_pct}%).
      </p>
    </figure>
  );
}

function EarningsChart({ title, note }: { title: string; note: string }) {
  return (
    <figure className="card">
      <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className="text-[10px] uppercase tracking-wide text-steel-500">{note}</span>
      </figcaption>
      <div aria-hidden className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={earnings} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis type="number" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} tickFormatter={(v: number) => usd(v, true)} />
            <YAxis type="category" dataKey="name" width={92} tick={AXIS} tickLine={false} axisLine={false} />
            <Tooltip {...tooltipStyle} formatter={(v: number) => [usd(v, true), "P&L"]} />
            <Bar dataKey="pl" radius={[0, 3, 3, 0]}>
              {earnings.map((row) => (
                <Cell key={row.name} fill={row.pl >= 0 ? GAIN : LOSS} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartDataTable
        caption={`${title} — profit and loss by line`}
        columns={[
          { key: "name", label: "Line" },
          { key: "pl", label: "P&L (USD)" },
        ]}
        rows={earnings}
      />
    </figure>
  );
}

const statement = [
  ["Opening value", usd(account.starting_value), "1 July 2026"],
  ["Realised P&L", usd(account.realised_pl, true), closed_trades.map((t) => `${t.ticker} ${usd(t.realised_pl, true)}`).join("; ")],
  ["Open P&L", usd(account.unrealised_pl, true), `${account.open_positions} positions still open`],
  ["Closing value", usd(account.current_value), "4 July 2026"],
  ["Cash", usd(account.cash_balance), `${account.cash_pct}% of the account`],
] as const;

export default function PaperBookPanel() {
  return (
    <section className="border-b border-ink-700 bg-ink-900" id="paper-book">
      <div className="container-site py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Paper trading · USD · virtual capital</p>
            <h2 className="h2 mt-1">The $1,000,000 account, and how the result is made</h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-steel-500">{benchmarks.period}</p>
            <Link href="/portfolio/dashboard" className="mt-1 inline-block text-sm font-semibold text-gold-400 hover:text-gold-300">
              Full journal →
            </Link>
          </div>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-steel-400">
          Starting capital {usd(account.starting_value)} on {meta.inception}. Latest published mark{" "}
          {usd(account.current_value)} ({account.return_pct >= 0 ? "+" : ""}
          {account.return_pct}%). {account.currency}. The client statement uses these same lines.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card text-center">
            <p className="text-xs uppercase tracking-widest text-steel-500">Account value</p>
            <p className="mt-2 text-2xl font-bold text-white">{usd(account.current_value)}</p>
            <p className="mt-1 text-xs text-steel-500">from {usd(account.starting_value)}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs uppercase tracking-widest text-steel-500">Result</p>
            <p className={`mt-2 text-2xl font-bold ${totalPl >= 0 ? "text-gain" : "text-loss"}`}>{usd(totalPl, true)}</p>
            <p className="mt-1 text-xs text-steel-500">
              {account.return_pct >= 0 ? "+" : ""}
              {account.return_pct}% since inception
            </p>
          </div>
          <div className="card text-center">
            <p className="text-xs uppercase tracking-widest text-steel-500">Realised</p>
            <p className="mt-2 text-2xl font-bold text-gain">{usd(account.realised_pl, true)}</p>
            <p className="mt-1 text-xs text-steel-500">{account.closed_trades} closed trade</p>
          </div>
          <div className="card text-center">
            <p className="text-xs uppercase tracking-widest text-steel-500">Still open</p>
            <p className="mt-2 text-2xl font-bold text-gain">{usd(account.unrealised_pl, true)}</p>
            <p className="mt-1 text-xs text-steel-500">{account.open_positions} positions</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <GrowthChart />
          <EarningsChart title="How the earnings are created" note="Each published line" />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="card">
            <p className="text-sm font-semibold text-white">Client statement</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-steel-500">Same virtual account</p>
            <table className="mt-3 w-full text-sm">
              <caption className="sr-only">Illustrative client statement of the virtual USD account</caption>
              <tbody>
                {statement.map(([label, value, detail]) => (
                  <tr key={label} className="border-t border-ink-700">
                    <th scope="row" className="py-2 pr-3 text-left font-medium text-steel-400">
                      {label}
                    </th>
                    <td className="num py-2 text-right font-semibold text-white">{value}</td>
                    <td className="hidden py-2 pl-3 text-right text-xs text-steel-500 sm:table-cell">{detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[11px] leading-relaxed text-steel-500">
              Sample statement for this paper account. Marked {account.last_updated.slice(0, 10)}. Simulated
              performance is educational and is not a promise of future results.
            </p>
          </div>
          <EarningsChart title="Client view of the same lines" note="Same P&L, statement view" />
        </div>
      </div>
    </section>
  );
}
