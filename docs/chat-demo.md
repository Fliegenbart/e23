# Optionales KI-Demolabor

Die Erweiterung benutzt den bestehenden gemeinsamen E23-Passwortzugang. Es gibt
keine persoenlichen Konten oder weitere Anmeldung. Das Backend und die Demo-UI
liegen im separaten Projekt `/Users/davidwegener/Desktop/Apps/e23-chatbot-demo`.

Die Standardkonfiguration ist deaktiviert. Fuer eine spaetere Freigabe:

- `CHAT_DEMO_ENABLED=true`
- `CHAT_DEMO_ORIGIN`: exakte HTTPS-Origin des separaten Demo-Dienstes
- `CHAT_DEMO_E23_ORIGIN`: exakte Origin dieser E23-Bereitstellung
- `CHAT_DEMO_PRIVATE_KEY`: serverseitiger PKCS8-Ed25519-Schluessel
- `CHAT_DEMO_ISSUER=e23` und `CHAT_DEMO_AUTH_EPOCH=1`, mit dem Backend abgestimmt

Der Backend-Public-Key muss zum Private-Key passen. Niemals `NEXT_PUBLIC_` fuer
Schluessel verwenden. Demo- und E23-Origin muessen unterschiedlich sein. HTTP ist
ausschliesslich fuer explizite localhost/Loopback-Testkonfigurationen erlaubt.

Flag und Origins bereits beim Build setzen: Next.js erzeugt daraus die CSP.
Aenderungen daran brauchen einen neuen Build/Deployment. Keine Wildcard fuer
Vercel-Preview-Domains; Staging separat konfigurieren.

`/ki-demo` wird hinter dem vorhandenen Login angeboten. Der Browser erhaelt erst
nach einem kontrollierten iframe-Handshake ein 60-Sekunden-Einmalticket. Das
Backend tauscht es gegen eine 15-Minuten-Session. Tokens nicht in URLs oder Storage.
Der separate Demo-Cookie ist signiert und an den bestehenden E23-Cookie gebunden.

Beim Logout werden beide Cookies entfernt und die Demo-Sitzung mit maximal einer
Sekunde Netzwerkwartezeit widerrufen. Bei nicht erreichbarem Backend endet ein
vorhandener API-Zugang spaetestens nach 15 Minuten. Ein reiner Passwortwechsel
entwertet bestehende E23-Cookies nicht: bei Kompromittierung auch SESSION_SECRET
rotieren, die gemeinsame Demo-Epoch erhoehen und Backend-Sessions widerrufen.

Tests `tests/chat-demo.test.mjs` sind bewusst opt-in mit `E23_TEST_PASSWORD`,
`TEST_BASE_URL` und optional `DEMO_TEST_API_URL`. Nur gegen eine lokale/staging
Instanz mit synthetischen Testdaten ausfuehren. Die bestehende Neon-Datenbank
wurde fuer diese Erweiterung weder migriert noch fuer Tests verwendet.
