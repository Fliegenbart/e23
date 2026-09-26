import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
export const SESSION_COOKIE = "e23-session";
export const MAX_AGE = 60 * 60 * 24 * 7;
function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32)
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  return value;
}
function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}
export function equal(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function createSession() {
  const expiry = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  return `${expiry}.${sign(expiry)}`;
}
export async function authenticated() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const [expiry, signature, extra] = token.split(".");
  if (
    extra ||
    !expiry ||
    !signature ||
    !/^\d+$/.test(expiry) ||
    Number(expiry) <= Date.now() / 1000
  )
    return false;
  return equal(signature, sign(expiry));
}
