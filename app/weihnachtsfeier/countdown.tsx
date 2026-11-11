"use client";
import { useEffect, useState } from "react";

const sizes = [86_400_000, 3_600_000, 60_000, 1000];

type Text = { label: string; units: string[]; running: string; over: string };

/** Counts down to the party; renders only in the browser, so no clock mismatch. */
export function Countdown({
  start,
  end,
  text,
}: {
  start: string;
  end: string;
  text: Text;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now !== null && now >= Date.parse(end))
    return <p className="feier-now">{text.over}</p>;
  if (now !== null && now >= Date.parse(start))
    return <p className="feier-now">{text.running}</p>;

  let rest = now === null ? 0 : Date.parse(start) - now;
  return (
    <dl className="feier-countdown" aria-label={text.label}>
      {sizes.map((ms, i) => {
        const value = Math.floor(rest / ms);
        rest -= value * ms;
        return (
          <div key={ms}>
            <dd suppressHydrationWarning>
              {now === null ? "–" : String(value).padStart(2, "0")}
            </dd>
            <dt>{text.units[i]}</dt>
          </div>
        );
      })}
    </dl>
  );
}
