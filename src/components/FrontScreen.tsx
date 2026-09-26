"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import HeroGlobe from "@/components/HeroGlobe";
import { compassPoint, formatLatLon } from "@/lib/tankermap";
import { parseGlobeShip, type GlobeShip } from "@/lib/sea-lanes";

export default function FrontScreen() {
  const [ship, setShip] = useState<GlobeShip | null>(null);
  const shipRef = useRef<GlobeShip | null>(null);
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
    <section className="relative isolate min-h-[calc(100svh-6.5rem)] overflow-hidden border-b border-ink-700 bg-ink-950">
      <div className="absolute inset-0">
        <HeroGlobe shipRef={shipRef} />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/80 to-transparent sm:hidden"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,#07090c_0%,rgba(7,9,12,0.9)_22%,rgba(7,9,12,0.42)_42%,rgba(7,9,12,0.08)_62%,transparent_78%)] sm:block"
      />
      <div className="container-site relative z-10 flex min-h-[calc(100svh-6.5rem)] flex-col justify-end pb-8 pt-8 sm:justify-center sm:py-16">
        <div className="max-w-xl">
          <p className="eyebrow">Seaborne crude, on the earth</p>
          <h1 className="h1 mt-4">
            Crude Oil Intelligence <span className="text-gold-400">Without the Noise</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-steel-400 sm:text-lg">
            Tankers and LNG carriers move along the desk&apos;s sea lanes — Gulf, Cape, Suez,
            Atlantic and Malacca — with one delayed hull marked from the public AIS feed.
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-steel-400">
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
          </ul>
          {ship ? (
            <Link
              href={`/tools/flow-map?vessel=${ship.imo}`}
              className="mt-4 inline-flex max-w-full flex-col rounded-md border border-gold-600/40 bg-ink-950/75 px-3 py-2 text-left backdrop-blur-sm transition-colors hover:border-gold-400"
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
            <p className="mt-4 text-xs text-steel-500">
              Lanes are a schematic. The watched hull appears here when TankerMap answers.
            </p>
          )}
          <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link href="/premium-dashboard" className="btn-primary">
              Open the Full Dashboard — 100% Free
            </Link>
            <Link href="/tools/flow-map?vessel=1076599" className="btn-secondary">
              Open the flow map
            </Link>
            <Link href="/portfolio/dashboard" className="btn-ghost">
              $1M Portfolio
            </Link>
          </div>
          <p className="mt-5 text-xs text-steel-500">
            Now 100% free · Terminal-grade dashboard · Daily briefings · Not financial advice
          </p>
        </div>
      </div>
    </section>
  );
}
