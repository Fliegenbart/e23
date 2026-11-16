import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import { equal } from "@/lib/auth";
import { getDemoConfig } from "./config";
export const DEMO_COOKIE = "e23-demo-session";
const isUuid = (value: string) =>
  /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
    value,
  );
function signature(payload: string, e23Session: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET required");
  return createHmac("sha256", secret)
    .update(`e23-demo-v1:${getDemoConfig()?.epoch}:${e23Session}:${payload}`)
    .digest("hex");
}
export function readDemoSession(value: string | undefined, e23Session: string) {
  if (!value || !e23Session) return null;
  const [sid, expires, sig, extra] = value.split(".");
  const expiry = Number(expires);
  if (
    extra ||
    !isUuid(sid ?? "") ||
    !Number.isSafeInteger(expiry) ||
    expiry <= Date.now() / 1000 ||
    !sig
  )
    return null;
  if (!equal(signature(`${sid}.${expires}`, e23Session), sig)) return null;
  return { sid, expiry, value };
}
export function createDemoSession(e23Session: string) {
  const expiry = Number(e23Session.split(".")[0]);
  if (!Number.isSafeInteger(expiry) || expiry <= Date.now() / 1000)
    throw new Error("Valid E23 session required");
  const sid = randomUUID();
  const payload = `${sid}.${expiry}`;
  return { sid, expiry, value: `${payload}.${signature(payload, e23Session)}` };
}
