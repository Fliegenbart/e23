/** The three companies that share the office; logos are their own artwork. */
export const companies = [
  {
    name: "practical",
    logo: "/feier/practical.svg",
    href: "https://practical.one",
    de: "Design-Beratung an der Schnittstelle von UX-Design und künstlicher Intelligenz.",
    en: "A design consultancy at the intersection of UX design and artificial intelligence.",
  },
  {
    name: "Ins Wandeln kommen",
    logo: "/feier/inswandeln.svg",
    href: "https://inswandeln.com",
    de: "Hilft Führungs-Teams, die Lücke zu schließen zwischen Gesagt und Getan.",
    en: "Helps leadership teams close the gap between what is said and what is done.",
  },
  {
    name: "TYRN.ON",
    logo: "/feier/tyrnon.svg",
    href: "https://tyrnon.com",
    de: "Entwickelt intelligente Systeme und KI-Technologie für Unternehmen – und setzt sie in der Praxis um.",
    en: "Builds intelligent systems and AI technology for companies – and puts them into practice.",
  },
] as const;

const slug = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, "-");

/** The logo bar at the top of the invitation. */
export function Logos() {
  return (
    <ul className="feier-logos">
      {companies.map((company) => (
        <li key={company.name}>
          <img className={`feier-logo-${slug(company.name)}`} src={company.logo} alt={company.name} />
        </li>
      ))}
    </ul>
  );
}

/** "Wer ist wir?": one line per company, in its own words. */
export function Who({ lang, intro }: { lang: "de" | "en"; intro: string }) {
  return (
    <div className="feier-who">
      <p>{intro}</p>
      <ul>
        {companies.map((company) => (
          <li key={company.name}>
            <a href={company.href} target="_blank" rel="noreferrer">
              <img
                className={`feier-logo-${slug(company.name)}`}
                src={company.logo}
                alt={company.name}
              />
            </a>
            <span>{company[lang]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
