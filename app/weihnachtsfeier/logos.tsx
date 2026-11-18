/** The three companies that share the office; logos are their own artwork. */
export const companies = [
  {
    name: "practical",
    logo: "/feier/practical.svg",
    href: "https://practical.one",
    area: { de: "Kunde.", en: "Customer." },
    person: { name: "Stefan Walz", photo: "/feier/team/stefan.webp" },
    de: "Digitale Kundenerlebnisse. Neu gebaut fürs KI-Zeitalter.",
    en: "Digital customer experience. Rebuilt for the AI era.",
  },
  {
    name: "Ins Wandeln kommen",
    logo: "/feier/inswandeln.svg",
    href: "https://inswandeln.com",
    area: { de: "Führung.", en: "Leadership." },
    person: { name: "Daniel Terner", photo: "/feier/team/daniel.webp" },
    de: "Vom Gesagten zum Getanen. Zackzack.",
    en: "From saying to doing. Chop-chop.",
  },
  {
    name: "TYRN.ON",
    logo: "/feier/tyrnon.svg",
    href: "https://tyrnon.com",
    area: { de: "Technik.", en: "Technology." },
    person: { name: "David Wegener", photo: null as string | null },
    de: "KI, die läuft. Nicht nur im Pilot.",
    en: "AI that runs. Not just in the pilot.",
  },
] as const;

const slug = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, "-");
const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("");

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

/** "Wer ist wir?": who is behind each company and what it covers. */
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
              <span className="feier-person">
                {company.person.photo ? (
                  <img className="feier-face" src={company.person.photo} alt="" width={44} height={44} />
                ) : (
                  <i aria-hidden="true">{initials(company.person.name)}</i>
                )}
                {company.person.name}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
