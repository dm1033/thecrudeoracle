"use client";

import type { EChartsCoreOption } from "echarts/core";
import EChart from "./EChart";
import ChartDataTable, { type ChartTableColumn } from "./ChartDataTable";
import { THEME } from "@/lib/theme-tokens";

export type BrentWtiPoint = { date: string; brent: number; wti: number };
export type HenryHubPoint = { date: string; hh: number };

const base = {
  backgroundColor: "transparent",
  textStyle: { color: THEME.inkSecondary, fontFamily: "ui-monospace, monospace" },
  grid: { left: 48, right: 16, top: 28, bottom: 28 },
  tooltip: { trigger: "axis" as const, backgroundColor: THEME.surface1, borderColor: THEME.hairline, textStyle: { color: THEME.ink } },
};

function ChartFrame({
  title,
  note,
  updated,
  data,
  columns,
  option,
}: {
  title: string;
  note: string;
  updated: string;
  data: Record<string, string | number>[];
  columns: ChartTableColumn[];
  option: EChartsCoreOption;
}) {
  return (
    <figure className="card">
      <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className="text-[10px] uppercase tracking-wide text-steel-500">{note}</span>
      </figcaption>
      <div aria-hidden className="h-64 w-full">
        <EChart option={option} />
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
      option={{
        ...base,
        legend: { textStyle: { color: THEME.inkSecondary }, top: 0 },
        xAxis: { type: "category", data: points.map((point) => point.date), axisLabel: { color: THEME.inkMuted } },
        yAxis: { type: "value", scale: true, axisLabel: { color: THEME.inkMuted }, splitLine: { lineStyle: { color: THEME.hairline } } },
        series: [
          { type: "line", name: "Brent", data: points.map((point) => point.brent), showSymbol: false, lineStyle: { color: THEME.brent, width: 1.5 } },
          { type: "line", name: "WTI", data: points.map((point) => point.wti), showSymbol: false, lineStyle: { color: THEME.wti, width: 1.5 } },
        ],
      }}
    />
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
      option={{
        ...base,
        xAxis: { type: "category", data: points.map((point) => point.date), axisLabel: { color: THEME.inkMuted } },
        yAxis: { type: "value", scale: true, axisLabel: { color: THEME.inkMuted }, splitLine: { lineStyle: { color: THEME.hairline } } },
        series: [{ type: "line", name: "Henry Hub", data: points.map((point) => point.hh), showSymbol: false, lineStyle: { color: THEME.gas, width: 1.5 } }],
      }}
    />
  );
}
