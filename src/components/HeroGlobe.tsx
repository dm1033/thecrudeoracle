"use client";

import { useEffect, useRef } from "react";
import { COAST, NODES } from "./globe-land";

type Vec = { x: number; y: number; z: number };

type Route = {
  from: [number, number];
  to: [number, number];
  color: "gold" | "cyan";
  speed: number;
  phase: number;
  kind: "tanker" | "lng";
};

const ROUTES: Route[] = [
  { from: [26.6, 50.2], to: [51.9, 4.4], color: "gold", speed: 0.045, phase: 0.05, kind: "tanker" },
  { from: [26.6, 50.2], to: [1.3, 103.8], color: "gold", speed: 0.038, phase: 0.42, kind: "tanker" },
  { from: [1.3, 103.8], to: [29.9, 121.8], color: "gold", speed: 0.05, phase: 0.2, kind: "tanker" },
  { from: [4.4, 6.8], to: [22.3, 114.2], color: "cyan", speed: 0.036, phase: 0.62, kind: "tanker" },
  { from: [29.4, -94.8], to: [51.9, 4.4], color: "gold", speed: 0.042, phase: 0.28, kind: "tanker" },
  { from: [59.9, 28.5], to: [51.5, 0.1], color: "gold", speed: 0.055, phase: 0.74, kind: "tanker" },
  { from: [25.9, 51.6], to: [35.4, 139.7], color: "cyan", speed: 0.034, phase: 0.15, kind: "lng" },
  { from: [29.7, -93.8], to: [51.7, -5.1], color: "cyan", speed: 0.04, phase: 0.55, kind: "lng" },
  { from: [-20.6, 116.7], to: [35.6, 139.8], color: "cyan", speed: 0.033, phase: 0.83, kind: "lng" },
];

const RIGS: Array<[number, number]> = [
  [61.2, 1.6],
  [27.4, -90.2],
  [26.2, 52.4],
  [4.1, 5.4],
  [-25.2, -42.6],
  [-19.6, 116.2],
];

const HUBS: Array<[number, number]> = [
  [51.5, -0.1],
  [51.9, 4.4],
  [29.7, -95.3],
  [1.3, 103.8],
  [31.2, 121.5],
  [35.6, 139.8],
  [25.2, 55.3],
  [19.1, 72.9],
  [6.4, 3.4],
  [40.7, -74.0],
];

const GOLD = [220, 181, 78];
const CYAN = [72, 214, 224];

function toVec(lat: number, lon: number): Vec {
  const φ = (lat * Math.PI) / 180;
  const λ = (lon * Math.PI) / 180;
  const c = Math.cos(φ);
  return { x: c * Math.sin(λ), y: Math.sin(φ), z: c * Math.cos(λ) };
}

function tilt(v: Vec, tiltRad: number): Vec {
  const c = Math.cos(tiltRad);
  const s = Math.sin(tiltRad);
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
}

function rotateLon(lat: number, lon: number, rot: number): Vec {
  return toVec(lat, lon + rot);
}

function slerp(a: Vec, b: Vec, t: number): Vec {
  let dot = a.x * b.x + a.y * b.y + a.z * b.z;
  dot = Math.max(-1, Math.min(1, dot));
  const omega = Math.acos(dot);
  if (omega < 1e-4) return a;
  const so = Math.sin(omega);
  const p = Math.sin((1 - t) * omega) / so;
  const q = Math.sin(t * omega) / so;
  return { x: a.x * p + b.x * q, y: a.y * p + b.y * q, z: a.z * p + b.z * q };
}

function project(v: Vec, cx: number, cy: number, r: number) {
  return { sx: cx + v.x * r, sy: cy - v.y * r, z: v.z };
}

export default function HeroGlobe() {
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
    const tiltRad = 0.42;

    const coastVec = COAST.map((ring) => ring.map(([lon, lat]) => toVec(lat, lon)));
    const nodeVec = NODES.map(([lon, lat]) => toVec(lat, lon));
    const hubVec = HUBS.map(([lat, lon]) => toVec(lat, lon));
    const rigVec = RIGS.map(([lat, lon]) => toVec(lat, lon));
    const routeVec = ROUTES.map((route) => ({
      ...route,
      a: toVec(route.from[0], route.from[1]),
      b: toVec(route.to[0], route.to[1]),
    }));

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

    const drawShip = (sx: number, sy: number, angle: number, rgb: number[], lng: boolean) => {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle);
      ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.95)`;
      ctx.beginPath();
      if (lng) {
        ctx.moveTo(11, 0);
        ctx.lineTo(-8, 3.4);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-8, -3.4);
      } else {
        ctx.moveTo(13, 0);
        ctx.lineTo(-9, 4);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-9, -4);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawRig = (sx: number, sy: number) => {
      ctx.strokeStyle = "rgba(220, 181, 78, 0.9)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx - 5, sy + 4);
      ctx.lineTo(sx, sy - 6);
      ctx.lineTo(sx + 5, sy + 4);
      ctx.moveTo(sx - 4, sy + 1);
      ctx.lineTo(sx + 4, sy + 1);
      ctx.stroke();
      ctx.fillStyle = "rgba(72, 214, 224, 0.9)";
      ctx.fillRect(sx - 1.2, sy - 7.5, 2.4, 2.4);
    };

    const paint = (time: number) => {
      if (!running) return;
      if (!reduce) frame = requestAnimationFrame(paint);
      if (!visible && !reduce) return;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.5;
      const r = Math.min(w, h) * 0.36;
      if (r < 20) return;

      const rot = reduce ? 18 : (time / 1000) * 8;

      const glow = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 1.45);
      glow.addColorStop(0, "rgba(18, 48, 82, 0.0)");
      glow.addColorStop(0.55, "rgba(28, 78, 120, 0.18)");
      glow.addColorStop(0.78, "rgba(201, 160, 56, 0.08)");
      glow.addColorStop(1, "rgba(7, 9, 12, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.45, 0, Math.PI * 2);
      ctx.fill();

      const ocean = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.3, r * 0.1, cx, cy, r);
      ocean.addColorStop(0, "#16324f");
      ocean.addColorStop(0.55, "#0c1b2e");
      ocean.addColorStop(1, "#070d16");
      ctx.fillStyle = ocean;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      const sheen = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.05, cx, cy, r);
      sheen.addColorStop(0, "rgba(180, 220, 255, 0.16)");
      sheen.addColorStop(0.45, "rgba(180, 220, 255, 0.02)");
      sheen.addColorStop(1, "rgba(0, 0, 0, 0.28)");
      ctx.fillStyle = sheen;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      ctx.lineWidth = 0.6;
      ctx.strokeStyle = "rgba(70, 130, 180, 0.22)";
      for (let lat = -60; lat <= 75; lat += 15) {
        ctx.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += 4) {
          const p = project(tilt(rotateLon(lat, lon, rot), tiltRad), cx, cy, r);
          if (p.z <= 0.02) {
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
      for (let lon = -180; lon < 180; lon += 20) {
        ctx.beginPath();
        let started = false;
        for (let lat = -80; lat <= 80; lat += 3) {
          const p = project(tilt(rotateLon(lat, lon, rot), tiltRad), cx, cy, r);
          if (p.z <= 0.02) {
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

      ctx.lineWidth = 1.05;
      ctx.strokeStyle = "rgba(201, 160, 56, 0.42)";
      ctx.shadowColor = "rgba(201, 160, 56, 0.25)";
      ctx.shadowBlur = 0;
      for (const ring of coastVec) {
        ctx.beginPath();
        let started = false;
        for (const base of ring) {
          const spun = {
            x: base.x * Math.cos((rot * Math.PI) / 180) + base.z * Math.sin((rot * Math.PI) / 180),
            y: base.y,
            z: -base.x * Math.sin((rot * Math.PI) / 180) + base.z * Math.cos((rot * Math.PI) / 180),
          };
          const p = project(tilt(spun, tiltRad), cx, cy, r);
          if (p.z <= 0.05) {
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
      ctx.shadowBlur = 0;

      for (const base of nodeVec) {
        const spun = {
          x: base.x * Math.cos((rot * Math.PI) / 180) + base.z * Math.sin((rot * Math.PI) / 180),
          y: base.y,
          z: -base.x * Math.sin((rot * Math.PI) / 180) + base.z * Math.cos((rot * Math.PI) / 180),
        };
        const p = project(tilt(spun, tiltRad), cx, cy, r);
        if (p.z <= 0.08) continue;
        const a = 0.15 + p.z * 0.45;
        ctx.fillStyle = `rgba(90, 170, 210, ${a})`;
        ctx.fillRect(p.sx, p.sy, 1.3, 1.3);
      }

      const samples = 48;
      for (const route of routeVec) {
        const rgb = route.color === "gold" ? GOLD : CYAN;
        ctx.beginPath();
        let started = false;
        let prev: { sx: number; sy: number; z: number } | null = null;
        const pts: Array<{ sx: number; sy: number; z: number }> = [];
        for (let i = 0; i <= samples; i++) {
          const v = slerp(route.a, route.b, i / samples);
          const spun = {
            x: v.x * Math.cos((rot * Math.PI) / 180) + v.z * Math.sin((rot * Math.PI) / 180),
            y: v.y,
            z: -v.x * Math.sin((rot * Math.PI) / 180) + v.z * Math.cos((rot * Math.PI) / 180),
          };
          const p = project(tilt(spun, tiltRad), cx, cy, r * 1.012);
          pts.push(p);
          if (p.z <= 0.04) {
            started = false;
            prev = null;
            continue;
          }
          if (!started) {
            ctx.moveTo(p.sx, p.sy);
            started = true;
          } else if (prev) {
            ctx.lineTo(p.sx, p.sy);
          }
          prev = p;
        }
        ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.95)`;
        ctx.lineWidth = 2.2;
        ctx.shadowColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.9)`;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        const t = reduce ? route.phase : (route.phase + time / 1000 * route.speed) % 1;
        for (let trail = 7; trail >= 0; trail--) {
          const tt = (t - trail * 0.012 + 1) % 1;
          const idx = Math.min(samples - 1, Math.floor(tt * samples));
          const p0 = pts[idx];
          const p1 = pts[idx + 1];
          if (!p0 || !p1 || p0.z < 0.05 || p1.z < 0.05) continue;
          const f = tt * samples - idx;
          const sx = p0.sx + (p1.sx - p0.sx) * f;
          const sy = p0.sy + (p1.sy - p0.sy) * f;
          const alpha = trail === 0 ? 0.95 : 0.28 * (1 - trail / 8);
          const radius = trail === 0 ? 2.2 : 1.6 - trail * 0.12;
          ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(0.4, radius), 0, Math.PI * 2);
          ctx.fill();
          if (trail === 0) {
            const ang = Math.atan2(p1.sy - p0.sy, p1.sx - p0.sx);
            drawShip(sx, sy, ang, rgb, route.kind === "lng");
          }
        }
      }

      for (const base of hubVec) {
        const spun = {
          x: base.x * Math.cos((rot * Math.PI) / 180) + base.z * Math.sin((rot * Math.PI) / 180),
          y: base.y,
          z: -base.x * Math.sin((rot * Math.PI) / 180) + base.z * Math.cos((rot * Math.PI) / 180),
        };
        const p = project(tilt(spun, tiltRad), cx, cy, r);
        if (p.z <= 0.08) continue;
        ctx.fillStyle = "rgba(233, 205, 126, 0.95)";
        ctx.shadowColor = "rgba(233, 205, 126, 0.8)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, 2.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      for (const base of rigVec) {
        const spun = {
          x: base.x * Math.cos((rot * Math.PI) / 180) + base.z * Math.sin((rot * Math.PI) / 180),
          y: base.y,
          z: -base.x * Math.sin((rot * Math.PI) / 180) + base.z * Math.cos((rot * Math.PI) / 180),
        };
        const p = project(tilt(spun, tiltRad), cx, cy, r);
        if (p.z <= 0.1) continue;
        drawRig(p.sx, p.sy);
      }

      ctx.restore();

      ctx.beginPath();
      ctx.arc(cx, cy, r + 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(201, 160, 56, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(90, 140, 180, 0.25)";
      ctx.lineWidth = 0.6;
      ctx.stroke();
      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * Math.PI * 2;
        const inner = i % 6 === 0 ? r + 6 : r + 8;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
        ctx.lineTo(cx + Math.cos(a) * (r + 12), cy + Math.sin(a) * (r + 12));
        ctx.strokeStyle = i % 6 === 0 ? "rgba(201, 160, 56, 0.55)" : "rgba(120, 160, 190, 0.35)";
        ctx.stroke();
      }
    };

    frame = requestAnimationFrame(paint);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      aria-hidden
    />
  );
}
