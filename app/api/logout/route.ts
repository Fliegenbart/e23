import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { DEMO_COOKIE, readDemoSession } from "@/lib/chat-demo/session";
import { revokeDemoSession } from "@/lib/chat-demo/ticket";
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.headers.get("host"))
    return new NextResponse("Forbidden", { status: 403 });
  const response = NextResponse.redirect(new URL("/", origin), 303);
  try {
    const session = readDemoSession(
      request.cookies.get(DEMO_COOKIE)?.value,
      request.cookies.get(SESSION_COOKIE)?.value ?? "",
    );
    if (session) await revokeDemoSession(session.sid);
  } catch {
    /* Logout remains independent of optional demo configuration. */
  }
  response.cookies.set(DEMO_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
