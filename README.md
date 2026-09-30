# E23 — Mehr möglich. Miteinander.

Password-protected editorial microsite for the E23 manifesto. Next.js App Router, React, TypeScript. Manifesto content (including the approved updated closing headline) is in `lib/manifest.json`; rendered only on the server after authentication.

## Local development

```sh
npm ci
cp .env.example .env.local
# Set SITE_PASSWORD and a random SESSION_SECRET (at least 32 characters).
npm run dev
```

## Verification

```sh
npm run build
npm run typecheck
npm run start -- --port 3001
# In another terminal:
node --test tests/access.test.mjs
```

Access tests use `.env.local`, and test anonymous HTML/RSC, rejected passwords, cross-origin requests, cookie flags, forged sessions, logout, and absence of manifesto text in browser JavaScript. `TEST_BASE_URL` can select a different local test server.

## Deployment

Vercel project `e23`, team `davids-projects-f2bdba89`. Set `SITE_PASSWORD` and `SESSION_SECRET` as sensitive Vercel variables. Never commit `.env.local` or session secrets. Sessions expire after seven days. Rotate the session secret to invalidate all existing sessions.

The login is a shared-password gate, with signed HttpOnly/Secure/SameSite cookies. It is not an individual identity system; failed requests have a delay, not a distributed rate limit. The gate protects website delivery, not access to the source repository.

No analytics, third-party embeds or external font calls. The image is an AI-generated material study, not a photograph of the actual office. Manrope is self-hosted under the SIL Open Font License (see `public/fonts/OFL.txt`). The manifesto includes the user-requested laboratory framing and an expanded conversation chapter about new understanding emerging between people, with AI freeing time and attention for it. Three inline SVG studies animate once on viewport entry, can be replayed, and respect reduced-motion preferences.

## Shared projects and ideas

`/projekte` uses the same password/session as the manifesto. Everyone with access can create and edit ideas, projects and tasks, assign names and dates, post comments, archive/restore projects, and share a project URL. Names are self-declared, not verified identities. Task completion determines progress; the UI refreshes shared data every 20 seconds and on window focus. Version checks reject stale edits instead of silently overwriting another person's changes.

Data lives in Neon Postgres (resource `e23-projekte`, Frankfurt, free plan), accessed only by authenticated server routes. Add the sensitive `DATABASE_URL` to each deployed environment that needs the workspace. Production and development are connected; preview needs its own configuration. No project content is stored solely in the browser. Only the last comment display name is remembered locally.

Provision an empty database once with `node scripts/setup-workspace.mjs`. The script creates tables/indexes without seeding content. For integration verification, run `TEST_BASE_URL=http://127.0.0.1:3010 node --test tests/*.test.mjs` against a running production build. The workspace test creates its own record and deletes only that UUID in a finally block. It checks auth, origin restrictions, validation, persistence, task progress, comments, stale-write conflicts and archive/restore.

## Blog

Interner Blog unter `/blog`, geschützt wie der Rest der Seite. Jeder Beitrag ist eine Markdown-Datei in `content/blog/<slug>.md`:

```markdown
---
title: Titel des Beitrags
dek: Unterzeile, erscheint unter dem Titel und in der Übersicht
date: 2026-09-30
---

Absätze, `## Zwischenüberschriften`, `> Zitate` und **fett**.
Ein Absatz, der komplett fett ist, wird als großer Kernsatz gesetzt.
```

Der Dateiname ergibt die URL (`/blog/<slug>`, nur Kleinbuchstaben, Ziffern und Bindestriche). Neue Beiträge erscheinen nach dem nächsten Deployment.
