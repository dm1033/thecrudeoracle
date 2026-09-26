"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import {
  cargoRule,
  compassPoint,
  formatLatLon,
  formatUtc,
  hullClass,
  nameplateBarrels,
  seaRegion,
  type VesselWatchView,
} from "@/lib/tankermap";

function useAgeLabel(iso: string | null): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!iso) return;
    const parsed = Date.parse(iso);
    if (Number.isNaN(parsed)) return;
    const minutes = Math.floor((Date.now() - parsed) / 60_000);
    if (minutes < 1) setLabel("just now");
    else if (minutes < 60) setLabel(`${minutes}m ago`);
    else if (minutes < 48 * 60) setLabel(`${Math.floor(minutes / 60)}h ago`);
    else setLabel(`${Math.floor(minutes / 1440)}d ago`);
  }, [iso]);

  return label;
}

function formatCount(value: number | null, suffix: string): string {
  if (value == null) return "Not reported";
  return `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value)} ${suffix}`;
}

function cargoLabel(state: string | null, confidence: number | null): string {
  if (!state) return "Not reported";
  const pretty = state.charAt(0).toUpperCase() + state.slice(1);
  if (confidence == null) return `${pretty} estimate`;
  const percent = confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence);
  return `${pretty} estimate · ${percent}%`;
}

function LayerButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
        pressed
          ? "border-gold-500/70 bg-gold-500/15 text-gold-300"
          : "border-ink-600 bg-ink-900 text-steel-500 hover:text-steel-300"
      }`}
    >
      {children}
    </button>
  );
}

export default function VesselWatch({ view }: { view: VesselWatchView }) {
  const [aisOn, setAisOn] = useState(true);
  const [deskOn, setDeskOn] = useState(true);
  const clipId = useId().replace(/:/g, "");
  const insetClipId = `${clipId}-inset`;
  const vessel = view.vessel;
  const map = view.map;
  const attachment = view.attachment;
  const positionAge = useAgeLabel(vessel?.observedAt ?? null);
  const draughtAge = useAgeLabel(vessel?.draughtObservedAt ?? null);
  const [positionStale, setPositionStale] = useState(false);

  useEffect(() => {
    if (!vessel) return;
    const hours = (Date.now() - Date.parse(vessel.observedAt)) / 3_600_000;
    setPositionStale(Number.isFinite(hours) && hours > 6);
  }, [vessel]);

  const shareLabel = vessel ? `${vessel.name} on TankerMap` : `IMO ${view.imo} on TankerMap`;
  const region = vessel ? seaRegion(vessel.lat, vessel.lon) : null;
  const sizeBand = vessel ? hullClass(vessel.deadweight) : null;
  const barrels = vessel ? nameplateBarrels(vessel.deadweight) : null;
  const heading =
    vessel?.cogDeg != null ? `${vessel.cogDeg.toFixed(0)}° ${compassPoint(vessel.cogDeg)}` : null;

  return (
    <section aria-labelledby="vessel-watch-h" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Watched vessel · TankerMap</p>
          <h2 id="vessel-watch-h" className="h2 mt-1">
            {vessel ? vessel.name : `IMO ${view.imo}`}
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-steel-500">
            Public AIS for the hull in the TankerMap link, with a Crude Oracle note attached to the same
            position. The AIS is delayed. The note is a desk reading, not a second feed.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Map layers">
          <LayerButton pressed={aisOn} onClick={() => setAisOn((on) => !on)}>
            AIS track
          </LayerButton>
          {attachment ? (
            <LayerButton pressed={deskOn} onClick={() => setDeskOn((on) => !on)}>
              Desk layer
            </LayerButton>
          ) : null}
        </div>
      </div>

      {view.notice ? (
        <p className="rounded-lg border border-risk/40 bg-risk/10 px-4 py-3 text-sm text-steel-300">{view.notice}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card overflow-hidden p-0 lg:col-span-3">
          {map && vessel ? (
            <svg
              viewBox={`0 0 ${map.width} ${map.height}`}
              role="img"
              aria-label={`${vessel.name} last observed ${formatLatLon(vessel.lat, vessel.lon)}${
                heading ? `, course ${heading}` : ""
              }. ${attachment && deskOn ? "Desk layer shows a 48-hour heading ray and chokepoints." : ""}`}
              className="h-auto w-full bg-[#071018]"
            >
              <rect width={map.width} height={map.height} fill="#071018" />
              <g clipPath={`url(#${clipId})`}>
                {map.graticule.map((line, index) => (
                  <line
                    key={`g-${index}`}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke="#1c2633"
                    strokeWidth={1}
                  />
                ))}
                {map.coastD ? <path d={map.coastD} fill="none" stroke="#3d4c60" strokeWidth={1} /> : null}
                {aisOn && map.trackD ? (
                  <path d={map.trackD} fill="none" stroke="#48d6e0" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
                ) : null}
                {deskOn && map.headingRay ? (
                  <line
                    x1={map.headingRay.x1}
                    y1={map.headingRay.y1}
                    x2={map.headingRay.x2}
                    y2={map.headingRay.y2}
                    stroke="#c9a038"
                    strokeWidth={1.6}
                    strokeDasharray="5 4"
                  />
                ) : null}
                {deskOn
                  ? map.places.map((place) => (
                      <g key={place.id}>
                        <polygon
                          points={`${place.x},${place.y - 5} ${place.x + 5},${place.y} ${place.x},${place.y + 5} ${place.x - 5},${place.y}`}
                          fill="none"
                          stroke="#dcb54e"
                          strokeWidth={1.2}
                        />
                        <text x={place.labelX} y={place.labelY} textAnchor={place.anchor} fill="#a6b1c0" fontSize={11}>
                          {place.name}
                        </text>
                      </g>
                    ))
                  : null}
                {aisOn && map.courseTick ? (
                  <line
                    x1={map.courseTick.x1}
                    y1={map.courseTick.y1}
                    x2={map.courseTick.x2}
                    y2={map.courseTick.y2}
                    stroke="#dcb54e"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                ) : null}
                <circle cx={map.vessel.x} cy={map.vessel.y} r={11} fill="none" stroke="#dcb54e" strokeOpacity={0.45} />
                <circle cx={map.vessel.x} cy={map.vessel.y} r={4.5} fill="#dcb54e" stroke="#07090c" strokeWidth={1} />
                <text x={map.vessel.x + 10} y={map.vessel.y - 10} fill="#f4efe2" fontSize={12} fontWeight={600}>
                  {map.vesselName}
                </text>
                {deskOn && attachment ? (
                  <g>
                    <rect x={14} y={14} width={248} height={62} rx={6} fill="#0b0e13" fillOpacity={0.92} stroke="#a8842c" />
                    <text x={26} y={34} fill="#c9a038" fontSize={10} fontWeight={700} letterSpacing={1.4}>
                      DESK LAYER
                    </text>
                    <text x={26} y={52} fill="#e7e1d2" fontSize={12}>
                      {attachment.headline.length > 36 ? `${attachment.headline.slice(0, 34)}…` : attachment.headline}
                    </text>
                    <text x={26} y={68} fill="#8b98a9" fontSize={11}>
                      {[heading, vessel.cargoState ? cargoLabel(vessel.cargoState, vessel.cargoConfidence) : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </text>
                  </g>
                ) : null}
                {aisOn && map.inset ? (
                  <g>
                    <rect
                      x={map.inset.x}
                      y={map.inset.y}
                      width={map.inset.width}
                      height={map.inset.height}
                      rx={6}
                      fill="#07090c"
                      stroke="#212936"
                    />
                    <clipPath id={insetClipId}>
                      <rect x={map.inset.x} y={map.inset.y} width={map.inset.width} height={map.inset.height} rx={6} />
                    </clipPath>
                    <g clipPath={`url(#${insetClipId})`}>
                      {map.inset.coastD ? <path d={map.inset.coastD} fill="none" stroke="#3d4c60" strokeWidth={1} /> : null}
                      {map.inset.trackD ? (
                        <path d={map.inset.trackD} fill="none" stroke="#48d6e0" strokeWidth={1.8} strokeLinecap="round" />
                      ) : null}
                      <circle cx={map.inset.vessel.x} cy={map.inset.vessel.y} r={3.5} fill="#dcb54e" />
                    </g>
                    <text x={map.inset.x + 10} y={map.inset.y + 16} fill="#8b98a9" fontSize={10} fontWeight={600}>
                      Recent fixes
                    </text>
                  </g>
                ) : null}
              </g>
              <clipPath id={clipId}>
                <rect width={map.width} height={map.height} />
              </clipPath>
            </svg>
          ) : (
            <div className="flex min-h-64 items-center px-6 py-10">
              <p className="max-w-md text-sm leading-relaxed text-steel-400">
                {view.status === "unavailable"
                  ? "TankerMap did not answer just now. The position is left blank rather than invented."
                  : `TankerMap has no public position for IMO ${view.imo} right now.`}
              </p>
            </div>
          )}
          <p className="border-t border-ink-700 px-4 py-2 text-[11px] leading-relaxed text-steel-500">
            Land outline: Natural Earth, public domain. Position: TankerMap AIS, delayed. Not for navigation.
          </p>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <article className="card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-risk/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-risk">
                delayed
              </span>
              {positionStale ? (
                <span className="rounded bg-risk/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-risk">
                  Position older than 6h
                </span>
              ) : null}
            </div>
            {vessel ? (
              <>
                <p className="mt-3 font-mono text-sm text-white">{formatLatLon(vessel.lat, vessel.lon)}</p>
                <p className="mt-1 text-xs text-steel-500">
                  Desk grid: {region}
                  {positionAge ? ` · observed ${positionAge}` : ""}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-xs">
                  <div>
                    <dt className="text-steel-500">Speed</dt>
                    <dd className="num font-semibold text-white">
                      {vessel.speedKn == null ? "Not reported" : `${vessel.speedKn.toFixed(1)} kn`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-steel-500">Course</dt>
                    <dd className="num font-semibold text-white">{heading ?? "Not reported"}</dd>
                  </div>
                  <div>
                    <dt className="text-steel-500">Destination</dt>
                    <dd className="font-semibold text-white">{vessel.destination ?? "Not reported"}</dd>
                  </div>
                  <div>
                    <dt className="text-steel-500">Cargo flag</dt>
                    <dd className="font-semibold text-white">{cargoLabel(vessel.cargoState, vessel.cargoConfidence)}</dd>
                  </div>
                  <div>
                    <dt className="text-steel-500">Draught</dt>
                    <dd className="font-semibold text-white">
                      {vessel.draughtMeters == null ? "Not reported" : `${vessel.draughtMeters.toFixed(1)} m`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-steel-500">Deadweight</dt>
                    <dd className="font-semibold text-white">{formatCount(vessel.deadweight, "DWT")}</dd>
                  </div>
                  <div>
                    <dt className="text-steel-500">Type</dt>
                    <dd className="font-semibold text-white">
                      {vessel.vesselType ?? "Tanker"}
                      {sizeBand ? ` · ${sizeBand}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-steel-500">Flag / built</dt>
                    <dd className="font-semibold text-white">
                      {[vessel.flag, vessel.builtYear].filter(Boolean).join(" · ") || "Not reported"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-steel-500">IMO / MMSI</dt>
                    <dd className="num font-semibold text-white">
                      {vessel.imo}
                      {vessel.mmsi ? ` · ${vessel.mmsi}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-steel-500">Nameplate</dt>
                    <dd className="font-semibold text-white">
                      {barrels == null ? "Not reported" : `${(barrels / 1_000_000).toFixed(2)} mb crude`}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-[11px] leading-relaxed text-steel-500">
                  {cargoRule(vessel.cargoReason)} Nameplate is deadweight × 7.37 barrels per tonne of crude — a
                  ceiling, not a measured lifting.
                  {vessel.draughtObservedAt
                    ? ` Draught observed ${formatUtc(vessel.draughtObservedAt)}${draughtAge ? ` (${draughtAge})` : ""}.`
                    : ""}
                </p>
                <p className="mt-2 text-[11px] text-steel-500">
                  AIS observed {formatUtc(vessel.observedAt)}
                  {view.track.length > 0 ? ` · ${view.track.length} track fix${view.track.length === 1 ? "" : "es"}` : ""}
                  {" · "}retrieved {formatUtc(view.retrievedAt)}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-steel-400">
                {view.status === "unavailable"
                  ? "The AIS card stays empty until TankerMap answers. Open the source link to check the map there."
                  : "No public AIS record is attached to this IMO right now."}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <a href={view.shareUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold-400 hover:text-gold-300">
                {shareLabel} →
              </a>
              <a href={view.profileUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold-400 hover:text-gold-300">
                Vessel page →
              </a>
            </div>
          </article>

          {attachment ? (
            <article className="card border-gold-600/40">
              <p className="eyebrow">Attached desk layer</p>
              <h3 className="mt-1 text-base font-semibold text-white">{attachment.headline}</h3>
              <p className="mt-2 text-sm leading-relaxed text-steel-300">{attachment.read}</p>
              <ul className="mt-3 space-y-2">
                {attachment.factors.map((factor) => (
                  <li key={factor.factor} className="text-xs leading-relaxed">
                    <span className="font-semibold text-steel-300">{factor.factor}:</span>{" "}
                    <span className="text-steel-500">{factor.detail}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 rounded border border-ink-700 bg-ink-900 p-3 text-xs leading-relaxed text-steel-400">
                <span className="font-semibold text-gold-500">So what: </span>
                {attachment.implication}
              </p>
              <footer className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink-700 pt-2 text-[11px] text-steel-500">
                <span>
                  Source:{" "}
                  <a href={attachment.source_url} target="_blank" rel="noopener noreferrer" className="underline decoration-ink-600 underline-offset-2 hover:text-gold-400">
                    {attachment.source}
                  </a>
                </span>
                <span>Updated: {formatUtc(attachment.last_updated)}</span>
                <span className="rounded bg-risk/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-risk">
                  {attachment.data_type}
                </span>
              </footer>
            </article>
          ) : (
            <p className="card text-xs leading-relaxed text-steel-500">
              No desk note is attached to IMO {view.imo}. The map shows TankerMap AIS only.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
