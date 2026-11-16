import "server-only";
import { randomUUID } from "node:crypto";
import { importPKCS8, SignJWT } from "jose";
import { backendFetch } from "./backend";
import { getDemoConfig } from "./config";
export async function signDemoTicket(
  sid: string,
  purpose: "bootstrap" | "revoke",
  nonce?: string,
) {
  const config = getDemoConfig();
  const pem = process.env.CHAT_DEMO_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!config || !pem) throw new Error("Demo signing is not configured");
  const key = await importPKCS8(pem, "EdDSA");
  return new SignJWT({
    sid,
    purpose,
    ...(nonce ? { nonce } : {}),
    epoch: config.epoch,
  })
    .setProtectedHeader({ alg: "EdDSA", typ: "JWT" })
    .setIssuer(process.env.CHAT_DEMO_ISSUER ?? "e23")
    .setAudience("e23-chat-demo")
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime("60s")
    .sign(key);
}
export async function revokeDemoSession(sid: string) {
  const config = getDemoConfig();
  if (!config) return;
  try {
    const ticket = await signDemoTicket(sid, "revoke");
    await backendFetch("v1/auth/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket }),
      signal: AbortSignal.timeout(1000),
    });
  } catch {
    /* E23 logout must work even if the demo is unavailable. */
  }
}
