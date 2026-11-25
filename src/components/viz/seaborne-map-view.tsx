"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { GeoJsonLayer, PathLayer, ScatterplotLayer } from "@deck.gl/layers";
import "maplibre-gl/dist/maplibre-gl.css";
import { COAST } from "@/components/globe-land";
import { LANES } from "@/lib/sea-lanes";
import { OFFSHORE_RIGS } from "@/lib/offshore-rigs";
import { CHOKEPOINTS, type Chokepoint } from "@/lib/chokepoints";
import { THEME } from "@/lib/theme-tokens";

type Ship = {
  name: string;
  imo: string;
  lat: number;
  lon: number;
  cogDeg: number | null;
  speedKn: number | null;
  observedAt: string;
  shareUrl: string;
};

type Selection =
  | { kind: "chokepoint"; item: Chokepoint }
  | { kind: "rig"; item: (typeof OFFSHORE_RIGS)[number] }
  | { kind: "ship"; item: Ship };

const land = {
  type: "FeatureCollection" as const,
  features: COAST.map((ring, index) => ({
    type: "Feature" as const,
    id: index,
    properties: {},
    geometry: { type: "Polygon" as const, coordinates: [ring.map(([lon, lat]) => [lon, lat])] },
  })),
};

export default function SeaborneMapView() {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [ship, setShip] = useState<Ship | null>(null);
  const [layersOn, setLayersOn] = useState({ crude: true, lng: true, ais: true, rigs: true, choke: true });
  const [selected, setSelected] = useState<Selection | null>(null);
  const [globe, setGlobe] = useState(false);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/globe-vessel")
      .then((res) => res.json())
      .then((body: { ship: Ship | null }) => {
        if (!cancelled) setShip(body.ship);
      })
      .catch(() => {
        if (!cancelled) setShip(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const deckLayers = useMemo(() => {
    const lanes = LANES.filter((lane) => (lane.kind === "lng" ? layersOn.lng : layersOn.crude)).map((lane) => ({
      id: lane.id,
      color: lane.kind === "lng" ? [56, 189, 248] : [217, 119, 36],
      path: lane.waypoints.map(([lat, lon]) => [lon, lat]),
    }));
    return [
      new GeoJsonLayer({ id: "land", data: land, filled: true, stroked: false, getFillColor: [17, 22, 31, 255] }),
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
            getRadius: 28000,
            radiusUnits: "meters",
            getFillColor: [236, 238, 242],
            pickable: true,
            onClick: (info: { object?: (typeof OFFSHORE_RIGS)[number] }) => {
              if (info.object) setSelected({ kind: "rig", item: info.object });
            },
          })
        : null,
      layersOn.ais && ship
        ? new ScatterplotLayer({
            id: "ais",
            data: [ship],
            getPosition: (d) => [d.lon, d.lat],
            getRadius: 40000,
            radiusUnits: "meters",
            getFillColor: [16, 185, 129],
            pickable: true,
            onClick: (info: { object?: Ship }) => {
              if (info.object) setSelected({ kind: "ship", item: info.object });
            },
          })
        : null,
    ].filter(Boolean);
  }, [layersOn, ship]);

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
    map.on("load", () => map.resize());
    mapRef.current = map;
    overlayRef.current = overlay;
    return () => {
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
  }, [node]);

  useEffect(() => {
    overlayRef.current?.setProps({ layers: deckLayers });
  }, [deckLayers]);

  useEffect(() => {
    try {
      mapRef.current?.setProjection({ type: globe ? "globe" : "mercator" });
    } catch {
      setGlobe(false);
    }
  }, [globe]);

  return (
    <div className="grid min-h-[520px] lg:grid-cols-[340px_1fr_360px]">
      <aside className="border-b border-border-hairline bg-surface-1 p-4 lg:border-b-0 lg:border-r">
        <p className="eyebrow">Seaborne desk</p>
        <h2 className="mt-2 font-serif text-2xl text-ink-primary">Physical barrels, delayed marks</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
          Lanes are schematic. The hull is one delayed TankerMap position. Chokepoint boxes are labels, not a flow census.
        </p>
        <ul className="mt-4 space-y-1 text-xs">
          {(
            [
              ["crude", "Crude lanes"],
              ["lng", "LNG lanes"],
              ["ais", "Delayed AIS"],
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
        <button type="button" className="mt-4 font-mono text-[10px] uppercase tracking-[0.08em] text-brass" onClick={() => setGlobe((value) => !value)}>
          Projection: {globe ? "Globe" : "Mercator"}
        </button>
      </aside>
      <div className="relative h-[480px] w-full">
        <div ref={setNode} className="h-full w-full" />
        <span className="pointer-events-none absolute left-2 top-2 z-10 font-mono text-[10px] text-ink-muted">LAT / LON</span>
      </div>
      <aside className="border-t border-border-hairline bg-surface-1 p-4 lg:border-l lg:border-t-0">
        <p className="eyebrow">Telemetry</p>
        {!selected && <p className="mt-3 text-sm text-ink-secondary">Select a chokepoint, rig, or the delayed hull.</p>}
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
            <p className="mt-2 font-mono text-xs text-ink-secondary">
              IMO {selected.item.imo} · {selected.item.lat.toFixed(3)}, {selected.item.lon.toFixed(3)}
              {selected.item.cogDeg != null ? ` · COG ${selected.item.cogDeg}°` : ""}
              {selected.item.speedKn != null ? ` · ${selected.item.speedKn} kn` : ""}
            </p>
            <p className="mt-2 text-sm text-ink-secondary">Delayed AIS. Observed {selected.item.observedAt}.</p>
            <a className="mt-2 inline-block text-sm text-brass" href={selected.item.shareUrl}>
              TankerMap source
            </a>
          </div>
        )}
        {ship && selected?.kind !== "ship" && (
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted">Watched hull loaded · {ship.name}</p>
        )}
      </aside>
    </div>
  );
}
