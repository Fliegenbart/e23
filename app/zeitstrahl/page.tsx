import { redirect } from "next/navigation";
import { authenticated } from "@/lib/auth";
import { BlogFooter } from "../blog/blog-chrome";
import { SiteHeader } from "../site-header";
import { Line, Overlap } from "../typography";
import { Timeline } from "./timeline";
import "../blog/blog.css";
import "./timeline.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Zeitstrahl — E23" };

export default async function TimelinePage() {
  if (!(await authenticated())) redirect("/?next=zeitstrahl");
  return (
    <>
      <SiteHeader current="/zeitstrahl" />
      <main className="tl-page">
        <section className="tl-intro">
          <span className="eyebrow">Zeitstrahl / Die nächsten 18 Monate</span>
          <h1>
            <Line index={0}>Wohin</Line>
            <Line index={1}>
              <em>die Reise geht.</em>
            </Line>
          </h1>
          <p>
            Kunden, Produkte, Formate, Begleitung, Intern. Was wir vorhaben, wer es trägt –
            und wann es auf die Straße kommt.
          </p>
          <Overlap variant="tl" track={false} />
        </section>
        <Timeline />
      </main>
      <BlogFooter />
    </>
  );
}
