import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticated } from "@/lib/auth";
import { saveAnmeldung, setAttended } from "@/lib/feier-db";

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

/** Same-origin JSON only; returns the parsed body or the refusal to send. */
async function read(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    if (!origin || new URL(origin).host !== req.headers.get("host"))
      return { refusal: json({ error: "forbidden" }, 403) };
  } catch {
    return { refusal: json({ error: "forbidden" }, 403) };
  }
  if (!req.headers.get("content-type")?.includes("application/json"))
    return { refusal: json({ error: "invalid" }, 415) };
  const raw = await req.text();
  if (raw.length > 4000) return { refusal: json({ error: "invalid" }, 413) };
  try {
    return { body: JSON.parse(raw) as unknown };
  } catch {
    return { refusal: json({ error: "invalid" }, 400) };
  }
}

function failure(error: unknown) {
  console.error(
    "feier request failed",
    error instanceof Error ? error.name : "unknown",
  );
  return json({ error: "unavailable" }, 503);
}

/** Public sign-up for the Weihnachtsfeier; replies with a code the form translates. */
export async function POST(req: NextRequest) {
  const { body, refusal } = await read(req);
  if (refusal) return refusal;
  const parsed = input.safeParse(body);
  if (!parsed.success) return json({ error: "invalid" }, 400);
  const { website, ...data } = parsed.data;
  // Bots get a friendly answer and nothing is stored.
  if (website) return json({ ok: true });
  try {
    const result = await saveAnmeldung({ ...data, email: data.email.toLowerCase() });
    return result === "saved" ? json({ ok: true }) : json({ error: "full" }, 409);
  } catch (error) {
    return failure(error);
  }
}

const attendance = z.object({ id: z.uuid(), attended: z.boolean() });

/** Internal: mark who actually came. Needs the site session. */
export async function PATCH(req: NextRequest) {
  if (!(await authenticated())) return json({ error: "unauthorized" }, 401);
  const { body, refusal } = await read(req);
  if (refusal) return refusal;
  const parsed = attendance.safeParse(body);
  if (!parsed.success) return json({ error: "invalid" }, 400);
  try {
    return (await setAttended(parsed.data.id, parsed.data.attended))
      ? json({ ok: true })
      : json({ error: "missing" }, 404);
  } catch (error) {
    return failure(error);
  }
}
