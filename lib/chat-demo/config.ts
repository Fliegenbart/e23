function safeOrigin(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const local = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && local))
      return null;
    return value.replace(/\/$/, "") === url.origin ? url.origin : null;
  } catch {
    return null;
  }
}
/**
 * The demo backend is only ever reached from this server (see the proxy route);
 * browsers stay on the E23 address. Fails closed unless fully configured.
 */
export function getDemoConfig() {
  if (process.env.CHAT_DEMO_ENABLED !== "true") return null;
  const origin = safeOrigin(process.env.CHAT_DEMO_ORIGIN);
  const proxySecret = process.env.CHAT_DEMO_PROXY_SECRET ?? "";
  const epoch = Number(process.env.CHAT_DEMO_AUTH_EPOCH ?? 1);
  if (
    !origin ||
    !/^[a-f0-9]{64}$/.test(proxySecret) ||
    !Number.isSafeInteger(epoch) ||
    epoch < 1
  )
    return null;
  return { origin, proxySecret, epoch };
}
