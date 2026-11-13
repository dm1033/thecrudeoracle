"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import ChartDataTable from "./ChartDataTable";
import type { SpreadHistoryRow } from "@/lib/curve";

const STEEL = "#8b98a9";
const GRID = "#212936";

const LINES = [
  { key: "gasoline_crack", name: "Gasoline minus WTI", color: "#c9a038" },
  { key: "diesel_crack", name: "Diesel minus WTI", color: "#5b8dd6" },
  { key: "crack_321", name: "3-2-1 crack", color: "#2ecc71" },
  { key: "brent_wti", name: "Brent minus WTI", color: "#c3ccd8" },
] as const;

function shortDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`)
  );
}

export default function SpreadHistoryChart({ rows }: { rows: SpreadHistoryRow[] }) {
  const shown = LINES.filter((line) => rows.some((row) => typeof row[line.key] === "number"));
  if (rows.length < 2 || !shown.length) return null;
  const title = `Spreads over the last ${rows.length} trading days`;
  return (
    <figure className="card">
      <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className="text-[10px] uppercase tracking-wide text-steel-500">USD/bbl · from EIA daily spot prices</span>
      </figcaption>
      {/* Decorative: the sr-only table below is the accessible equivalent (WCAG 1.1.1) */}
      <div aria-hidden className="h-72 w-full">
        <ResponsiveContainer>
          <LineChart data={rows} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              minTickGap={32}
              stroke={STEEL}
              tick={{ fill: STEEL, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: GRID }}
            />
            <YAxis stroke={STEEL} tick={{ fill: STEEL, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} domain={["auto", "auto"]} />
            <Tooltip
              labelFormatter={(label) => shortDate(String(label))}
              contentStyle={{ backgroundColor: "#10141b", border: "1px solid #2e3948", borderRadius: 6, fontSize: 12 }}
              labelStyle={{ color: "#c3ccd8" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {shown.map((line) => (
              <Line key={line.key} type="monotone" dataKey={line.key} name={line.name} stroke={line.color} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartDataTable
        caption={`${title}: data table`}
        columns={[{ key: "date", label: "Date" }, ...shown.map((line) => ({ key: line.key, label: `${line.name} (USD/bbl)` }))]}
        rows={rows.map((row) => ({ ...row }) as Record<string, string | number>)}
      />
    </figure>
  );
}
