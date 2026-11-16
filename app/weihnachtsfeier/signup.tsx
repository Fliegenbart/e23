"use client";
import { useState, type FormEvent } from "react";

export type SignupText = {
  name: string;
  email: string;
  guests: string;
  note: string;
  notePlaceholder: string;
  submit: string;
  sending: string;
  privacy: string;
  privacyLink: string;
  privacyHref: string;
  doneTitle: string;
  done: string;
  calendar: string;
  calendarHint: string;
  errors: Record<"invalid" | "full" | "unavailable", string>;
};

/** Sign-up form; posts to /api/anmeldung and confirms in place. */
export function Signup({ lang, text }: { lang: string; text: SignupText }) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState("sending");
    setError("");
    try {
      const response = await fetch("/api/anmeldung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          guests: Number(form.get("guests")),
          note: form.get("note"),
          website: form.get("website"),
          lang,
        }),
      });
      if (response.ok) return setState("done");
      const code = (await response.json().catch(() => null))?.error;
      setError(text.errors[code as "full"] ?? text.errors.unavailable);
    } catch {
      setError(text.errors.unavailable);
    }
    setState("idle");
  }

  if (state === "done")
    return (
      <div className="feier-done" role="status">
        <strong>{text.doneTitle}</strong>
        <p>{text.done}</p>
        <a className="feier-cta" href="/weihnachtsfeier/termin.ics" download="e23-weihnachtsfeier.ics">
          {text.calendar} <span aria-hidden="true">↓</span>
        </a>
        <small>{text.calendarHint}</small>
      </div>
    );

  return (
    <form className="feier-form" onSubmit={submit}>
      <label>
        <span>{text.name}</span>
        <input name="name" required maxLength={80} autoComplete="name" />
      </label>
      <label>
        <span>{text.email}</span>
        <input name="email" type="email" required maxLength={200} autoComplete="email" />
      </label>
      <label className="feier-form-short">
        <span>{text.guests}</span>
        <select name="guests" defaultValue="1">
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      <label className="feier-form-wide">
        <span>{text.note}</span>
        <textarea name="note" rows={3} maxLength={500} placeholder={text.notePlaceholder} />
      </label>
      <label className="feier-form-trap" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <div className="feier-form-wide feier-form-end">
        <button type="submit" disabled={state === "sending"}>
          {state === "sending" ? text.sending : text.submit}
        </button>
        <p>
          {text.privacy} <a href={text.privacyHref}>{text.privacyLink}</a>
        </p>
      </div>
      {error && (
        <p className="feier-form-wide feier-form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
