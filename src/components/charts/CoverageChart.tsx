"use client";

import EChart from "./EChart";
import ChartDataTable from "./ChartDataTable";
import type { NewsTimelinePoint } from "@/lib/oracle-intelligence";
import { THEME } from "@/lib/theme-tokens";

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
  const average = points.reduce((sum, point) => sum + point.sharePct, 0) / points.length;
  return (
    <figure className="card">
      <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className="text-[10px] uppercase tracking-wide text-steel-500">GDELT coverage volume · times in UTC</span>
      </figcaption>
      <div aria-hidden className="h-64 w-full">
        <EChart
          option={{
            backgroundColor: "transparent",
            grid: { left: 48, right: 12, top: 16, bottom: 28 },
            tooltip: { trigger: "axis" },
            xAxis: { type: "category", data: points.map((point) => label(point.t, false)), axisLabel: { color: THEME.inkMuted } },
            yAxis: { type: "value", axisLabel: { color: THEME.inkMuted }, splitLine: { lineStyle: { color: THEME.hairline } } },
            series: [
              { type: "bar", name: "Coverage share", data: points.map((point) => point.sharePct), itemStyle: { color: THEME.brent } },
              { type: "line", name: "7-day average", data: points.map(() => average), showSymbol: false, lineStyle: { color: THEME.inkSecondary, type: "dashed" } },
            ],
          }}
        />
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
