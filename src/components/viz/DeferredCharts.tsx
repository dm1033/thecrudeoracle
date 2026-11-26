"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { SeasonalSuite } from "@/lib/eia-seasonal";
import type { SpotSpreadPayload } from "./spot-spread-view";

const SpotView = dynamic(() => import("./SpotSpreadTerminal"), {
  ssr: false,
  loading: () => <p className="p-4 text-sm text-ink-secondary">Loading the delayed spot chart.</p>,
});

const SeasonalView = dynamic(() => import("./SeasonalChart"), {
  ssr: false,
  loading: () => <p className="p-4 text-sm text-ink-secondary">Loading the EIA stock band.</p>,
});

function useDesktopCharts(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    let idle = 0;
    let timer = 0;
    const arm = () => {
      if (!media.matches || connection?.saveData) return;
      const start = () => setReady(true);
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(start, { timeout: 1600 });
      else timer = window.setTimeout(start, 500);
    };
    arm();
    media.addEventListener("change", arm);
    return () => {
      media.removeEventListener("change", arm);
      if (idle && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      if (timer) window.clearTimeout(timer);
    };
  }, []);
  return ready;
}

function last(points: { date: string; value: number }[] | undefined): { date: string; value: number } | null {
  if (!points || points.length === 0) return null;
  return points[points.length - 1];
}

function figure(value: number, digits: number): string {
  return value.toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function Print({ label, point, unit, digits }: { label: string; point: { date: string; value: number } | null; unit: string; digits: number }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted">{label}</p>
      <p className="num mt-1 text-lg text-ink-primary">{point ? figure(point.value, digits) : "—"}</p>
      <p className="font-mono text-[10px] text-ink-muted">{point ? `${point.date} · ${unit}` : unit}</p>
    </div>
  );
}

/** Latest delayed prints, with the chart library loaded on a desktop or on request. */
export function DeferredSpotChart({ data }: { data: SpotSpreadPayload | null }) {
  const [open, setOpen] = useState(false);
  const desktop = useDesktopCharts();
  return (
    <div className="lg:min-h-[460px]">
      {open || desktop ? (
        <SpotView data={data} />
      ) : (
    <div className="p-4">
      {data ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Print label="Brent" point={last(data.brent)} unit="$/bbl" digits={2} />
          <Print label="WTI" point={last(data.wti)} unit="$/bbl" digits={2} />
          <Print label="Brent − WTI" point={last(data.spread)} unit="$/bbl" digits={2} />
          <Print label="Henry Hub" point={last(data.henryHub)} unit="$/MMBtu" digits={2} />
        </div>
      ) : (
        <p className="text-sm text-ink-secondary">The delayed EIA spot history is not loaded. No chart is drawn in its place.</p>
      )}
      <p className="mt-3 text-xs leading-relaxed text-ink-muted">Delayed EIA daily spots. The date is the trade date of the print.</p>
      <button type="button" className="btn-secondary mt-4" onClick={() => setOpen(true)}>
        Show the chart
      </button>
    </div>
      )}
    </div>
  );
}

/** Five-year EIA stock band. The chart bundle stays off a phone until it is opened. */
export function DeferredSeasonalChart({ suite }: { suite: SeasonalSuite | null }) {
  const [open, setOpen] = useState(false);
  const desktop = useDesktopCharts();
  const series = suite?.series[0] ?? null;
  const point = series?.points[series.points.length - 1] ?? null;
  return (
    <div className="lg:min-h-[640px]">
      {open || desktop ? (
        <SeasonalView suite={suite} />
      ) : (
    <div className="p-4">
      {series && point ? (
        <p className="text-sm text-ink-secondary">
          <span className="text-ink-primary">{series.name}</span> {figure(point.value, 1)} million barrels, week ending {point.date}.
          {point.change == null ? " No week-on-week change is shown." : ` Week on week ${point.change > 0 ? "+" : ""}${figure(point.change, 1)}.`}
        </p>
      ) : (
        <p className="text-sm text-ink-secondary">The five-year EIA stock band is not loaded. No range is drawn from memory.</p>
      )}
      <p className="mt-3 text-xs leading-relaxed text-ink-muted">Delayed EIA weekly stocks. Not a forecast.</p>
      <button type="button" className="btn-secondary mt-4" onClick={() => setOpen(true)}>
        Show the chart
      </button>
    </div>
      )}
    </div>
  );
}
