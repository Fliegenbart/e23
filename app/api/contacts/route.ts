import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { authenticated } from "@/lib/auth";
import { contactMutation, ensureContacts, listContacts } from "@/lib/contacts";
import { db } from "@/lib/workspace/db";

export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
const conflict = () =>
  json(
    {
      error:
        "Jemand hat diesen Eintrag inzwischen geändert. Bitte neu laden und erneut prüfen.",
    },
    409,
  );
function failure(error: unknown) {
  console.error(
    "contacts request failed",
    error instanceof Error ? error.name : "unknown",
  );
  return json(
    {
      error:
        "Die Kontakte sind gerade nicht erreichbar. Bitte versuche es erneut.",
    },
    503,
  );
}

export async function GET() {
  if (!(await authenticated()))
    return json({ error: "Bitte melde dich erneut an." }, 401);
  try {
    return json({ contacts: await listContacts() });
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
  const raw = await req.text();
  if (raw.length > 10000) return json({ error: "Der Text ist zu lang." }, 413);
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return json({ error: "Ungültige Eingabe." }, 400);
  }
  const result = contactMutation.safeParse(input);
  if (!result.success)
    return json({ error: result.error.issues[0].message }, 400);
  const d = result.data;
  try {
    await ensureContacts();
    const sql = db();
    if (d.action === "create") {
      const id = randomUUID();
      // A project that no longer exists is simply not linked.
      await sql`INSERT INTO e23_contacts(id,kind,name,company,role,email,phone,stage,source,owner,next_step,next_date,note,item_id) VALUES(${id},${d.kind},${d.name},${d.company},${d.role},${d.email},${d.phone},${d.stage},${d.source},${d.owner},${d.next_step},${d.next_date}::date,${d.note},(SELECT id FROM e23_work_items WHERE id=${d.item_id}::uuid))`;
      return json({ id }, 201);
    }
    if (d.action === "update") {
      const rows =
        await sql`UPDATE e23_contacts SET kind=${d.kind},name=${d.name},company=${d.company},role=${d.role},email=${d.email},phone=${d.phone},stage=${d.stage},source=${d.source},owner=${d.owner},next_step=${d.next_step},next_date=${d.next_date}::date,note=${d.note},item_id=(SELECT id FROM e23_work_items WHERE id=${d.item_id}::uuid),version=version+1,updated_at=now() WHERE id=${d.id} AND version=${d.version} RETURNING id`;
      return rows.length ? json({ id: d.id }) : conflict();
    }
    const rows =
      await sql`DELETE FROM e23_contacts WHERE id=${d.id} AND version=${d.version} RETURNING id`;
    return rows.length ? json({ id: d.id }) : conflict();
  } catch (error) {
    return failure(error);
  }
}
