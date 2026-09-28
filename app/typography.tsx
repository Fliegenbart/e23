import { Fragment, type CSSProperties, type ReactNode } from "react";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** Splits text into words carrying their index (--i) for staggered motion. */
export function Words({
  text,
  offset = 0,
  accent,
}: {
  text: string;
  offset?: number;
  accent?: (index: number) => boolean;
}) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span
            className={accent?.(i + offset) ? "w w-accent" : "w"}
            style={{ "--i": i + offset } as Vars}
          >
            {word}
          </span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </>
  );
}

export function count(text: string) {
  return text.split(" ").length;
}

/** A masked line that rises into view; --l staggers consecutive lines. */
export function Line({
  children,
  index,
  className,
}: {
  children: ReactNode;
  index: number;
  className?: string;
}) {
  return (
    <span className={`mask-line ${className ?? ""}`} style={{ "--l": index } as Vars}>
      <span>{children}</span>
    </span>
  );
}

export function vars(values: Record<string, string | number>) {
  return Object.fromEntries(
    Object.entries(values).map(([k, v]) => [`--${k}`, v]),
  ) as Vars;
}

/** The E23 leitmotif: translucent discs whose overlap creates a third colour. */
export function Overlap({
  variant,
  track = true,
}: {
  variant: string;
  /** Measure its own scroll progress; otherwise inherit --p from a parent. */
  track?: boolean;
}) {
  return (
    <div
      className={`overlap overlap-${variant}`}
      data-scroll={track ? "" : undefined}
      aria-hidden="true"
    >
      <i />
      <i />
      <i />
    </div>
  );
}
