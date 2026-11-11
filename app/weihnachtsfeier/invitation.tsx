import { feier, hosts } from "@/lib/feier";
import { Arrow, Mark } from "../marks";
import { MotionDirector } from "../motion-director";
import { Line } from "../typography";
import { Countdown } from "./countdown";
import { LegalLinks } from "./legal";
import { Network } from "./network";
import { Portrait } from "./portrait";
import { Signup } from "./signup";
import "./feier.css";

export type Lang = "de" | "en";

const copy = {
  de: {
    other: { href: "/weihnachtsfeier/en", label: "English", lang: "en" },
    eyebrow: "Einladung · Advent 2026",
    title: "Weihnachtsfeier.",
    accent: "Miteinander.",
    lead: "Ein Nachmittag für Austausch und Begegnung.",
    aboutEyebrow: "Austausch · Netzwerken · Weiterdenken",
    aboutTitle: "Wie wollen wir arbeiten?",
    questions: [
      "Was macht KI mit unserer Arbeit – und mit uns?",
      "Wie arbeiten, wenn alles hinterfragt wird?",
      "Mehr Zeit fürs Wesentliche: Austausch?",
    ],
    footer: "Esplanade 23 · 14.12.2026 · ab 16:00 Uhr",
    hostsEyebrow: "Wer einlädt",
    hostsTitle: "Deine Gastgeber.",
    portraitOf: "Portrait von",
    signupEyebrow: "Anmeldung",
    signupTitle: "Bist du dabei?",
    signupLead: "Sag kurz Bescheid.",
    signup: {
      name: "Name",
      email: "E-Mail",
      guests: "Personen",
      note: "Nachricht (optional)",
      notePlaceholder: "Etwas, das wir wissen sollten?",
      submit: "Anmelden",
      sending: "Wird gesendet …",
      privacy: "Deine Angaben nutzen wir nur für die Feier.",
      privacyLink: "Datenschutz",
      privacyHref: "/weihnachtsfeier/datenschutz",
      doneTitle: "Danke, du bist angemeldet.",
      done: "Wir freuen uns auf dich.",
      errors: {
        invalid: "Bitte prüfe deine Angaben.",
        full: "Die Anmeldung ist geschlossen. Melde dich bitte direkt bei uns.",
        unavailable: "Das hat gerade nicht geklappt. Bitte versuche es später noch einmal.",
      },
    },
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
    lead: "An afternoon for conversation and new connections.",
    aboutEyebrow: "Exchange · Networking · Thinking ahead",
    aboutTitle: "How do we want to work?",
    questions: [
      "What is AI doing to our work – and to us?",
      "How do we work when everything is in question?",
      "More time for what matters: each other?",
    ],
    footer: "Esplanade 23 · 14 December 2026 · from 4 pm",
    hostsEyebrow: "Who invites you",
    hostsTitle: "Your hosts.",
    portraitOf: "Portrait of",
    signupEyebrow: "Sign up",
    signupTitle: "Will you join us?",
    signupLead: "Just let us know.",
    signup: {
      name: "Name",
      email: "Email",
      guests: "People",
      note: "Message (optional)",
      notePlaceholder: "Anything we should know?",
      submit: "Sign up",
      sending: "Sending …",
      privacy: "We use your details for the party only.",
      privacyLink: "Privacy",
      privacyHref: "/weihnachtsfeier/en/datenschutz",
      doneTitle: "Thank you, you are signed up.",
      done: "We look forward to seeing you.",
      errors: {
        invalid: "Please check your details.",
        full: "Sign-up is closed. Please get in touch with us directly.",
        unavailable: "That did not work just now. Please try again later.",
      },
    },
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
          <a className="feier-cta" href="#anmeldung">
            {t.signup.submit} <Arrow />
          </a>
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
          <span className="eyebrow">{t.aboutEyebrow}</span>
          <h2>{t.aboutTitle}</h2>
          <ol>
            {t.questions.map((q, i) => (
              <li key={q}>
                <span>0{i + 1}</span>
                {q}
              </li>
            ))}
          </ol>
        </section>
        <section className="feier-hosts" data-reveal>
          <span className="eyebrow">{t.hostsEyebrow}</span>
          <h2>{t.hostsTitle}</h2>
          <ul>
            {hosts.map((host) => (
              <li key={host.portrait}>
                <Portrait src={host.portrait} label={`${t.portraitOf} ${host.name}`} />
                <strong>{host.name}</strong>
              </li>
            ))}
          </ul>
        </section>
        <section className="feier-signup" id="anmeldung" data-reveal>
          <div>
            <span className="eyebrow">{t.signupEyebrow}</span>
            <h2>{t.signupTitle}</h2>
            <p>{t.signupLead}</p>
          </div>
          <Signup lang={lang} text={t.signup} />
        </section>
      </main>
      <footer className="feier-footer">
        <Mark />
        <span>{t.footer}</span>
        <LegalLinks lang={lang} />
      </footer>
    </>
  );
}
