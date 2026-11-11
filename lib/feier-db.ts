import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/workspace/db";

export type Anmeldung = {
  id: string;
  name: string;
  email: string;
  guests: number;
  note: string;
  lang: string;
  attended: boolean;
  created_at: string;
  updated_at: string;
};

/** Hard ceiling, so a flood of fake sign-ups cannot fill the database. */
const LIMIT = 400;

let ready: Promise<unknown> | null = null;
/** The table is created on first use; no separate setup step is needed. */
function schema() {
  const sql = db();
  ready ??= sql`CREATE TABLE IF NOT EXISTS e23_feier_anmeldungen (id uuid PRIMARY KEY, name varchar(80) NOT NULL, email varchar(200) NOT NULL UNIQUE, guests integer NOT NULL CHECK(guests BETWEEN 1 AND 5), note varchar(500) NOT NULL DEFAULT '', lang text NOT NULL DEFAULT 'de', attended boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`.catch(
    (error) => {
      ready = null;
      throw error;
    },
  );
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
