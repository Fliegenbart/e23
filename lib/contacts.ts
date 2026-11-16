import "server-only";
import { z } from "zod";
import { db } from "./workspace/db";
import { stages, type Contact, type Stage } from "./contacts-shared";

/** Shared list of leads and contacts: one row per person in e23_contacts. */

const text = (max: number) => z.string().trim().max(max);
const fields = {
  kind: z.enum(["lead", "kontakt"]),
  name: z
    .string()
    .trim()
    .min(1, "Bitte einen Namen eingeben.")
    .max(120, "Der Name darf höchstens 120 Zeichen haben."),
  company: text(120),
  role: text(120),
  email: text(200).refine(
    (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    "Bitte eine gültige E-Mail-Adresse eingeben.",
  ),
  phone: text(60),
  stage: z.enum(stages.map((s) => s.id) as [Stage, ...Stage[]]),
  source: text(120),
  owner: text(80),
  next_step: text(200),
  next_date: z
    .union([
      z.literal(""),
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .refine((v) => {
          const d = new Date(v);
          return !isNaN(+d) && d.toISOString().slice(0, 10) === v;
        }, "Ungültiges Datum."),
    ])
    .transform((v) => v || null),
  note: text(4000),
  item_id: z.union([z.literal(""), z.uuid()]).transform((v) => v || null),
};
const ref = { id: z.uuid(), version: z.number().int().positive() };
export const contactMutation = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), ...fields }),
  z.object({ action: z.literal("update"), ...ref, ...fields }),
  z.object({ action: z.literal("delete"), ...ref }),
]);

let ready: Promise<unknown> | null = null;
/** Creates the table on first use, so no separate migration step is needed. */
export function ensureContacts() {
  ready ??= db()`CREATE TABLE IF NOT EXISTS e23_contacts (id uuid PRIMARY KEY, kind text NOT NULL DEFAULT 'lead' CHECK(kind IN ('lead','kontakt')), name varchar(120) NOT NULL, company varchar(120) NOT NULL DEFAULT '', role varchar(120) NOT NULL DEFAULT '', email varchar(200) NOT NULL DEFAULT '', phone varchar(60) NOT NULL DEFAULT '', stage text NOT NULL DEFAULT 'neu' CHECK(stage IN ('neu','kontaktiert','gespraech','angebot','gewonnen','ruhend')), source varchar(120) NOT NULL DEFAULT '', owner varchar(80) NOT NULL DEFAULT '', next_step varchar(200) NOT NULL DEFAULT '', next_date date, note text NOT NULL DEFAULT '', item_id uuid REFERENCES e23_work_items(id) ON DELETE SET NULL, version integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`.catch(
    (error) => {
      ready = null;
      throw error;
    },
  );
  return ready;
}

export async function listContacts(): Promise<Contact[]> {
  await ensureContacts();
  return (await db()`SELECT id, kind, name, company, role, email, phone, stage, source, owner, next_step, to_char(next_date,'YYYY-MM-DD') AS next_date, note, item_id, version, updated_at FROM e23_contacts ORDER BY lower(name), created_at`) as Contact[];
}
