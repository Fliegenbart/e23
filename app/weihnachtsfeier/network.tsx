"use client";
import { useEffect, useRef } from "react";

type Dot = { x: number; y: number; vx: number; vy: number; r: number; hot: boolean };

/**
 * Snow that networks: flakes drift down, and whenever two come close a line
 * forms between them. The pointer is one more participant in the exchange.
 */
export function Network() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let reach = 150;
    let w = 0;
    let h = 0;
    let dots: Dot[] = [];
    let frame = 0;
    const pointer = { x: -999, y: -999 };

    const resize = () => {
      const ratio = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      reach = Math.min(150, w / 3.6);
      canvas.width = w * ratio;
      canvas.height = h * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.round(Math.min(90, Math.max(26, (w * h) / 14000)));
      dots = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: 0.12 + Math.random() * 0.3,
        r: 1.2 + Math.random() * 2.2,
        hot: i % 7 === 0,
      }));
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const all = pointer.x > -900 ? [...dots, { ...pointer, r: 0, hot: true }] : dots;
      for (let a = 0; a < all.length; a++) {
        for (let b = a + 1; b < all.length; b++) {
          const dx = all[a].x - all[b].x;
          const dy = all[a].y - all[b].y;
          const d = Math.hypot(dx, dy);
          if (d > reach) continue;
          const hot = all[a].hot || all[b].hot;
          ctx.strokeStyle = hot
            ? `rgba(237, 89, 47, ${(1 - d / reach) * 0.75})`
            : `rgba(243, 240, 232, ${(1 - d / reach) * 0.28})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(all[a].x, all[a].y);
          ctx.lineTo(all[b].x, all[b].y);
          ctx.stroke();
        }
      }
      for (const dot of dots) {
        ctx.fillStyle = dot.hot ? "#ed592f" : "rgba(243, 240, 232, 0.8)";
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = () => {
      for (const dot of dots) {
        dot.x += dot.vx;
        dot.y += dot.vy;
        if (dot.y > h + 10) {
          dot.y = -10;
          dot.x = Math.random() * w;
        }
        if (dot.x < -10) dot.x = w + 10;
        if (dot.x > w + 10) dot.x = -10;
      }
      draw();
      frame = requestAnimationFrame(tick);
    };

    const move = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      pointer.x = event.clientX - box.left;
      pointer.y = event.clientY - box.top;
      if (still) draw();
    };
    const leave = () => {
      pointer.x = pointer.y = -999;
      if (still) draw();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const host = canvas.parentElement;
    host?.addEventListener("pointermove", move);
    host?.addEventListener("pointerleave", leave);
    if (!still) frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      host?.removeEventListener("pointermove", move);
      host?.removeEventListener("pointerleave", leave);
    };
  }, []);
  return <canvas ref={ref} className="feier-network" aria-hidden="true" />;
}
