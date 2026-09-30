import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
process.loadEnvFile(".env.local");
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const phrase = "Wir verwechseln die Zusammenführung";
const post = (path, password, origin = base) =>
  fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ password }),
    redirect: "manual",
  });
test("anonymous HTML and RSC do not contain the manifesto", async () => {
  for (const headers of [{}, { RSC: "1" }]) {
    const r = await fetch(base, { headers });
    const body = await r.text();
    assert.equal(r.status, 200);
    assert(!body.includes(phrase));
    assert(!body.includes(process.env.SITE_PASSWORD));
    assert.match(r.headers.get("cache-control"), /no-store|private/);
  }
});
test("incorrect password does not issue a session", async () => {
  const r = await post("/api/login", "wrong");
  assert.equal(r.status, 303);
  assert.match(r.headers.get("location"), /error=1/);
  assert.equal(r.headers.get("set-cookie"), null);
});
test("cross-origin login is rejected", async () => {
  assert.equal(
    (await post("/api/login", process.env.SITE_PASSWORD, "https://example.com"))
      .status,
    403,
  );
});
test("correct password grants access, secure cookie, logout clears it", async () => {
  const r = await post("/api/login", process.env.SITE_PASSWORD);
  assert.equal(r.status, 303);
  const cookie = r.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /Secure/i);
  assert.match(cookie, /SameSite=lax/i);
  const content = await fetch(base, {
    headers: { Cookie: cookie.split(";")[0] },
  });
  assert((await content.text()).includes(phrase));
  const out = await post("/api/logout", "");
  assert.equal(out.status, 303);
  assert.match(out.headers.get("set-cookie"), /Max-Age=0/);
});
test("forged and expired cookies do not grant access", async () => {
  for (const token of ["9999999999.forged", "1.forged"]) {
    const r = await fetch(base, {
      headers: { Cookie: `e23-session=${token}` },
    });
    assert(!(await r.text()).includes(phrase));
  }
});
test("manifest never appears in client JavaScript", () => {
  const fs = process.getBuiltinModule("node:fs");
  for (const file of fs
    .readdirSync(".next/static/chunks", { recursive: true })
    .filter((p) => p.endsWith(".js")))
    assert(
      !readFileSync(`.next/static/chunks/${file}`, "utf8").includes(phrase),
    );
});
test("blog is protected and returns to the requested post after sign-in", async () => {
  const slug = "wenn-intelligenz-zur-commodity-wird";
  const article = "Reproduzierbare Intelligenz verliert ihren Knappheitswert";
  for (const path of ["/blog", `/blog/${slug}`]) {
    const r = await fetch(`${base}${path}`, { redirect: "manual" });
    assert.notEqual(r.status, 200);
    assert(!(await r.text()).includes(article));
  }
  const login = await fetch(`${base}/api/login`, {
    method: "POST",
    headers: {
      Origin: base,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      password: process.env.SITE_PASSWORD,
      next: `blog/${slug}`,
    }),
    redirect: "manual",
  });
  assert.equal(new URL(login.headers.get("location")).pathname, `/blog/${slug}`);
  const cookie = login.headers.get("set-cookie").split(";")[0];
  const page = await fetch(`${base}/blog/${slug}`, { headers: { Cookie: cookie } });
  assert((await page.text()).includes(article));
  const evil = await post("/api/login", process.env.SITE_PASSWORD);
  assert.equal(new URL(evil.headers.get("location")).pathname, "/");
});
test("login ignores next targets outside the site", async () => {
  const r = await fetch(`${base}/api/login`, {
    method: "POST",
    headers: {
      Origin: base,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ password: "wrong", next: "//example.com" }),
    redirect: "manual",
  });
  assert.equal(r.headers.get("location").includes("example.com"), false);
});
