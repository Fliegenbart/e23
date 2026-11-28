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

/**
 * "angemeldet": signed up on the page. "sicher": the hosts added them by hand.
 * Both count as coming. "vielleicht" and "abgesagt" can be set on any entry.
 */
export type Status = "angemeldet" | "sicher" | "vielleicht" | "abgesagt";
/** What the hosts choose in the list; "zugesagt" is stored as angemeldet or sicher. */
export const answers = ["zugesagt", "unsicher", "abgesagt"] as const;
export type Answer = (typeof answers)[number];
/** What can be chosen when adding a guest by hand. */
export const manualAnswers = ["zugesagt", "unsicher"] as const;

/** Hard ceiling, so a flood of fake sign-ups cannot fill the database. */
const LIMIT = 400;

let ready: Promise<unknown> | null = null;
/** The table is created on first use; no separate setup step is needed. */
function schema() {
  ready ??= (async () => {
    const sql = db();
    await sql`CREATE TABLE IF NOT EXISTS e23_feier_anmeldungen (id uuid PRIMARY KEY, name varchar(80) NOT NULL, email varchar(200) UNIQUE, guests integer NOT NULL CHECK(guests BETWEEN 1 AND 5), note varchar(500) NOT NULL DEFAULT '', lang text NOT NULL DEFAULT 'de', status text NOT NULL DEFAULT 'angemeldet' CONSTRAINT e23_feier_anmeldungen_status_check CHECK(status IN ('angemeldet','sicher','vielleicht','abgesagt')), attended boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`;
    // Older tables: add the status, allow an entry without an e-mail address
    // and allow "abgesagt". Only widens; no entry is rewritten.
    const [state] = (await sql`SELECT (SELECT count(*)::int FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='e23_feier_anmeldungen' AND column_name='email' AND is_nullable='YES') AS email, (SELECT count(*)::int FROM pg_constraint WHERE conrelid='e23_feier_anmeldungen'::regclass AND conname='e23_feier_anmeldungen_status_check' AND pg_get_constraintdef(oid) LIKE '%abgesagt%') AS status`) as {
      email: number;
      status: number;
    }[];
    if (state.email && state.status) return;
    await sql.transaction([
      sql`ALTER TABLE e23_feier_anmeldungen ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'angemeldet'`,
      sql`ALTER TABLE e23_feier_anmeldungen ALTER COLUMN email DROP NOT NULL`,
      sql`ALTER TABLE e23_feier_anmeldungen DROP CONSTRAINT IF EXISTS e23_feier_anmeldungen_status_check`,
      sql`ALTER TABLE e23_feier_anmeldungen ADD CONSTRAINT e23_feier_anmeldungen_status_check CHECK(status IN ('angemeldet','sicher','vielleicht','abgesagt'))`,
    ]);
  })().catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}

/**
 * One sign-up per e-mail address: signing up again updates the entry, and
 * counts as coming again if the hosts had marked it "unsicher" or "abgesagt".
 */
export async function saveAnmeldung(input: {
  name: string;
  email: string;
  guests: number;
  note: string;
  lang: string;
}): Promise<"saved" | "full"> {
  await schema();
  const sql = db();
  const rows = await sql`INSERT INTO e23_feier_anmeldungen (id, name, email, guests, note, lang) SELECT ${randomUUID()}, ${input.name}, ${input.email}, ${input.guests}, ${input.note}, ${input.lang} WHERE (SELECT count(*) FROM e23_feier_anmeldungen) < ${LIMIT} OR EXISTS (SELECT 1 FROM e23_feier_anmeldungen WHERE email=${input.email}) ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name, guests=EXCLUDED.guests, note=EXCLUDED.note, lang=EXCLUDED.lang, status='angemeldet', updated_at=now() RETURNING id`;
  return rows.length ? "saved" : "full";
}

/** A guest the hosts add by hand: no e-mail address, "zugesagt" or "unsicher". */
export async function addManual(input: {
  name: string;
  guests: number;
  note: string;
  answer: (typeof manualAnswers)[number];
}): Promise<Anmeldung | null> {
  await schema();
  const sql = db();
  const status: Status = input.answer === "zugesagt" ? "sicher" : "vielleicht";
  const rows = (await sql`INSERT INTO e23_feier_anmeldungen (id, name, guests, note, status) SELECT ${randomUUID()}, ${input.name}, ${input.guests}, ${input.note}, ${status} WHERE (SELECT count(*) FROM e23_feier_anmeldungen) < ${LIMIT} RETURNING *`) as Anmeldung[];
  return rows[0] ?? null;
}

/**
 * Move any entry to zugesagt, unsicher or abgesagt. "Zugesagt" keeps where the
 * entry came from: sign-ups from the page stay "angemeldet", the rest "sicher".
 */
export async function setAnswer(id: string, answer: Answer): Promise<Status | null> {
  await schema();
  const sql = db();
  const rows = (await sql`UPDATE e23_feier_anmeldungen SET status=CASE WHEN ${answer}='unsicher' THEN 'vielleicht' WHEN ${answer}='abgesagt' THEN 'abgesagt' WHEN email IS NULL THEN 'sicher' ELSE 'angemeldet' END, updated_at=now() WHERE id=${id} RETURNING status`) as { status: Status }[];
  return rows[0]?.status ?? null;
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
