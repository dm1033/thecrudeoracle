"use client";

import { useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartDataTable, { type ChartTableColumn } from "@/components/charts/ChartDataTable";
import type { CrackChartPoint, StockChartPoint, UtilPoint } from "@/lib/diesel-assemble";

const GOLD = "#c9a038";
const STEEL = "#8b98a9";
const NAVY = "#5b8dd6";
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

function ticks(length: number): number {
  return Math.max(0, Math.ceil(length / 6) - 1);
}

export function StocksChart({ points }: { points: StockChartPoint[] }) {
  const [years, setYears] = useState<2 | 5>(2);
  const end = points.length ? Date.parse(`${points[points.length - 1].period}T00:00:00Z`) : 0;
  const start = end - years * 365.25 * 86400000;
  const data = points.filter((point) => Date.parse(`${point.period}T00:00:00Z`) >= start);
  const columns: ChartTableColumn[] = [
    { key: "period", label: "Week ending" },
    { key: "stocks", label: "Stocks (million barrels)" },
    { key: "avg", label: "Five-year average (million barrels)" },
    { key: "low", label: "Five-year low (million barrels)" },
    { key: "high", label: "Five-year high (million barrels)" },
  ];
  const rows = data.map((point) => ({
    period: point.period,
    stocks: point.stocks,
    avg: point.avg ?? "TBC",
    low: point.low ?? "TBC",
    high: point.high ?? "TBC",
  }));

  return (
    <figure className="card">
      <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-white">US distillate stocks against the five-year band</span>
        <span className="flex gap-2 text-[10px] uppercase tracking-wide text-steel-500">
          <button
            type="button"
            aria-pressed={years === 2}
            onClick={() => setYears(2)}
            className={years === 2 ? "font-bold text-gold-400" : "hover:text-white"}
          >
            2 years
          </button>
          <button
            type="button"
            aria-pressed={years === 5}
            onClick={() => setYears(5)}
            className={years === 5 ? "font-bold text-gold-400" : "hover:text-white"}
          >
            5 years
          </button>
        </span>
      </figcaption>
      {data.length === 0 ? (
        <p className="text-sm text-steel-400">WDISTUS1 dark. No cached stocks.</p>
      ) : (
        <div aria-hidden className="h-64 w-full">
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
              <XAxis dataKey="period" {...axisProps} interval={ticks(data.length)} />
              <YAxis {...axisProps} domain={["auto", "auto"]} unit="" />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="high" name="5-year high" stroke="none" fill={GOLD} fillOpacity={0.08} />
              <Line type="monotone" dataKey="high" name="High" stroke={STEEL} strokeDasharray="3 3" dot={false} strokeWidth={1} />
              <Line type="monotone" dataKey="low" name="Low" stroke={STEEL} strokeDasharray="3 3" dot={false} strokeWidth={1} />
              <Line type="monotone" dataKey="avg" name="5-year avg" stroke={NAVY} strokeDasharray="5 4" dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="stocks" name="Stocks" stroke={GOLD} dot={false} strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      <ChartDataTable caption="US distillate stocks, million barrels" columns={columns} rows={rows} />
      <p className="mt-2 text-[11px] text-steel-500">
        WDISTUS1. EIA thousand barrels ÷ 1,000. Band is the same ISO week in the prior five calendar years. Current year excluded. As-of is the week-ending date.
      </p>
    </figure>
  );
}

export function CrackChart({
  daily,
  weekly,
}: {
  daily: CrackChartPoint[];
  weekly: CrackChartPoint[];
}) {
  const [span, setSpan] = useState<"1y" | "5y">("1y");
  const data = span === "1y" ? daily : weekly;
  const columns: ChartTableColumn[] = [
    { key: "period", label: "Date" },
    { key: "wti", label: "Crack vs WTI ($/bbl)" },
    { key: "brent", label: "Crack vs Brent ($/bbl)" },
  ];
  const rows = data.map((point) => ({
    period: point.period,
    wti: point.wti ?? "TBC",
    brent: point.brent ?? "TBC",
  }));

  return (
    <figure className="card">
      <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-white">ULSD spot crack</span>
        <span className="flex gap-2 text-[10px] uppercase tracking-wide text-steel-500">
          <button type="button" aria-pressed={span === "1y"} onClick={() => setSpan("1y")} className={span === "1y" ? "font-bold text-gold-400" : "hover:text-white"}>
            1 year
          </button>
          <button type="button" aria-pressed={span === "5y"} onClick={() => setSpan("5y")} className={span === "5y" ? "font-bold text-gold-400" : "hover:text-white"}>
            5 years
          </button>
        </span>
      </figcaption>
      {data.length === 0 ? (
        <p className="text-sm text-steel-400">EER_EPD2DXL0_PF4_Y35NY_DPG or RWTC dark. No crack line.</p>
      ) : (
        <div aria-hidden className="h-64 w-full">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
              <XAxis dataKey="period" {...axisProps} interval={ticks(data.length)} />
              <YAxis {...axisProps} domain={["auto", "auto"]} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="wti" name="vs WTI" stroke={GOLD} dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="brent" name="vs Brent" stroke={NAVY} dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <ChartDataTable caption="ULSD spot crack, dollars per barrel" columns={columns} rows={rows} />
      <p className="mt-2 text-[11px] text-steel-500">
        (NYH ULSD $/gal × 42) − crude $/bbl. One-year view is the daily spot. Five-year view is the last spot of each ISO week. Spot crack. STEO path is dark: no confirmed series id.
      </p>
    </figure>
  );
}

export function UtilizationSpark({ points }: { points: UtilPoint[] }) {
  if (points.length === 0) {
    return <p className="text-sm text-steel-400">WPULEUS3 dark. No utilization spark.</p>;
  }
  return (
    <div>
      <div aria-hidden className="h-16 w-full">
        <ResponsiveContainer>
          <LineChart data={points} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <Line type="monotone" dataKey="utilization" stroke={GOLD} dot={false} strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartDataTable
        caption="Refinery utilization, percent"
        columns={[
          { key: "period", label: "Week ending" },
          { key: "utilization", label: "Utilization (percent)" },
        ]}
        rows={points.map((point) => ({ period: point.period, utilization: point.utilization }))}
      />
    </div>
  );
}
