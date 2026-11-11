"use client";

import { useMemo, useRef, useState } from "react";
import type { Goal } from "@/lib/goals-shared";

const months = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];
export function monthLabel(date: string) {
  const [y, m] = date.split("-").map(Number);
  return `${months[m - 1]} ${y}`;
}

type Draft = {
  id?: string;
  version?: number;
  kind: Goal["kind"];
  due: string;
  body: string;
  owner: string;
};

/** The target picture and the stages towards it, above the calendar. */
export function Goals({
  goals,
  reload,
}: {
  goals: Goal[];
  reload: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  const vision = goals.find((g) => g.kind === "vision");
  const stages = useMemo(() => {
    const map = new Map<string, Goal[]>();
    for (const g of goals)
      if (g.kind === "step") map.set(g.due, [...(map.get(g.due) ?? []), g]);
    return [...map.entries()].map(([due, steps]) => ({ due, steps }));
  }, [goals]);
  const steps = goals.filter((g) => g.kind === "step");
  const doneCount = steps.filter((g) => g.done).length;
  const today = new Date().toISOString().slice(0, 10);

  function open(next: Draft) {
    setDraft(next);
    setError("");
    dialog.current?.showModal();
  }
  async function send(body: object, close = true) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(result.error || "Speichern fehlgeschlagen.");
      if (close) dialog.current?.close();
      await reload();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Speichern fehlgeschlagen.";
      if (close) setError(message);
      else window.alert(message);
    } finally {
      setBusy(false);
    }
  }
  function save(ev: React.FormEvent) {
    ev.preventDefault();
    if (!draft) return;
    const { id, version, kind: _kind, ...fields } = draft;
    send(id ? { action: "update", id, version, ...fields } : { action: "create", ...fields });
  }

  if (!vision) return null;
  return (
    <section className="goal" aria-labelledby="goal-title">
      <div className="goal-vision">
        <span className="eyebrow">Zielbild · {monthLabel(vision.due)}</span>
        <h2 id="goal-title">Wo wir dann stehen wollen</h2>
        <p className="goal-text">{vision.body}</p>
        {vision.version === 1 && (
          <p className="goal-hint">
            Das ist ein erster Entwurf. Setzt euch zusammen und schreibt ihn
            um, bis jeder von euch seinen Weg darin sieht.
          </p>
        )}
        <div className="goal-meta">
          <button type="button" onClick={() => open({ ...vision })}>
            Zielbild bearbeiten
          </button>
          <span>
            {doneCount} von {steps.length} Schritten erreicht
          </span>
        </div>
        <div
          className="goal-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={doneCount}
          aria-label="Erreichte Schritte"
        >
          <span style={{ width: `${steps.length ? (doneCount / steps.length) * 100 : 0}%` }} />
        </div>
      </div>

      <ol className="goal-path">
        {stages.map((stage, i) => {
          const done = stage.steps.filter((s) => s.done).length;
          const complete = done === stage.steps.length;
          const late = !complete && stage.due < today;
          return (
            <li
              key={stage.due}
              className={`goal-stage${complete ? " is-complete" : ""}${late ? " is-late" : ""}`}
            >
              <header>
                <span className="goal-node" aria-hidden="true">
                  {complete ? "✓" : i + 1}
                </span>
                <h3>
                  <small>Etappe {i + 1} · bis</small>
                  {monthLabel(stage.due)}
                </h3>
                <span className="goal-count">
                  {late ? "überfällig · " : ""}
                  {done}/{stage.steps.length}
                </span>
              </header>
              <ul>
                {stage.steps.map((step) => (
                  <li key={step.id} className={step.done ? "is-done" : ""}>
                    <input
                      type="checkbox"
                      checked={step.done}
                      disabled={busy}
                      aria-label={`Erreicht: ${step.body}`}
                      onChange={() =>
                        send(
                          {
                            action: "toggle",
                            id: step.id,
                            version: step.version,
                            done: !step.done,
                          },
                          false,
                        )
                      }
                    />
                    <button type="button" onClick={() => open({ ...step })}>
                      {step.body}
                      {step.owner && <em>{step.owner}</em>}
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="goal-add"
                onClick={() =>
                  open({ kind: "step", due: stage.due, body: "", owner: "" })
                }
              >
                + Schritt
              </button>
            </li>
          );
        })}
        <li className="goal-stage goal-finish">
          <header>
            <span className="goal-node" aria-hidden="true">
              ★
            </span>
            <h3>
              <small>Ziel</small>
              {monthLabel(vision.due)}
            </h3>
          </header>
          <p>{vision.body}</p>
          <button
            type="button"
            className="goal-add"
            onClick={() =>
              open({ kind: "step", due: vision.due, body: "", owner: "" })
            }
          >
            + Neue Etappe
          </button>
        </li>
      </ol>

      <dialog
        ref={dialog}
        className="tl-dialog"
        onClose={() => setDraft(null)}
        aria-labelledby="goal-dialog-title"
      >
        {draft && (
          <form onSubmit={save}>
            <h2 id="goal-dialog-title">
              {draft.kind === "vision"
                ? "Zielbild"
                : draft.id
                  ? "Schritt bearbeiten"
                  : "Neuer Schritt"}
            </h2>
            <label>
              {draft.kind === "vision"
                ? "Wo stehen wir dann?"
                : "Was muss bis dahin wahr sein?"}
              <textarea
                required
                rows={draft.kind === "vision" ? 5 : 3}
                maxLength={600}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                autoFocus
              />
            </label>
            <div className="tl-row">
              <label>
                {draft.kind === "vision" ? "Zieldatum" : "Bis wann?"}
                <input
                  type="date"
                  required
                  value={draft.due}
                  onChange={(e) => setDraft({ ...draft, due: e.target.value })}
                />
              </label>
              {draft.kind === "step" && (
                <label>
                  Wer trägt das?
                  <input
                    maxLength={80}
                    value={draft.owner}
                    placeholder="Name"
                    onChange={(e) => setDraft({ ...draft, owner: e.target.value })}
                  />
                </label>
              )}
            </div>
            {draft.kind === "step" && (
              <p className="goal-dialog-hint">
                Schritte mit demselben Datum bilden eine Etappe.
              </p>
            )}
            {error && (
              <p className="tl-error" role="alert">
                {error}
              </p>
            )}
            <div className="tl-actions">
              {draft.id && draft.kind === "step" && (
                <button
                  type="button"
                  className="tl-delete"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm("Diesen Schritt wirklich löschen?"))
                      send({ action: "delete", id: draft.id, version: draft.version });
                  }}
                >
                  Löschen
                </button>
              )}
              <button
                type="button"
                className="tl-cancel"
                onClick={() => dialog.current?.close()}
              >
                Abbrechen
              </button>
              <button type="submit" className="tl-save" disabled={busy}>
                {busy ? "Speichert …" : "Speichern"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </section>
  );
}
