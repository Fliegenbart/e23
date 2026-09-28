"use client";

import { useEffect } from "react";

/** Pointer-reactive circles on the gate and an orange wipe on sign-in. */
export function GateMotion() {
  useEffect(() => {
    const gate = document.querySelector<HTMLElement>(".gate");
    const form = gate?.querySelector("form");
    if (!gate || !form) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const move = (e: PointerEvent) => {
      gate.style.setProperty("--mx", (e.clientX / window.innerWidth - 0.5).toFixed(3));
      gate.style.setProperty("--my", (e.clientY / window.innerHeight - 0.5).toFixed(3));
    };
    let leaving = false;
    const submit = (e: SubmitEvent) => {
      if (reduced || leaving) return;
      e.preventDefault();
      leaving = true;
      gate.classList.add("is-leaving");
      window.setTimeout(() => form.submit(), 620);
    };
    // Returning via back/forward cache must not keep the page covered.
    const show = () => {
      leaving = false;
      gate.classList.remove("is-leaving");
    };
    if (!reduced) window.addEventListener("pointermove", move, { passive: true });
    form.addEventListener("submit", submit);
    window.addEventListener("pageshow", show);
    return () => {
      window.removeEventListener("pointermove", move);
      form.removeEventListener("submit", submit);
      window.removeEventListener("pageshow", show);
    };
  }, []);
  return <div className="gate-wipe" aria-hidden="true" />;
}
