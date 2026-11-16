"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/** Helpers shared by the project board and the contacts view. */

export const dateLabel = (date: string | null) =>
  date
    ? new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "short",
      }).format(new Date(date.slice(0, 10) + "T12:00:00"))
    : "";
export const dateInput = (date: string | null) => date?.slice(0, 10) || "";
export const values = (form: HTMLFormElement) =>
  Object.fromEntries(new FormData(form).entries());
export async function api(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, cache: "no-store" });
  const body = await response.json();
  if (!response.ok) {
    if (response.status === 401)
      throw new Error(
        "Deine Sitzung ist abgelaufen. Bitte melde dich auf der Startseite erneut an.",
      );
    throw new Error(body.error || "Das hat leider nicht funktioniert.");
  }
  return body;
}
export function EditorDialog({
  title,
  children,
  close,
  wide,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      className={wide ? "ws-dialog wide" : "ws-dialog"}
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      aria-labelledby="editor-title"
    >
      <div className="ws-dialog-head">
        <h2 id="editor-title">{title}</h2>
        <button
          type="button"
          className="ws-icon"
          aria-label="Schließen"
          onClick={close}
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

