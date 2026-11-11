import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { authenticated } from "@/lib/auth";
import { ensureGoals, goalMutation, listGoals } from "@/lib/goals";
import { db } from "@/lib/workspace/db";

export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
function failure(error: unknown) {
  console.error(
    "goals request failed",
    error instanceof Error ? error.name : "unknown",
  );
  return json(
    { error: "Das Zielbild ist gerade nicht erreichbar. Bitte versuche es erneut." },
    503,
  );
}

export async function GET() {
  if (!(await authenticated()))
    return json({ error: "Bitte melde dich erneut an." }, 401);
  try {
    return json({ goals: await listGoals() });
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
  if (raw.length > 5000) return json({ error: "Der Text ist zu lang." }, 413);
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return json({ error: "Ungültige Eingabe." }, 400);
  }
  const result = goalMutation.safeParse(input);
  if (!result.success)
    return json({ error: result.error.issues[0].message }, 400);
  const d = result.data;
  try {
    await ensureGoals();
    const sql = db();
    if (d.action === "create") {
      const id = randomUUID();
      await sql`INSERT INTO e23_goals(id,kind,due,body,owner) VALUES(${id},'step',${d.due},${d.body},${d.owner})`;
      return json({ id }, 201);
    }
    const rows =
      d.action === "update"
        ? await sql`UPDATE e23_goals SET due=${d.due},body=${d.body},owner=${d.owner},version=version+1 WHERE id=${d.id} AND version=${d.version} RETURNING id`
        : d.action === "toggle"
          ? await sql`UPDATE e23_goals SET done=${d.done},version=version+1 WHERE id=${d.id} AND version=${d.version} AND kind='step' RETURNING id`
          : await sql`DELETE FROM e23_goals WHERE id=${d.id} AND version=${d.version} AND kind='step' RETURNING id`;
    return rows.length
      ? json({ id: d.id })
      : json(
          {
            error:
              "Jemand hat das inzwischen geändert. Bitte neu laden und erneut prüfen.",
          },
          409,
        );
  } catch (error) {
    return failure(error);
  }
}
