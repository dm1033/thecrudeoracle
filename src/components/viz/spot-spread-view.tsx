"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ColorType, HistogramSeries, LineSeries, createChart, type IChartApi, type UTCTimestamp } from "lightweight-charts";
import { HISTORY_RANGES, rebase, sliceRange, type HistoryPoint, type HistoryRange } from "@/lib/historical-series";
import { THEME } from "@/lib/theme-tokens";

export interface SpotSpreadPayload {
  brent: HistoryPoint[];
  wti: HistoryPoint[];
  henryHub: HistoryPoint[];
  spread: HistoryPoint[];
}

function stamp(date: string): UTCTimestamp {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 1000) as UTCTimestamp;
}

export default function SpotSpreadView({
  data,
  showHenry = true,
}: {
  data: SpotSpreadPayload | null;
  showHenry?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [range, setRange] = useState<HistoryRange>("1Y");
  const [mode, setMode] = useState<"price" | "rebased">("price");
  const [log, setLog] = useState(false);

  const windowed = useMemo(() => {
    if (!data) return null;
    const apply = (points: HistoryPoint[]) => {
      const sliced = sliceRange(points, range);
      return mode === "rebased" ? rebase(sliced) : sliced;
    };
    return {
      brent: apply(data.brent),
      wti: apply(data.wti),
      henryHub: showHenry ? apply(data.henryHub) : [],
      spread: sliceRange(data.spread, range),
    };
  }, [data, range, mode, showHenry]);

  useEffect(() => {
    const node = ref.current;
    if (!node || !windowed) return;
    const chart = createChart(node, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: THEME.surface1 }, textColor: THEME.inkSecondary, fontFamily: "ui-monospace, monospace" },
      grid: { vertLines: { color: THEME.hairline }, horzLines: { color: THEME.hairline } },
      rightPriceScale: { borderColor: THEME.hairline },
      timeScale: { borderColor: THEME.hairline },
      crosshair: { vertLine: { color: THEME.brass }, horzLine: { color: THEME.brass } },
    });
    const brent = chart.addSeries(LineSeries, { color: THEME.brent, lineWidth: 2, priceLineVisible: false });
    const wti = chart.addSeries(LineSeries, { color: THEME.wti, lineWidth: 2, priceLineVisible: false });
    const henry = showHenry ? chart.addSeries(LineSeries, { color: THEME.gas, lineWidth: 1, priceLineVisible: false }) : null;
    const spread = chart.addSeries(HistogramSeries, { color: THEME.brass, priceScaleId: "spread", priceLineVisible: false });
    chart.priceScale("spread").applyOptions({ scaleMargins: { top: 0.72, bottom: 0 } });
    chart.priceScale("right").applyOptions({ mode: log ? 1 : 0 });
    brent.setData(windowed.brent.map((point) => ({ time: stamp(point.date), value: point.value })));
    wti.setData(windowed.wti.map((point) => ({ time: stamp(point.date), value: point.value })));
    henry?.setData(windowed.henryHub.map((point) => ({ time: stamp(point.date), value: point.value })));
    spread.setData(windowed.spread.map((point) => ({ time: stamp(point.date), value: point.value, color: point.value >= 0 ? THEME.brent : THEME.wti })));
    chart.timeScale().fitContent();
    chartRef.current = chart;
    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [windowed, log, showHenry]);

  if (!data || data.brent.length + data.wti.length < 2) {
    return (
      <p className="p-4 text-sm text-ink-secondary">
        EIA daily history is not loaded. No stand-in series is drawn. A keyless build leaves this panel empty on purpose.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 border-b border-border-hairline px-3 py-2">
        {HISTORY_RANGES.map((item) => (
          <button key={item} type="button" onClick={() => setRange(item)} className={`px-2 py-1 font-mono text-[10px] tracking-[0.08em] ${range === item ? "bg-brass text-canvas" : "text-ink-secondary"}`}>
            {item}
          </button>
        ))}
        <button type="button" onClick={() => setMode((value) => (value === "price" ? "rebased" : "price"))} className="px-2 py-1 font-mono text-[10px] tracking-[0.08em] text-ink-secondary">
          {mode === "price" ? "$/BBL" : "% REBASED"}
        </button>
        <button type="button" onClick={() => setLog((value) => !value)} className="px-2 py-1 font-mono text-[10px] tracking-[0.08em] text-ink-secondary">
          {log ? "LOG" : "LIN"}
        </button>
      </div>
      <div ref={ref} className="h-[420px] w-full" />
      <p className="border-t border-border-hairline px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted">
        EIA daily spot · Brent {THEME.brent} · WTI · Henry Hub · lower bars are Brent minus WTI · delayed
      </p>
    </div>
  );
}
