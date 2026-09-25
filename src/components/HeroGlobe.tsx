"use client";

import { useEffect, useRef } from "react";
import { decodeEdges, decodePoints } from "@/components/globe/decode";
import { HUBS, RIGS, SEA_LANES, type Vessel } from "@/components/globe/routes";
import {
  COAST_B64,
  COAST_EDGES_B64,
  INTERIOR_B64,
  INTERIOR_EDGES_B64,
} from "@/components/globe/landMask";

const GOLD = "255, 198, 72";
const CYAN = "72, 236, 244";
const TILT = 0.34;
const SPIN = 0.055; // radians per second — a full turn takes about two minutes

type LaneMesh = {
  vessel: Vessel;
  xyz: Float32Array;
  ships: { phase: number; speed: number }[];
};

function llVec(lat: number, lon: number): [number, number, number] {
  const φ = (lat * Math.PI) / 180;
  const λ = (lon * Math.PI) / 180;
  const c = Math.cos(φ);
  return [c * Math.cos(λ), Math.sin(φ), c * Math.sin(λ)];
}

function slerp(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  dot = Math.max(-1, Math.min(1, dot));
  const omega = Math.acos(dot);
  if (omega < 1e-4) return a;
  const s = Math.sin(omega);
  const p = Math.sin((1 - t) * omega) / s;
  const q = Math.sin(t * omega) / s;
  return [a[0] * p + b[0] * q, a[1] * p + b[1] * q, a[2] * p + b[2] * q];
}

function buildLanes(): LaneMesh[] {
  return SEA_LANES.map((lane) => {
    const samples: number[] = [];
    for (let w = 0; w < lane.waypoints.length - 1; w++) {
      const a = llVec(lane.waypoints[w][0], lane.waypoints[w][1]);
      const b = llVec(lane.waypoints[w + 1][0], lane.waypoints[w + 1][1]);
      const steps = 18;
      for (let s = 0; s < steps; s++) {
        const p = slerp(a, b, s / steps);
        samples.push(p[0], p[1], p[2]);
      }
    }
    const last = lane.waypoints[lane.waypoints.length - 1];
    const end = llVec(last[0], last[1]);
    samples.push(end[0], end[1], end[2]);
    const ships = Array.from({ length: lane.ships }, (_, i) => ({
      phase: i / lane.ships,
      speed: lane.vessel === "lng" ? 0.018 : 0.014,
    }));
    return { vessel: lane.vessel, xyz: new Float32Array(samples), ships };
  });
}

function rotate(x: number, y: number, z: number, yaw: number): [number, number, number] {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const ct = Math.cos(TILT);
  const st = Math.sin(TILT);
  return [x1, y * ct - z1 * st, y * st + z1 * ct];
}

function drawShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  vessel: Vessel,
  alpha: number,
  scale: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  const color = vessel === "lng" ? `rgb(${CYAN})` : `rgb(${GOLD})`;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(2, 2.1);
  ctx.lineTo(-7, 2.1);
  ctx.lineTo(-8.2, 0);
  ctx.lineTo(-7, -2.1);
  ctx.lineTo(2, -2.1);
  ctx.closePath();
  ctx.fill();
  if (vessel === "lng") {
    ctx.fillStyle = "rgba(7, 16, 28, 0.55)";
    ctx.beginPath();
    ctx.arc(-3.2, 0, 1.7, 0, Math.PI * 2);
    ctx.arc(1.4, 0, 1.7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawRig(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number, pulse: number, scale: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = `rgba(${GOLD},${0.85})`;
  ctx.fillStyle = `rgba(${CYAN},${0.9})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-5, 3);
  ctx.lineTo(-2, -1);
  ctx.moveTo(5, 3);
  ctx.lineTo(2, -1);
  ctx.moveTo(-5, 3);
  ctx.lineTo(5, 3);
  ctx.moveTo(0, -1);
  ctx.lineTo(0, -7);
  ctx.stroke();
  ctx.globalAlpha = alpha * (0.45 + pulse * 0.55);
  ctx.beginPath();
  ctx.arc(0, -7, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export default function HeroGlobe() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const coast = decodePoints(COAST_B64);
    const coastEdges = decodeEdges(COAST_EDGES_B64);
    const interior = decodePoints(INTERIOR_B64);
    const interiorEdges = decodeEdges(INTERIOR_EDGES_B64);
    const lanes = buildLanes();
    const rigs = RIGS.map((r) => ({ name: r.name, v: llVec(r.lat, r.lon) }));
    const hubs = HUBS.map((h) => ({ name: h.name, v: llVec(h.lat, h.lon) }));

    const stars = Array.from({ length: 70 }, (_, i) => {
      const s = Math.sin(i * 127.1) * 43758.5453;
      const t = Math.sin(i * 311.7) * 24634.6345;
      return { x: s - Math.floor(s), y: t - Math.floor(t), r: 0.4 + (i % 5) * 0.18 };
    });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let running = true;
    const t0 = performance.now();

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
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const draw = (now: number) => {
      if (!running) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.4;
      const elapsed = (now - t0) / 1000;
      const yaw = reduced ? -1.15 : elapsed * SPIN - 1.15;
      const pulse = reduced ? 0.6 : 0.5 + 0.5 * Math.sin(elapsed * 2.2);

      ctx.clearRect(0, 0, w, h);

      const sky = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.65);
      sky.addColorStop(0, "#0c1828");
      sky.addColorStop(0.55, "#070b12");
      sky.addColorStop(1, "#07090c");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "rgba(214, 196, 140, 0.55)";
      for (const star of stars) {
        ctx.globalAlpha = 0.25 + (star.r % 0.4);
        ctx.beginPath();
        ctx.arc(star.x * w, star.y * h, star.r * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const glow = ctx.createRadialGradient(cx, cy, radius * 0.92, cx, cy, radius * 1.28);
      glow.addColorStop(0, "rgba(78, 214, 214, 0)");
      glow.addColorStop(0.45, "rgba(78, 214, 214, 0.16)");
      glow.addColorStop(0.72, "rgba(201, 160, 56, 0.08)");
      glow.addColorStop(1, "rgba(7, 9, 12, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.28, 0, Math.PI * 2);
      ctx.fill();

      const ocean = ctx.createRadialGradient(cx - radius * 0.28, cy - radius * 0.32, radius * 0.1, cx, cy, radius);
      ocean.addColorStop(0, "#16324a");
      ocean.addColorStop(0.45, "#0c1c2e");
      ocean.addColorStop(1, "#071018");
      ctx.fillStyle = ocean;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      const project = (x: number, y: number, z: number) => {
        const p = rotate(x, y, z, yaw);
        return {
          sx: cx + p[0] * radius,
          sy: cy - p[1] * radius,
          z: p[2],
          light: Math.max(0, p[0] * -0.35 + p[1] * 0.55 + p[2] * 0.76),
        };
      };

      const drawMesh = (xyz: Float32Array, edges: Uint16Array, rgb: string, width: number) => {
        const buckets: Path2D[] = Array.from({ length: 6 }, () => new Path2D());
        const n = xyz.length / 3;
        const sx = new Float32Array(n);
        const sy = new Float32Array(n);
        const z = new Float32Array(n);
        const lit = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          const p = project(xyz[i * 3], xyz[i * 3 + 1], xyz[i * 3 + 2]);
          sx[i] = p.sx;
          sy[i] = p.sy;
          z[i] = p.z;
          lit[i] = p.light;
        }
        for (let e = 0; e < edges.length; e += 2) {
          const i = edges[e];
          const j = edges[e + 1];
          if (z[i] < 0.02 || z[j] < 0.02) continue;
          const shade = (lit[i] + lit[j]) * 0.5;
          const bucket = Math.min(5, Math.floor(shade * 6));
          buckets[bucket].moveTo(sx[i], sy[i]);
          buckets[bucket].lineTo(sx[j], sy[j]);
        }
        ctx.lineWidth = width * dpr;
        ctx.lineCap = "round";
        for (let b = 0; b < buckets.length; b++) {
          ctx.strokeStyle = `rgba(${rgb},${0.08 + b * 0.1})`;
          ctx.stroke(buckets[b]);
        }
        ctx.fillStyle = `rgba(${rgb},0.9)`;
        for (let i = 0; i < n; i++) {
          if (z[i] < 0.05) continue;
          ctx.globalAlpha = 0.15 + lit[i] * 0.85;
          ctx.beginPath();
          ctx.arc(sx[i], sy[i], (0.7 + lit[i] * 0.9) * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      };

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      drawMesh(interior, interiorEdges, "58, 110, 158", 0.6);
      drawMesh(coast, coastEdges, "212, 168, 74", 0.85);

      for (const lane of lanes) {
        const rgb = lane.vessel === "lng" ? CYAN : GOLD;
        const count = lane.xyz.length / 3;
        const pts: { sx: number; sy: number; z: number }[] = [];
        for (let i = 0; i < count; i++) {
          pts.push(project(lane.xyz[i * 3], lane.xyz[i * 3 + 1], lane.xyz[i * 3 + 2]));
        }
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = `rgba(${rgb},0.95)`;
        ctx.shadowBlur = Math.max(8, radius * 0.035);
        const trace = () => {
          ctx.beginPath();
          let pen = false;
          for (const p of pts) {
            if (p.z < 0.05) {
              pen = false;
              continue;
            }
            if (!pen) {
              ctx.moveTo(p.sx, p.sy);
              pen = true;
            } else ctx.lineTo(p.sx, p.sy);
          }
          ctx.stroke();
        };
        ctx.lineWidth = Math.max(4, radius * 0.016);
        ctx.strokeStyle = `rgba(${rgb},0.35)`;
        trace();
        ctx.shadowBlur = Math.max(4, radius * 0.012);
        ctx.lineWidth = Math.max(1.6, radius * 0.006);
        ctx.strokeStyle = `rgba(${rgb},1)`;
        trace();
        ctx.shadowBlur = 0;

        for (const ship of lane.ships) {
          const travel = reduced ? ship.phase : (ship.phase + elapsed * ship.speed) % 1;
          const idx = travel * (count - 1);
          const i0 = Math.floor(idx);
          const i1 = Math.min(count - 1, i0 + 1);
          const f = idx - i0;
          const a = pts[i0];
          const b = pts[i1];
          if (a.z < 0.08 && b.z < 0.08) continue;
          const sx = a.sx + (b.sx - a.sx) * f;
          const sy = a.sy + (b.sy - a.sy) * f;
          const z = a.z + (b.z - a.z) * f;
          const angle = Math.atan2(b.sy - a.sy, b.sx - a.sx);
          const trail = 5;
          for (let t = trail; t >= 1; t--) {
            const back = Math.max(0, i0 - t * 2);
            const p = pts[back];
            if (p.z < 0.05) continue;
            ctx.globalAlpha = ((trail - t + 1) / (trail + 2)) * Math.min(1, z + 0.2) * 0.55;
            ctx.fillStyle = `rgba(${rgb},1)`;
            ctx.beginPath();
            ctx.arc(p.sx, p.sy, Math.max(1.5, radius * 0.008) * (1 + (trail - t) * 0.12), 0, Math.PI * 2);
            ctx.fill();
          }
          drawShip(ctx, sx, sy, angle, lane.vessel, Math.min(1, 0.55 + z * 0.5), Math.max(1.8, radius * 0.02));
        }
      }

      for (const rig of rigs) {
        const p = project(rig.v[0], rig.v[1], rig.v[2]);
        if (p.z < 0.12) continue;
        drawRig(ctx, p.sx, p.sy, Math.min(1, 0.3 + p.z), pulse, Math.max(1.3, radius * 0.011));
      }
      ctx.restore();

      ctx.strokeStyle = "rgba(166, 177, 192, 0.28)";
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 8 * dpr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(201, 160, 56, 0.35)";
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 14 * dpr, -0.4, 0.9);
      ctx.stroke();

      ctx.font = `${11 * dpr}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textBaseline = "middle";
      for (const hub of hubs) {
        const p = project(hub.v[0], hub.v[1], hub.v[2]);
        if (p.z < 0.45) continue;
        ctx.globalAlpha = Math.min(1, (p.z - 0.4) * 2);
        ctx.fillStyle = "#e9cd7e";
        ctx.fillText(hub.name, p.sx + 8 * dpr, p.sy - 8 * dpr);
      }
      ctx.globalAlpha = 1;

      const spec = ctx.createRadialGradient(
        cx - radius * 0.32,
        cy - radius * 0.36,
        0,
        cx - radius * 0.18,
        cy - radius * 0.2,
        radius * 0.55
      );
      spec.addColorStop(0, "rgba(233, 205, 126, 0.16)");
      spec.addColorStop(1, "rgba(233, 205, 126, 0)");
      ctx.fillStyle = spec;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running && !reduced) {
        running = true;
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}
