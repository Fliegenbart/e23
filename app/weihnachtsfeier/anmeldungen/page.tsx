import { redirect } from "next/navigation";
import { authenticated } from "@/lib/auth";
import { listAnmeldungen, type Anmeldung } from "@/lib/feier-db";
import { BlogFooter } from "../../blog/blog-chrome";
import { SiteHeader } from "../../site-header";
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
  const people = rows?.reduce((sum, row) => sum + row.guests, 0) ?? 0;
  return (
    <>
      <SiteHeader current="/weihnachtsfeier/anmeldungen" />
      <main className="feier feier-list">
        <span className="eyebrow">Weihnachtsfeier · 14.12.2026</span>
        <h1>Anmeldungen</h1>
        {rows === null ? (
          <p>Die Anmeldungen sind gerade nicht erreichbar.</p>
        ) : rows.length === 0 ? (
          <p>Noch keine Anmeldungen.</p>
        ) : (
          <>
            <p>
              {rows.length} {rows.length === 1 ? "Anmeldung" : "Anmeldungen"},{" "}
              {people} {people === 1 ? "Person" : "Personen"}.
            </p>
            <div className="feier-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>E-Mail</th>
                    <th>Personen</th>
                    <th>Nachricht</th>
                    <th>Angemeldet</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>
                        <a href={`mailto:${row.email}`}>{row.email}</a>
                      </td>
                      <td>{row.guests}</td>
                      <td>{row.note}</td>
                      <td>{when.format(new Date(row.created_at))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
      <BlogFooter />
    </>
  );
}
