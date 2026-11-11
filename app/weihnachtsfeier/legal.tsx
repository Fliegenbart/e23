import type { ReactNode } from "react";
import { legal } from "@/lib/feier";
import { Arrow, Mark } from "../marks";
import type { Lang } from "./invitation";
import "./feier.css";

export type Kind = "impressum" | "datenschutz";

const base = { de: "/weihnachtsfeier", en: "/weihnachtsfeier/en" };

/** Footer links to both legal pages, in the reader's language. */
export function LegalLinks({ lang }: { lang: Lang }) {
  return (
    <nav className="feier-legal-links" aria-label={lang === "de" ? "Rechtliches" : "Legal"}>
      <a href={`${base[lang]}/impressum`}>{lang === "de" ? "Impressum" : "Legal notice"}</a>
      <a href={`${base[lang]}/datenschutz`}>{lang === "de" ? "Datenschutz" : "Privacy"}</a>
    </nav>
  );
}

/** A required detail; an empty one is flagged instead of silently left out. */
function Detail({ value, lang }: { value: string; lang: Lang }) {
  return value ? (
    <>{value}</>
  ) : (
    <mark className="feier-missing">{lang === "de" ? "Angabe fehlt" : "Detail missing"}</mark>
  );
}

function Address({ lang }: { lang: Lang }) {
  return (
    <p>
      <Detail value={legal.name} lang={lang} />
      <br />
      <Detail value={legal.street} lang={lang} />
      <br />
      <Detail value={legal.city} lang={lang} />
    </p>
  );
}

function Contact({ lang }: { lang: Lang }) {
  return (
    <p>
      {lang === "de" ? "E-Mail" : "Email"}:{" "}
      {legal.email ? (
        <a href={`mailto:${legal.email}`}>{legal.email}</a>
      ) : (
        <Detail value="" lang={lang} />
      )}
      {legal.phone && (
        <>
          <br />
          {lang === "de" ? "Telefon" : "Phone"}: {legal.phone}
        </>
      )}
    </p>
  );
}

function deleteBy(lang: Lang) {
  if (!legal.deleteBy) return "";
  return new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-GB", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(legal.deleteBy));
}

function Impressum({ lang }: { lang: Lang }) {
  const de = lang === "de";
  return (
    <>
      <h1>{de ? "Impressum" : "Legal notice"}</h1>
      <h2>{de ? "Angaben gemäß § 5 DDG" : "Information according to § 5 DDG (Germany)"}</h2>
      <Address lang={lang} />
      {legal.represented && <p>{legal.represented}</p>}
      <h2>{de ? "Kontakt" : "Contact"}</h2>
      <Contact lang={lang} />
      {(legal.register || legal.vatId) && (
        <>
          <h2>{de ? "Register und Umsatzsteuer" : "Register and VAT"}</h2>
          <p>
            {legal.register}
            {legal.register && legal.vatId && <br />}
            {legal.vatId && `${de ? "Umsatzsteuer-ID" : "VAT ID"}: ${legal.vatId}`}
          </p>
        </>
      )}
    </>
  );
}

function Datenschutz({ lang }: { lang: Lang }) {
  const de = lang === "de";
  const until = deleteBy(lang);
  const section = (title: string, body: ReactNode) => (
    <>
      <h2>{title}</h2>
      {body}
    </>
  );
  return de ? (
    <>
      <h1>Datenschutz</h1>
      {section(
        "Wer verantwortlich ist",
        <>
          <Address lang={lang} />
          <Contact lang={lang} />
        </>,
      )}
      {section(
        "Aufruf der Seite",
        <p>
          Die Seite wird bei Vercel Inc. (USA) gehostet. Beim Aufruf verarbeitet
          Vercel technisch notwendige Daten in Server-Protokollen: IP-Adresse,
          Zeitpunkt, aufgerufene Adresse und Angaben zu Browser und Gerät. Eine
          Verarbeitung in den USA ist dabei möglich. Rechtsgrundlage ist unser
          berechtigtes Interesse an einem sicheren und stabilen Betrieb (Art. 6
          Abs. 1 lit. f DSGVO).
        </p>,
      )}
      {section(
        "Anmeldung zur Weihnachtsfeier",
        <>
          <p>
            Wenn du dich anmeldest, speichern wir deinen Namen, deine
            E-Mail-Adresse, die Zahl der Personen, deine Nachricht, die Sprache
            der Seite und den Zeitpunkt der Anmeldung. Nach der Feier halten wir
            außerdem fest, ob du da warst.
          </p>
          <p>
            Wir nutzen die Angaben nur, um die Feier zu planen und
            durchzuführen. Rechtsgrundlage ist unser berechtigtes Interesse an
            der Organisation der Veranstaltung (Art. 6 Abs. 1 lit. f DSGVO).
            Einsehen können sie die Menschen, die an der Esplanade 23 arbeiten
            und Zugang zum internen Bereich haben.
          </p>
          <p>
            Gespeichert werden die Anmeldungen in einer Datenbank von Neon Inc.
            (USA) am Standort Frankfurt. Wir löschen sie spätestens am{" "}
            <Detail value={until} lang={lang} />. Auf Wunsch löschen wir deine
            Anmeldung sofort.
          </p>
        </>,
      )}
      {section(
        "Cookies und Tracking",
        <p>
          Diese Seite setzt keine Cookies, nutzt keine Analyse- oder
          Werbedienste und lädt keine Schriften oder Inhalte von Dritten.
        </p>,
      )}
      {section(
        "Deine Rechte",
        <p>
          Du kannst Auskunft über deine Daten verlangen, sie berichtigen oder
          löschen lassen, die Verarbeitung einschränken lassen, ihr
          widersprechen und deine Daten in einem gängigen Format erhalten. Dafür
          genügt eine E-Mail an die oben genannte Adresse. Außerdem kannst du
          dich bei einer Datenschutz-Aufsichtsbehörde beschweren.
        </p>,
      )}
    </>
  ) : (
    <>
      <h1>Privacy</h1>
      {section(
        "Who is responsible",
        <>
          <Address lang={lang} />
          <Contact lang={lang} />
        </>,
      )}
      {section(
        "Visiting the page",
        <p>
          The page is hosted by Vercel Inc. (USA). When you open it, Vercel
          processes technically necessary data in server logs: IP address, time,
          the address requested and details of browser and device. Processing in
          the USA is possible. The legal basis is our legitimate interest in
          secure and stable operation (Art. 6(1)(f) GDPR).
        </p>,
      )}
      {section(
        "Signing up for the Christmas party",
        <>
          <p>
            When you sign up, we store your name, your email address, the number
            of people, your message, the language of the page and the time of
            your sign-up. After the party we also record whether you were there.
          </p>
          <p>
            We use these details only to plan and run the party. The legal basis
            is our legitimate interest in organising the event (Art. 6(1)(f)
            GDPR). They can be seen by the people who work at Esplanade 23 and
            have access to the internal area.
          </p>
          <p>
            Sign-ups are stored in a database run by Neon Inc. (USA), located in
            Frankfurt. We delete them by{" "}
            <Detail value={until} lang={lang} /> at the latest. On request we
            delete your sign-up immediately.
          </p>
        </>,
      )}
      {section(
        "Cookies and tracking",
        <p>
          This page sets no cookies, uses no analytics or advertising services
          and loads no fonts or content from third parties.
        </p>,
      )}
      {section(
        "Your rights",
        <p>
          You can ask what data we hold about you, have it corrected or deleted,
          have its processing restricted, object to it, and receive your data in
          a common format. An email to the address above is enough. You can also
          complain to a data protection supervisory authority.
        </p>,
      )}
    </>
  );
}

/** Impressum or Datenschutzhinweis of the public microsite. */
export function Legal({ lang, kind }: { lang: Lang; kind: Kind }) {
  const other = lang === "de" ? "en" : "de";
  return (
    <>
      <header className="feier-header">
        <a href={base[lang]} aria-label={lang === "de" ? "Zur Einladung" : "To the invitation"}>
          <Mark />
        </a>
        <a className="feier-lang" href={`${base[other]}/${kind}`} lang={other} hrefLang={other}>
          {other === "en" ? "English" : "Deutsch"} <Arrow diagonal />
        </a>
      </header>
      <main className="feier feier-legal" lang={lang}>
        <a className="feier-back" href={base[lang]}>
          ← {lang === "de" ? "Zur Einladung" : "Back to the invitation"}
        </a>
        {kind === "impressum" ? <Impressum lang={lang} /> : <Datenschutz lang={lang} />}
      </main>
      <footer className="feier-footer">
        <Mark />
        <LegalLinks lang={lang} />
      </footer>
    </>
  );
}
