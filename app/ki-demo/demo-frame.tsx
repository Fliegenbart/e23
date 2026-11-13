"use client";
import { useEffect, useRef, useState } from "react";
/** The console is served through E23's own proxy path, so it shares this origin. */
const consolePath = "/api/ki-demo/backend/embed";
export default function DemoFrame() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const origin = window.location.origin;
    let nonce = "";
    let active = true;
    const pending = new Set<AbortController>();
    setReady(false);
    setError("");
    const timeout = window.setTimeout(
      () =>
        setError(
          "Der Demo-Dienst antwortet nicht. E23 bleibt weiterhin nutzbar.",
        ),
      18000,
    );
    async function receive(event: MessageEvent) {
      if (
        event.origin !== origin ||
        event.source !== frame.current?.contentWindow ||
        !event.data ||
        event.data.version !== 1
      )
        return;
      const data = event.data;
      if (data.type === "e23-demo:status" && data.nonce === nonce) {
        if (data.status === "ready") {
          clearTimeout(timeout);
          setReady(true);
          setError("");
        }
        if (data.status === "error")
          setError(
            "Die Demo konnte den Zugang nicht bestätigen. Bitte erneut verbinden.",
          );
        return;
      }
      if (
        data.type !== "e23-demo:ready" ||
        typeof data.nonce !== "string" ||
        !/^[a-f0-9-]{36}$/i.test(data.nonce) ||
        data.nonce === nonce
      )
        return;
      nonce = data.nonce;
      const expected = nonce;
      const target = frame.current?.contentWindow;
      const controller = new AbortController();
      pending.add(controller);
      const requestTimeout = window.setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch("/api/ki-demo/ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nonce: expected }),
          signal: controller.signal,
          cache: "no-store",
        });
        const body = await response.json();
        if (!response.ok)
          throw new Error(
            body.error?.message ?? "Der Demo-Zugang ist nicht verfügbar.",
          );
        if (
          !active ||
          nonce !== expected ||
          target !== frame.current?.contentWindow
        )
          return;
        target?.postMessage(
          {
            type: "e23-demo:ticket",
            version: 1,
            nonce: expected,
            ticket: body.ticket,
          },
          origin,
        );
      } catch (e) {
        if (active && nonce === expected)
          setError(e instanceof Error ? e.message : "Verbindungsfehler");
      } finally {
        clearTimeout(requestTimeout);
        pending.delete(controller);
      }
    }
    window.addEventListener("message", receive);
    return () => {
      active = false;
      clearTimeout(timeout);
      for (const item of pending) item.abort();
      window.removeEventListener("message", receive);
    };
  }, [version]);
  return (
    <section className="demo-frame-container" aria-label="KI-Demolabor">
      {error ? (
        <div className="demo-feedback" role="alert">
          <h1>Demo nicht verbunden</h1>
          <p>{error}</p>
          <button onClick={() => setVersion((v) => v + 1)}>
            Erneut verbinden
          </button>
        </div>
      ) : (
        !ready && (
          <p className="demo-feedback" role="status">
            Demolabor wird verbunden …
          </p>
        )
      )}
      <iframe
        key={version}
        ref={frame}
        src={consolePath}
        title="E23 KI-Demolabor"
        sandbox="allow-scripts allow-same-origin allow-forms"
        referrerPolicy="no-referrer"
        className="demo-frame"
      />
    </section>
  );
}
