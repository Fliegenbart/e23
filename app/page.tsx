import { authenticated } from "@/lib/auth";
import manifest from "@/lib/manifest.json";
import { ReadingTools } from "./reading-tools";
import { TogetherArt, SharingArt, DialogueArt } from "./collaboration-art";
export const dynamic = "force-dynamic";
function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={diagonal ? "arrow diagonal" : "arrow"}
    >
      <path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function Mark() {
  return (
    <span className="wordmark">
      E23<span>.</span>
    </span>
  );
}
function Circles() {
  return (
    <div className="circles" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const access = await authenticated();
  if (!access) {
    const error = (await searchParams).error;
    return (
      <main className="gate">
        <header className="gate-header">
          <Mark />
          <span>Esplanade 23</span>
        </header>
        <div className="gate-art" aria-hidden="true">
          <Circles />
          <span className="gate-art-word">Miteinander.</span>
        </div>
        <section className="gate-content">
          <span className="eyebrow">Ein gemeinsamer Anfang</span>
          <h1>
            Mehr möglich.
            <br />
            <em>Miteinander.</em>
          </h1>
          <p>
            Ein Ort. Viele Möglichkeiten.
            <br />
            Unser Manifest für eine gemeinsame Haltung zur Arbeit.
          </p>
          <form action="/api/login" method="post">
            <label htmlFor="password">Passwort</label>
            <div className="password-row">
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Dein Zugang zu E23"
                required
                maxLength={256}
                autoComplete="current-password"
                aria-describedby={error ? "login-error" : undefined}
              />
              <button type="submit" aria-label="Manifest öffnen">
                <Arrow />
              </button>
            </div>
            {error && (
              <p className="login-error" id="login-error" role="alert">
                Das Passwort stimmt noch nicht. Versuch es erneut.
              </p>
            )}
          </form>
          <span className="gate-note">
            Ein kleiner Kreis. Ein offener Gedanke.
          </span>
        </section>
        <footer className="gate-footer">
          <span>E23 — Das Manifest</span>
          <span>Mehr möglich. Miteinander.</span>
        </footer>
      </main>
    );
  }
  return (
    <>
      <a className="skip-link" href="#anfang">
        Zum Manifest
      </a>
      <ReadingTools />
      <header className="site-header">
        <a href="#" aria-label="E23 – zum Anfang">
          <Mark />
        </a>
        <span className="header-caption">Ein Ort. Viele Möglichkeiten.</span>
        <a className="header-link" href="#anfang">
          Das Manifest <Arrow diagonal />
        </a>
      </header>
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-heading">
            <h1 id="hero-title">
              Mehr möglich.
              <br />
              <span>Miteinander.</span>
            </h1>
            <div className="hero-aside">
              <span>
                Ein gemeinsamer Ort.
                <br />
                Eine gemeinsame Haltung.
              </span>
              <span>Esplanade 23</span>
            </div>
          </div>
          <div className="hero-image">
            <img
              src="/miteinander.webp"
              alt="Orange transparente Flächen überlagern sich im Sonnenlicht und lassen gemeinsame Farbräume entstehen."
              width="1536"
              height="512"
              fetchPriority="high"
            />
            <a
              className="hero-scroll"
              href="#anfang"
              aria-label="Manifest lesen"
            >
              <Arrow />
            </a>
          </div>
          <div className="image-caption">
            <span>Esplanade 23 — Ein gemeinsamer Anfang</span>
            <span>Unser Manifest ↓</span>
          </div>
        </section>
        <section className="intro section-pad" id="anfang" data-chapter="0">
          <div className="section-kicker">
            <span>00 / Der Anfang</span>
            <span>Eine Einladung zum Miteinander</span>
          </div>
          <div className="intro-layout">
            <h2>
              Ein Ort.
              <br />
              Und alles,
              <br />
              was daraus
              <br />
              <em>werden kann.</em>
            </h2>
            <div className="prose">
              {manifest.intro.slice(0, 3).map((p) => (
                <p key={p}>{p}</p>
              ))}
              <p className="quiet">{manifest.intro[3]}</p>
            </div>
          </div>
        </section>
        <section className="question-band">
          <span className="eyebrow">Sondern:</span>
          <h2>
            Was könnte
            <br />
            <em>zwischen uns</em>
            <br />
            entstehen?
          </h2>
          <TogetherArt />
        </section>
        {manifest.chapters.slice(0, 5).map((chapter, i) => (
          <section
            key={chapter.title}
            id={`kapitel-${i + 1}`}
            data-chapter={i + 1}
            className={`chapter section-pad chapter-${i + 1}`}
          >
            <div className="section-kicker">
              <span>
                0{i + 1} /{" "}
                {
                  [
                    "Menschlicher Kern",
                    "Großzügigkeit",
                    "Das Gespräch",
                    "Gute Werkzeuge",
                    "Verantwortung",
                  ][i]
                }
              </span>
              <span className="little-line" />
            </div>
            <div className="chapter-layout">
              <div className="chapter-heading">
                <h2>{chapter.title}</h2>
                {i === 1 && <SharingArt />}
                {i === 2 && <DialogueArt />}
                {i === 4 && (
                  <span className="chapter-footnote">
                    Was wir empfangen haben,
                    <br />
                    können wir weitergeben.
                  </span>
                )}
              </div>
              <div className="prose">
                {chapter.paragraphs.map((p, j) => (
                  <p
                    key={p}
                    className={
                      (i === 0 && j === 1) ||
                      (i === 1 && j === 1) ||
                      (i === 3 && j === 3)
                        ? "emphasis"
                        : ""
                    }
                  >
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </section>
        ))}
        <section
          className="closing section-pad"
          id="kapitel-6"
          data-chapter="6"
        >
          <div className="section-kicker">
            <span>06 / Unser Labor</span>
            <span>Esplanade 23</span>
          </div>
          <h2>
            E23 ist unser Labor
            <br />
            <em>für eine neue Art zu arbeiten.</em>
          </h2>
          <div className="closing-intro">
            <p className="lab-intro">
              Hier geben wir einem neuen Paradigma der Arbeit Raum.
            </p>
            {manifest.chapters[5].paragraphs.slice(0, 2).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className="closing-statement">
            <p>{manifest.chapters[5].paragraphs[2]}</p>
            <p>
              Wir nutzen sie, um
              <br />
              <span>
                miteinander mehr
                <br />
                möglich zu machen.
              </span>
            </p>
          </div>
          <a href="#" className="back-top">
            Zurück zum Anfang <Arrow />
          </a>
        </section>
      </main>
      <footer className="site-footer">
        <Mark />
        <span>Mehr möglich. Miteinander.</span>
        <form method="post" action="/api/logout">
          <button type="submit">
            Abmelden <Arrow diagonal />
          </button>
        </form>
      </footer>
    </>
  );
}
