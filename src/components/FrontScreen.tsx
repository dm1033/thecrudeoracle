"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import DeskTape from "@/components/DeskTape";
import HeroGlobe from "@/components/HeroGlobe";
import { compassPoint, formatLatLon } from "@/lib/tankermap";
import type { TapePlayhead } from "@/lib/desk-tape";
import { parseGlobeShip, type GlobeShip } from "@/lib/sea-lanes";

export default function FrontScreen() {
  const [ship, setShip] = useState<GlobeShip | null>(null);
  const shipRef = useRef<GlobeShip | null>(null);
  const tapeRef = useRef<TapePlayhead | null>(null);
  shipRef.current = ship;

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/globe-vessel", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        const next = parseGlobeShip(payload);
        if (next) setShip(next);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <section className="relative isolate overflow-hidden border-b border-ink-700 bg-ink-950 sm:min-h-[calc(100svh-6.5rem)]">
      <div className="relative h-[78vh] min-h-[560px] sm:absolute sm:inset-0 sm:h-auto sm:min-h-0">
        <HeroGlobe shipRef={shipRef} tapeRef={tapeRef} />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[68vh] h-28 bg-gradient-to-b from-transparent to-ink-950 sm:hidden"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,#07090c_0%,rgba(7,9,12,0.92)_24%,rgba(7,9,12,0.55)_42%,rgba(7,9,12,0.08)_64%,transparent_80%)] sm:block"
      />
      <div className="container-site relative z-10 pb-8 sm:flex sm:min-h-[calc(100svh-6.5rem)] sm:items-center sm:py-10">
        <div className="max-w-lg rounded-xl border border-ink-700/80 bg-ink-950/80 p-4 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-5">
          <p className="eyebrow">Seaborne crude, on the earth</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Crude Oil Intelligence <span className="text-gold-400">Without the Noise</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-steel-400">
            Ships move on the desk lanes. Offshore rigs mark the basins. Brent and WTI barrels
            replay the published price path, in dollars per barrel.
          </p>
          <DeskTape tapeRef={tapeRef} />
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-steel-400">
            <li className="flex items-center gap-2">
              <span aria-hidden className="h-1.5 w-6 rounded-full bg-gold-400" />
              Crude lane
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="inline-block h-1.5 w-6 rounded-full bg-[#48d6e0]" />
              LNG lane
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="h-2.5 w-2.5 rounded-full border border-gold-300" />
              Delayed AIS
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="inline-block h-2.5 w-2.5 border border-gold-300 bg-ink-950" />
              Offshore rig
            </li>
          </ul>
          {ship ? (
            <Link
              href={`/tools/flow-map?vessel=${ship.imo}`}
              className="mt-3 inline-flex max-w-full flex-col rounded-md border border-gold-600/40 bg-ink-950/75 px-3 py-2 text-left transition-colors hover:border-gold-400"
            >
              <span className="text-sm font-semibold text-gold-300">{ship.name}</span>
              <span className="num mt-1 text-xs text-steel-300">
                {formatLatLon(ship.lat, ship.lon)}
                {ship.speedKn != null ? ` · ${ship.speedKn.toFixed(1)} kn` : ""}
                {ship.cogDeg != null ? ` · ${Math.round(ship.cogDeg)}° ${compassPoint(ship.cogDeg)}` : ""}
              </span>
              <span className="mt-1 text-[11px] uppercase tracking-wider text-steel-500">
                Delayed AIS · open the hull
              </span>
            </Link>
          ) : (
            <p className="mt-3 text-xs text-steel-500">
              Lanes are a schematic. The watched hull appears here when TankerMap answers.
            </p>
          )}
          <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link href="/premium-dashboard" className="btn-primary">
              Open the Full Dashboard — 100% Free
            </Link>
            <Link href="/crude-oil-prices" className="btn-secondary">
              Crude prices
            </Link>
            <Link href="/tools/flow-map?vessel=1076599" className="btn-ghost">
              Flow map
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
