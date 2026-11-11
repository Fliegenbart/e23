import "server-only";
import { z } from "zod";
import { db } from "./workspace/db";
import type { Goal } from "./goals-shared";

/**
 * Where E23 wants to be in 18 months (one "vision" row) and what has to be
 * true by when to get there ("step" rows, grouped by due date into stages).
 */

const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte ein Datum wählen.")
  .refine((v) => {
    const d = new Date(v);
    return !isNaN(+d) && d.toISOString().slice(0, 10) === v;
  }, "Ungültiges Datum.");
const fields = {
  due: day,
  body: z
    .string()
    .trim()
    .min(1, "Bitte einen Text eingeben.")
    .max(600, "Der Text darf höchstens 600 Zeichen haben."),
  owner: z.string().trim().max(80),
};
const ref = { id: z.uuid(), version: z.number().int().positive() };
export const goalMutation = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), ...fields }),
  z.object({ action: z.literal("update"), ...ref, ...fields }),
  z.object({ action: z.literal("toggle"), ...ref, done: z.boolean() }),
  z.object({ action: z.literal("delete"), ...ref }),
]);

/** A first draft to argue about – written once, then edited like everything else. */
const draft: [Goal["kind"], string, string, string][] = [
  [
    "vision",
    "2028-05-31",
    "E23 ist ein voll belegtes Haus mit fünf Mietern. Wir leben von gemeinsamen Kundenprojekten, eigenen Produkten und regelmäßigen Formaten zu Identität und Arbeit.",
    "",
  ],
  ["step", "2027-02-28", "Zwei neue Mieter sind eingezogen.", ""],
  ["step", "2027-02-28", "Der erste Pilotabend „Identität und KI“ hat stattgefunden.", ""],
  ["step", "2027-02-28", "Jeder von uns hat ein Angebot benannt, das er auf die Straße bringen will.", ""],
  ["step", "2027-05-31", "Ein gemeinsames Kundenprojekt, in dem mindestens zwei von uns zusammenarbeiten.", ""],
  ["step", "2027-05-31", "Das erste Produkt ist bei einem zahlenden Pilotkunden.", "Daniel"],
  ["step", "2027-11-30", "Der Workshop zu Identität und KI läuft regelmäßig.", "Monika"],
  ["step", "2027-11-30", "Zwei Produkte bringen Umsatz.", ""],
  ["step", "2027-11-30", "Das offene Format hat einen festen Rhythmus.", ""],
];

let ready: Promise<unknown> | null = null;
export function ensureGoals() {
  ready ??= (async () => {
    const sql = db();
    await sql`CREATE TABLE IF NOT EXISTS e23_goals (id uuid PRIMARY KEY, kind text NOT NULL CHECK(kind IN ('vision','step')), due date NOT NULL, body varchar(600) NOT NULL, owner varchar(80) NOT NULL DEFAULT '', done boolean NOT NULL DEFAULT false, version integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now())`;
    const [{ empty }] =
      (await sql`SELECT NOT EXISTS (SELECT 1 FROM e23_goals) AS empty`) as {
        empty: boolean;
      }[];
    if (!empty) return;
    await sql.transaction(
      draft.map(
        ([kind, due, body, owner]) =>
          sql`INSERT INTO e23_goals(id,kind,due,body,owner) VALUES(gen_random_uuid(),${kind},${due},${body},${owner})`,
      ),
    );
  })().catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}

export async function listGoals(): Promise<Goal[]> {
  await ensureGoals();
  return (await db()`SELECT id, kind, to_char(due,'YYYY-MM-DD') AS due, body, owner, done, version, to_char(created_at,'YYYY-MM-DD') AS created FROM e23_goals ORDER BY due, created_at, id`) as Goal[];
}
