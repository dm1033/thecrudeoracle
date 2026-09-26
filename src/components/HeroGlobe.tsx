"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { COAST, NODES } from "./globe-land";
import { HEADING_RAY_HOURS } from "@/lib/tankermap";
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

const GOLD = [220, 181, 78];
const CYAN = [72, 214, 224];
const MASK_W = 720;
const MASK_H = 360;
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

function buildLandMask(): Uint8Array | null {
  const canvas = document.createElement("canvas");
  canvas.width = MASK_W;
  canvas.height = MASK_H;
  const g = canvas.getContext("2d", { willReadFrequently: true });
  if (!g) return null;
  g.clearRect(0, 0, MASK_W, MASK_H);
  g.fillStyle = "#fff";
  for (const ring of COAST) {
    if (ring.length < 3) continue;
    const unwrapped = unwrapRing(ring);
    for (const shift of [-360, 0, 360]) {
      g.beginPath();
      for (let i = 0; i < unwrapped.length; i++) {
        const x = ((unwrapped[i][0] + shift + 180) / 360) * MASK_W;
        const y = ((90 - unwrapped[i][1]) / 180) * MASK_H;
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.closePath();
      g.fill();
    }
  }
  const pixels = g.getImageData(0, 0, MASK_W, MASK_H).data;
  const mask = new Uint8Array(MASK_W * MASK_H);
  for (let i = 0; i < mask.length; i++) mask[i] = pixels[i * 4] > 128 ? 1 : 0;
  for (const probe of PROBES) {
    const { x, y } = maskPixel(probe.lon, probe.lat, MASK_W, MASK_H);
    if ((mask[y * MASK_W + x] === 1) !== probe.land) return null;
  }
  return mask;
}

export default function HeroGlobe({ shipRef }: { shipRef: RefObject<GlobeShip | null> }) {
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
    const mask = buildLandMask();

    const coastVec = COAST.map((ring) => ring.map(([lon, lat]) => toVec(lat, lon)));
    const nodeVec = NODES.map(([lon, lat]) => toVec(lat, lon));
    const lanes = LANES.map((lane) => ({ ...lane, frame: buildLaneFrame(lane.waypoints) }));
    const stars = Array.from({ length: 70 }, (_, i) => ({
      x: ((i * 97) % 1000) / 1000,
      y: ((i * 53) % 1000) / 1000,
      a: 0.12 + (i % 5) * 0.07,
      r: i % 7 === 0 ? 1.3 : 0.7,
    }));

    const bake = document.createElement("canvas");
    const bakeCtx = bake.getContext("2d", { willReadFrequently: true });
    let image: ImageData | null = null;

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
      ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.96)`;
      ctx.beginPath();
      if (lng) {
        ctx.moveTo(16, 0);
        ctx.lineTo(-10, 4);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-10, -4);
      } else {
        ctx.moveTo(18, 0);
        ctx.lineTo(-12, 5);
        ctx.lineTo(-7, 0);
        ctx.lineTo(-12, -5);
      }
      ctx.closePath();
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
      const cy = wide ? h * 0.5 : h * 0.4;
      const radius = wide ? Math.min(h * 0.5, w * 0.34) : Math.min(h * 0.36, w * 0.48);
      if (radius < 40) return;

      const rot = (reduce ? -52 : -52 + (time / 1000) * 2.15) * (Math.PI / 180);
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);

      for (const star of stars) {
        ctx.fillStyle = `rgba(198, 214, 226, ${star.a})`;
        ctx.fillRect(star.x * w, star.y * h, star.r, star.r);
      }

      const glow = ctx.createRadialGradient(cx, cy, radius * 0.82, cx, cy, radius * 1.35);
      glow.addColorStop(0, "rgba(18, 48, 82, 0)");
      glow.addColorStop(0.72, "rgba(36, 92, 140, 0.16)");
      glow.addColorStop(1, "rgba(7, 9, 12, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      if (mask && bakeCtx) {
        const size = Math.max(160, Math.min(420, Math.ceil(radius * 1.55)));
        if (bake.width !== size || bake.height !== size || !image) {
          bake.width = size;
          bake.height = size;
          image = bakeCtx.createImageData(size, size);
        }
        const buf = image.data;
        const rad = size / 2;
        const inv = 1 / rad;
        const lx = -0.35;
        const ly = 0.55;
        const lz = 0.76;
        for (let py = 0; py < size; py++) {
          const ny = -((py + 0.5) - rad) * inv;
          const row = py * size;
          for (let px = 0; px < size; px++) {
            const nx = ((px + 0.5) - rad) * inv;
            const rr = nx * nx + ny * ny;
            const i = (row + px) * 4;
            if (rr > 1) {
              buf[i + 3] = 0;
              continue;
            }
            const nz = Math.sqrt(1 - rr);
            const yR = ny * cosT + nz * sinT;
            const zR = -ny * sinT + nz * cosT;
            const x = nx * cosR - zR * sinR;
            const z = nx * sinR + zR * cosR;
            const lat = Math.asin(Math.max(-1, Math.min(1, yR))) * (180 / Math.PI);
            const lon = Math.atan2(x, z) * (180 / Math.PI);
            const sample = maskPixel(lon, lat, MASK_W, MASK_H);
            const land = mask[sample.y * MASK_W + sample.x] === 1;
            const ndotl = Math.max(0, nx * lx + ny * ly + nz * lz);
            const shade = 0.16 + 0.84 * ndotl;
            if (land) {
              buf[i] = 36 + 78 * shade;
              buf[i + 1] = 58 + 70 * shade;
              buf[i + 2] = 46 + 36 * shade;
            } else {
              buf[i] = 3 + 16 * shade;
              buf[i + 1] = 16 + 42 * shade;
              buf[i + 2] = 30 + 62 * shade;
              const spec = ndotl * ndotl;
              const hot = spec * spec * spec;
              buf[i] = Math.min(255, buf[i] + hot * 160);
              buf[i + 1] = Math.min(255, buf[i + 1] + hot * 190);
              buf[i + 2] = Math.min(255, buf[i + 2] + hot * 210);
            }
            const edge = rr > 0.965 ? (1 - rr) / 0.035 : 1;
            buf[i + 3] = Math.round(255 * edge);
          }
        }
        bakeCtx.putImageData(image, 0, 0);
        ctx.imageSmoothingEnabled = true;
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

      ctx.lineWidth = 0.6;
      ctx.strokeStyle = "rgba(150, 190, 210, 0.16)";
      for (let lat = -60; lat <= 75; lat += 30) {
        ctx.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += 6) {
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

      ctx.lineWidth = 1.15;
      ctx.strokeStyle = "rgba(236, 226, 198, 0.72)";
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

      const samples = 28;
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
        ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.42)`;
        ctx.lineWidth = 1.15;
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
          for (let trail = 6; trail >= 1; trail--) {
            const back = lanePosition(lane.frame, t - trail * 0.012);
            const pb = project(viewVec(back, cosR, sinR, cosT, sinT), cx, cy, radius * 1.012);
            if (pb.z < 0.06) continue;
            ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${0.28 * (1 - trail / 7)})`;
            ctx.beginPath();
            ctx.arc(pb.sx, pb.sy, Math.max(0.8, (3.1 - trail * 0.32) * (radius / 280)), 0, Math.PI * 2);
            ctx.fill();
          }
          const ang = Math.atan2(p1.sy - p0.sy, p1.sx - p0.sx);
          const scale = (radius / 230) * (0.78 + 0.35 * p0.z);
          drawShip(p0.sx, p0.sy, ang, rgb, lane.kind === "lng", scale);
        }
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
          ctx.arc(pos.sx, pos.sy, 9 * (radius / 280), 0, Math.PI * 2);
          ctx.stroke();
          drawShip(pos.sx, pos.sy, Math.atan2(p1.sy - pos.sy, p1.sx - pos.sx), GOLD, false, (radius / 250) * 1.2);
          if (pos.z > 0.2) {
            ctx.font = "600 13px Inter, sans-serif";
            ctx.lineWidth = 3;
            ctx.strokeStyle = "rgba(7, 9, 12, 0.8)";
            ctx.strokeText(watched.name, pos.sx + 12, pos.sy - 10);
            ctx.fillStyle = "#e9cd7e";
            ctx.fillText(watched.name, pos.sx + 12, pos.sy - 10);
          }
        }
      }

      ctx.restore();

      ctx.beginPath();
      ctx.arc(cx, cy, radius + 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(201, 160, 56, 0.55)";
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(120, 160, 190, 0.28)";
      ctx.lineWidth = 0.6;
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
  }, [shipRef]);

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden />;
}
