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
import curveData from "../../../data/curve-monitor.json";

const GOLD = "#c9a038";
const NAVYLINE = "#5b8dd6";
const STEEL = "#8b98a9";
const GRID = "#212936";

export default function CurveChart() {
  return (
    <figure className="card">
      <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-white">Forward Curves — Brent vs WTI, M1–M12</span>
        <span className="text-[10px] uppercase tracking-wide text-steel-500">
          USD/bbl · downward slope = backwardation · indicative
        </span>
      </figcaption>
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <LineChart data={curveData.forward_curves} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke={STEEL} tick={{ fill: STEEL, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} />
            <YAxis stroke={STEEL} tick={{ fill: STEEL, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{ backgroundColor: "#10141b", border: "1px solid #2e3948", borderRadius: 6, fontSize: 12 }}
              labelStyle={{ color: "#c3ccd8" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="brent" name="Brent" stroke={GOLD} strokeWidth={2} dot={{ r: 2.5, fill: GOLD }} />
            <Line type="monotone" dataKey="wti" name="WTI" stroke={NAVYLINE} strokeWidth={2} dot={{ r: 2.5, fill: NAVYLINE }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11px] text-steel-500">
        Source: {curveData.curve_summary.source} · Updated: {curveData.meta.last_published.slice(0, 10)} ·{" "}
        <span className="font-semibold uppercase">manual</span>
      </p>
    </figure>
  );
}
