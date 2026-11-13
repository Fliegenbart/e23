/** The three companies that share the office; logos are their own artwork. */
export const companies = [
  {
    name: "practical",
    logo: "/feier/practical.svg",
    href: "https://practical.one",
    area: { de: "Kunde", en: "Customer" },
    de: "Digitale Kundenerlebnisse, neu gebaut für das KI-Zeitalter.",
    en: "Digital customer experience, rebuilt for the AI era.",
  },
  {
    name: "Ins Wandeln kommen",
    logo: "/feier/inswandeln.svg",
    href: "https://inswandeln.com",
    area: { de: "Organisation", en: "Organisation" },
    de: "Bringt Führungsteams vom Gesagten zum Getanen.",
    en: "Gets leadership teams from saying to doing.",
  },
  {
    name: "TYRN.ON",
    logo: "/feier/tyrnon.svg",
    href: "https://tyrnon.com",
    area: { de: "Technik", en: "Technology" },
    de: "KI-Systeme für Unternehmen – entwickelt und in die Praxis gebracht.",
    en: "AI systems for companies – built and put into practice.",
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

/** "Wer ist wir?": what each company covers, in one line. */
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
            <span>
              <b>{company.area[lang]}</b>
              {company[lang]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
