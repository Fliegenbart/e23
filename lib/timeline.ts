import "server-only";
import { z } from "zod";
import { db } from "./workspace/db";
import { lanes, statuses, type Lane, type Status, type Entry } from "./timeline-shared";
export type { Entry };

/** Shared 18-month roadmap: one row per entry in e23_timeline. */

const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte ein Datum wählen.")
  .refine((v) => {
    const d = new Date(v);
    return !isNaN(+d) && d.toISOString().slice(0, 10) === v;
  }, "Ungültiges Datum.");
const fields = {
  title: z
    .string()
    .trim()
    .min(1, "Bitte einen Titel eingeben.")
    .max(160, "Der Titel darf höchstens 160 Zeichen haben."),
  lane: z.enum(lanes.map((l) => l.id) as [Lane, ...Lane[]]),
  status: z.enum(statuses.map((s) => s.id) as [Status, ...Status[]]),
  starts: day,
  ends: z.union([z.literal(""), day]).transform((v) => v || null),
  owner: z.string().trim().max(80),
  note: z.string().trim().max(2000),
};
const span = (v: { starts: string; ends: string | null }) =>
  !v.ends || v.ends >= v.starts;
const spanError = {
  message: "Das Ende darf nicht vor dem Beginn liegen.",
  path: ["ends"],
};
export const timelineMutation = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), ...fields }).refine(span, spanError),
  z
    .object({
      action: z.literal("update"),
      id: z.uuid(),
      version: z.number().int().positive(),
      ...fields,
    })
    .refine(span, spanError),
  z.object({
    action: z.literal("delete"),
    id: z.uuid(),
    version: z.number().int().positive(),
  }),
]);

const createTable = (sql: ReturnType<typeof db>) =>
  sql`CREATE TABLE IF NOT EXISTS e23_timeline (id uuid PRIMARY KEY, title varchar(160) NOT NULL, lane text NOT NULL CONSTRAINT e23_timeline_lane_check CHECK(lane IN ('kunden','produkte','formate','begleitung','intern')), status text NOT NULL DEFAULT 'geplant' CHECK(status IN ('idee','geplant','fix','erledigt')), starts date NOT NULL, ends date, owner varchar(80) NOT NULL DEFAULT '', note text NOT NULL DEFAULT '', version integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK(ends IS NULL OR ends >= starts))`;

/** First entries, written once when the table is created – then editable like any other. */
const firstEntries: [string, Lane, Status, string][] = [
  ["Workshop für einen Kunden", "kunden", "geplant", "2026-11-25"],
  ["Workshop für einen weiteren Kunden", "kunden", "idee", "2026-12-09"],
  ["Kleine Weihnachtsfeier", "intern", "idee", "2026-12-18"],
  ["Offenes Format: Leute zu uns einladen", "formate", "idee", "2027-01-28"],
];

/** Added with the "Begleitung" lane; written once, for new and existing tables alike. */
const laterEntries: [string, Lane, Status, string, string | null][] = [
  ["Zwei weitere Büromieter finden", "intern", "geplant", "2026-11-16", "2027-02-26"],
  [
    "Pilotabend: Wer bin ich, wenn die KI meine Arbeit kann?",
    "begleitung",
    "idee",
    "2027-02-18",
    null,
  ],
];
const insert = (
  sql: ReturnType<typeof db>,
  [title, lane, status, starts, ends]: [string, Lane, Status, string, string | null],
) =>
  sql`INSERT INTO e23_timeline(id,title,lane,status,starts,ends,note) VALUES(gen_random_uuid(),${title},${lane},${status},${starts},${ends},'Termin noch offen.')`;

let ready: Promise<unknown> | null = null;
/** Creates or upgrades the table on first use, so no separate migration step is needed. */
export function ensureTimeline() {
  ready ??= (async () => {
    const sql = db();
    const [state] = (await sql`SELECT to_regclass('e23_timeline') IS NOT NULL AS exists, (SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname='e23_timeline_lane_check' AND conrelid=to_regclass('e23_timeline')) AS lanes`) as {
      exists: boolean;
      lanes: string | null;
    }[];
    if (!state.exists) {
      await createTable(sql);
      await sql.transaction(
        [...firstEntries.map((e) => [...e, null] as const), ...laterEntries].map(
          (e) => insert(sql, e as [string, Lane, Status, string, string | null]),
        ),
      );
    } else if (!state.lanes?.includes("begleitung")) {
      // Table from before the "Begleitung" lane: widen the check, add its entries.
      await sql.transaction([
        sql`ALTER TABLE e23_timeline DROP CONSTRAINT IF EXISTS e23_timeline_lane_check`,
        sql`ALTER TABLE e23_timeline ADD CONSTRAINT e23_timeline_lane_check CHECK(lane IN ('kunden','produkte','formate','begleitung','intern'))`,
        ...laterEntries.map((e) => insert(sql, e)),
      ]);
    }
  })().catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}

export async function listEntries(): Promise<Entry[]> {
  await ensureTimeline();
  return (await db()`SELECT id, title, lane, status, to_char(starts,'YYYY-MM-DD') AS starts, to_char(ends,'YYYY-MM-DD') AS ends, owner, note, version, updated_at FROM e23_timeline ORDER BY starts, created_at`) as Entry[];
}
