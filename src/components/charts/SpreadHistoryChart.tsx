"use client";

import EChart from "./EChart";
import ChartDataTable from "./ChartDataTable";
import type { SpreadHistoryRow } from "@/lib/curve";
import { THEME } from "@/lib/theme-tokens";

const LINES = [
  { key: "gasoline_crack", name: "Gasoline minus WTI", color: THEME.brent },
  { key: "diesel_crack", name: "Diesel minus WTI", color: THEME.gas },
  { key: "crack_321", name: "3-2-1 crack", color: THEME.bull },
  { key: "brent_wti", name: "Brent minus WTI", color: THEME.inkSecondary },
] as const;

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
      <div aria-hidden className="h-72 w-full">
        <EChart
          option={{
            backgroundColor: "transparent",
            grid: { left: 48, right: 12, top: 32, bottom: 28 },
            tooltip: { trigger: "axis" },
            legend: { textStyle: { color: THEME.inkSecondary }, top: 0 },
            xAxis: { type: "category", data: rows.map((row) => row.date), axisLabel: { color: THEME.inkMuted } },
            yAxis: { type: "value", scale: true, axisLabel: { color: THEME.inkMuted }, splitLine: { lineStyle: { color: THEME.hairline } } },
            series: shown.map((line) => ({
              type: "line",
              name: line.name,
              showSymbol: false,
              connectNulls: false,
              data: rows.map((row) => (typeof row[line.key] === "number" ? row[line.key] : null)),
              lineStyle: { color: line.color, width: 1.5 },
            })),
          }}
        />
      </div>
      <ChartDataTable
        caption={`${title}: data table`}
        columns={[{ key: "date", label: "Date" }, ...shown.map((line) => ({ key: line.key, label: `${line.name} (USD/bbl)` }))]}
        rows={rows.map((row) => ({ ...row }) as Record<string, string | number>)}
      />
    </figure>
  );
}
