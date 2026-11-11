import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveAnmeldung } from "@/lib/feier-db";

export const dynamic = "force-dynamic";

const input = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email().max(200),
  guests: z.number().int().min(1).max(5),
  note: z.string().trim().max(500),
  lang: z.enum(["de", "en"]),
  /** Honeypot: hidden from people, so only bots fill it in. */
  website: z.string().max(200),
});

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Public sign-up for the Weihnachtsfeier; replies with a code the form translates. */
export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    if (!origin || new URL(origin).host !== req.headers.get("host"))
      return json({ error: "forbidden" }, 403);
  } catch {
    return json({ error: "forbidden" }, 403);
  }
  if (!req.headers.get("content-type")?.includes("application/json"))
    return json({ error: "invalid" }, 415);
  const raw = await req.text();
  if (raw.length > 4000) return json({ error: "invalid" }, 413);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "invalid" }, 400);
  }
  const parsed = input.safeParse(body);
  if (!parsed.success) return json({ error: "invalid" }, 400);
  const { website, ...data } = parsed.data;
  // Bots get a friendly answer and nothing is stored.
  if (website) return json({ ok: true });
  try {
    const result = await saveAnmeldung({ ...data, email: data.email.toLowerCase() });
    return result === "saved" ? json({ ok: true }) : json({ error: "full" }, 409);
  } catch (error) {
    console.error(
      "feier sign-up failed",
      error instanceof Error ? error.name : "unknown",
    );
    return json({ error: "unavailable" }, 503);
  }
}
