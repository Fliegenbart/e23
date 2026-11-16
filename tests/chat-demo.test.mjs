import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3010";
const api = process.env.DEMO_TEST_API_URL ?? "http://127.0.0.1:4310";
const demoTest = process.env.E23_TEST_PASSWORD ? test : test.skip;
async function login() {
  const r = await fetch(base + "/api/login", {
    method: "POST",
    headers: {
      Origin: base,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      password: process.env.E23_TEST_PASSWORD,
      next: "ki-demo",
    }),
    redirect: "manual",
  });
  assert.equal(r.status, 303);
  assert.equal(new URL(r.headers.get("location")).pathname, "/ki-demo");
  return r.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}
const post = (cookie, body = { nonce: randomUUID() }, origin = base) =>
  fetch(base + "/api/ki-demo/ticket", {
    method: "POST",
    headers: {
      Origin: origin,
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
demoTest("anonymous demo page redirects to shared login; anonymous ticket denied", async () => {
  const r = await fetch(base + "/ki-demo", { redirect: "manual" });
  assert.equal(r.status, 307);
  assert.match(r.headers.get("location"), /next=ki-demo/);
  assert.equal((await post("")).status, 401);
});
demoTest("ticket checks origin and body; shared login grants no second login", async () => {
  const cookie = await login();
  assert.equal(
    (await post(cookie, {}, "https://attacker.invalid")).status,
    403,
  );
  assert.equal((await post(cookie, { nonce: "bad" })).status, 400);
  assert.equal((await post(cookie, { nonce: "x".repeat(3000) })).status, 413);
  const page = await fetch(base + "/ki-demo", { headers: { Cookie: cookie } });
  assert.equal(page.status, 200);
  const csp = page.headers.get("content-security-policy");
  assert.match(csp, /frame-ancestors 'none'/);
  assert.doesNotMatch(csp, /frame-src|127\.0\.0\.1:4310/);
});
const proxy = base + "/api/ki-demo/backend/";
const viaProxy = (cookie, path, init = {}) =>
  fetch(proxy + path, {
    ...init,
    headers: { Origin: base, Cookie: cookie, ...init.headers },
  });
demoTest("backend is reachable only through the signed-in E23 proxy", async () => {
  assert.equal((await fetch(proxy + "embed")).status, 401);
  assert.equal((await fetch(api + "/v1/profiles")).status, 404);
  assert.equal((await fetch(api + "/embed")).status, 404);
  const cookie = await login();
  for (const path of ["health/ready", "v1/../health/ready", "V1/profiles", "embed/x"])
    assert.equal((await viaProxy(cookie, path)).status, 404, path);
  const embed = await viaProxy(cookie, "embed");
  assert.equal(embed.status, 200);
  assert.match(embed.headers.get("content-type"), /text\/html/);
  assert.equal(embed.headers.get("x-frame-options"), "SAMEORIGIN");
  assert.match(
    embed.headers.get("content-security-policy"),
    /script-src 'self';.*frame-ancestors 'self'$/,
  );
  const asset = /(?:src|href)="\.\/(assets\/[^"]+)"/.exec(await embed.text())[1];
  assert.equal((await viaProxy(cookie, asset)).status, 200);
  assert.deepEqual(await (await viaProxy(cookie, "embed-config")).json(), {
    parentOrigin: base,
  });
  // Signed in to E23, but without a demo token the API itself still refuses.
  assert.equal((await viaProxy(cookie, "v1/profiles")).status, 401);
  assert.equal(
    (
      await viaProxy(cookie, "v1/auth/exchange", {
        method: "POST",
        headers: { Origin: "https://attacker.invalid", "Content-Type": "application/json" },
        body: "{}",
      })
    ).status,
    403,
  );
});
demoTest("E23 ticket exchanges once and logout revokes the API session", async () => {
  const cookie = await login();
  const response = await post(cookie);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  const data = await response.json();
  const cookies = [
    cookie,
    ...response.headers.getSetCookie().map((c) => c.split(";")[0]),
  ].join("; ");
  const exchange = () =>
    viaProxy(cookies, "v1/auth/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  const r = await exchange();
  assert.equal(r.status, 200, await r.clone().text());
  const { token } = await r.json();
  assert.equal((await exchange()).status, 401);
  const profiles = () =>
    fetch(api + "/v1/profiles", {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-E23-Proxy-Secret": process.env.DEMO_TEST_PROXY_SECRET,
      },
    });
  assert.equal((await profiles()).status, 200);
  const out = await fetch(base + "/api/logout", {
    method: "POST",
    headers: { Origin: base, Cookie: cookies },
    redirect: "manual",
  });
  assert.equal(out.status, 303);
  assert.equal((await profiles()).status, 401);
});
