"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const View = dynamic(() => import("./seaborne-map-view"), {
  ssr: false,
  loading: () => <div className="h-[520px] bg-ocean" aria-hidden />,
});

type LoadMode = "immediate" | "desktop";

function prefersSaveData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(connection?.saveData);
}

/**
 * The tanker map pulls in MapLibre and deck.gl. On the homepage (`desktop`)
 * that bundle stays unloaded on a phone until someone asks for it. A wide
 * screen still opens the map on its own. The flow-map page keeps `immediate`.
 */
export default function SeaborneTerminalMap({ load = "immediate" }: { load?: LoadMode }) {
  const [active, setActive] = useState(load === "immediate");

  useEffect(() => {
    if (load !== "desktop") return;
    const media = window.matchMedia("(min-width: 1024px)");
    const enable = () => {
      if (media.matches && !prefersSaveData()) setActive(true);
    };
    enable();
    media.addEventListener("change", enable);
    return () => media.removeEventListener("change", enable);
  }, [load]);

  const framed = load === "desktop";

  return (
    <div
      className={`frame-ticks border border-border-hairline bg-ocean ${
        framed ? "h-[520px] overflow-hidden lg:h-[880px]" : ""
      }`}
    >
      {active ? <View /> : <MapPoster onOpen={() => setActive(true)} />}
    </div>
  );
}

function MapPoster({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="relative flex h-full min-h-[520px] flex-col justify-between bg-ocean p-4 sm:p-6">
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid slice">
        <path d="M80 420 C 220 300, 340 460, 520 340 S 860 180, 1120 260" fill="none" stroke="#c89b3c" strokeWidth="2" opacity="0.85" />
        <path d="M140 180 C 300 220, 420 120, 640 200 S 980 280, 1140 160" fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.7" />
        <circle cx="520" cy="340" r="4" fill="#c89b3c" />
        <circle cx="640" cy="200" r="4" fill="#38bdf8" />
        <circle cx="860" cy="250" r="3" fill="#eceef2" />
      </svg>
      <div className="relative max-w-md">
        <p className="eyebrow">Seaborne desk</p>
        <p className="mt-2 font-serif text-2xl text-ink-primary">Schematic lanes, delayed positions</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
          Crude and LNG lanes on this poster are a drawing. Moving tankers are delayed AIS and load with the map.
          Satellite layers, when the map is open, are NASA mosaics. Not for navigation.
        </p>
      </div>
      <div className="relative">
        <button type="button" className="btn-primary" onClick={onOpen}>
          Open the tanker map
        </button>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted">Delayed AIS · at least 1 knot</p>
      </div>
    </div>
  );
}
