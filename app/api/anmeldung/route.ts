import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticated } from "@/lib/auth";
import {
  addManual,
  deleteAnmeldung,
  manualStatuses,
  saveAnmeldung,
  setAttended,
  setStatus,
} from "@/lib/feier-db";

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

const change = z.union([
  z.object({ id: z.uuid(), attended: z.boolean() }),
  z.object({ id: z.uuid(), status: z.enum(manualStatuses) }),
]);

/** Internal: mark who actually came, or change "vielleicht" to "sicher". Needs the site session. */
export async function PATCH(req: NextRequest) {
  if (!(await authenticated())) return json({ error: "unauthorized" }, 401);
  const { body, refusal } = await read(req);
  if (refusal) return refusal;
  const parsed = change.safeParse(body);
  if (!parsed.success) return json({ error: "invalid" }, 400);
  try {
    const done =
      "attended" in parsed.data
        ? await setAttended(parsed.data.id, parsed.data.attended)
        : await setStatus(parsed.data.id, parsed.data.status);
    return done ? json({ ok: true }) : json({ error: "missing" }, 404);
  } catch (error) {
    return failure(error);
  }
}

const manual = z.object({
  name: z.string().trim().min(1).max(80),
  guests: z.number().int().min(1).max(5),
  note: z.string().trim().max(500),
  status: z.enum(manualStatuses),
});

/** Internal: add a guest by hand who has not signed up. Needs the site session. */
export async function PUT(req: NextRequest) {
  if (!(await authenticated())) return json({ error: "unauthorized" }, 401);
  const { body, refusal } = await read(req);
  if (refusal) return refusal;
  const parsed = manual.safeParse(body);
  if (!parsed.success) return json({ error: "invalid" }, 400);
  try {
    const row = await addManual(parsed.data);
    return row
      ? json({ ok: true, id: row.id, created_at: row.created_at })
      : json({ error: "full" }, 409);
  } catch (error) {
    return failure(error);
  }
}

/** Internal: delete one sign-up. Needs the site session. */
export async function DELETE(req: NextRequest) {
  if (!(await authenticated())) return json({ error: "unauthorized" }, 401);
  const { body, refusal } = await read(req);
  if (refusal) return refusal;
  const parsed = z.object({ id: z.uuid() }).safeParse(body);
  if (!parsed.success) return json({ error: "invalid" }, 400);
  try {
    // Already gone counts as done: the entry is not there either way.
    await deleteAnmeldung(parsed.data.id);
    return json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
