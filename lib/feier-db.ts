import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/workspace/db";

export type Anmeldung = {
  id: string;
  name: string;
  /** Empty for guests the hosts added by hand. */
  email: string | null;
  guests: number;
  note: string;
  lang: string;
  status: Status;
  attended: boolean;
  created_at: string;
  updated_at: string;
};

/** "angemeldet": signed up on the page. The other two were added by the hosts. */
export const manualStatuses = ["sicher", "vielleicht"] as const;
export type Status = "angemeldet" | (typeof manualStatuses)[number];

/** Hard ceiling, so a flood of fake sign-ups cannot fill the database. */
const LIMIT = 400;

let ready: Promise<unknown> | null = null;
/** The table is created on first use; no separate setup step is needed. */
function schema() {
  ready ??= (async () => {
    const sql = db();
    await sql`CREATE TABLE IF NOT EXISTS e23_feier_anmeldungen (id uuid PRIMARY KEY, name varchar(80) NOT NULL, email varchar(200) UNIQUE, guests integer NOT NULL CHECK(guests BETWEEN 1 AND 5), note varchar(500) NOT NULL DEFAULT '', lang text NOT NULL DEFAULT 'de', status text NOT NULL DEFAULT 'angemeldet' CHECK(status IN ('angemeldet','sicher','vielleicht')), attended boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`;
    // Tables from before guests could be added by hand: add the status and
    // allow an entry without an e-mail address. Only adds; nothing is rewritten.
    const [state] = (await sql`SELECT count(*) FILTER (WHERE column_name='status')::int AS status, count(*) FILTER (WHERE column_name='email' AND is_nullable='YES')::int AS email FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='e23_feier_anmeldungen'`) as {
      status: number;
      email: number;
    }[];
    if (state.status && state.email) return;
    await sql.transaction([
      sql`ALTER TABLE e23_feier_anmeldungen ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'angemeldet' CHECK(status IN ('angemeldet','sicher','vielleicht'))`,
      sql`ALTER TABLE e23_feier_anmeldungen ALTER COLUMN email DROP NOT NULL`,
    ]);
  })().catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}

/** One sign-up per e-mail address: signing up again updates the entry. */
export async function saveAnmeldung(input: {
  name: string;
  email: string;
  guests: number;
  note: string;
  lang: string;
}): Promise<"saved" | "full"> {
  await schema();
  const sql = db();
  const rows = await sql`INSERT INTO e23_feier_anmeldungen (id, name, email, guests, note, lang) SELECT ${randomUUID()}, ${input.name}, ${input.email}, ${input.guests}, ${input.note}, ${input.lang} WHERE (SELECT count(*) FROM e23_feier_anmeldungen) < ${LIMIT} OR EXISTS (SELECT 1 FROM e23_feier_anmeldungen WHERE email=${input.email}) ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, guests=EXCLUDED.guests, note=EXCLUDED.note, lang=EXCLUDED.lang, updated_at=now() RETURNING id`;
  return rows.length ? "saved" : "full";
}

/** A guest the hosts add by hand: no e-mail address, "sicher" or "vielleicht". */
export async function addManual(input: {
  name: string;
  guests: number;
  note: string;
  status: (typeof manualStatuses)[number];
}): Promise<Anmeldung | null> {
  await schema();
  const sql = db();
  const rows = (await sql`INSERT INTO e23_feier_anmeldungen (id, name, guests, note, status) SELECT ${randomUUID()}, ${input.name}, ${input.guests}, ${input.note}, ${input.status} WHERE (SELECT count(*) FROM e23_feier_anmeldungen) < ${LIMIT} RETURNING *`) as Anmeldung[];
  return rows[0] ?? null;
}

/** "Vielleicht" becomes "sicher" or back. Sign-ups from the page keep their status. */
export async function setStatus(id: string, status: (typeof manualStatuses)[number]) {
  await schema();
  const sql = db();
  const rows = await sql`UPDATE e23_feier_anmeldungen SET status=${status}, updated_at=now() WHERE id=${id} AND status<>'angemeldet' RETURNING id`;
  return rows.length > 0;
}

export async function listAnmeldungen(): Promise<Anmeldung[]> {
  await schema();
  const sql = db();
  return (await sql`SELECT * FROM e23_feier_anmeldungen ORDER BY created_at`) as Anmeldung[];
}

/** Tick off who actually came. Returns false if the entry no longer exists. */
export async function setAttended(id: string, attended: boolean) {
  await schema();
  const sql = db();
  const rows = await sql`UPDATE e23_feier_anmeldungen SET attended=${attended} WHERE id=${id} RETURNING id`;
  return rows.length > 0;
}

/** Remove one sign-up for good. Returns false if it was already gone. */
export async function deleteAnmeldung(id: string) {
  await schema();
  const sql = db();
  const rows = await sql`DELETE FROM e23_feier_anmeldungen WHERE id=${id} RETURNING id`;
  return rows.length > 0;
}
