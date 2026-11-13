import { NextRequest, NextResponse } from "next/server";
import { authenticated } from "@/lib/auth";
import { backendFetch } from "@/lib/chat-demo/backend";
import { getDemoConfig } from "@/lib/chat-demo/config";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
/**
 * The demo console and its API live on a separate backend. Signed-in visitors
 * reach it only through this path, so the browser never leaves the E23 address.
 */
const allowed =
  /^(embed|assets\/[A-Za-z0-9._-]+|v1\/[a-z0-9-]+(\/[a-z0-9-]+)*)$/;
const failure = (status: number, message: string) =>
  NextResponse.json(
    { error: { message, retryable: status >= 500 } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
function ownOrigin(request: NextRequest) {
  const protocol =
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ??
    request.nextUrl.protocol.replace(":", "");
  return `${protocol}://${request.headers.get("host")}`;
}
async function forward(
  request: NextRequest,
  context: RouteContext<"/api/ki-demo/backend/[...path]">,
) {
  if (!getDemoConfig()) return failure(404, "Die Demo ist nicht aktiviert.");
  if (!(await authenticated())) return failure(401, "Bitte in E23 anmelden.");
  const path = (await context.params).path.join("/");
  // The console only accepts tickets from the page that embeds it: this one.
  if (request.method === "GET" && path === "embed-config")
    return NextResponse.json(
      { parentOrigin: ownOrigin(request) },
      { headers: { "Cache-Control": "no-store" } },
    );
  if (!allowed.test(path)) return failure(404, "Nicht gefunden.");
  let body: ArrayBuffer | undefined;
  if (request.method === "POST") {
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).host !== request.headers.get("host"))
      return failure(403, "Unzulaessige Herkunft.");
    if (Number(request.headers.get("content-length") ?? 0) > 16384)
      return failure(413, "Anfrage zu gross.");
    body = await request.arrayBuffer();
    if (body.byteLength > 16384) return failure(413, "Anfrage zu gross.");
  }
  const headers = new Headers();
  for (const name of ["authorization", "content-type", "accept"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  let upstream: Response;
  try {
    upstream = await backendFetch(path, {
      method: request.method,
      headers,
      body,
      signal: request.signal,
    });
  } catch {
    return failure(502, "Der Demo-Dienst ist gerade nicht erreichbar.");
  }
  const out = new Headers({ "Cache-Control": "no-store" });
  for (const name of ["content-type", "retry-after"]) {
    const value = upstream.headers.get(name);
    if (value) out.set(name, value);
  }
  // Answers are streamed; nothing in between may hold them back.
  out.set("X-Accel-Buffering", "no");
  return new Response(upstream.body, { status: upstream.status, headers: out });
}
export { forward as GET, forward as POST };
