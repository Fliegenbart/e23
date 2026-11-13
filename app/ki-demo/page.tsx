import { authenticated } from "@/lib/auth";
import { getDemoConfig } from "@/lib/chat-demo/config";
import { notFound, redirect } from "next/navigation";
import DemoFrame from "./demo-frame";
import "./demo.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "KI-Demolabor | E23" };
export default async function DemoPage() {
  const config = getDemoConfig();
  if (!config) notFound();
  if (!(await authenticated())) redirect("/?next=ki-demo");
  return (
    <main className="demo-shell">
      <nav className="demo-nav" aria-label="Demo-Navigation">
        <a href="/">E23 · Zurück zum Manifest</a>
        <a href="/projekte">Projekte & Ideen</a>
        <form action="/api/logout" method="post">
          <button>Abmelden</button>
        </form>
      </nav>
      <DemoFrame />
    </main>
  );
}
