"use client";

import { useState } from "react";
import EChart from "@/components/charts/EChart";
import type { SeasonalSeries, SeasonalSuite } from "@/lib/eia-seasonal";
import { THEME } from "@/lib/theme-tokens";

export default function SeasonalChart({ suite }: { suite: SeasonalSuite | null }) {
  const [id, setId] = useState(suite?.series[0]?.id ?? "");
  const series = suite?.series.find((item) => item.id === id) ?? suite?.series[0] ?? null;
  if (!suite || !series) {
    return (
      <p className="p-4 text-sm text-ink-secondary">
        The five-year EIA stock band is not loaded. No range is drawn from memory.
      </p>
    );
  }
  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-border-hairline px-3 py-2">
        {suite.series.map((item) => (
          <button key={item.id} type="button" onClick={() => setId(item.id)} className={`px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] ${item.id === series.id ? "bg-brass text-canvas" : "text-ink-secondary"}`}>
            {item.name}
          </button>
        ))}
      </div>
      <Band series={series} />
      <p className="border-t border-border-hairline px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted">
        EIA weekly · million barrels · ISO-week band uses the five prior ISO years · week-on-week only when the prior print is seven days earlier · as of {series.asOf}
      </p>
    </div>
  );
}

function Band({ series }: { series: SeasonalSeries }) {
  const weeks = series.bands.map((band) => String(band.isoWeek));
  const recent = series.points.slice(-16);
  return (
    <div className="grid gap-[1px] bg-border-hairline lg:grid-cols-2">
      <div className="h-72 bg-surface-1">
        <EChart
          option={{
            backgroundColor: "transparent",
            grid: { left: 48, right: 12, top: 28, bottom: 24 },
            tooltip: { trigger: "axis" },
            legend: { textStyle: { color: THEME.inkSecondary }, top: 0 },
            xAxis: { type: "category", data: weeks, axisLabel: { color: THEME.inkMuted } },
            yAxis: { type: "value", scale: true, axisLabel: { color: THEME.inkMuted }, splitLine: { lineStyle: { color: THEME.hairline } } },
            series: [
              { type: "line", name: "5y max", data: series.bands.map((band) => band.max), showSymbol: false, lineStyle: { opacity: 0 }, stack: "band", areaStyle: { color: "transparent" } },
              { type: "line", name: "5y min-max", data: series.bands.map((band) => (band.min != null && band.max != null ? band.max - band.min : null)), showSymbol: false, lineStyle: { opacity: 0 }, stack: "band", areaStyle: { color: "rgba(200,155,60,0.18)" } },
              { type: "line", name: "5y mean", data: series.bands.map((band) => band.mean), showSymbol: false, lineStyle: { color: THEME.inkSecondary, type: "dashed" } },
              { type: "line", name: "Prior year", data: series.bands.map((band) => band.prior), showSymbol: false, lineStyle: { color: THEME.wti } },
              { type: "line", name: "Current year", data: series.bands.map((band) => band.current), showSymbol: false, lineStyle: { color: THEME.brent, width: 2 } },
            ],
          }}
        />
      </div>
      <div className="h-72 bg-surface-1">
        <EChart
          option={{
            backgroundColor: "transparent",
            grid: { left: 48, right: 12, top: 16, bottom: 24 },
            tooltip: { trigger: "axis" },
            xAxis: { type: "category", data: recent.map((point) => point.date), axisLabel: { color: THEME.inkMuted } },
            yAxis: { type: "value", axisLabel: { color: THEME.inkMuted }, splitLine: { lineStyle: { color: THEME.hairline } } },
            series: [
              {
                type: "bar",
                name: "Week on week",
                data: recent.map((point) => ({ value: point.change, itemStyle: { color: (point.change ?? 0) >= 0 ? THEME.bear : THEME.bull } })),
              },
            ],
          }}
        />
      </div>
    </div>
  );
}
