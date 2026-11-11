import { teamPageLive } from "@/lib/site";
import { Arrow, Mark } from "./marks";

const links = [
  { href: "/", label: "Das Manifest" },
  ...(teamPageLive ? [{ href: "/wir", label: "Wer wir sind" }] : []),
  { href: "/projekte", label: "Projekte & Ideen" },
  { href: "/zeitstrahl", label: "Zeitstrahl" },
  { href: "/blog", label: "Blog" },
  { href: "/weihnachtsfeier", label: "Weihnachtsfeier" },
];

/** Header for the pages behind the manifest; marks the current section. */
export function SiteHeader({ current }: { current: string }) {
  return (
    <header className="site-header blog-header">
      <a href="/" aria-label="E23 – zum Manifest">
        <Mark />
      </a>
      <nav className="manifest-nav" aria-label="Hauptnavigation">
        {links.map((link) => (
          <a
            key={link.href}
            className={`header-link${link.href === current ? " is-current" : ""}`}
            href={link.href}
            aria-current={link.href === current ? "page" : undefined}
          >
            {link.label} <Arrow diagonal />
          </a>
        ))}
      </nav>
    </header>
  );
}
