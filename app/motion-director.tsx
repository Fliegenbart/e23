"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Drives the manifest's motion: smooth scrolling, reveal-on-entry and
 * scroll-linked progress variables. Elements opt in with data attributes:
 * - data-reveal: receives .is-in once it enters the viewport
 * - data-scroll: receives --p (0..1 while crossing the viewport) and
 *   --q (0..1 while its top edge travels from viewport bottom to top)
 */
export function MotionDirector() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    root.classList.add("motion-ready");

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            reveal.unobserve(entry.target);
          }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => reveal.observe(el));

    const tracked = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll]"));
    const visible = new Set<HTMLElement>();
    const watch = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) visible.add(el);
        else visible.delete(el);
      }
      schedule();
    });
    tracked.forEach((el) => watch.observe(el));

    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      for (const el of visible) {
        const box = el.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (vh - box.top) / (vh + box.height)));
        const q = Math.min(1, Math.max(0, (vh - box.top) / vh));
        el.style.setProperty("--p", p.toFixed(4));
        el.style.setProperty("--q", q.toFixed(4));
      }
    };
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    // Reduced motion: pin every scroll-linked piece to its finished state.
    if (reduced) tracked.forEach((el) => el.style.setProperty("--p", "0.75"));
    else {
      update();
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
    }

    const lenis =
      !reduced && fine
        ? new Lenis({ autoRaf: true, anchors: true, lerp: 0.09 })
        : null;

    let cursorCleanup = () => {};
    if (!reduced && fine) {
      const dot = document.createElement("div");
      const ring = document.createElement("div");
      dot.className = "cursor-dot";
      ring.className = "cursor-ring";
      document.body.append(dot, ring);
      root.classList.add("has-cursor");
      let x = -100;
      let y = -100;
      let rx = x;
      let ry = y;
      let raf = 0;
      const loop = () => {
        rx += (x - rx) * 0.18;
        ry += (y - ry) * 0.18;
        dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
        raf = requestAnimationFrame(loop);
      };
      const move = (e: PointerEvent) => {
        x = e.clientX;
        y = e.clientY;
        root.style.setProperty("--mx", (x / window.innerWidth - 0.5).toFixed(3));
        root.style.setProperty("--my", (y / window.innerHeight - 0.5).toFixed(3));
        const target = e.target as Element | null;
        const hot = target?.closest("a, button, label, input");
        ring.classList.toggle("is-hot", !!hot);
        ring.classList.toggle("is-text", !!target?.closest("input"));
      };
      const leave = () => ring.classList.add("is-away");
      const enter = () => ring.classList.remove("is-away");
      window.addEventListener("pointermove", move, { passive: true });
      document.addEventListener("pointerleave", leave);
      document.addEventListener("pointerenter", enter);
      raf = requestAnimationFrame(loop);
      cursorCleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", move);
        document.removeEventListener("pointerleave", leave);
        document.removeEventListener("pointerenter", enter);
        dot.remove();
        ring.remove();
        root.classList.remove("has-cursor");
      };
    }

    return () => {
      reveal.disconnect();
      watch.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      lenis?.destroy();
      cursorCleanup();
      root.classList.remove("motion-ready");
    };
  }, []);
  return null;
}
