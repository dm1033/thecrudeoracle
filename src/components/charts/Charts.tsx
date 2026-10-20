"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import ChartDataTable, { type ChartTableColumn } from "./ChartDataTable";

const GOLD = "#c9a038";
const STEEL = "#8b98a9";
const NAVYLINE = "#5b8dd6";
const GRID = "#212936";

const axisProps = {
  stroke: STEEL,
  tick: { fill: STEEL, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: GRID },
} as const;

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#10141b",
    border: "1px solid #2e3948",
    borderRadius: 6,
    fontSize: 12,
  },
  labelStyle: { color: "#c3ccd8" },
} as const;

export type BrentWtiPoint = { date: string; brent: number; wti: number };
export type HenryHubPoint = { date: string; hh: number };

function ChartFrame({
  title,
  note,
  updated,
  data,
  columns,
  children,
}: {
  title: string;
  note: string;
  updated: string;
  data: Record<string, string | number>[];
  columns: ChartTableColumn[];
  children: React.ReactNode;
}) {
  return (
    <figure className="card">
      <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className="text-[10px] uppercase tracking-wide text-steel-500">{note}</span>
      </figcaption>
      <div aria-hidden className="h-64 w-full">
        {children}
      </div>
      <ChartDataTable caption={`${title} — data table`} columns={columns} rows={data} />
      <p className="mt-2 text-[11px] text-steel-300">
        Last updated <time dateTime={updated}>{updated}</time> · Source: EIA
      </p>
    </figure>
  );
}

function UnavailableChart({ title }: { title: string }) {
  return (
    <figure className="card">
      <figcaption className="text-sm font-semibold text-white">{title}</figcaption>
      <p className="mt-3 text-sm leading-relaxed text-steel-400">
        EIA history is not available for this chart, so no stand-in series is shown.
      </p>
    </figure>
  );
}

export function BrentWtiChart({ points }: { points: BrentWtiPoint[] }) {
  if (points.length < 2) return <UnavailableChart title="Brent vs WTI — EIA daily spot" />;
  const updated = points[points.length - 1].date;
  return (
    <ChartFrame
      title="Brent vs WTI — EIA daily spot"
      note="USD/bbl · Source: EIA"
      updated={updated}
      data={points}
      columns={[
        { key: "date", label: "Trade date" },
        { key: "brent", label: "Brent (USD/bbl)" },
        { key: "wti", label: "WTI (USD/bbl)" },
      ]}
    >
      <ResponsiveContainer>
        <LineChart data={points} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
          <XAxis dataKey="date" {...axisProps} minTickGap={24} />
          <YAxis {...axisProps} domain={["auto", "auto"]} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="brent" name="Brent" stroke={GOLD} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="wti" name="WTI" stroke={NAVYLINE} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function HenryHubChart({ points }: { points: HenryHubPoint[] }) {
  if (points.length < 2) return <UnavailableChart title="Henry Hub — EIA daily spot" />;
  const updated = points[points.length - 1].date;
  return (
    <ChartFrame
      title="Henry Hub — EIA daily spot"
      note="USD/MMBtu · Source: EIA"
      updated={updated}
      data={points}
      columns={[
        { key: "date", label: "Trade date" },
        { key: "hh", label: "Henry Hub (USD/MMBtu)" },
      ]}
    >
      <ResponsiveContainer>
        <LineChart data={points} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
          <XAxis dataKey="date" {...axisProps} minTickGap={24} />
          <YAxis {...axisProps} domain={["auto", "auto"]} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="hh" name="Henry Hub" stroke={GOLD} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
