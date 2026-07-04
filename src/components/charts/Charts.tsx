"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import chartData from "../../../data/chart-data.json";

const GOLD = "#c9a038";
const STEEL = "#8b98a9";
const GAIN = "#2ecc71";
const LOSS = "#e74c3c";
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

function ChartFrame({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="card">
      <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className="text-[10px] uppercase tracking-wide text-steel-500">{note}</span>
      </figcaption>
      <div className="h-64 w-full">{children}</div>
      <p className="mt-2 text-[11px] text-steel-500">
        Source: {chartData.meta.source} · Updated: {chartData.meta.last_published.slice(0, 10)} ·{" "}
        <span className="font-semibold uppercase">{chartData.meta.data_type}</span>
      </p>
    </figure>
  );
}

export function BrentWtiChart() {
  return (
    <ChartFrame title="Brent vs WTI — 30-Day Trend" note="USD/bbl · indicative">
      <ResponsiveContainer>
        <LineChart data={chartData.brent_wti_30d} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
          <XAxis dataKey="date" {...axisProps} />
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

export function GasTrendChart() {
  return (
    <ChartFrame title="Gas Prices — 30-Day Trend" note="TTF EUR/MWh · NBP p/therm · indicative">
      <ResponsiveContainer>
        <LineChart data={chartData.gas_trend_30d} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
          <XAxis dataKey="date" {...axisProps} />
          <YAxis {...axisProps} domain={["auto", "auto"]} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="ttf" name="TTF" stroke={GOLD} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="nbp" name="UK NBP" stroke={NAVYLINE} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function InventoriesChart() {
  return (
    <ChartFrame title="US Commercial Crude Inventories" note="million barrels · indicative">
      <ResponsiveContainer>
        <AreaChart data={chartData.us_inventories_weeks} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="stocksFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
              <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
          <XAxis dataKey="week" {...axisProps} />
          <YAxis {...axisProps} domain={["auto", "auto"]} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="stocks" name="Stocks" stroke={GOLD} fill="url(#stocksFill)" strokeWidth={2} />
          <Line type="monotone" dataKey="fiveYearAvg" name="5-yr avg" stroke={STEEL} strokeWidth={1.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function RigCountChart() {
  return (
    <ChartFrame title="US Rig Count" note="weekly · indicative">
      <ResponsiveContainer>
        <BarChart data={chartData.rig_count_weeks} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
          <XAxis dataKey="week" {...axisProps} />
          <YAxis {...axisProps} domain={["auto", "auto"]} />
          <Tooltip {...tooltipStyle} cursor={{ fill: "#161b24" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="oil" name="Oil rigs" fill={GOLD} radius={[2, 2, 0, 0]} />
          <Bar dataKey="gas" name="Gas rigs" fill={NAVYLINE} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function OpecProductionChart() {
  return (
    <ChartFrame title="OPEC Crude Production vs Target" note="mb/d · indicative">
      <ResponsiveContainer>
        <LineChart data={chartData.opec_production_months} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
          <XAxis dataKey="month" {...axisProps} />
          <YAxis {...axisProps} domain={["auto", "auto"]} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="production" name="Production" stroke={GOLD} strokeWidth={2} dot={false} />
          <Line type="stepAfter" dataKey="target" name="Target" stroke={STEEL} strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function WatchlistPerformanceChart() {
  return (
    <ChartFrame title="Watchlist vs Benchmark — Indexed" note="30 days, 100 = start · indicative">
      <ResponsiveContainer>
        <LineChart data={chartData.watchlist_performance_30d} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
          <XAxis dataKey="date" {...axisProps} />
          <YAxis {...axisProps} domain={["auto", "auto"]} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={100} stroke={GRID} />
          <Line type="monotone" dataKey="watchlist" name="Watchlist" stroke={GOLD} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="benchmark" name="Benchmark" stroke={STEEL} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function SectorHeatmapChart() {
  return (
    <ChartFrame title="Energy Sector Heatmap — Daily Moves" note="% change · indicative">
      <ResponsiveContainer>
        <BarChart data={chartData.sector_heatmap} layout="vertical" margin={{ top: 5, right: 20, bottom: 0, left: 20 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" {...axisProps} />
          <YAxis type="category" dataKey="sector" {...axisProps} width={80} />
          <Tooltip {...tooltipStyle} cursor={{ fill: "#161b24" }} />
          <ReferenceLine x={0} stroke={STEEL} />
          <Bar dataKey="move" name="Daily move %" radius={[0, 2, 2, 0]}>
            {chartData.sector_heatmap.map((entry) => (
              <Cell key={entry.sector} fill={entry.move >= 0 ? GAIN : LOSS} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
