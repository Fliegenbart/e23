import { notFound, redirect } from "next/navigation";
import { authenticated } from "@/lib/auth";
import { teamPageLive } from "@/lib/site";
import { BlogFooter } from "../blog/blog-chrome";
import { MotionDirector } from "../motion-director";
import { SiteHeader } from "../site-header";
import { Line, Overlap } from "../typography";
import "../blog/blog.css";
import "./wir.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wer wir sind — E23" };

const levels = [
  {
    level: "Mensch",
    question: "Wer bin ich, wenn die KI meine Arbeit kann?",
    who: "Monika",
    what: "Begleitung & Seelsorge",
    text: "Workshops und Gespräche für Menschen, deren berufliche Identität durch KI ins Wanken gerät. Ausdrücklich christlich, offen für alle – auch gemeinsam mit Seelsorgern aus unserem Umfeld.",
  },
  {
    level: "Organisation",
    question: "Wie kommt ein Unternehmen durch den Wandel?",
    who: "Daniel Terner",
    what: "Ins Wandeln kommen",
    text: "Begleitet Unternehmen in Transformationsprozesse hinein und hindurch.",
  },
  {
    level: "Kunde",
    question: "Wie erlebt der Kunde ein Unternehmen im KI-Zeitalter?",
    who: "Stefan",
    what: "Practical.one",
    href: "https://practical.one",
    text: "Fragt nach der Digital Customer Experience, wenn KI zum Alltag gehört.",
  },
  {
    level: "Technik",
    question: "Was lässt sich heute schon bauen?",
    who: "David",
    what: "Server, Agenten, Prototypen",
    text: "Experimentiert mit eigener Infrastruktur und KI-Agenten – und macht Ideen schnell erprobbar.",
  },
];

export default async function TeamPage() {
  if (!teamPageLive) notFound();
  if (!(await authenticated())) redirect("/?next=wir");
  return (
    <>
      <MotionDirector />
      <SiteHeader current="/wir" />
      <main className="wir">
        <section className="wir-intro">
          <span className="eyebrow">Wer wir sind</span>
          <h1>
            <Line index={0}>Vier Fragen.</Line>
            <Line index={1}>
              <em>Ein Haus.</em>
            </Line>
          </h1>
          <p>
            An der Esplanade 23 arbeiten Menschen mit eigenen Firmen unter einem
            Dach. Was uns verbindet: Wir sind Christen, und wir wollen, dass
            Menschen durch KI handlungsfähiger werden – nicht überflüssig.
          </p>
          <Overlap variant="tl" track={false} />
        </section>
        <ol className="wir-levels">
          {levels.map((l, i) => (
            <li key={l.level} data-reveal>
              <span className="wir-num">0{i + 1}</span>
              <div className="wir-level">
                <span className="eyebrow">{l.level}</span>
                <h2>{l.question}</h2>
              </div>
              <div className="wir-who">
                <strong>{l.who}</strong>
                {l.href ? (
                  <a href={l.href} target="_blank" rel="noreferrer">
                    {l.what} ↗
                  </a>
                ) : (
                  <span>{l.what}</span>
                )}
                <p>{l.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <section className="wir-stance" data-reveal>
          <h2>Woran man bei uns ist</h2>
          <div>
            <p>
              <strong>Wer wir sind:</strong> Christen. Unser Glaube prägt, wie
              wir arbeiten, wem wir zuhören und was wir für Erfolg halten.
            </p>
            <p>
              <strong>Für wen wir arbeiten:</strong> für alle. Niemand muss
              unseren Glauben teilen, um mit uns zu arbeiten oder zu uns zu
              kommen.
            </p>
            <p>
              <strong>Was ausdrücklich christlich ist:</strong> sagen wir
              vorher. Begleitung ist bei uns kein Verkaufsgespräch.
            </p>
          </div>
        </section>
      </main>
      <BlogFooter />
    </>
  );
}
