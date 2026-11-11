import { feier } from "@/lib/feier";
import { Arrow, Mark } from "../marks";
import { Line } from "../typography";
import { LegalLinks } from "./legal";
import { Network } from "./network";
import { Signup } from "./signup";
import { SignupDialog } from "./signup-dialog";
import "./feier.css";

export type Lang = "de" | "en";

const copy = {
  de: {
    other: { href: "/weihnachtsfeier/en", label: "English", lang: "en" },
    eyebrow: "Einladung · Advent 2026",
    title: "Weihnachtsfeier.",
    accent: "Miteinander.",
    lead: "Wir haben ein neues Büro. Das möchten wir mit euch teilen. Es soll ein Ort sein, an dem Transformation ermöglicht wird – im Persönlichen, im Business, gemeinsam.",
    tagline: "Netzwerken. Austauschen. Kekse. Glühwein. Ihr wisst Bescheid.",
    when: "14.12.2026 · ab 16:00 · Esplanade 23",
    calendar: "In den Kalender",
    signupTitle: "Bist du dabei?",
    close: "Schließen",
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
    },  },
  en: {
    other: { href: "/weihnachtsfeier", label: "Deutsch", lang: "de" },
    eyebrow: "Invitation · Advent 2026",
    title: "Christmas party.",
    accent: "Together.",
    lead: "We have a new office, and we want to share it with you. It is meant to be a place where transformation becomes possible – personally, in business, together.",
    tagline: "Networking. Conversation. Cookies. Mulled wine. You know the drill.",
    when: "14 December 2026 · from 4 pm · Esplanade 23",
    calendar: "Add to calendar",
    signupTitle: "Will you join us?",
    close: "Close",
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
    },  },
};

/**
 * Public microsite, one screen and no scrolling: the invitation fills the
 * viewport, the sign-up form opens in a dialog. No links into the protected site.
 */
export function Invitation({ lang }: { lang: Lang }) {
  const t = copy[lang];
  return (
    <div className="feier-one" lang={lang}>
      <header className="feier-header">
        <Mark />
        <a className="feier-lang" href={t.other.href} lang={t.other.lang} hrefLang={t.other.lang}>
          {t.other.label} <Arrow diagonal />
        </a>
      </header>
      <main className="feier-hero">
        <Network />
        <span className="eyebrow">{t.eyebrow}</span>
        <h1>
          <Line index={0}>{t.title}</Line>
          <Line index={1}>
            <em>{t.accent}</em>
          </Line>
        </h1>
        <p className="feier-lead">{t.lead}</p>
        <p className="feier-tagline">{t.tagline}</p>
        <p className="feier-when">
          <time dateTime={feier.start}>{t.when}</time>
        </p>
        <SignupDialog open={t.signup.submit} close={t.close} title={t.signupTitle}>
          <Signup lang={lang} text={t.signup} />
        </SignupDialog>
        <footer className="feier-foot">
          <a href="/weihnachtsfeier/termin.ics">{t.calendar}</a>
          <LegalLinks lang={lang} />
        </footer>
      </main>
    </div>
  );
}
