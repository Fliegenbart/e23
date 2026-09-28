import { z } from "zod";
const title = z
  .string()
  .trim()
  .min(1, "Bitte einen Titel eingeben.")
  .max(160, "Der Titel darf höchstens 160 Zeichen haben.");
const person = z.string().trim().max(80);
const date = z
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
  .transform((v) => v || null);
const fields = {
  title,
  description: z.string().trim().max(8000),
  kind: z.enum(["idea", "project"]),
  owner: person,
  due: date,
};
export const mutation = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), ...fields }),
  z.object({
    action: z.literal("update"),
    id: z.uuid(),
    version: z.number().int().positive(),
    status: z.enum(["active", "completed", "archived"]),
    ...fields,
  }),
  z.object({
    action: z.literal("task-create"),
    itemId: z.uuid(),
    title,
    assignee: person,
    due: date,
  }),
  z.object({
    action: z.literal("task-update"),
    id: z.uuid(),
    version: z.number().int().positive(),
    title,
    assignee: person,
    due: date,
    status: z.enum(["todo", "doing", "done"]),
  }),
  z.object({
    action: z.literal("comment"),
    itemId: z.uuid(),
    author: person.min(1, "Bitte deinen Namen eingeben."),
    body: z.string().trim().min(1).max(4000),
  }),
]);
