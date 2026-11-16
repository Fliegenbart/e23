"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Layers3,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import type { WorkItem } from "@/lib/workspace/types";
import { stages, type Contact, type ContactKind } from "@/lib/contacts-shared";
import { api, dateLabel, EditorDialog, values } from "./shared";

type Filter = "alle" | ContactKind;
const stageLabel = Object.fromEntries(stages.map((s) => [s.id, s.label]));
const today = () => new Date().toISOString().slice(0, 10);

/** Leads and contacts of the house: who we talk to and what comes next. */
export default function Contacts({
  projects,
  notify,
}: {
  projects: WorkItem[];
  notify: (text: string) => void;
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<Filter>("alle");
  const [stage, setStage] = useState("");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<{ contact?: Contact } | null>(null);
  const [kind, setKind] = useState<ContactKind>("lead");
  const [formError, setFormError] = useState("");
  const sequence = useRef(0);

  const load = useCallback(async () => {
    const seq = ++sequence.current;
    try {
      const data = await api("/api/contacts");
      if (seq === sequence.current) {
        setContacts(data.contacts);
        setError("");
      }
    } catch (e) {
      if (seq === sequence.current) setError((e as Error).message);
    } finally {
      if (seq === sequence.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    const focus = () => void load();
    window.addEventListener("focus", focus);
    return () => {
      sequence.current++;
      window.removeEventListener("focus", focus);
    };
  }, [load]);

  async function mutate(data: Record<string, unknown>) {
    setBusy(true);
    try {
      await api("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }
  const show = (contact?: Contact) => {
    setFormError("");
    setKind(contact?.kind ?? (filter === "kontakt" ? "kontakt" : "lead"));
    setEditor({ contact });
  };
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || busy) return;
    setFormError("");
    const old = editor.contact;
    try {
      await mutate({
        stage: old?.stage ?? "neu",
        ...values(event.currentTarget),
        action: old ? "update" : "create",
        ...(old ? { id: old.id, version: old.version } : {}),
      });
      setEditor(null);
      notify(kind === "lead" ? "Lead gespeichert." : "Kontakt gespeichert.");
    } catch (e) {
      setFormError((e as Error).message);
    }
  }
  async function remove(contact: Contact) {
    if (busy || !window.confirm(`„${contact.name}“ wirklich löschen?`)) return;
    setFormError("");
    try {
      await mutate({
        action: "delete",
        id: contact.id,
        version: contact.version,
      });
      setEditor(null);
      notify("Eintrag gelöscht.");
    } catch (e) {
      setFormError((e as Error).message);
    }
  }

  const needle = search.toLocaleLowerCase("de");
  const visible = contacts.filter(
    (c) =>
      (filter === "alle" || c.kind === filter) &&
      (!stage || (c.kind === "lead" && c.stage === stage)) &&
      `${c.name} ${c.company} ${c.role} ${c.email} ${c.owner} ${c.source} ${c.next_step} ${c.note}`
        .toLocaleLowerCase("de")
        .includes(needle),
  );
  const leads = contacts.filter((c) => c.kind === "lead");
  const open = leads.filter(
    (c) => c.stage !== "gewonnen" && c.stage !== "ruhend",
  );
  const due = contacts.filter((c) => c.next_date && c.next_date <= today());
  const count = (n: number) => n.toString().padStart(2, "0");

  return (
    <>
      <section className="ws-intro">
        <div>
          <span className="ws-eyebrow">Mit wem wir im Gespräch sind</span>
          <h1>
            Leads & Kontakte<span>.</span>
          </h1>
          <p>Wer interessiert sich für uns? Was ist der nächste Schritt?</p>
        </div>
        <button className="ws-primary" onClick={() => show()}>
          <Plus size={18} /> Neuer Eintrag
        </button>
      </section>
      {error && (
        <div className="ws-error" role="alert">
          <span>{error}</span>
          <button onClick={() => void load()}>Neu laden</button>
        </div>
      )}
      <div className="ws-overview ws-contact-overview">
        <div>
          <strong>{count(open.length)}</strong>
          <span>Offene Leads</span>
        </div>
        <div>
          <strong>
            {count(leads.filter((c) => c.stage === "gewonnen").length)}
          </strong>
          <span>Gewonnen</span>
        </div>
        <div>
          <strong>{count(contacts.length - leads.length)}</strong>
          <span>Kontakte</span>
        </div>
        <div>
          <strong>{count(due.length)}</strong>
          <span>Nächste Schritte fällig</span>
        </div>
      </div>
      <div className="ws-list-head">
        <div className="ws-chips" role="group" aria-label="Art">
          {(
            [
              ["alle", "Alle"],
              ["lead", "Leads"],
              ["kontakt", "Kontakte"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              className={filter === key ? "selected" : ""}
              aria-pressed={filter === key}
              onClick={() => {
                setFilter(key);
                if (key === "kontakt") setStage("");
              }}
            >
              {label}
              <span>
                {key === "alle"
                  ? contacts.length
                  : contacts.filter((c) => c.kind === key).length}
              </span>
            </button>
          ))}
          {filter !== "kontakt" && (
            <label className="ws-chip-select">
              <span className="sr-only">Stand</span>
              <select value={stage} onChange={(e) => setStage(e.target.value)}>
                <option value="">Jeder Stand</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <label className="ws-search">
          <Search size={17} />
          <input
            aria-label="Leads und Kontakte suchen"
            placeholder="Name, Firma oder Stichwort suchen"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {loading ? (
        <div className="ws-loading" role="status">
          Kontakte werden geladen …
        </div>
      ) : !visible.length ? (
        <section className="ws-empty">
          <h3>
            {contacts.length
              ? "Hier haben wir nichts gefunden."
              : "Noch kein Eintrag."}
          </h3>
          <p>
            {contacts.length
              ? "Versuche einen anderen Suchbegriff oder Filter."
              : "Wer hat Interesse gezeigt, wen wollt ihr ansprechen? Tragt die erste Person ein."}
          </p>
          {!contacts.length && (
            <button className="ws-secondary" onClick={() => show()}>
              <Plus size={16} /> Ersten Eintrag anlegen
            </button>
          )}
        </section>
      ) : (
        <ul className="ws-contacts">
          {visible.map((c) => {
            const project = projects.find((p) => p.id === c.item_id);
            const late = !!c.next_date && c.next_date < today();
            return (
              <li key={c.id} className="ws-contact">
                <div className="ws-contact-who">
                  <button
                    className="ws-contact-name"
                    onClick={() => show(c)}
                    aria-label={`Bearbeiten: ${c.name}`}
                  >
                    {c.name}
                  </button>
                  {(c.company || c.role) && (
                    <span>
                      <Building2 size={12} aria-hidden="true" />
                      {[c.role, c.company].filter(Boolean).join(" · ")}
                    </span>
                  )}
                  <span className="ws-contact-links">
                    {c.email && (
                      <a href={`mailto:${c.email}`}>
                        <Mail size={12} aria-hidden="true" />
                        {c.email}
                      </a>
                    )}
                    {c.phone && (
                      <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}>
                        <Phone size={12} aria-hidden="true" />
                        {c.phone}
                      </a>
                    )}
                  </span>
                </div>
                <div className="ws-contact-state">
                  <span
                    className={`ws-stage ${c.kind === "lead" ? c.stage : "kontakt"}`}
                  >
                    {c.kind === "lead" ? stageLabel[c.stage] : "Kontakt"}
                  </span>
                  {c.source && <span>über {c.source}</span>}
                </div>
                <div className="ws-contact-next">
                  {c.next_step ? (
                    <strong>{c.next_step}</strong>
                  ) : (
                    <span>Kein nächster Schritt</span>
                  )}
                  {c.next_date && (
                    <span className={late ? "overdue" : ""}>
                      <CalendarDays size={12} aria-hidden="true" />
                      {dateLabel(c.next_date)}
                      {late && " · überfällig"}
                    </span>
                  )}
                  {c.note && <p>{c.note}</p>}
                </div>
                <div className="ws-contact-meta">
                  <span>
                    <UserRound size={12} aria-hidden="true" />
                    {c.owner || "Noch offen"}
                  </span>
                  {project && (
                    <a href={"/projekte?projekt=" + project.id}>
                      <Layers3 size={12} aria-hidden="true" />
                      {project.title}
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {editor && (
        <EditorDialog
          title={
            editor.contact
              ? "Eintrag bearbeiten"
              : kind === "lead"
                ? "Neuer Lead"
                : "Neuer Kontakt"
          }
          close={() => {
            if (!busy) setEditor(null);
          }}
          wide
        >
          <form className="ws-editor-form" onSubmit={save}>
            {formError && (
              <div className="ws-form-error" role="alert">
                {formError}
              </div>
            )}
            <div className="ws-form-row">
              <label>
                Name
                <input
                  name="name"
                  defaultValue={editor.contact?.name}
                  required
                  maxLength={120}
                  autoFocus
                  placeholder="Vor- und Nachname"
                />
              </label>
              <label>
                Art
                <select
                  name="kind"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as ContactKind)}
                >
                  <option value="lead">Lead – mögliches Geschäft</option>
                  <option value="kontakt">Kontakt – Netzwerk</option>
                </select>
              </label>
            </div>
            <div className="ws-form-row">
              <label>
                Firma
                <input
                  name="company"
                  defaultValue={editor.contact?.company}
                  maxLength={120}
                />
              </label>
              <label>
                Funktion
                <input
                  name="role"
                  defaultValue={editor.contact?.role}
                  maxLength={120}
                  placeholder="z. B. Geschäftsführerin"
                />
              </label>
            </div>
            <div className="ws-form-row">
              <label>
                E-Mail
                <input
                  name="email"
                  type="email"
                  defaultValue={editor.contact?.email}
                  maxLength={200}
                />
              </label>
              <label>
                Telefon
                <input
                  name="phone"
                  type="tel"
                  defaultValue={editor.contact?.phone}
                  maxLength={60}
                />
              </label>
            </div>
            <div className="ws-form-row">
              {kind === "lead" && (
                <label>
                  Stand
                  <select
                    name="stage"
                    defaultValue={editor.contact?.stage || "neu"}
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Woher kennen wir uns?
                <input
                  name="source"
                  defaultValue={editor.contact?.source}
                  maxLength={120}
                  placeholder="z. B. Empfehlung, Workshop, Netzwerk"
                />
              </label>
            </div>
            <div className="ws-form-row">
              <label>
                Nächster Schritt
                <input
                  name="next_step"
                  defaultValue={editor.contact?.next_step}
                  maxLength={200}
                  placeholder="z. B. Angebot schicken"
                />
              </label>
              <label>
                Bis wann
                <input
                  name="next_date"
                  type="date"
                  defaultValue={editor.contact?.next_date || ""}
                />
              </label>
            </div>
            <div className="ws-form-row">
              <label>
                Zuständig bei uns
                <input
                  name="owner"
                  defaultValue={editor.contact?.owner}
                  maxLength={80}
                  placeholder="Name"
                />
              </label>
              <label>
                Gehört zu Projekt
                <select
                  name="item_id"
                  defaultValue={
                    projects.some((p) => p.id === editor.contact?.item_id)
                      ? (editor.contact?.item_id ?? "")
                      : ""
                  }
                >
                  <option value="">Kein Projekt</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Notizen
              <textarea
                name="note"
                defaultValue={editor.contact?.note}
                maxLength={4000}
                rows={5}
                placeholder="Worum geht es? Was wurde besprochen? Was ist der Person wichtig?"
              />
            </label>
            <div className="ws-dialog-actions">
              {editor.contact && (
                <button
                  type="button"
                  className="ws-text-button ws-delete"
                  disabled={busy}
                  onClick={() => editor.contact && void remove(editor.contact)}
                >
                  <Trash2 size={15} /> Löschen
                </button>
              )}
              <button
                type="button"
                className="ws-secondary"
                onClick={() => setEditor(null)}
                disabled={busy}
              >
                Abbrechen
              </button>
              <button type="submit" className="ws-primary" disabled={busy}>
                {busy ? "Wird gespeichert …" : "Speichern"}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </EditorDialog>
      )}
    </>
  );
}
