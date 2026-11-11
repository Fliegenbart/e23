import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { authenticated } from "@/lib/auth";
import { ensureTimeline, listEntries, timelineMutation } from "@/lib/timeline";
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
    "timeline request failed",
    error instanceof Error ? error.name : "unknown",
  );
  return json(
    {
      error:
        "Der Zeitstrahl ist gerade nicht erreichbar. Bitte versuche es erneut.",
    },
    503,
  );
}

export async function GET() {
  if (!(await authenticated()))
    return json({ error: "Bitte melde dich erneut an." }, 401);
  try {
    return json({ entries: await listEntries() });
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
  const result = timelineMutation.safeParse(input);
  if (!result.success)
    return json({ error: result.error.issues[0].message }, 400);
  const d = result.data;
  try {
    await ensureTimeline();
    const sql = db();
    if (d.action === "create") {
      const id = randomUUID();
      await sql`INSERT INTO e23_timeline(id,title,lane,status,starts,ends,owner,note) VALUES(${id},${d.title},${d.lane},${d.status},${d.starts},${d.ends},${d.owner},${d.note})`;
      return json({ id }, 201);
    }
    if (d.action === "update") {
      const rows =
        await sql`UPDATE e23_timeline SET title=${d.title},lane=${d.lane},status=${d.status},starts=${d.starts},ends=${d.ends},owner=${d.owner},note=${d.note},version=version+1,updated_at=now() WHERE id=${d.id} AND version=${d.version} RETURNING id`;
      return rows.length ? json({ id: d.id }) : conflict();
    }
    const rows =
      await sql`DELETE FROM e23_timeline WHERE id=${d.id} AND version=${d.version} RETURNING id`;
    return rows.length ? json({ id: d.id }) : conflict();
  } catch (error) {
    return failure(error);
  }
}
