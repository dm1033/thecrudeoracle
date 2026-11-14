"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import ChartDataTable from "./ChartDataTable";
import type { NewsTimelinePoint } from "@/lib/oracle-intelligence";

const STEEL = "#8b98a9";
const GRID = "#212936";
const GOLD = "#c9a038";

function label(t: string, withTime: boolean): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "UTC",
  }).format(new Date(t));
}

export default function CoverageChart({ points }: { points: NewsTimelinePoint[] }) {
  if (points.length < 2) return null;
  const title = "Share of online news matching the search terms, last seven days";
  return (
    <figure className="card">
      <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className="text-[10px] uppercase tracking-wide text-steel-500">% of all coverage · times in UTC</span>
      </figcaption>
      {/* Decorative: the sr-only table below is the accessible equivalent (WCAG 1.1.1) */}
      <div aria-hidden className="h-64 w-full">
        <ResponsiveContainer>
          <AreaChart data={points} margin={{ top: 5, right: 10, bottom: 0, left: -5 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
            <XAxis
              dataKey="t"
              tickFormatter={(t) => label(String(t), false)}
              minTickGap={40}
              stroke={STEEL}
              tick={{ fill: STEEL, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: GRID }}
            />
            <YAxis stroke={STEEL} tick={{ fill: STEEL, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} domain={[0, "auto"]} />
            <Tooltip
              labelFormatter={(t) => `${label(String(t), true)} UTC`}
              formatter={(value) => [`${Number(value).toFixed(3)}%`, "Share of coverage"]}
              contentStyle={{ backgroundColor: "#10141b", border: "1px solid #2e3948", borderRadius: 6, fontSize: 12 }}
              labelStyle={{ color: "#c3ccd8" }}
            />
            <Area type="monotone" dataKey="sharePct" stroke={GOLD} fill={GOLD} fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ChartDataTable
        caption={`${title}: data table`}
        columns={[
          { key: "when", label: "Time (UTC)" },
          { key: "share", label: "Share of coverage (%)" },
        ]}
        rows={points.map((point) => ({ when: label(point.t, true), share: point.sharePct.toFixed(3) }))}
      />
    </figure>
  );
}
