"use client";
import { useEffect, useState } from "react";
const labels = [
  "Der Anfang",
  "Menschlicher Kern",
  "Großzügigkeit",
  "Das Gespräch",
  "Gute Werkzeuge",
  "Verantwortung",
  "Unser Labor",
];
export function ReadingTools() {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const update = () =>
      setProgress(
        window.scrollY /
          Math.max(
            1,
            document.documentElement.scrollHeight - window.innerHeight,
          ),
      );
    update();
    window.addEventListener("scroll", update, { passive: true });
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting)
            setActive(Number((entry.target as HTMLElement).dataset.chapter));
      },
      { rootMargin: "-10% 0px -55% 0px" },
    );
    document
      .querySelectorAll("[data-chapter]")
      .forEach((el) => observer.observe(el));
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("keydown", escape);
      observer.disconnect();
    };
  }, []);
  return (
    <>
      <div
        className="reading-progress"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden="true"
      />
      <nav className="chapter-nav" aria-label="Kapitelübersicht">
        <button
          className="chapter-toggle"
          aria-expanded={open}
          aria-controls="chapter-list"
          onClick={() => setOpen(!open)}
        >
          <span>Das Manifest</span>
          <span className="toggle-symbol" aria-hidden="true">
            {open ? "−" : "+"}
          </span>
        </button>
        <div
          id="chapter-list"
          className={`chapter-list ${open ? "is-open" : ""}`}
        >
          {labels.map((label, i) => (
            <a
              key={label}
              aria-label={label}
              href={i === 0 ? "#anfang" : `#kapitel-${i}`}
              aria-current={active === i ? "location" : undefined}
              onClick={() => setOpen(false)}
            >
              <span className="chapter-dot" />
              <span className="chapter-label">{label}</span>
              <span className="chapter-num">0{i}</span>
            </a>
          ))}
        </div>
      </nav>
    </>
  );
}
