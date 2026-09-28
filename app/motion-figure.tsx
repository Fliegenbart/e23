"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Animate once on entry, then remain still. Never hide the underlying artwork. */
export function MotionFigure({
  children,
  caption,
  variant,
  scrub = false,
}: {
  children: ReactNode;
  caption: string;
  variant: "together" | "sharing" | "dialogue";
  /** Tie the animation to scroll position instead of playing once. */
  scrub?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(preference.matches);
    sync();
    preference.addEventListener("change", sync);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", sync);
    };
  }, []);
  if (scrub)
    return (
      <figure className={`motion-figure motion-scrub motion-${variant}`} data-scroll>
        <div className="motion-art" aria-hidden="true">
          {children}
        </div>
        <figcaption>
          <span className="sr-only">{caption}</span>
        </figcaption>
      </figure>
    );
  return (
    <figure
      ref={ref}
      className={`motion-figure motion-${variant} ${visible && !reduced ? "motion-started" : ""}`}
    >
      <div key={iteration} className="motion-art" aria-hidden="true">
        {children}
      </div>
      <figcaption>
        <span className="sr-only">{caption}</span>
        {!reduced && (
          <button
            type="button"
            onClick={() => {
              setVisible(true);
              setIteration((value) => value + 1);
            }}
            aria-label={`Animation wiederholen: ${caption}`}
            title="Animation wiederholen"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M19 8a8 8 0 1 0 1 7M19 3v5h-5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </figcaption>
    </figure>
  );
}
