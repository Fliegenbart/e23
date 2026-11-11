"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  lanes,
  statuses,
  type Entry,
  type Lane,
  type Status,
} from "@/lib/timeline-shared";
import type { Goal } from "@/lib/goals-shared";
import { Goals, monthLabel } from "./goals";

const BASE_MONTHS = 18;
const MAX_MONTHS = 30;
const monthNames = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];

type Draft = {
  id?: string;
  version?: number;
  title: string;
  lane: Lane;
  status: Status;
  starts: string;
  ends: string;
  owner: string;
  note: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Months between the window's first month and the given ISO date. */
function monthIndex(origin: Date, date: string) {
  const [y, m] = date.split("-").map(Number);
  return (y - origin.getFullYear()) * 12 + (m - 1 - origin.getMonth());
}
function formatSpan(e: Entry) {
  const fmt = (v: string) => {
    const [y, m, d] = v.split("-").map(Number);
    return `${d}. ${monthNames[m - 1]} ${String(y).slice(2)}`;
  };
  return e.ends && e.ends !== e.starts
    ? `${fmt(e.starts)} – ${fmt(e.ends)}`
    : fmt(e.starts);
}
/** Shifts an ISO date by whole months, keeping the day where the month allows it. */
function shiftMonths(date: string, by: number) {
  const [y, m, d] = date.split("-").map(Number);
  const first = new Date(y, m - 1 + by, 1);
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return `${first.getFullYear()}-${pad(first.getMonth() + 1)}-${pad(Math.min(d, days))}`;
}
const zooms = [
  { months: 6, label: "6 Monate" },
  { months: 12, label: "12 Monate" },
  { months: 0, label: "Alles" },
];
type Drag = { id: string; dx: number; dy: number; months: number; lane: Lane };

const statusLabel = (s: Status) =>
  statuses.find((x) => x.id === s)?.label ?? s;

export function Timeline() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const [zoom, setZoom] = useState(12);
  const [hidden, setHidden] = useState<Lane[]>([]);
  const [drag, setDrag] = useState<Drag | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const tracks = useRef(new Map<Lane, HTMLDivElement>());
  const suppressClick = useRef(false);
  const gesture = useRef<{ x: number; y: number; col: number; moved: boolean } | null>(null);

  const origin = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);
  // The calendar always reaches the target date, even if that is past 18 months.
  const span = useMemo(() => {
    const target = goals.find((g) => g.kind === "vision");
    const needed = target ? monthIndex(origin, target.due) + 1 : 0;
    return Math.min(MAX_MONTHS, Math.max(BASE_MONTHS, needed));
  }, [goals, origin]);
  const months = useMemo(
    () =>
      Array.from({ length: span }, (_, i) => {
        const d = new Date(origin.getFullYear(), origin.getMonth() + i, 1);
        return { year: d.getFullYear(), month: d.getMonth() };
      }),
    [origin, span],
  );
  const today = useMemo(() => {
    const now = new Date();
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return ((now.getDate() - 0.5) / days / span) * 100;
  }, [span]);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/timeline", { cache: "no-store" });
      if (r.status === 401) {
        window.location.href = "/?next=zeitstrahl";
        return;
      }
      const body = await r.json();
      if (!r.ok) throw new Error(body.error);
      setEntries(body.entries);
      setError("");
      // The target picture is an addition: the calendar still works without it.
      const g = await fetch("/api/goals", { cache: "no-store" });
      if (g.ok) setGoals((await g.json()).goals);
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Der Zeitstrahl konnte nicht geladen werden.",
      );
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => {
      if (!document.querySelector("dialog[open]")) load();
    }, 20000);
    const focus = () => {
      if (!document.querySelector("dialog[open]")) load();
    };
    window.addEventListener("focus", focus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [load]);

  function open(next: Draft) {
    setDraft(next);
    setFormError("");
    dialog.current?.showModal();
  }
  function create(lane: Lane = "kunden", monthOffset = 0) {
    const start = new Date(
      origin.getFullYear(),
      origin.getMonth() + monthOffset,
      monthOffset === 0 ? new Date().getDate() : 1,
    );
    open({
      title: "",
      lane,
      status: "geplant",
      starts: iso(start),
      ends: "",
      owner: "",
      note: "",
    });
  }
  function edit(e: Entry) {
    open({ ...e, ends: e.ends ?? "" });
  }
  async function send(body: object) {
    setSaving(true);
    setFormError("");
    try {
      const r = await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(result.error || "Speichern fehlgeschlagen.");
      dialog.current?.close();
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }
  function save(ev: React.FormEvent) {
    ev.preventDefault();
    if (!draft) return;
    const { id, version, ...fields } = draft;
    send(id ? { action: "update", id, version, ...fields } : { action: "create", ...fields });
  }
  function remove() {
    if (!draft?.id || !draft.version) return;
    if (!window.confirm(`„${draft.title}“ wirklich aus dem Zeitstrahl löschen?`))
      return;
    send({ action: "delete", id: draft.id, version: draft.version });
  }

  /** Moves an entry by whole months and/or to another lane; shown at once, then saved. */
  async function move(entry: Entry, by: number, lane: Lane) {
    if (!by && lane === entry.lane) return;
    const next = {
      ...entry,
      lane,
      starts: shiftMonths(entry.starts, by),
      ends: entry.ends ? shiftMonths(entry.ends, by) : null,
    };
    setEntries((list) => list?.map((e) => (e.id === entry.id ? next : e)) ?? list);
    try {
      const r = await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: entry.id,
          version: entry.version,
          title: entry.title,
          lane: next.lane,
          status: entry.status,
          starts: next.starts,
          ends: next.ends ?? "",
          owner: entry.owner,
          note: entry.note,
        }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error);
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Verschieben fehlgeschlagen.",
      );
    }
    await load();
  }
  function laneAt(y: number, fallback: Lane) {
    for (const [lane, el] of tracks.current) {
      const box = el.getBoundingClientRect();
      if (y >= box.top && y <= box.bottom) return lane;
    }
    return fallback;
  }
  function dragStart(e: React.PointerEvent<HTMLButtonElement>, entry: Entry) {
    if (e.button !== 0) return;
    const track = tracks.current.get(entry.lane);
    if (!track) return;
    gesture.current = {
      x: e.clientX,
      y: e.clientY,
      col: track.getBoundingClientRect().width / span,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function dragMove(e: React.PointerEvent<HTMLButtonElement>, entry: Entry) {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.moved && Math.hypot(dx, dy) < 6) return;
    g.moved = true;
    setDrag({
      id: entry.id,
      dx,
      dy,
      months: Math.round(dx / g.col),
      lane: laneAt(e.clientY, entry.lane),
    });
  }
  function dragEnd(entry: Entry) {
    const g = gesture.current;
    gesture.current = null;
    if (!g?.moved || !drag) {
      setDrag(null);
      return;
    }
    const { months: by, lane } = drag;
    setDrag(null);
    // The click that follows a drag must not open the editor.
    window.setTimeout(() => (suppressClick.current = false), 0);
    suppressClick.current = true;
    move(entry, by, lane);
  }
  function scrollToToday() {
    const el = board.current;
    if (!el) return;
    const width = el.scrollWidth - 170;
    el.scrollTo({ left: Math.max(0, (today / 100) * width - 80), behavior: "smooth" });
  }

  // Stage deadlines and the target date as flags on the calendar.
  const marks = useMemo(() => {
    const dates = new Map<string, boolean>();
    for (const g of goals)
      dates.set(g.due, dates.get(g.due) || g.kind === "vision");
    let stage = 0;
    return [...dates.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([due, final]) => {
        if (!final) stage += 1;
        const [y, m, d] = due.split("-").map(Number);
        const days = new Date(y, m, 0).getDate();
        const at = monthIndex(origin, due) + (d - 0.5) / days;
        return {
          due,
          final,
          left: (at / span) * 100,
          label: final ? `Ziel · ${monthLabel(due)}` : `Etappe ${stage}`,
          visible: at >= 0 && at <= span,
        };
      })
      .filter((mark) => mark.visible);
  }, [goals, origin, span]);

  const placed = useMemo(() => {
    const rows = new Map<Lane, { entry: Entry; from: number; to: number }[]>();
    for (const lane of lanes) rows.set(lane.id, []);
    for (const entry of entries ?? []) {
      const from = monthIndex(origin, entry.starts);
      const to = monthIndex(origin, entry.ends ?? entry.starts);
      if (to < 0 || from >= span) continue;
      rows.get(entry.lane)?.push({
        entry,
        from: Math.max(0, from),
        to: Math.min(span - 1, to),
      });
    }
    return rows;
  }, [entries, origin, span]);

  const byMonth = useMemo(
    () =>
      months.map((m, i) => ({
        ...m,
        items: (entries ?? []).filter((e) => {
          const from = monthIndex(origin, e.starts);
          const to = monthIndex(origin, e.ends ?? e.starts);
          return from <= i && to >= i && (from === i || i === 0);
        }),
      })),
    [entries, months, origin],
  );

  const soon = useMemo(() => {
    const limit = iso(new Date(Date.now() + 90 * 864e5));
    const now = iso(new Date());
    return (entries ?? []).filter(
      (e) =>
        e.status !== "erledigt" &&
        e.starts <= limit &&
        (e.ends ?? e.starts) >= now,
    );
  }, [entries]);

  return (
    <div className="tl">
      <div className="tl-toolbar">
        <ul className="tl-legend" aria-label="Status">
          {statuses.map((s) => (
            <li key={s.id}>
              <span className={`tl-swatch is-${s.id}`} />
              {s.label}
            </li>
          ))}
        </ul>
        <button type="button" className="tl-add" onClick={() => create()}>
          Eintrag hinzufügen <span aria-hidden="true">+</span>
        </button>
      </div>

      {error && (
        <p className="tl-error" role="alert">
          {error}
        </p>
      )}
      {!entries && !error && <p className="tl-loading">Zeitstrahl wird geladen …</p>}

      {entries && (
        <>
          <Goals goals={goals} reload={load} />
          <section className="tl-soon" aria-labelledby="tl-soon-title">
            <h2 id="tl-soon-title">Die nächsten 90 Tage</h2>
            {soon.length ? (
              <ol>
                {soon.map((e) => (
                  <li key={e.id}>
                    <button type="button" onClick={() => edit(e)}>
                      <span className={`tl-dot is-${e.lane}`} />
                      <span className="tl-soon-date">{formatSpan(e)}</span>
                      <span className="tl-soon-title">{e.title}</span>
                      {e.owner && <span className="tl-soon-owner">{e.owner}</span>}
                      <span className={`tl-badge is-${e.status}`}>
                        {statusLabel(e.status)}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="tl-quiet">
                Noch nichts eingetragen. Was steht als Nächstes an?
              </p>
            )}
          </section>

          <div className="tl-controls">
            <div className="tl-filters" role="group" aria-label="Bereiche ein- und ausblenden">
              {lanes.map((lane) => {
                const on = !hidden.includes(lane.id);
                const n = (entries ?? []).filter((e) => e.lane === lane.id).length;
                return (
                  <button
                    key={lane.id}
                    type="button"
                    aria-pressed={on}
                    className={`tl-chip${on ? " is-on" : ""}`}
                    onClick={() =>
                      setHidden((h) =>
                        on ? [...h, lane.id] : h.filter((x) => x !== lane.id),
                      )
                    }
                  >
                    <span className={`tl-dot is-${lane.id}`} />
                    {lane.label}
                    <small>{n}</small>
                  </button>
                );
              })}
            </div>
            <div className="tl-view">
              <button type="button" className="tl-jump" onClick={scrollToToday}>
                Heute
              </button>
              <div className="tl-zoom" role="group" aria-label="Zeitraum">
                {zooms.map((z) => (
                  <button
                    key={z.label}
                    type="button"
                    aria-pressed={zoom === z.months}
                    className={zoom === z.months ? "is-on" : ""}
                    onClick={() => setZoom(z.months)}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="tl-tip">
            Einträge lassen sich ziehen: seitlich in einen anderen Monat, nach
            oben oder unten in einen anderen Bereich. Mit Tastatur: Alt + Pfeiltasten.
          </p>

          <div
            ref={board}
            className={`tl-board${drag ? " is-dragging" : ""}`}
            role="region"
            aria-label={`Zeitstrahl, ${span} Monate`}
            tabIndex={0}
          >
            <div
              className="tl-grid"
              style={
                {
                  "--months": span,
                  "--zoom": Math.min(span, zoom || span),
                } as React.CSSProperties
              }
            >
              <div className="tl-corner" />
              <div className="tl-months">
                {months.map((m, i) => (
                  <div
                    key={i}
                    className={`tl-month${m.month === 0 ? " is-year" : ""}`}
                  >
                    {(i === 0 || m.month === 0) && (
                      <span className="tl-year">{m.year}</span>
                    )}
                    {monthNames[m.month]}
                  </div>
                ))}
              </div>
              <div className="tl-now" aria-hidden="true">
                <span className="tl-today" style={{ left: `${today}%` }}>
                  <span>Heute</span>
                </span>
                {marks.map((mark) => (
                  <span
                    key={mark.due}
                    className={`tl-mark${mark.final ? " is-final" : ""}`}
                    style={{ left: `${mark.left}%` }}
                  >
                    <span>{mark.label}</span>
                  </span>
                ))}
              </div>
              {lanes
                .filter((lane) => !hidden.includes(lane.id))
                .map((lane, row) => (
                <div
                  className={`tl-lane is-${lane.id}${drag?.lane === lane.id ? " is-target" : ""}`}
                  key={lane.id}
                >
                  <div className="tl-lane-label" style={{ gridRow: row + 2 }}>
                    <span className={`tl-dot is-${lane.id}`} />
                    {lane.label}
                  </div>
                  <div
                    className="tl-track"
                    style={{ gridRow: row + 2 }}
                    ref={(el) => {
                      if (el) tracks.current.set(lane.id, el);
                      else tracks.current.delete(lane.id);
                    }}
                  >
                    <div className="tl-slots">
                      {months.map((m, i) => (
                        <button
                          key={i}
                          type="button"
                          className="tl-slot"
                          onClick={() => create(lane.id, i)}
                          aria-label={`${lane.label}: Eintrag im ${monthNames[m.month]} ${m.year} hinzufügen`}
                          tabIndex={-1}
                        />
                      ))}
                    </div>
                    {placed.get(lane.id)?.map(({ entry, from, to }, n) => {
                      const dragging = drag?.id === entry.id;
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          className={`tl-item is-${entry.status}${dragging ? " is-dragged" : ""}`}
                          style={
                            {
                              gridColumn: `${from + 1} / ${to + 2}`,
                              "--n": n,
                              ...(dragging
                                ? { translate: `${drag.dx}px ${drag.dy}px` }
                                : {}),
                            } as React.CSSProperties
                          }
                          onPointerDown={(e) => dragStart(e, entry)}
                          onPointerMove={(e) => dragMove(e, entry)}
                          onPointerUp={() => dragEnd(entry)}
                          onPointerCancel={() => {
                            gesture.current = null;
                            setDrag(null);
                          }}
                          onClick={() => {
                            if (!suppressClick.current) edit(entry);
                          }}
                          onKeyDown={(e) => {
                            if (!e.altKey) return;
                            const order = lanes.map((l) => l.id);
                            const at = order.indexOf(entry.lane);
                            const step: Record<string, [number, number]> = {
                              ArrowLeft: [-1, 0],
                              ArrowRight: [1, 0],
                              ArrowUp: [0, -1],
                              ArrowDown: [0, 1],
                            };
                            const s = step[e.key];
                            if (!s) return;
                            e.preventDefault();
                            move(
                              entry,
                              s[0],
                              order[Math.min(order.length - 1, Math.max(0, at + s[1]))],
                            );
                          }}
                        >
                          <span className="tl-item-title">{entry.title}</span>
                          <span className="tl-item-meta">
                            {dragging
                              ? formatSpan({
                                  ...entry,
                                  starts: shiftMonths(entry.starts, drag.months),
                                  ends: entry.ends
                                    ? shiftMonths(entry.ends, drag.months)
                                    : null,
                                })
                              : formatSpan(entry)}
                            {entry.owner ? ` · ${entry.owner}` : ""}
                          </span>
                          {entry.note && !dragging && (
                            <span className="tl-item-note">{entry.note}</span>
                          )}
                          <span className={`tl-item-status is-${entry.status}`}>
                            {statusLabel(entry.status)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ol className="tl-list" aria-label="Zeitstrahl nach Monaten">
            {byMonth.map((m, i) => (
              <li key={i}>
                <h3>
                  {monthNames[m.month]} <span>{m.year}</span>
                </h3>
                {m.items.length ? (
                  m.items.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      className={`tl-item is-${e.status}`}
                      onClick={() => edit(e)}
                    >
                      <span className="tl-item-title">
                        <span className={`tl-dot is-${e.lane}`} />
                        {e.title}
                      </span>
                      <span className="tl-item-meta">
                        {formatSpan(e)}
                        {e.owner ? ` · ${e.owner}` : ""}
                      </span>
                    </button>
                  ))
                ) : (
                  <span className="tl-quiet">—</span>
                )}
              </li>
            ))}
          </ol>
        </>
      )}

      <dialog
        ref={dialog}
        className="tl-dialog"
        onClose={() => setDraft(null)}
        aria-labelledby="tl-dialog-title"
      >
        {draft && (
          <form onSubmit={save}>
            <h2 id="tl-dialog-title">
              {draft.id ? "Eintrag bearbeiten" : "Neuer Eintrag"}
            </h2>
            <label>
              Was?
              <input
                required
                maxLength={160}
                value={draft.title}
                placeholder="z. B. Workshop mit Kunde X"
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                autoFocus
              />
            </label>
            <div className="tl-row">
              <label>
                Bereich
                <select
                  value={draft.lane}
                  onChange={(e) =>
                    setDraft({ ...draft, lane: e.target.value as Lane })
                  }
                >
                  {lanes.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Wer kümmert sich?
                <input
                  maxLength={80}
                  value={draft.owner}
                  placeholder="Name"
                  onChange={(e) => setDraft({ ...draft, owner: e.target.value })}
                />
              </label>
            </div>
            <div className="tl-row">
              <label>
                Ab
                <input
                  type="date"
                  required
                  value={draft.starts}
                  onChange={(e) => setDraft({ ...draft, starts: e.target.value })}
                />
              </label>
              <label>
                <span>
                  Bis <small>(optional)</small>
                </span>
                <input
                  type="date"
                  value={draft.ends}
                  min={draft.starts}
                  onChange={(e) => setDraft({ ...draft, ends: e.target.value })}
                />
              </label>
            </div>
            <fieldset className="tl-status">
              <legend>Wie sicher?</legend>
              {statuses.map((s) => (
                <label key={s.id}>
                  <input
                    type="radio"
                    name="status"
                    value={s.id}
                    checked={draft.status === s.id}
                    onChange={() => setDraft({ ...draft, status: s.id })}
                  />
                  <span className={`tl-badge is-${s.id}`}>{s.label}</span>
                </label>
              ))}
            </fieldset>
            <label>
              <span>
                Notiz <small>(optional)</small>
              </span>
              <textarea
                rows={3}
                maxLength={2000}
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              />
            </label>
            {formError && (
              <p className="tl-error" role="alert">
                {formError}
              </p>
            )}
            <div className="tl-actions">
              {draft.id && (
                <button
                  type="button"
                  className="tl-delete"
                  onClick={remove}
                  disabled={saving}
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
              <button type="submit" className="tl-save" disabled={saving}>
                {saving ? "Speichert …" : "Speichern"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
}
