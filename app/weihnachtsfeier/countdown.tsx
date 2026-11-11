"use client";
import { useEffect, useState } from "react";

const units = [
  { label: "Tage", ms: 86_400_000 },
  { label: "Stunden", ms: 3_600_000 },
  { label: "Minuten", ms: 60_000 },
  { label: "Sekunden", ms: 1000 },
];

/** Counts down to the party; renders only in the browser, so no clock mismatch. */
export function Countdown({ start, end }: { start: string; end: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now !== null && now >= Date.parse(end))
    return <p className="feier-now">Schön war’s. Bis zum nächsten Jahr.</p>;
  if (now !== null && now >= Date.parse(start))
    return <p className="feier-now">Es läuft. Komm rein.</p>;

  let rest = now === null ? 0 : Date.parse(start) - now;
  return (
    <dl className="feier-countdown" aria-label="Zeit bis zur Feier">
      {units.map((unit) => {
        const value = Math.floor(rest / unit.ms);
        rest -= value * unit.ms;
        return (
          <div key={unit.label}>
            <dd suppressHydrationWarning>
              {now === null ? "–" : String(value).padStart(2, "0")}
            </dd>
            <dt>{unit.label}</dt>
          </div>
        );
      })}
    </dl>
  );
}
