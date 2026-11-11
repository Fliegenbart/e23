import { feier } from "@/lib/feier";
import { Arrow, Mark } from "../marks";
import { MotionDirector } from "../motion-director";
import { Line } from "../typography";
import { Countdown } from "./countdown";
import { Network } from "./network";
import "./feier.css";

export type Lang = "de" | "en";

const copy = {
  de: {
    other: { href: "/weihnachtsfeier/en", label: "English", lang: "en" },
    eyebrow: "Einladung · Advent 2026",
    title: "Weihnachtsfeier.",
    accent: "Miteinander.",
    lead: "Ein Nachmittag für Austausch und Begegnung – an der Esplanade 23. Feiern, kennenlernen, gemeinsam weiterdenken.",
    aboutEyebrow: "Worum es geht",
    aboutTitle: "Wie wollen wir arbeiten?",
    about:
      "KI stellt gerade vieles infrage: unsere Arbeit, unser Selbstbild, was wir für selbstverständlich hielten. Darüber wollen wir nicht allein nachdenken, sondern miteinander. Dafür nehmen wir uns Zeit: für Gespräche, Austausch und neue Kontakte.",
    questions: [
      "Wie verändert KI unser Arbeiten – und unser Bild von uns selbst?",
      "Wie wollen wir arbeiten, wenn alles hinterfragt wird?",
      "Bekommen wir mehr Zeit für das Wesentliche: den Austausch?",
    ],
    footer: "Esplanade 23 · 14.12.2026 · ab 16:00 Uhr",
    when: "Wann",
    date: "Montag, 14. Dezember 2026",
    time: "ab 16:00 Uhr",
    where: "Wo",
    inHouse: "im Haus",
    save: "Merken",
    calendar: "In den Kalender",
    countdown: {
      label: "Zeit bis zur Feier",
      units: ["Tage", "Stunden", "Minuten", "Sekunden"],
      running: "Es läuft. Komm rein.",
      over: "Schön war’s. Bis zum nächsten Jahr.",
    },
  },
  en: {
    other: { href: "/weihnachtsfeier", label: "Deutsch", lang: "de" },
    eyebrow: "Invitation · Advent 2026",
    title: "Christmas party.",
    accent: "Together.",
    lead: "An afternoon for conversation and new connections – at Esplanade 23. Celebrate, meet people, think ahead together.",
    aboutEyebrow: "What it is about",
    aboutTitle: "How do we want to work?",
    about:
      "AI is calling a lot into question: our work, how we see ourselves, things we took for granted. We would rather think that through together than alone. That is what this afternoon is for: conversations, exchange and new contacts.",
    questions: [
      "How is AI changing the way we work – and the way we see ourselves?",
      "How do we want to work when everything is being questioned?",
      "Will we gain more time for what matters most: talking to each other?",
    ],
    footer: "Esplanade 23 · 14 December 2026 · from 4 pm",
    when: "When",
    date: "Monday, 14 December 2026",
    time: "from 4 pm",
    where: "Where",
    inHouse: "in the house",
    save: "Save the date",
    calendar: "Add to calendar",
    countdown: {
      label: "Time until the party",
      units: ["Days", "Hours", "Minutes", "Seconds"],
      running: "It’s on. Come in.",
      over: "That was lovely. See you next year.",
    },
  },
};

/** Public microsite: no session check, and no links into the protected site. */
export function Invitation({ lang }: { lang: Lang }) {
  const t = copy[lang];
  return (
    <>
      <MotionDirector />
      <header className="feier-header">
        <Mark />
        <a className="feier-lang" href={t.other.href} lang={t.other.lang} hrefLang={t.other.lang}>
          {t.other.label} <Arrow diagonal />
        </a>
      </header>
      <main className="feier" lang={lang}>
        <section className="feier-hero">
          <Network />
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>
            <Line index={0}>{t.title}</Line>
            <Line index={1}>
              <em>{t.accent}</em>
            </Line>
          </h1>
          <p>{t.lead}</p>
          <Countdown start={feier.start} end={feier.end} text={t.countdown} />
        </section>
        <dl className="feier-facts" data-reveal>
          <div>
            <dt className="eyebrow">{t.when}</dt>
            <dd>
              <time dateTime="2026-12-14T16:00">{t.date}</time>
            </dd>
            <dd className="feier-sub">{t.time}</dd>
          </div>
          <div>
            <dt className="eyebrow">{t.where}</dt>
            <dd>{feier.place}</dd>
            <dd className="feier-sub">{t.inHouse}</dd>
          </div>
          <div>
            <dt className="eyebrow">{t.save}</dt>
            <dd>
              <a className="feier-cal" href="/weihnachtsfeier/termin.ics">
                {t.calendar} <Arrow diagonal />
              </a>
            </dd>
          </div>
        </dl>
        <section className="feier-about" data-reveal>
          <div>
            <span className="eyebrow">{t.aboutEyebrow}</span>
            <h2>{t.aboutTitle}</h2>
            <p>{t.about}</p>
          </div>
          <ol>
            {t.questions.map((q, i) => (
              <li key={q}>
                <span>0{i + 1}</span>
                {q}
              </li>
            ))}
          </ol>
        </section>
      </main>
      <footer className="feier-footer">
        <Mark />
        <span>{t.footer}</span>
      </footer>
    </>
  );
}
