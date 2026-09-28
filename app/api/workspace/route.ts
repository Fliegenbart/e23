import { NextRequest, NextResponse } from "next/server";
import { authenticated } from "@/lib/auth";
import { db, getDetail, listItems } from "@/lib/workspace/db";
import { mutation } from "@/lib/workspace/validation";
import { randomUUID } from "node:crypto";
import { z } from "zod";
export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
function failure(error: unknown) {
  console.error(
    "workspace request failed",
    error instanceof Error ? error.name : "unknown",
  );
  return json(
    {
      error:
        "Der gemeinsame Bereich ist gerade nicht erreichbar. Bitte versuche es erneut.",
    },
    503,
  );
}
export async function GET(req: NextRequest) {
  if (!(await authenticated()))
    return json({ error: "Bitte melde dich erneut an." }, 401);
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (id) {
      if (!z.uuid().safeParse(id).success)
        return json({ error: "Ungültige Projektadresse." }, 400);
      const detail = await getDetail(id);
      return detail
        ? json(detail)
        : json({ error: "Dieses Vorhaben wurde nicht gefunden." }, 404);
    }
    return json({ items: await listItems() });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(req: NextRequest) {
  if (!(await authenticated()))
    return json({ error: "Bitte melde dich erneut an." }, 401);
  try {
    const origin = req.headers.get("origin");
    if (!origin || new URL(origin).host !== req.headers.get("host"))
      return json({ error: "Anfrage nicht erlaubt." }, 403);
  } catch {
    return json({ error: "Anfrage nicht erlaubt." }, 403);
  }
  if (!req.headers.get("content-type")?.includes("application/json"))
    return json({ error: "Ungültiges Format." }, 415);
  try {
    const raw = await req.text();
    if (raw.length > 20000)
      return json({ error: "Der Text ist zu lang." }, 413);
    let input: unknown;
    try {
      input = JSON.parse(raw);
    } catch {
      return json({ error: "Ungültige Eingabe." }, 400);
    }
    const result = mutation.safeParse(input);
    if (!result.success)
      return json({ error: result.error.issues[0].message }, 400);
    const d = result.data;
    const sql = db();
    if (d.action === "create") {
      const id = randomUUID();
      await sql`INSERT INTO e23_work_items(id,title,description,kind,owner,due) VALUES(${id},${d.title},${d.description},${d.kind},${d.owner},${d.due})`;
      return json({ id }, 201);
    }
    if (d.action === "update") {
      const rows =
        await sql`UPDATE e23_work_items SET title=${d.title},description=${d.description},kind=${d.kind},status=${d.status},owner=${d.owner},due=${d.due},version=version+1,updated_at=now() WHERE id=${d.id} AND version=${d.version} RETURNING id`;
      return rows.length
        ? json({ id: d.id })
        : json(
            {
              error:
                "Jemand hat dieses Vorhaben inzwischen geändert. Bitte neu laden und deine Änderung erneut prüfen.",
            },
            409,
          );
    }
    if (d.action === "task-create") {
      const id = randomUUID();
      const rows =
        await sql`INSERT INTO e23_tasks(id,item_id,title,assignee,due) SELECT ${id}::uuid,id,${d.title},${d.assignee},${d.due}::date FROM e23_work_items WHERE id=${d.itemId} AND status='active' RETURNING id`;
      return rows.length
        ? json({ id }, 201)
        : json(
            {
              error: "Aufgaben können nur in aktiven Vorhaben angelegt werden.",
            },
            409,
          );
    }
    if (d.action === "task-update") {
      const rows =
        await sql`UPDATE e23_tasks SET title=${d.title},status=${d.status},assignee=${d.assignee},due=${d.due},version=version+1 WHERE id=${d.id} AND version=${d.version} RETURNING id`;
      return rows.length
        ? json({ id: d.id })
        : json(
            {
              error:
                "Diese Aufgabe wurde inzwischen geändert. Bitte lade den aktuellen Stand.",
            },
            409,
          );
    }
    const id = randomUUID();
    const rows =
      await sql`INSERT INTO e23_comments(id,item_id,author,body) SELECT ${id}::uuid,id,${d.author},${d.body} FROM e23_work_items WHERE id=${d.itemId} RETURNING id`;
    return rows.length
      ? json({ id }, 201)
      : json({ error: "Vorhaben nicht gefunden." }, 404);
  } catch (error) {
    return failure(error);
  }
}
