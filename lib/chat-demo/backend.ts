import "server-only";
import { getDemoConfig } from "./config";
/** Server-to-server call to the demo backend; the shared secret never leaves this server. */
export function backendFetch(path: string, init: RequestInit = {}) {
  const config = getDemoConfig();
  if (!config) throw new Error("Demo is not configured");
  const headers = new Headers(init.headers);
  headers.set("X-E23-Proxy-Secret", config.proxySecret);
  return fetch(`${config.origin}/${path}`, {
    ...init,
    headers,
    cache: "no-store",
    redirect: "manual",
  });
}
