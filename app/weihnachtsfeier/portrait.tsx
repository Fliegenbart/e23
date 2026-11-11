"use client";
import { useEffect, useRef } from "react";

type Dot = { hx: number; hy: number; x: number; y: number; vx: number; vy: number; phase: number };

/**
 * A portrait drawn as a network: the dots drift in like snow, settle into a
 * face, and give way to the pointer before springing back.
 */
export function Portrait({ src, label }: { src: string; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -999, y: -999 };
    let points: number[][] = [];
    let dots: Dot[] = [];
    let links: number[][] = [];
    let size = 0;
    let frame = 0;
    let visible = false;
    let gone = false;

    const layout = () => {
      const ratio = Math.min(devicePixelRatio || 1, 2);
      size = canvas.clientWidth;
      canvas.width = canvas.height = size * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      dots = points.map(([px, py], i) => {
        const hx = (px / 1000) * size;
        const hy = (py / 1000) * size;
        const old = dots[i];
        return {
          hx,
          hy,
          // First layout: scattered above, like snow about to fall.
          x: old ? hx : Math.random() * size,
          y: old ? hy : still ? hy : -Math.random() * size * 0.6,
          vx: 0,
          vy: 0,
          phase: Math.random() * Math.PI * 2,
        };
      });
      if (still) for (const dot of dots) dot.x = dot.hx;
      draw();
    };

    /** Each dot is tied to its nearest neighbours, so the face is one net. */
    const connect = () => {
      const cell = 22;
      const buckets = new Map<number, number[]>();
      const key = (x: number, y: number) => Math.floor(x / cell) * 1000 + Math.floor(y / cell);
      points.forEach(([x, y], i) => {
        const k = key(x, y);
        buckets.set(k, [...(buckets.get(k) ?? []), i]);
      });
      const seen = new Set<number>();
      links = [];
      points.forEach(([x, y], i) => {
        const near: [number, number][] = [];
        for (let dx = -1; dx <= 1; dx++)
          for (let dy = -1; dy <= 1; dy++)
            for (const j of buckets.get(key(x + dx * cell, y + dy * cell)) ?? []) {
              const d = Math.hypot(points[j][0] - x, points[j][1] - y);
              if (j !== i && d < cell) near.push([d, j]);
            }
        near.sort((a, b) => a[0] - b[0]);
        for (const [, j] of near.slice(0, 2)) {
          const id = Math.min(i, j) * 10000 + Math.max(i, j);
          if (!seen.has(id)) {
            seen.add(id);
            links.push([i, j]);
          }
        }
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = "rgba(34, 37, 31, 0.28)";
      ctx.beginPath();
      for (const [a, b] of links) {
        ctx.moveTo(dots[a].x, dots[a].y);
        ctx.lineTo(dots[b].x, dots[b].y);
      }
      ctx.stroke();
      const r = Math.max(1.3, size / 300);
      dots.forEach((dot, i) => {
        ctx.fillStyle = i % 9 === 0 ? "#ed592f" : "#22251f";
        ctx.fillRect(dot.x - r / 2, dot.y - r / 2, r, r);
      });
    };

    const tick = (time: number) => {
      const reach = size * 0.16;
      for (const dot of dots) {
        const tx = dot.hx + Math.cos(time / 900 + dot.phase) * 0.9;
        const ty = dot.hy + Math.sin(time / 1100 + dot.phase) * 0.9;
        dot.vx += (tx - dot.x) * 0.045;
        dot.vy += (ty - dot.y) * 0.045;
        const dx = dot.x - pointer.x;
        const dy = dot.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < reach && d > 0.01) {
          const push = ((reach - d) / reach) ** 2 * 5;
          dot.vx += (dx / d) * push;
          dot.vy += (dy / d) * push;
        }
        dot.vx *= 0.8;
        dot.vy *= 0.8;
        dot.x += dot.vx;
        dot.y += dot.vy;
      }
      draw();
      if (visible) frame = requestAnimationFrame(tick);
    };

    const move = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      pointer.x = event.clientX - box.left;
      pointer.y = event.clientY - box.top;
    };
    const leave = () => {
      pointer.x = pointer.y = -999;
    };

    const resize = new ResizeObserver(() => points.length && layout());
    const watch = new IntersectionObserver(([entry]) => {
      const now = entry.isIntersecting;
      if (now && !visible && !still) frame = requestAnimationFrame(tick);
      visible = now;
    });

    fetch(src)
      .then((response) => response.json())
      .then((data: number[][]) => {
        if (gone) return;
        points = data;
        connect();
        layout();
        resize.observe(canvas);
        watch.observe(canvas);
      })
      .catch(() => {});
    if (!still) {
      canvas.addEventListener("pointermove", move);
      canvas.addEventListener("pointerleave", leave);
    }
    return () => {
      gone = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      watch.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
    };
  }, [src]);
  return <canvas ref={ref} className="feier-portrait" role="img" aria-label={label} />;
}
