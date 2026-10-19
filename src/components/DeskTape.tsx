"use client";

import { useEffect, useId, useState } from "react";
import chartData from "../../data/chart-data.json";
import { playheadAt, priceBounds, seriesLine, type BoardQuote, type TapePlayhead } from "@/lib/desk-tape";

const SERIES = chartData.brent_wti_30d;
const SPAN = Math.max(1, SERIES.length - 1);
const LOOP_MS = 22_000;

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

function Step({ value }: { value: number }) {
  const up = value > 0.004;
  const down = value < -0.004;
  const color = up ? "text-gain" : down ? "text-loss" : "text-steel-500";
  const sign = up ? "+" : "";
  return (
    <span className={`num text-[11px] font-semibold ${color}`}>
      {sign}
      {value.toFixed(2)}
    </span>
  );
}

function Barrel({ name, price, step }: { name: string; price: number; step: number | null }) {
  return (
    <div className="rounded-md border border-gold-600/30 bg-ink-950/80 px-2 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-steel-500">{name}</div>
      <div className="relative mt-1 h-14">
        <svg viewBox="0 0 120 56" className="h-full w-full" aria-hidden>
          <ellipse cx="60" cy="10" rx="46" ry="7" fill="#1c160c" stroke="#c9a038" strokeWidth="1.4" />
          <path d="M14 10 v32 a46 7 0 0 0 92 0 V10" fill="#241c10" stroke="#c9a038" strokeWidth="1.4" />
          <path d="M14 24 h92 M14 36 h92" stroke="#a8842c" strokeWidth="1.2" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pt-1">
          <span className="num text-base font-bold text-gold-300">{money(price)}</span>
        </div>
      </div>
      {step === null ? null : (
        <div className="text-[10px] text-steel-500">
          <Step value={step} /> this print
        </div>
      )}
    </div>
  );
}

export default function DeskTape({
  tapeRef,
  board,
}: {
  tapeRef: { current: TapePlayhead | null };
  board?: BoardQuote | null;
}) {
  const clipId = useId().replace(/:/g, "");
  const bounds = priceBounds(SERIES);
  const [play, setPlay] = useState<TapePlayhead>(() => playheadAt(SERIES, 0));
  const [progress, setProgress] = useState(0);
  const [spoken, setSpoken] = useState(() => {
    if (board) {
      return `As of ${board.asOf.slice(0, 10)}: Brent ${money(board.brent)}, WTI ${money(board.wti)}`;
    }
    const first = playheadAt(SERIES, 0);
    return `${first.date}: Brent ${money(first.brent)}, WTI ${money(first.wti)}`;
  });

  useEffect(() => {
    if (board) {
      tapeRef.current = {
        brent: board.brent,
        wti: board.wti,
        date: board.asOf.slice(0, 10),
        brentStep: 0,
        wtiStep: 0,
      };
      setSpoken(
        `As of ${board.asOf.slice(0, 10)}: Brent ${money(board.brent)}, WTI ${money(board.wti)}${
          board.live ? ", delayed EIA spot" : ", manual desk marks"
        }`
      );
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const last = playheadAt(SERIES, SPAN);
      if (!board) tapeRef.current = last;
      setPlay(last);
      setProgress(SPAN);
      if (!board) setSpoken(`${last.date}: Brent ${money(last.brent)}, WTI ${money(last.wti)}`);
      return;
    }
    let frame = 0;
    let lastUi = 0;
    let lastDate = "";
    const start = performance.now();
    const tick = (now: number) => {
      const cycle = ((now - start) % LOOP_MS) / LOOP_MS;
      const t = cycle * SPAN;
      const next = playheadAt(SERIES, t);
      if (!board) tapeRef.current = next;
      if (now - lastUi > 80) {
        lastUi = now;
        setProgress(t);
        setPlay(next);
      }
      if (!board && next.date !== lastDate) {
        lastDate = next.date;
        setSpoken(`${next.date}: Brent ${money(next.brent)}, WTI ${money(next.wti)}`);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [tapeRef, board]);

  const brent = seriesLine(
    SERIES.map((row) => row.brent),
    320,
    96,
    bounds.min,
    bounds.max
  );
  const wti = seriesLine(
    SERIES.map((row) => row.wti),
    320,
    96,
    bounds.min,
    bounds.max
  );
  const reveal = (progress / SPAN) * 320;

  const brentPrice = board?.brent ?? play.brent;
  const wtiPrice = board?.wti ?? play.wti;

  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-2">
        <Barrel name="Brent" price={brentPrice} step={board ? null : play.brentStep} />
        <Barrel name="WTI" price={wtiPrice} step={board ? null : play.wtiStep} />
      </div>
      {board ? (
        <p className="mt-2 text-[11px] leading-relaxed text-steel-300">
          As of <time dateTime={board.asOf}>{board.asOf.slice(0, 10)}</time>
          {board.live ? " · delayed EIA spot" : " · manual desk marks"}
        </p>
      ) : null}
      <figure className="mt-3">
        <figcaption className="flex items-baseline justify-between gap-2 text-[10px] uppercase tracking-wider text-steel-500">
          <span>Brent / WTI · USD/bbl</span>
          <span className="num text-steel-400">{play.date}</span>
        </figcaption>
        <svg viewBox="0 0 320 96" className="mt-1 h-28 w-full" role="img" aria-label="Brent and WTI indicative series replay">
          {[0.25, 0.5, 0.75].map((g) => (
            <line
              key={g}
              x1="0"
              x2="320"
              y1={96 * g}
              y2={96 * g}
              stroke="#212936"
              strokeWidth="1"
            />
          ))}
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="0" width={reveal} height="96" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <path d={brent} fill="none" stroke="#dcb54e" strokeWidth="2.2" />
            <path d={wti} fill="none" stroke="#7eb0e8" strokeWidth="2" />
          </g>
          <line x1={reveal} x2={reveal} y1="0" y2="96" stroke="#e9cd7e" strokeOpacity="0.7" strokeWidth="1" />
        </svg>
        <p className="mt-1 text-[10px] leading-relaxed text-steel-500">
          Last published {chartData.meta.last_published.slice(0, 10)} · {chartData.meta.data_type} · {chartData.meta.source} ·
          replay of the published prints
        </p>
      </figure>
      <p className="sr-only" aria-live="polite">
        {spoken}
      </p>
    </div>
  );
}
