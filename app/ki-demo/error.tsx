"use client";
export default function DemoError({ reset }: { reset: () => void }) {
  return (
    <main className="gate">
      <h1>Die Demo ist gerade nicht verfügbar.</h1>
      <p>Die übrige E23-Website bleibt nutzbar.</p>
      <button onClick={reset}>Erneut versuchen</button>
      <a href="/">Zurück zu E23</a>
    </main>
  );
}
