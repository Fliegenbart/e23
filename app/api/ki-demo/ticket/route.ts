import { NextRequest, NextResponse } from "next/server";
import { authenticated, SESSION_COOKIE } from "@/lib/auth";
import { getDemoConfig } from "@/lib/chat-demo/config";
import {
  createDemoSession,
  DEMO_COOKIE,
  readDemoSession,
} from "@/lib/chat-demo/session";
import { signDemoTicket } from "@/lib/chat-demo/ticket";
export const runtime = "nodejs";
const failure = (status: number, message: string) =>
  NextResponse.json(
    { error: { message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
export async function POST(request: NextRequest) {
  const config = getDemoConfig();
  if (!config) return failure(404, "Die Demo ist nicht aktiviert.");
  if (!(await authenticated())) return failure(401, "Bitte in E23 anmelden.");
  if (request.headers.get("origin") !== config.parentOrigin)
    return failure(403, "Unzulaessige Herkunft.");
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    return failure(415, "JSON erforderlich.");
  let text = "";
  const reader = request.body?.getReader();
  if (!reader) return failure(400, "Anfrage fehlt.");
  try {
    const decoder = new TextDecoder();
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) {
        await reader.cancel();
        return failure(413, "Anfrage zu gross.");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    reader.releaseLock();
  }
  let nonce: string;
  try {
    const data = JSON.parse(text);
    if (
      Object.keys(data).length !== 1 ||
      typeof data.nonce !== "string" ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
        data.nonce,
      )
    )
      return failure(400, "Ungueltige Verbindungskennung.");
    nonce = data.nonce;
  } catch {
    return failure(400, "Ungueltige Anfrage.");
  }
  try {
    const e23Session = request.cookies.get(SESSION_COOKIE)!.value;
    const session =
      readDemoSession(request.cookies.get(DEMO_COOKIE)?.value, e23Session) ??
      createDemoSession(e23Session);
    const ticket = await signDemoTicket(session.sid, "bootstrap", nonce);
    const response = NextResponse.json(
      { ticket, nonce },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(DEMO_COOKIE, session.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.max(0, session.expiry - Math.floor(Date.now() / 1000)),
    });
    return response;
  } catch {
    return failure(
      503,
      "Der Demo-Zugang ist noch nicht vollstaendig konfiguriert.",
    );
  }
}
