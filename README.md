# E23 — Mehr möglich. Miteinander.

Password-protected editorial microsite for the E23 manifesto. Next.js App Router, React, TypeScript. Full original manifesto content is in `lib/manifest.json`; rendered only on the server after authentication.

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

No analytics, third-party embeds or external font calls. The image is an AI-generated material study, not a photograph of the actual office. Manrope is self-hosted under the SIL Open Font License (see `public/fonts/OFL.txt`). The original copy is preserved, with chapter navigation and additional editorial labels.
