"use client";
import { useRef, type ReactNode } from "react";

/** Extra content opens in a dialog, so the invitation stays one screen. */
export function Dialog({
  open,
  variant,
  close,
  title,
  children,
}: {
  open: string;
  /** "cta" is the filled button, "link" a quiet text link. */
  variant: "cta" | "link";
  close: string;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        className={variant === "cta" ? "feier-cta" : "feier-more"}
        onClick={() => ref.current?.showModal()}
      >
        {open} {variant === "cta" && <span aria-hidden="true">→</span>}
      </button>
      <dialog
        ref={ref}
        className="feier-dialog"
        aria-label={title}
        onClick={(event) => event.target === ref.current && ref.current?.close()}
      >
        <div>
          <button
            type="button"
            className="feier-dialog-close"
            onClick={() => ref.current?.close()}
            aria-label={close}
          >
            ×
          </button>
          <h2>{title}</h2>
          {children}
        </div>
      </dialog>
    </>
  );
}
