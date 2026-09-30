import { Arrow, Mark } from "../marks";

export function BlogHeader() {
  return (
    <header className="site-header blog-header">
      <a href="/" aria-label="E23 – zum Manifest">
        <Mark />
      </a>
      <nav className="manifest-nav" aria-label="Hauptnavigation">
        <a className="header-link" href="/">
          Das Manifest <Arrow diagonal />
        </a>
        <a className="header-link" href="/projekte">
          Projekte & Ideen <Arrow diagonal />
        </a>
        <a className="header-link is-current" href="/blog" aria-current="page">
          Blog <Arrow diagonal />
        </a>
      </nav>
    </header>
  );
}

export function BlogFooter() {
  return (
    <footer className="site-footer">
      <Mark />
      <span>Intern. Für den Kreis von E23.</span>
      <form method="post" action="/api/logout">
        <button type="submit">
          Abmelden <Arrow diagonal />
        </button>
      </form>
    </footer>
  );
}
