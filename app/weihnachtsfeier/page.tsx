import { redirect } from "next/navigation";
import { authenticated } from "@/lib/auth";
import { feier } from "@/lib/feier";
import { BlogFooter } from "../blog/blog-chrome";
import { Arrow } from "../marks";
import { MotionDirector } from "../motion-director";
import { SiteHeader } from "../site-header";
import { Line, vars } from "../typography";
import { Countdown } from "./countdown";
import "../blog/blog.css";
import "./feier.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Weihnachtsfeier — E23" };

/** Fixed positions, so the snowfall is identical on server and client. */
const flakes = Array.from({ length: 28 }, (_, i) => ({
  x: (i * 37) % 100,
  size: 3 + ((i * 7) % 6),
  time: 11 + ((i * 5) % 10),
  delay: -((i * 13) % 20),
  sway: ((i * 11) % 9) - 4,
}));

export default async function FeierPage() {
  if (!(await authenticated())) redirect("/?next=weihnachtsfeier");
  return (
    <>
      <MotionDirector />
      <SiteHeader current="/weihnachtsfeier" />
      <main className="feier">
        <section className="feier-hero">
          <div className="feier-snow" aria-hidden="true">
            {flakes.map((f, i) => (
              <i
                key={i}
                style={vars({
                  x: `${f.x}%`,
                  s: `${f.size}px`,
                  t: `${f.time}s`,
                  d: `${f.delay}s`,
                  w: `${f.sway}vw`,
                })}
              />
            ))}
          </div>
          <span className="eyebrow">Einladung · Advent 2026</span>
          <h1>
            <Line index={0}>Weihnachtsfeier.</Line>
            <Line index={1}>
              <em>Miteinander.</em>
            </Line>
          </h1>
          <p>
            Ein Jahr geht zu Ende. Wir feiern es zusammen – an der Esplanade 23.
          </p>
          <Countdown start={feier.start} end={feier.end} />
        </section>
        <dl className="feier-facts" data-reveal>
          <div>
            <dt className="eyebrow">Wann</dt>
            <dd>
              Montag, <time dateTime="2026-12-14T16:00">14. Dezember 2026</time>
            </dd>
            <dd className="feier-sub">ab 16:00 Uhr</dd>
          </div>
          <div>
            <dt className="eyebrow">Wo</dt>
            <dd>{feier.place}</dd>
            <dd className="feier-sub">im Haus</dd>
          </div>
          <div>
            <dt className="eyebrow">Merken</dt>
            <dd>
              <a className="feier-cal" href="/weihnachtsfeier/termin.ics">
                In den Kalender <Arrow diagonal />
              </a>
            </dd>
          </div>
        </dl>
      </main>
      <BlogFooter />
    </>
  );
}
