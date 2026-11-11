"use client";
import { useRef, type ReactNode } from "react";

/** The sign-up form lives in a dialog, so the invitation stays one screen. */
export function SignupDialog({
  open,
  close,
  title,
  children,
}: {
  open: string;
  close: string;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="feier-cta" onClick={() => ref.current?.showModal()}>
        {open} <span aria-hidden="true">→</span>
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
