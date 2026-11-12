import { NextRequest, NextResponse } from "next/server";
import { authenticated } from "@/lib/auth";
import {
  IdeasUnavailable,
  suggestIdeas,
  suggestionRequest,
} from "@/lib/workspace/ideas";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
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
  if (raw.length > 4000) return json({ error: "Der Text ist zu lang." }, 413);
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return json({ error: "Ungültige Eingabe." }, 400);
  }
  const result = suggestionRequest.safeParse(input);
  if (!result.success)
    return json({ error: result.error.issues[0].message }, 400);
  try {
    return json({ ideas: await suggestIdeas(result.data) });
  } catch (error) {
    if (error instanceof IdeasUnavailable)
      return json(
        {
          error:
            "Ideenvorschläge sind noch nicht eingerichtet. Es fehlt der OpenAI-Schlüssel.",
        },
        503,
      );
    console.error(
      "idea suggestion failed",
      error instanceof Error ? error.message.slice(0, 80) : "unknown",
    );
    return json(
      {
        error:
          "Die Vorschläge konnten gerade nicht erzeugt werden. Bitte versuche es erneut.",
      },
      502,
    );
  }
}
