"use client";
import { useState } from "react";

export type Guest = {
  id: string;
  name: string;
  email: string;
  guests: number;
  note: string;
  attended: boolean;
  when: string;
};

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/** Who signed up, and a tick for who actually came. */
export function GuestList({ initial }: { initial: Guest[] }) {
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState("");

  async function toggle(id: string, attended: boolean) {
    const mark = (value: boolean) =>
      setRows((list) =>
        list.map((row) => (row.id === id ? { ...row, attended: value } : row)),
      );
    mark(attended);
    setError("");
    try {
      const response = await fetch("/api/anmeldung", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, attended }),
      });
      if (response.ok) return;
      if (response.status === 401) {
        window.location.href = "/?next=weihnachtsfeier/anmeldungen";
        return;
      }
    } catch {}
    mark(!attended);
    setError("Das Häkchen wurde nicht gespeichert. Bitte versuche es erneut.");
  }

  const people = rows.reduce((sum, row) => sum + row.guests, 0);
  const came = rows.filter((row) => row.attended);
  return (
    <>
      <dl className="feier-stats">
        <div>
          <dd>{rows.length}</dd>
          <dt>{rows.length === 1 ? "Anmeldung" : "Anmeldungen"}</dt>
        </div>
        <div>
          <dd>{people}</dd>
          <dt>{people === 1 ? "Person angemeldet" : "Personen angemeldet"}</dt>
        </div>
        <div>
          <dd>{came.length}</dd>
          <dt>waren da</dt>
        </div>
      </dl>
      {error && (
        <p className="feier-list-error" role="alert">
          {error}
        </p>
      )}
      <div className="feier-table">
        <table>
          <thead>
            <tr>
              <th>War da</th>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Personen</th>
              <th>Nachricht</th>
              <th>Angemeldet</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
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
                  <a href={`mailto:${row.email}`}>{row.email}</a>
                </td>
                <td>{plural(row.guests, "Person", "Personen")}</td>
                <td>{row.note}</td>
                <td>{row.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
