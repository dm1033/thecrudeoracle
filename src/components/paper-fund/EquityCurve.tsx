"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartDataTable from "@/components/charts/ChartDataTable";
import type { EquityPoint } from "@/lib/paper-fund";
import { usd } from "@/lib/paper-fund";

const GOLD = "#dcb54e";
const GRID = "#212936";
const AXIS = { fill: "#8b98a9", fontSize: 11 };

export default function EquityCurve({ points, starting }: { points: EquityPoint[]; starting: number }) {
  const navs = points.map((p) => p.nav);
  const min = Math.min(starting, ...navs);
  const max = Math.max(starting, ...navs);
  const pad = Math.max((max - min) * 0.35, starting * 0.01);
  const rows = points.map((p) => ({ date: p.date, nav: p.nav, note: p.note }));

  return (
    <figure className="card">
      <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-white">The Crude Oracle $10M Paper Fund NAV</span>
        <span className="text-[10px] uppercase tracking-wide text-steel-500">
          {points.length} published mark{points.length === 1 ? "" : "s"}
        </span>
      </figcaption>
      <div aria-hidden className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
            <YAxis
              domain={[min - pad, max + pad]}
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(2)}m`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#10141b", border: "1px solid #2e3948", borderRadius: 6, fontSize: 12 }}
              labelStyle={{ color: "#c3ccd8" }}
              formatter={(v: number) => [usd(v), "NAV"]}
            />
            <ReferenceLine y={starting} stroke="#5c6b7e" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="nav" stroke={GOLD} strokeWidth={2} dot={{ r: 4, fill: GOLD }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartDataTable
        caption="Published weekly NAV of the $10,000,000 paper fund"
        columns={[
          { key: "date", label: "Date" },
          { key: "nav", label: "NAV (USD)" },
          { key: "note", label: "Note" },
        ]}
        rows={rows}
      />
      <table className="mt-3 w-full text-left text-xs">
        <caption className="sr-only">NAV history</caption>
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-steel-500">
            <th className="py-1 font-semibold">Date</th>
            <th className="py-1 text-right font-semibold">NAV</th>
            <th className="py-1 pl-3 font-semibold">Note</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.date} className="border-t border-ink-700">
              <td className="num py-1.5 text-steel-300">{p.date}</td>
              <td className="num py-1.5 text-right text-white">{usd(p.nav)}</td>
              <td className="py-1.5 pl-3 text-steel-500">{p.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-steel-500">
        The dashed line is the {usd(starting)} inception NAV. Losing weeks stay on this chart. A single point is the whole history so far.
      </p>
    </figure>
  );
}
