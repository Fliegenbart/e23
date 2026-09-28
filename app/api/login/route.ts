import { NextRequest, NextResponse } from "next/server";
import { createSession, equal, MAX_AGE, SESSION_COOKIE } from "@/lib/auth";
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.headers.get("host"))
    return new NextResponse("Forbidden", { status: 403 });
  const form = await request.formData();
  const password = form.get("password");
  const expected = process.env.SITE_PASSWORD;
  if (!expected)
    return new NextResponse("Site is not configured", { status: 503 });
  if (
    typeof password !== "string" ||
    password.length > 256 ||
    !equal(password, expected)
  ) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return NextResponse.redirect(
      new URL(
        form.get("next") === "projekte"
          ? "/?error=1&next=projekte"
          : "/?error=1",
        origin,
      ),
      303,
    );
  }
  const response = NextResponse.redirect(
    new URL(form.get("next") === "projekte" ? "/projekte" : "/", origin),
    303,
  );
  response.cookies.set(SESSION_COOKIE, createSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
