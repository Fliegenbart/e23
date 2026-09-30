"use client";

import { useEffect, useRef } from "react";

/** Thin orange bar showing how far the article has been read. */
export function ReadProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const article = document.querySelector(".post-body");
      if (!article || !bar.current) return;
      const box = article.getBoundingClientRect();
      const total = box.height - window.innerHeight * 0.6;
      const done = Math.min(1, Math.max(0, -box.top / Math.max(1, total)));
      bar.current.style.transform = `scaleX(${done})`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  return <div ref={bar} className="reading-progress" aria-hidden="true" />;
}
