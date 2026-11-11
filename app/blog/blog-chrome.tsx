import { Arrow, Mark } from "../marks";
import { SiteHeader } from "../site-header";

export function BlogHeader() {
  return <SiteHeader current="/blog" />;
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
