import { redirect } from "next/navigation";
import { authenticated } from "@/lib/auth";
import { listAnmeldungen, type Anmeldung } from "@/lib/feier-db";
import { BlogFooter } from "../../blog/blog-chrome";
import { SiteHeader } from "../../site-header";
import { GuestList } from "./guest-list";
import "../../blog/blog.css";
import "../feier.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Anmeldungen Weihnachtsfeier — E23" };

const when = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Berlin",
});

/** Internal: who has signed up. Behind the same password as the rest. */
export default async function AnmeldungenPage() {
  if (!(await authenticated())) redirect("/?next=weihnachtsfeier/anmeldungen");
  let rows: Anmeldung[] | null = null;
  try {
    rows = await listAnmeldungen();
  } catch (error) {
    console.error(
      "feier list failed",
      error instanceof Error ? error.name : "unknown",
    );
  }
  return (
    <>
      <SiteHeader current="/weihnachtsfeier/anmeldungen" />
      <main className="feier feier-list">
        <span className="eyebrow">Weihnachtsfeier · 14.12.2026</span>
        <h1>Anmeldungen</h1>
        <p className="feier-list-lead">
          Wer sich für die Weihnachtsfeier angemeldet hat. Am Abend ein Häkchen
          setzen, wer wirklich da war.{" "}
          <a href="/weihnachtsfeier">Zur Einladung</a>
        </p>
        {rows === null ? (
          <p>Die Anmeldungen sind gerade nicht erreichbar.</p>
        ) : rows.length === 0 ? (
          <p>Noch keine Anmeldungen.</p>
        ) : (
          <GuestList
            initial={rows.map((row) => ({
              id: row.id,
              name: row.name,
              email: row.email,
              guests: row.guests,
              note: row.note,
              attended: row.attended,
              when: when.format(new Date(row.created_at)),
            }))}
          />
        )}
      </main>
      <BlogFooter />
    </>
  );
}
