"use client";

import { useEffect, useRef } from "react";
import { COAST, NODES } from "./globe-land";
import { HEADING_RAY_HOURS } from "@/lib/tankermap";
import { OFFSHORE_RIGS } from "@/lib/offshore-rigs";
import {
  LANES,
  buildLaneFrame,
  lanePosition,
  maskPixel,
  offsetByCourse,
  toVec,
  unwrapRing,
  type GlobeShip,
  type Vec,
} from "@/lib/sea-lanes";
import { BARREL_MARKS, type TapePlayhead } from "@/lib/desk-tape";

const GOLD = [220, 181, 78];
const CYAN = [72, 214, 224];
const TEX_W = 1440;
const TEX_H = 720;
const BAKE_CAP = 960;
const TILT = 0.4;

type Proj = { sx: number; sy: number; z: number };

function project(v: Vec, cx: number, cy: number, radius: number): Proj {
  return { sx: cx + v.x * radius, sy: cy - v.y * radius, z: v.z };
}

function spin(v: Vec, cosR: number, sinR: number): Vec {
  return {
    x: v.x * cosR + v.z * sinR,
    y: v.y,
    z: -v.x * sinR + v.z * cosR,
  };
}

function tiltOf(v: Vec, cosT: number, sinT: number): Vec {
  return { x: v.x, y: v.y * cosT - v.z * sinT, z: v.y * sinT + v.z * cosT };
}

function viewVec(base: Vec, cosR: number, sinR: number, cosT: number, sinT: number): Vec {
  return tiltOf(spin(base, cosR, sinR), cosT, sinT);
}

const PROBES: Array<{ lon: number; lat: number; land: boolean }> = [
  { lon: 2.3, lat: 48.9, land: true },
  { lon: -30, lat: 35, land: false },
  { lon: 64, lat: 16, land: false },
  { lon: 78, lat: 22, land: true },
  { lon: -98, lat: 39, land: true },
  { lon: 134, lat: -25, land: true },
];

/** 0 ocean, 1 land, 2 coastline. Null when the land mask fails its probes. */
function buildEarthKind(): Uint8Array | null {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const g = canvas.getContext("2d", { willReadFrequently: true });
  if (!g) return null;
  g.clearRect(0, 0, TEX_W, TEX_H);
  g.fillStyle = "#fff";
  for (const ring of COAST) {
    if (ring.length < 3) continue;
    const unwrapped = unwrapRing(ring);
    for (const shift of [-360, 0, 360]) {
      g.beginPath();
      for (let i = 0; i < unwrapped.length; i++) {
        const x = ((unwrapped[i][0] + shift + 180) / 360) * TEX_W;
        const y = ((90 - unwrapped[i][1]) / 180) * TEX_H;
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.closePath();
      g.fill();
    }
  }
  const pixels = g.getImageData(0, 0, TEX_W, TEX_H).data;
  const mask = new Uint8Array(TEX_W * TEX_H);
  for (let i = 0; i < mask.length; i++) mask[i] = pixels[i * 4] > 128 ? 1 : 0;
  for (const probe of PROBES) {
    const { x, y } = maskPixel(probe.lon, probe.lat, TEX_W, TEX_H);
    if ((mask[y * TEX_W + x] === 1) !== probe.land) return null;
  }
  const kind = new Uint8Array(mask.length);
  for (let y = 0; y < TEX_H; y++) {
    const row = y * TEX_W;
    const up = y > 0 ? row - TEX_W : row;
    const down = y + 1 < TEX_H ? row + TEX_W : row;
    for (let x = 0; x < TEX_W; x++) {
      const i = row + x;
      const land = mask[i] === 1;
      const left = mask[row + (x > 0 ? x - 1 : x)] === 1;
      const right = mask[row + (x + 1 < TEX_W ? x + 1 : x)] === 1;
      const coast = left !== land || right !== land || (mask[up + x] === 1) !== land || (mask[down + x] === 1) !== land;
      kind[i] = coast ? 2 : land ? 1 : 0;
    }
  }
  return kind;
}

type SphereMap = {
  size: number;
  count: number;
  nx: Float32Array;
  zR: Float32Array;
  row: Uint16Array;
  shade: Uint8Array;
  spec: Uint8Array;
  alpha: Uint8Array;
  slot: Uint32Array;
};

function prepareSphere(size: number, cosT: number, sinT: number): SphereMap {
  const rad = size / 2;
  const inv = 1 / rad;
  const lx = -0.35;
  const ly = 0.55;
  const lz = 0.76;
  let count = 0;
  for (let py = 0; py < size; py++) {
    const ny = -((py + 0.5) - rad) * inv;
    for (let px = 0; px < size; px++) {
      const nx = ((px + 0.5) - rad) * inv;
      if (nx * nx + ny * ny <= 1) count += 1;
    }
  }
  const map: SphereMap = {
    size,
    count,
    nx: new Float32Array(count),
    zR: new Float32Array(count),
    row: new Uint16Array(count),
    shade: new Uint8Array(count),
    spec: new Uint8Array(count),
    alpha: new Uint8Array(count),
    slot: new Uint32Array(count),
  };
  let n = 0;
  for (let py = 0; py < size; py++) {
    const ny = -((py + 0.5) - rad) * inv;
    for (let px = 0; px < size; px++) {
      const nx = ((px + 0.5) - rad) * inv;
      const rr = nx * nx + ny * ny;
      if (rr > 1) continue;
      const nz = Math.sqrt(1 - rr);
      const yR = ny * cosT + nz * sinT;
      const zR = -ny * sinT + nz * cosT;
      const lat = Math.asin(Math.max(-1, Math.min(1, yR))) * (180 / Math.PI);
      const sample = maskPixel(0, lat, TEX_W, TEX_H);
      const ndotl = Math.max(0, nx * lx + ny * ly + nz * lz);
      const hot = ndotl * ndotl;
      const spec = hot * hot * hot;
      const edge = rr > 0.972 ? (1 - rr) / 0.028 : 1;
      map.nx[n] = nx;
      map.zR[n] = zR;
      map.row[n] = sample.y;
      map.shade[n] = Math.round((0.2 + 0.8 * ndotl) * 255);
      map.spec[n] = Math.round(spec * 255);
      map.alpha[n] = Math.round(255 * edge);
      map.slot[n] = py * size + px;
      n += 1;
    }
  }
  return map;
}

function paintSphere(
  image: ImageData,
  map: SphereMap,
  kind: Uint8Array,
  cosR: number,
  sinR: number
) {
  const buf = image.data;
  const { count, nx, zR, row, shade, spec, alpha, slot } = map;
  const scale = (180 / Math.PI) / 360;
  for (let i = 0; i < count; i++) {
    const x = nx[i] * cosR - zR[i] * sinR;
    const z = nx[i] * sinR + zR[i] * cosR;
    let u = Math.atan2(x, z) * scale + 0.5;
    u -= Math.floor(u);
    const col = Math.min(TEX_W - 1, (u * TEX_W) | 0);
    const surface = kind[row[i] * TEX_W + col];
    const s = shade[i];
    const o = slot[i] * 4;
    if (surface === 1) {
      buf[o] = 48 + ((96 * s) >> 8);
      buf[o + 1] = 68 + ((82 * s) >> 8);
      buf[o + 2] = 46 + ((42 * s) >> 8);
    } else if (surface === 2) {
      buf[o] = 168 + ((70 * s) >> 8);
      buf[o + 1] = 156 + ((64 * s) >> 8);
      buf[o + 2] = 122 + ((48 * s) >> 8);
    } else {
      const add = spec[i];
      buf[o] = Math.min(255, 6 + ((28 * s) >> 8) + ((add * 170) >> 8));
      buf[o + 1] = Math.min(255, 22 + ((58 * s) >> 8) + ((add * 200) >> 8));
      buf[o + 2] = Math.min(255, 42 + ((78 * s) >> 8) + ((add * 220) >> 8));
    }
    buf[o + 3] = alpha[i];
  }
}

export default function HeroGlobe({
  shipRef,
  tapeRef,
}: {
  shipRef: { current: GlobeShip | null };
  tapeRef: { current: TapePlayhead | null };
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let running = true;
    let visible = true;
    const cosT = Math.cos(TILT);
    const sinT = Math.sin(TILT);
    const kind = buildEarthKind();

    const coastVec = COAST.map((ring) => ring.map(([lon, lat]) => toVec(lat, lon)));
    const nodeVec = NODES.map(([lon, lat]) => toVec(lat, lon));
    const lanes = LANES.map((lane) => ({ ...lane, frame: buildLaneFrame(lane.waypoints) }));
    const rigs = OFFSHORE_RIGS.map((rig) => ({ ...rig, vec: toVec(rig.lat, rig.lon) }));
    const stars = Array.from({ length: 90 }, (_, i) => ({
      x: ((i * 97) % 1000) / 1000,
      y: ((i * 53) % 1000) / 1000,
      a: 0.15 + (i % 5) * 0.08,
      r: i % 7 === 0 ? 1.4 : 0.8,
    }));

    const bake = document.createElement("canvas");
    const bakeCtx = bake.getContext("2d", { willReadFrequently: true });
    let image: ImageData | null = null;
    let sphere: SphereMap | null = null;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sphere = null;
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    const onVis = () => {
      visible = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVis);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    const drawShip = (sx: number, sy: number, angle: number, rgb: number[], lng: boolean, scale: number) => {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle);
      ctx.scale(scale, scale);
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.ellipse(1, 4.2, 15, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.98)`;
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(11, 5.2);
      ctx.lineTo(-13, 5.2);
      ctx.lineTo(-16, 2.2);
      ctx.lineTo(-16, -2.2);
      ctx.lineTo(-13, -5.2);
      ctx.lineTo(11, -5.2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255, 248, 230, 0.92)";
      ctx.fillRect(-12.5, -3.4, 6.2, 6.8);
      if (lng) {
        ctx.fillStyle = "rgba(210, 236, 240, 0.95)";
        ctx.beginPath();
        ctx.arc(-1, -0.4, 2.5, 0, Math.PI * 2);
        ctx.arc(5.2, -0.4, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "rgba(20, 16, 8, 0.35)";
        ctx.fillRect(-2, -1.3, 10, 2.6);
      }
      ctx.restore();
    };

    const drawRig = (sx: number, sy: number, scale: number) => {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(scale, scale);
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(233, 205, 126, 0.95)";
      ctx.fillStyle = "rgba(12, 14, 18, 0.94)";
      ctx.lineWidth = 1.35;
      ctx.beginPath();
      ctx.moveTo(-7, 8);
      ctx.lineTo(-4.5, 1);
      ctx.moveTo(0, 9);
      ctx.lineTo(0, 1);
      ctx.moveTo(7, 8);
      ctx.lineTo(4.5, 1);
      ctx.stroke();
      ctx.fillRect(-9, -3.5, 18, 6);
      ctx.strokeRect(-9, -3.5, 18, 6);
      ctx.beginPath();
      ctx.moveTo(-3.2, -3.5);
      ctx.lineTo(0, -16);
      ctx.lineTo(3.2, -3.5);
      ctx.moveTo(-1.5, -8);
      ctx.lineTo(1.5, -8);
      ctx.stroke();
      ctx.fillStyle = "#f3d78a";
      ctx.beginPath();
      ctx.arc(0, -17.2, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const paint = (time: number) => {
      if (!running) return;
      if (!reduce) frame = requestAnimationFrame(paint);
      if (!visible && !reduce) return;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const wide = w > h * 1.08;
      const cx = wide ? w * 0.66 : w * 0.5;
      const cy = wide ? h * 0.5 : h * 0.48;
      const radius = wide ? Math.min(h * 0.48, w * 0.36) : Math.min(h * 0.46, w * 0.48);
      if (radius < 40) return;

      const rot = (reduce ? -52 : -52 + (time / 1000) * 2.15) * (Math.PI / 180);
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);

      for (const star of stars) {
        ctx.fillStyle = `rgba(210, 224, 236, ${star.a})`;
        ctx.fillRect(star.x * w, star.y * h, star.r, star.r);
      }

      const glow = ctx.createRadialGradient(cx, cy, radius * 0.82, cx, cy, radius * 1.35);
      glow.addColorStop(0, "rgba(18, 48, 82, 0)");
      glow.addColorStop(0.72, "rgba(36, 92, 140, 0.18)");
      glow.addColorStop(1, "rgba(7, 9, 12, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      if (kind && bakeCtx) {
        const dpr = canvas.clientWidth > 0 ? canvas.width / canvas.clientWidth : 1;
        const size = Math.max(480, Math.min(BAKE_CAP, Math.ceil(radius * 2 * dpr)));
        if (!sphere || sphere.size !== size || !image) {
          bake.width = size;
          bake.height = size;
          image = bakeCtx.createImageData(size, size);
          sphere = prepareSphere(size, cosT, sinT);
        }
        paintSphere(image, sphere, kind, cosR, sinR);
        bakeCtx.putImageData(image, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(bake, cx - radius, cy - radius, radius * 2, radius * 2);
      } else {
        const ocean = ctx.createRadialGradient(cx - radius * 0.28, cy - radius * 0.32, radius * 0.08, cx, cy, radius);
        ocean.addColorStop(0, "#1a4568");
        ocean.addColorStop(0.55, "#0c1d33");
        ocean.addColorStop(1, "#070e18");
        ctx.fillStyle = ocean;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        for (const base of nodeVec) {
          const p = project(viewVec(base, cosR, sinR, cosT, sinT), cx, cy, radius);
          if (p.z <= 0.05) continue;
          const dot = Math.max(1.4, radius * 0.03 * p.z);
          ctx.fillStyle = `rgba(78, 108, 86, ${0.35 + p.z * 0.55})`;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, dot, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      ctx.lineWidth = 0.7;
      ctx.strokeStyle = "rgba(170, 205, 224, 0.2)";
      for (let lat = -60; lat <= 75; lat += 30) {
        ctx.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += 4) {
          const p = project(viewVec(toVec(lat, lon), cosR, sinR, cosT, sinT), cx, cy, radius);
          if (p.z <= 0.04) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(p.sx, p.sy);
            started = true;
          } else ctx.lineTo(p.sx, p.sy);
        }
        ctx.stroke();
      }

      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(2.2, radius / 180);
      ctx.strokeStyle = "rgba(18, 22, 16, 0.8)";
      for (const ring of coastVec) {
        ctx.beginPath();
        let started = false;
        for (const base of ring) {
          const p = project(viewVec(base, cosR, sinR, cosT, sinT), cx, cy, radius);
          if (p.z <= 0.04) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(p.sx, p.sy);
            started = true;
          } else ctx.lineTo(p.sx, p.sy);
        }
        ctx.stroke();
      }
      ctx.lineWidth = Math.max(1.15, radius / 320);
      ctx.strokeStyle = "rgba(244, 236, 214, 0.92)";
      for (const ring of coastVec) {
        ctx.beginPath();
        let started = false;
        for (const base of ring) {
          const p = project(viewVec(base, cosR, sinR, cosT, sinT), cx, cy, radius);
          if (p.z <= 0.04) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(p.sx, p.sy);
            started = true;
          } else ctx.lineTo(p.sx, p.sy);
        }
        ctx.stroke();
      }

      const samples = 36;
      for (const lane of lanes) {
        const rgb = lane.color === "gold" ? GOLD : CYAN;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= samples; i++) {
          const v = lanePosition(lane.frame, i / samples);
          const p = project(viewVec(v, cosR, sinR, cosT, sinT), cx, cy, radius * 1.012);
          if (p.z <= 0.05) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(p.sx, p.sy);
            started = true;
          } else ctx.lineTo(p.sx, p.sy);
        }
        ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.55)`;
        ctx.lineWidth = Math.max(1.4, radius / 260);
        ctx.stroke();

        for (let s = 0; s < lane.ships; s++) {
          const t = reduce
            ? (lane.phase + s / lane.ships) % 1
            : (lane.phase + s / lane.ships + time / 1000 / lane.duration) % 1;
          const head = lanePosition(lane.frame, t);
          const next = lanePosition(lane.frame, t + 0.01);
          const p0 = project(viewVec(head, cosR, sinR, cosT, sinT), cx, cy, radius * 1.012);
          const p1 = project(viewVec(next, cosR, sinR, cosT, sinT), cx, cy, radius * 1.012);
          if (p0.z < 0.08) continue;
          for (let trail = 5; trail >= 1; trail--) {
            const back = lanePosition(lane.frame, t - trail * 0.012);
            const pb = project(viewVec(back, cosR, sinR, cosT, sinT), cx, cy, radius * 1.012);
            if (pb.z < 0.06) continue;
            ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${0.32 * (1 - trail / 6)})`;
            ctx.beginPath();
            ctx.arc(pb.sx, pb.sy, Math.max(1.1, (3.4 - trail * 0.35) * (radius / 240)), 0, Math.PI * 2);
            ctx.fill();
          }
          const ang = Math.atan2(p1.sy - p0.sy, p1.sx - p0.sx);
          const scale = Math.max(0.95, radius / 165) * (0.72 + 0.4 * p0.z);
          drawShip(p0.sx, p0.sy, ang, rgb, lane.kind === "lng", scale);
        }
      }

      for (const rig of rigs) {
        const p = project(viewVec(rig.vec, cosR, sinR, cosT, sinT), cx, cy, radius * 1.01);
        if (p.z < 0.16) continue;
        drawRig(p.sx, p.sy, Math.max(0.72, radius / 340) * (0.8 + 0.35 * p.z));
      }

      const tape = tapeRef.current;
      if (tape) {
        const drawMark = (lat: number, lon: number, name: string, price: number) => {
          const p = project(viewVec(toVec(lat, lon), cosR, sinR, cosT, sinT), cx, cy, radius * 1.02);
          if (p.z < 0.28) return;
          const s = (radius / 300) * (0.85 + 0.35 * p.z);
          ctx.save();
          ctx.translate(p.sx, p.sy - 16 * s);
          ctx.scale(s, s);
          ctx.fillStyle = "rgba(16, 12, 6, 0.88)";
          ctx.strokeStyle = "rgba(220, 181, 78, 0.95)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-16, -12);
          ctx.lineTo(16, -12);
          ctx.lineTo(16, 14);
          ctx.quadraticCurveTo(0, 22, -16, 14);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-16, -4);
          ctx.lineTo(16, -4);
          ctx.moveTo(-16, 6);
          ctx.lineTo(16, 6);
          ctx.stroke();
          ctx.fillStyle = "#e9cd7e";
          ctx.font = "700 11px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`$${price.toFixed(2)}`, 0, 1);
          ctx.font = "600 8px Inter, sans-serif";
          ctx.fillStyle = "#c3ccd8";
          ctx.fillText(name, 0, 22);
          ctx.restore();
        };
        drawMark(BARREL_MARKS[0].lat, BARREL_MARKS[0].lon, "Brent", tape.brent);
        drawMark(BARREL_MARKS[1].lat, BARREL_MARKS[1].lon, "WTI", tape.wti);
      }

      const watched = shipRef.current;
      if (watched) {
        const glideHours = reduce || watched.cogDeg == null || watched.speedKn == null ? 0 : Math.sin(time / 1600) * 5;
        const moved =
          watched.cogDeg == null || watched.speedKn == null
            ? { lat: watched.lat, lon: watched.lon }
            : offsetByCourse(watched.lat, watched.lon, watched.cogDeg, watched.speedKn, glideHours);
        const pos = project(viewVec(toVec(moved.lat, moved.lon), cosR, sinR, cosT, sinT), cx, cy, radius * 1.02);
        if (pos.z > 0.08) {
          if (watched.cogDeg != null && watched.speedKn != null && watched.speedKn > 0) {
            ctx.beginPath();
            ctx.setLineDash([3, 4]);
            let drawing = false;
            for (let hour = 0; hour <= HEADING_RAY_HOURS; hour += 4) {
              const step = offsetByCourse(watched.lat, watched.lon, watched.cogDeg, watched.speedKn, hour);
              const p = project(viewVec(toVec(step.lat, step.lon), cosR, sinR, cosT, sinT), cx, cy, radius * 1.02);
              if (p.z <= 0.05) {
                drawing = false;
                continue;
              }
              if (!drawing) {
                ctx.moveTo(p.sx, p.sy);
                drawing = true;
              } else ctx.lineTo(p.sx, p.sy);
            }
            ctx.strokeStyle = "rgba(233, 205, 126, 0.85)";
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.setLineDash([]);
          }
          const ahead =
            watched.cogDeg == null
              ? moved
              : offsetByCourse(moved.lat, moved.lon, watched.cogDeg, watched.speedKn ?? 12, 2);
          const p1 = project(viewVec(toVec(ahead.lat, ahead.lon), cosR, sinR, cosT, sinT), cx, cy, radius * 1.02);
          ctx.strokeStyle = "rgba(233, 205, 126, 0.95)";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(pos.sx, pos.sy, 11 * (radius / 280), 0, Math.PI * 2);
          ctx.stroke();
          drawShip(pos.sx, pos.sy, Math.atan2(p1.sy - pos.sy, p1.sx - pos.sx), GOLD, false, Math.max(1.15, radius / 150));
          if (pos.z > 0.2) {
            ctx.font = "600 13px Inter, sans-serif";
            ctx.lineWidth = 3;
            ctx.strokeStyle = "rgba(7, 9, 12, 0.8)";
            ctx.strokeText(watched.name, pos.sx + 14, pos.sy - 12);
            ctx.fillStyle = "#e9cd7e";
            ctx.fillText(watched.name, pos.sx + 14, pos.sy - 12);
          }
        }
      }

      ctx.restore();

      ctx.beginPath();
      ctx.arc(cx, cy, radius + 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(201, 160, 56, 0.7)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(150, 190, 214, 0.35)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    };

    frame = requestAnimationFrame(paint);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [shipRef, tapeRef]);

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden />;
}
