"use client";
import { useState } from "react";

type Status = "angemeldet" | "sicher" | "vielleicht";
export type Guest = {
  id: string;
  name: string;
  /** Empty for guests added by hand. */
  email: string | null;
  guests: number;
  note: string;
  status: Status;
  attended: boolean;
  when: string;
};

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;
const login = "/?next=weihnachtsfeier/anmeldungen";
const when = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Berlin",
});
const filters = [
  { id: "alle", label: "Alle" },
  { id: "angemeldet", label: "Angemeldet" },
  { id: "hand", label: "Von Hand" },
] as const;
const empty = { name: "", guests: 1, status: "sicher" as Status, note: "" };

async function send(method: string, body: object) {
  const response = await fetch("/api/anmeldung", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (response.status === 401) window.location.href = login;
  return response;
}

/** Who signed up, who the hosts added by hand, and a tick for who actually came. */
export function GuestList({ initial }: { initial: Guest[] }) {
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("alle");
  const [draft, setDraft] = useState(empty);
  const [adding, setAdding] = useState(false);

  const patch = (id: string, change: Partial<Guest>) =>
    setRows((list) =>
      list.map((row) => (row.id === id ? { ...row, ...change } : row)),
    );

  async function toggle(id: string, attended: boolean) {
    patch(id, { attended });
    setError("");
    try {
      const response = await send("PATCH", { id, attended });
      if (response.ok || response.status === 401) return;
    } catch {}
    patch(id, { attended: !attended });
    setError("Das Häkchen wurde nicht gespeichert. Bitte versuche es erneut.");
  }

  async function restatus(row: Guest, status: Status) {
    patch(row.id, { status });
    setError("");
    try {
      const response = await send("PATCH", { id: row.id, status });
      if (response.ok || response.status === 401) return;
    } catch {}
    patch(row.id, { status: row.status });
    setError("Der Status wurde nicht gespeichert. Bitte versuche es erneut.");
  }

  async function remove(row: Guest) {
    if (!window.confirm(`Eintrag von ${row.name} endgültig löschen?`)) return;
    setError("");
    try {
      const response = await send("DELETE", { id: row.id });
      if (response.ok) {
        setRows((list) => list.filter((entry) => entry.id !== row.id));
        return;
      }
      if (response.status === 401) return;
    } catch {}
    setError("Der Eintrag wurde nicht gelöscht. Bitte versuche es erneut.");
  }

  async function add(event: React.FormEvent) {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name) return;
    setAdding(true);
    setError("");
    try {
      const response = await send("PUT", { ...draft, name, note: draft.note.trim() });
      if (response.ok) {
        const saved = (await response.json()) as { id: string; created_at: string };
        setRows((list) => [
          ...list,
          {
            ...draft,
            name,
            note: draft.note.trim(),
            id: saved.id,
            email: null,
            attended: false,
            when: when.format(new Date(saved.created_at)),
          },
        ]);
        setDraft(empty);
        setAdding(false);
        return;
      }
      if (response.status === 401) return;
    } catch {}
    setAdding(false);
    setError("Der Gast wurde nicht gespeichert. Bitte versuche es erneut.");
  }

  const count = (status: Status) =>
    rows.reduce((sum, row) => sum + (row.status === status ? row.guests : 0), 0);
  const signed = count("angemeldet");
  const sure = count("sicher");
  const maybe = count("vielleicht");
  const came = rows.filter((row) => row.attended);
  const shown = rows.filter((row) =>
    filter === "alle"
      ? true
      : filter === "angemeldet"
        ? row.status === "angemeldet"
        : row.status !== "angemeldet",
  );
  return (
    <>
      <dl className="feier-stats">
        <div>
          <dd>{signed}</dd>
          <dt>angemeldet</dt>
        </div>
        <div>
          <dd>{sure}</dd>
          <dt>sicher zugesagt</dt>
        </div>
        <div>
          <dd>{maybe}</dd>
          <dt>vielleicht</dt>
        </div>
        <div>
          <dd>{signed + sure + maybe}</dd>
          <dt>insgesamt möglich</dt>
        </div>
        <div>
          <dd>{came.length}</dd>
          <dt>waren da</dt>
        </div>
      </dl>

      <form className="feier-add" onSubmit={add}>
        <strong>Gast von Hand eintragen</strong>
        <label>
          <span>Name</span>
          <input
            required
            maxLength={80}
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
        </label>
        <label>
          <span>Personen</span>
          <select
            value={draft.guests}
            onChange={(event) =>
              setDraft({ ...draft, guests: Number(event.target.value) })
            }
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Kommt</span>
          <select
            value={draft.status}
            onChange={(event) =>
              setDraft({ ...draft, status: event.target.value as Status })
            }
          >
            <option value="sicher">sicher</option>
            <option value="vielleicht">vielleicht</option>
          </select>
        </label>
        <label className="feier-add-note">
          <span>Notiz (optional)</span>
          <input
            maxLength={500}
            placeholder="z. B. über Daniel"
            value={draft.note}
            onChange={(event) => setDraft({ ...draft, note: event.target.value })}
          />
        </label>
        <button type="submit" disabled={adding}>
          {adding ? "Speichert …" : "Hinzufügen"}
        </button>
      </form>

      {error && (
        <p className="feier-list-error" role="alert">
          {error}
        </p>
      )}

      <div className="feier-filter" role="group" aria-label="Liste filtern">
        {filters.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-pressed={filter === entry.id}
            onClick={() => setFilter(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p>{rows.length === 0 ? "Noch keine Einträge." : "Keine Einträge in dieser Ansicht."}</p>
      ) : (
        <div className="feier-table">
          <table>
            <thead>
              <tr>
                <th>War da</th>
                <th>Name</th>
                <th>Status</th>
                <th>E-Mail</th>
                <th>Personen</th>
                <th>Nachricht</th>
                <th>Eingetragen</th>
                <th aria-label="Löschen" />
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.id} className={row.attended ? "is-there" : undefined}>
                  <td>
                    <input
                      type="checkbox"
                      checked={row.attended}
                      onChange={(event) => toggle(row.id, event.target.checked)}
                      aria-label={`${row.name} war da`}
                    />
                  </td>
                  <td>{row.name}</td>
                  <td>
                    {row.status === "angemeldet" ? (
                      "angemeldet"
                    ) : (
                      <select
                        className={`feier-status is-${row.status}`}
                        value={row.status}
                        onChange={(event) =>
                          restatus(row, event.target.value as Status)
                        }
                        aria-label={`Status von ${row.name}`}
                      >
                        <option value="sicher">sicher</option>
                        <option value="vielleicht">vielleicht</option>
                      </select>
                    )}
                  </td>
                  <td>
                    {row.email ? (
                      <a href={`mailto:${row.email}`}>{row.email}</a>
                    ) : (
                      "–"
                    )}
                  </td>
                  <td>{plural(row.guests, "Person", "Personen")}</td>
                  <td>{row.note}</td>
                  <td>{row.when}</td>
                  <td>
                    <button
                      type="button"
                      className="feier-delete"
                      onClick={() => remove(row)}
                      aria-label={`Eintrag von ${row.name} löschen`}
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
