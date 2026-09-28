import { authenticated } from "@/lib/auth";
import manifest from "@/lib/manifest.json";
import { ReadingTools } from "./reading-tools";
import { TogetherArt, SharingArt, DialogueArt } from "./collaboration-art";
import { MotionDirector } from "./motion-director";
import { GateMotion } from "./gate-motion";
import { Words, Line, Overlap, count, vars } from "./typography";
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
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const access = await authenticated();
  if (!access) {
    const query = await searchParams;
    const error = query.error;
    return (
      <main className="gate">
        <GateMotion />
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
            <Line index={0}>Mehr möglich.</Line>
            <Line index={1}>
              <em>Miteinander.</em>
            </Line>
          </h1>
          <p>
            Ein Ort. Viele Möglichkeiten.
            <br />
            Unser Manifest für eine gemeinsame Haltung zur Arbeit.
          </p>
          <form action="/api/login" method="post">
            {query.next === "projekte" && (
              <input type="hidden" name="next" value="projekte" />
            )}
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
  const chapters = manifest.chapters.slice(0, 5);
  const kickers = [
    "Menschlicher Kern",
    "Großzügigkeit",
    "Das Gespräch",
    "Gute Werkzeuge",
    "Verantwortung",
  ];
  const emphasis = [1, 1, 2, 3, -1];
  const final = manifest.chapters[5].paragraphs[3];
  return (
    <>
      <div className="curtain" aria-hidden="true">
        <Mark />
      </div>
      <MotionDirector />
      <a className="skip-link" href="#anfang">
        Zum Manifest
      </a>
      <ReadingTools />
      <header className="site-header">
        <a href="#" aria-label="E23 – zum Anfang">
          <Mark />
        </a>
        <span className="header-caption">Ein Ort. Viele Möglichkeiten.</span>
        <nav className="manifest-nav" aria-label="Hauptnavigation">
          <a className="header-link" href="#anfang">
            Das Manifest <Arrow diagonal />
          </a>
          <a className="header-link" href="/projekte">
            Projekte & Ideen <Arrow diagonal />
          </a>
        </nav>
      </header>
      <main>
        <section className="hero" aria-labelledby="hero-title" data-scroll>
          <div className="hero-heading">
            <h1 id="hero-title">
              <Line index={0}>Mehr möglich.</Line>
              <Line index={1} className="hero-accent">
                Miteinander.
              </Line>
            </h1>
            <Overlap variant="hero" track={false} />
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
          <div className="section-kicker" data-reveal>
            <span>00 / Der Anfang</span>
            <span>Eine Einladung zum Miteinander</span>
          </div>
          <div className="intro-layout">
            <h2 data-reveal>
              <Line index={0}>Ein Ort.</Line>
              <Line index={1}>Und alles,</Line>
              <Line index={2}>was daraus</Line>
              <Line index={3}>
                <em>werden kann.</em>
              </Line>
            </h2>
            <div className="prose" data-reveal>
              {manifest.intro.slice(0, 3).map((p) => (
                <p key={p}>{p}</p>
              ))}
              <p className="quiet">{manifest.intro[3]}</p>
            </div>
          </div>
        </section>
        <section className="question-band" data-scroll>
          <span className="eyebrow">Sondern:</span>
          <h2 data-reveal>
            <Line index={0}>Was könnte</Line>
            <Line index={1}>
              <em>zwischen uns</em>
            </Line>
            <Line index={2}>entstehen?</Line>
          </h2>
          <TogetherArt />
        </section>
        {chapters.map((chapter, i) => (
          <section
            key={chapter.title}
            id={`kapitel-${i + 1}`}
            data-chapter={i + 1}
            data-scroll
            className={`chapter section-pad chapter-${i + 1}`}
          >
            <span className="chapter-number" aria-hidden="true">
              0{i + 1}
            </span>
            <div className="section-kicker" data-reveal>
              <span>
                0{i + 1} / {kickers[i]}
              </span>
              <span className="little-line" />
            </div>
            <div className="chapter-layout">
              <div className="chapter-heading">
                <h2 data-reveal>
                  <span className="reveal-block">{chapter.title}</span>
                </h2>
                {i === 0 && <Overlap variant="core" />}
                {i === 1 && <SharingArt />}
                {i === 2 && <DialogueArt />}
                {i === 3 && <Overlap variant="tools" />}
                {i === 4 && (
                  <span className="chapter-footnote" data-reveal>
                    Was wir empfangen haben,
                    <br />
                    können wir weitergeben.
                  </span>
                )}
              </div>
              <div className="prose">
                {chapter.paragraphs.map((p, j) =>
                  j === emphasis[i] ? (
                    <p
                      key={p}
                      className="emphasis fill"
                      data-scroll
                      style={vars({ n: count(p) })}
                    >
                      <Words text={p} />
                    </p>
                  ) : (
                    <p key={p} data-reveal>
                      {p}
                    </p>
                  ),
                )}
              </div>
            </div>
          </section>
        ))}
        <section
          className="closing section-pad"
          id="kapitel-6"
          data-chapter="6"
          data-scroll
        >
          <div className="section-kicker">
            <span>06 / Unser Labor</span>
            <span>Esplanade 23</span>
          </div>
          <h2 data-reveal>
            <Line index={0}>E23 ist unser Labor</Line>
            <Line index={1}>
              <em>für eine neue Art zu arbeiten.</em>
            </Line>
          </h2>
          <div className="closing-intro" data-reveal>
            <p className="lab-intro">
              Hier geben wir einem neuen Paradigma der Arbeit Raum.
            </p>
            {manifest.chapters[5].paragraphs.slice(0, 2).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div
            className="closing-statement"
            data-scroll
            style={vars({ n: count(final) })}
          >
            <p data-reveal>{manifest.chapters[5].paragraphs[2]}</p>
            <p className="build">
              <Words text={final} accent={(i) => i >= 4} />
            </p>
            <svg
              className="closing-mark"
              viewBox="0 0 400 360"
              fill="none"
              aria-hidden="true"
            >
              <circle className="c1" cx="150" cy="140" r="110" />
              <circle className="c2" cx="250" cy="140" r="110" />
              <circle className="c3" cx="200" cy="226" r="110" />
              <path
                className="spark"
                d="M200 146v44m-22-22h44m-37-15 30 30m-30 0 30-30"
              />
            </svg>
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
