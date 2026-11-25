"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import * as maplibregl from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { GeoJsonLayer, PathLayer, ScatterplotLayer } from "@deck.gl/layers";
import "maplibre-gl/dist/maplibre-gl.css";
import { COAST } from "@/components/globe-land";
import { LANES } from "@/lib/sea-lanes";
import { OFFSHORE_RIGS } from "@/lib/offshore-rigs";
import { CHOKEPOINTS, type Chokepoint } from "@/lib/chokepoints";
import { THEME } from "@/lib/theme-tokens";
import { tankermapShareUrl } from "@/lib/tankermap";
import {
  TANKER_CLASSES,
  headingTick,
  unavailableMovingTankerFeed,
  type MovingTanker,
  type MovingTankerFeed,
  type TankerClass,
} from "@/lib/moving-tankers";
import { SATELLITE_BASEMAPS, type SatelliteBasemapId } from "@/lib/satellite-basemaps";

type Basemap = "schematic" | SatelliteBasemapId;

type Selection =
  | { kind: "chokepoint"; item: Chokepoint }
  | { kind: "rig"; item: (typeof OFFSHORE_RIGS)[number] }
  | { kind: "ship"; item: MovingTanker };

const CLASS_ORDER: TankerClass[] = ["crude", "products", "chemical", "lng"];
const NO_TANKERS: MovingTanker[] = [];

const SWATCH: Record<TankerClass, string> = {
  crude: "bg-brent",
  products: "bg-brass",
  chemical: "bg-wti",
  lng: "bg-gas",
};

const land = {
  type: "FeatureCollection" as const,
  features: COAST.map((ring, index) => ({
    type: "Feature" as const,
    id: index,
    properties: {},
    geometry: { type: "Polygon" as const, coordinates: [ring.map(([lon, lat]) => [lon, lat])] },
  })),
};

function formatObserved(iso: string): string {
  if (!iso.includes("T")) return iso;
  const [date, time] = iso.split("T");
  return `${date} ${time.slice(0, 5)} UTC`;
}

export default function SeaborneMapView() {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [feed, setFeed] = useState<MovingTankerFeed | null>(null);
  const [layersOn, setLayersOn] = useState({ crude: true, lng: true, ais: true, rigs: true, choke: true });
  const [classOn, setClassOn] = useState<Record<TankerClass, boolean>>({ crude: true, products: true, chemical: true, lng: true });
  const [basemap, setBasemap] = useState<Basemap>("day");
  const [selected, setSelected] = useState<Selection | null>(null);
  const [globe, setGlobe] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/moving-tankers")
      .then((res) => res.json())
      .then((body: MovingTankerFeed) => {
        if (!cancelled) setFeed(body);
      })
      .catch(() => {
        if (!cancelled) setFeed(unavailableMovingTankerFeed(new Date().toISOString()));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tankers = feed?.status === "ok" ? feed.tankers : NO_TANKERS;
  const visible = useMemo(() => tankers.filter((tanker) => classOn[tanker.tankerClass]), [tankers, classOn]);
  const virtualizer = useVirtualizer({
    count: visible.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 28,
    overscan: 12,
  });

  const deckLayers = useMemo(() => {
    const lanes = LANES.filter((lane) => (lane.kind === "lng" ? layersOn.lng : layersOn.crude)).map((lane) => ({
      id: lane.id,
      color: lane.kind === "lng" ? [56, 189, 248] : [217, 119, 36],
      path: lane.waypoints.map(([lat, lon]) => [lon, lat]),
    }));
    const shown = layersOn.ais ? visible : [];
    const headings = shown.flatMap((tanker) => {
      const path = headingTick(tanker);
      return path ? [{ imo: tanker.imo, path, color: [...TANKER_CLASSES[tanker.tankerClass].color, 210] as [number, number, number, number] }] : [];
    });
    return [
      basemap === "schematic"
        ? new GeoJsonLayer({ id: "land", data: land, filled: true, stroked: false, getFillColor: [17, 22, 31, 255] })
        : null,
      new PathLayer({ id: "lanes", data: lanes, getPath: (d) => d.path, getColor: (d) => d.color as [number, number, number], getWidth: 2, widthUnits: "pixels" }),
      layersOn.choke
        ? new GeoJsonLayer({
            id: "choke",
            data: {
              type: "FeatureCollection",
              features: CHOKEPOINTS.map((item) => ({
                type: "Feature",
                properties: { id: item.id },
                geometry: { type: "Polygon", coordinates: [item.ring] },
              })),
            },
            filled: true,
            stroked: true,
            getFillColor: [200, 155, 60, 40],
            getLineColor: [200, 155, 60, 180],
            lineWidthMinPixels: 1,
            pickable: true,
            onClick: (info: { object?: { properties?: { id?: string } } }) => {
              const id = info.object?.properties?.id;
              const item = CHOKEPOINTS.find((place) => place.id === id);
              if (item) setSelected({ kind: "chokepoint", item });
            },
          })
        : null,
      layersOn.rigs
        ? new ScatterplotLayer({
            id: "rigs",
            data: OFFSHORE_RIGS,
            getPosition: (d) => [d.lon, d.lat],
            getRadius: 4,
            radiusUnits: "pixels",
            getFillColor: [236, 238, 242],
            pickable: true,
            onClick: (info: { object?: (typeof OFFSHORE_RIGS)[number] }) => {
              if (info.object) setSelected({ kind: "rig", item: info.object });
            },
          })
        : null,
      shown.length
        ? new PathLayer({
            id: "headings",
            data: headings,
            getPath: (d) => d.path,
            getColor: (d) => d.color,
            getWidth: 1,
            widthUnits: "pixels",
          })
        : null,
      shown.length
        ? new ScatterplotLayer({
            id: "moving",
            data: shown,
            getPosition: (d) => [d.lon, d.lat],
            getFillColor: (d: MovingTanker) => TANKER_CLASSES[d.tankerClass].color,
            getRadius: 3.5,
            radiusUnits: "pixels",
            pickable: true,
            onClick: (info: { object?: MovingTanker }) => {
              if (info.object) setSelected({ kind: "ship", item: info.object });
            },
          })
        : null,
    ].filter(Boolean);
  }, [basemap, layersOn, visible]);

  useEffect(() => {
    if (!node || mapRef.current) return;
    maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
    const map = new maplibregl.Map({
      container: node,
      style: { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": THEME.ocean } }] },
      center: [40, 18],
      zoom: 1.4,
      attributionControl: false,
    });
    const overlay = new MapboxOverlay({ interleaved: false, layers: [] });
    map.addControl(overlay);
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      map.resize();
      setMapReady(true);
    });
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(node);
    mapRef.current = map;
    overlayRef.current = overlay;
    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
      setMapReady(false);
    };
  }, [node]);

  useEffect(() => {
    overlayRef.current?.setProps({ layers: deckLayers });
  }, [deckLayers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    for (const spec of Object.values(SATELLITE_BASEMAPS)) {
      if (map.getLayer(spec.id)) map.removeLayer(spec.id);
    }
    if (basemap === "schematic") {
      map.setPaintProperty("bg", "background-color", THEME.ocean);
      return;
    }
    const spec = SATELLITE_BASEMAPS[basemap];
    if (!map.getSource(spec.id)) {
      map.addSource(spec.id, { type: "raster", tiles: [spec.tiles], tileSize: 256, maxzoom: spec.maxZoom });
    }
    map.addLayer({ id: spec.id, type: "raster", source: spec.id });
    map.setPaintProperty("bg", "background-color", "#000000");
  }, [basemap, mapReady]);

  useEffect(() => {
    try {
      mapRef.current?.setProjection({ type: globe ? "globe" : "mercator" });
    } catch {
      setGlobe(false);
    }
  }, [globe]);

  function focusTanker(tanker: MovingTanker) {
    setSelected({ kind: "ship", item: tanker });
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [tanker.lon, tanker.lat], zoom: Math.max(map.getZoom(), 3.2) });
  }

  const satellite = basemap === "schematic" ? null : SATELLITE_BASEMAPS[basemap];
  const counts = feed?.counts;

  return (
    <div className="grid min-h-[520px] lg:grid-cols-[340px_1fr_360px]">
      <aside className="border-b border-border-hairline bg-surface-1 p-4 lg:border-b-0 lg:border-r">
        <p className="eyebrow">Seaborne desk</p>
        <h2 className="mt-2 font-serif text-2xl text-ink-primary">Physical barrels, delayed marks</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
          Lanes and rigs are schematic. Moving tankers are delayed TankerMap positions at 1 knot or faster. Satellite layers are NASA mosaics, not a live picture of those hulls.
        </p>
        <fieldset className="mt-4">
          <legend className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted">Basemap</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ["schematic", "Schematic"],
                ["day", "Day satellite"],
                ["night", "Night satellite"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={basemap === id}
                className={`border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] ${basemap === id ? "border-brass text-brass" : "border-border-hairline text-ink-secondary"}`}
                onClick={() => setBasemap(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <ul className="mt-4 space-y-1 text-xs">
          {(
            [
              ["crude", "Crude lanes"],
              ["lng", "LNG lanes"],
              ["ais", "Moving tankers"],
              ["rigs", "Offshore rigs"],
              ["choke", "Chokepoints"],
            ] as const
          ).map(([key, label]) => (
            <li key={key}>
              <label className="flex items-center gap-2 font-mono uppercase tracking-[0.08em] text-ink-secondary">
                <input type="checkbox" checked={layersOn[key]} onChange={() => setLayersOn((state) => ({ ...state, [key]: !state[key] }))} />
                {label}
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-brass">Key · moving tankers</p>
          <p className="mt-1 font-mono text-[10px] text-ink-muted">{feed?.rule ?? "At least 1 knot."}</p>
          <ul className="mt-2 space-y-1">
            {CLASS_ORDER.map((id) => (
              <li key={id}>
                <label className="flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-secondary">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" checked={classOn[id]} onChange={() => setClassOn((state) => ({ ...state, [id]: !state[id] }))} />
                    <span className={`inline-block h-2 w-2 ${SWATCH[id]}`} />
                    {TANKER_CLASSES[id].label}
                  </span>
                  <span className="num text-ink-primary">{counts ? counts[id].toLocaleString("en-GB") : "—"}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
        <div ref={listRef} className="mt-3 h-56 overflow-auto border border-border-hairline">
          {feed?.status === "unavailable" || feed === null ? (
            <p className="p-2 text-xs text-ink-secondary">
              {feed === null ? "Reading TankerMap." : "TankerMap did not answer. No stand-in hulls are listed."}
            </p>
          ) : visible.length === 0 ? (
            <p className="p-2 text-xs text-ink-secondary">No hulls in the selected classes are underway at 1 knot or more.</p>
          ) : (
            <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
              {virtualizer.getVirtualItems().map((row) => {
                const tanker = visible[row.index];
                const active = selected?.kind === "ship" && selected.item.imo === tanker.imo;
                return (
                  <button
                    key={tanker.imo}
                    type="button"
                    className={`absolute left-0 top-0 flex w-full items-baseline justify-between gap-2 px-2 text-left font-mono text-[11px] ${active ? "text-brass" : "text-ink-primary"}`}
                    style={{ height: row.size, transform: `translateY(${row.start}px)` }}
                    onClick={() => focusTanker(tanker)}
                  >
                    <span className="truncate">{tanker.name}</span>
                    <span className="num shrink-0 text-ink-muted">{tanker.speedKn.toFixed(1)} kn</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button type="button" className="mt-4 font-mono text-[10px] uppercase tracking-[0.08em] text-brass" onClick={() => setGlobe((value) => !value)}>
          Projection: {globe ? "Globe" : "Mercator"}
        </button>
      </aside>
      <div className="relative h-[520px] min-h-[520px] w-full lg:h-full">
        <div ref={setNode} className="h-full w-full" />
        <span className="pointer-events-none absolute left-2 top-2 z-10 font-mono text-[10px] text-ink-muted">LAT / LON</span>
        <div className="pointer-events-none absolute bottom-2 left-2 z-10 border border-border-hairline bg-surface-1 px-2 py-1.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-brass">Moving · ≥ 1 kn</p>
          <ul className="mt-1 space-y-0.5">
            {CLASS_ORDER.map((id) => (
              <li key={id} className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-secondary">
                <span className="flex items-center gap-1.5">
                  <span className={`inline-block h-1.5 w-1.5 ${SWATCH[id]}`} />
                  {TANKER_CLASSES[id].label}
                </span>
                <span className="num text-ink-primary">{counts ? counts[id].toLocaleString("en-GB") : "—"}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="pointer-events-none absolute bottom-2 right-2 z-10 max-w-[240px] border border-border-hairline bg-surface-1 px-2 py-1 text-right font-mono text-[10px] leading-snug text-ink-secondary">
          {satellite ? (
            <>
              {satellite.attribution}. {satellite.note}{" "}
            </>
          ) : null}
          Positions: TankerMap AIS, delayed.
        </p>
      </div>
      <aside className="border-t border-border-hairline bg-surface-1 p-4 lg:border-l lg:border-t-0">
        <p className="eyebrow">Telemetry</p>
        {!selected && <p className="mt-3 text-sm text-ink-secondary">Select a chokepoint, rig, or a moving tanker.</p>}
        {selected?.kind === "chokepoint" && (
          <div className="mt-3">
            <h3 className="font-serif text-xl text-ink-primary">{selected.item.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{selected.item.note}</p>
          </div>
        )}
        {selected?.kind === "rig" && (
          <div className="mt-3">
            <h3 className="font-serif text-xl text-ink-primary">{selected.item.name}</h3>
            <p className="mt-2 font-mono text-xs text-ink-secondary">
              {selected.item.basin} · {selected.item.lat.toFixed(2)}, {selected.item.lon.toFixed(2)}
            </p>
            <p className="mt-2 text-sm text-ink-secondary">Schematic field mark. Not a rig census and not a live position.</p>
          </div>
        )}
        {selected?.kind === "ship" && (
          <div className="mt-3">
            <h3 className="font-serif text-xl text-ink-primary">{selected.item.name}</h3>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-brass">{TANKER_CLASSES[selected.item.tankerClass].label}</p>
            <p className="mt-2 font-mono text-xs text-ink-secondary">
              IMO {selected.item.imo} · {selected.item.lat.toFixed(3)}, {selected.item.lon.toFixed(3)}
              {selected.item.cogDeg != null ? ` · COG ${selected.item.cogDeg}°` : ""}
              {` · ${selected.item.speedKn.toFixed(1)} kn`}
            </p>
            {selected.item.destination && (
              <p className="mt-2 text-sm text-ink-secondary">AIS destination {selected.item.destination}. Crew entry, not a fixture.</p>
            )}
            <p className="mt-2 text-sm text-ink-secondary">Delayed AIS. Observed {formatObserved(selected.item.observedAt)}.</p>
            <a className="mt-2 inline-block text-sm text-brass" href={tankermapShareUrl(selected.item.imo)}>
              TankerMap source
            </a>
          </div>
        )}
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted">
          {feed?.status === "ok" ? `${visible.length.toLocaleString("en-GB")} moving in view · TankerMap` : "Moving tanker feed withheld until TankerMap answers"}
        </p>
      </aside>
    </div>
  );
}
