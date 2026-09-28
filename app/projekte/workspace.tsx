"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Plus,
  Lightbulb,
  Layers3,
  MessageCircle,
  ArrowRight,
  CalendarDays,
  UserRound,
  X,
  Pencil,
  Link2,
  RefreshCw,
  Circle,
  CircleCheck,
  CircleDashed,
  Archive,
  Search,
  Check,
  Sparkles,
} from "lucide-react";
import type { WorkItem, Detail, Task, TaskStatus } from "@/lib/workspace/types";

type Filter = "all" | "project" | "idea" | "completed" | "archived";
type Editor =
  | { type: "item"; item?: WorkItem; kind?: "idea" | "project" }
  | { type: "task"; task?: Task };
const states: Record<TaskStatus, string> = {
  todo: "Offen",
  doing: "In Arbeit",
  done: "Erledigt",
};
const dateLabel = (date: string | null) =>
  date
    ? new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "short",
      }).format(new Date(date.slice(0, 10) + "T12:00:00"))
    : "";
const dateInput = (date: string | null) => date?.slice(0, 10) || "";
const progress = (item: WorkItem) =>
  item.task_count ? Math.round((item.done_count / item.task_count) * 100) : 0;
const values = (form: HTMLFormElement) =>
  Object.fromEntries(new FormData(form).entries());
async function api(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, cache: "no-store" });
  const body = await response.json();
  if (!response.ok) {
    if (response.status === 401)
      throw new Error(
        "Deine Sitzung ist abgelaufen. Bitte melde dich auf der Startseite erneut an.",
      );
    throw new Error(body.error || "Das hat leider nicht funktioniert.");
  }
  return body;
}
function EditorDialog({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      className="ws-dialog"
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      aria-labelledby="editor-title"
    >
      <div className="ws-dialog-head">
        <h2 id="editor-title">{title}</h2>
        <button
          type="button"
          className="ws-icon"
          aria-label="Schließen"
          onClick={close}
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export default function Workspace() {
  const router = useRouter();
  const params = useSearchParams();
  const selected = params.get("projekt");
  const [items, setItems] = useState<WorkItem[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [formError, setFormError] = useState("");
  const [author, setAuthor] = useState("");
  const sequence = useRef(0);
  const load = useCallback(
    async (quiet = false) => {
      const seq = ++sequence.current;
      if (!quiet) setLoading(true);
      try {
        const [list, current] = await Promise.all([
          api("/api/workspace"),
          selected
            ? api("/api/workspace?id=" + encodeURIComponent(selected))
            : Promise.resolve(null),
        ]);
        if (seq === sequence.current) {
          setItems(list.items);
          setDetail(current);
          setError("");
        }
      } catch (e) {
        if (seq === sequence.current) setError((e as Error).message);
      } finally {
        if (seq === sequence.current) setLoading(false);
      }
    },
    [selected],
  );
  useEffect(() => {
    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load(true);
    }, 20000);
    const focus = () => void load(true);
    window.addEventListener("focus", focus);
    return () => {
      sequence.current++;
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [load]);
  useEffect(() => {
    try {
      setAuthor(localStorage.getItem("e23-display-name") || "");
    } catch {}
  }, []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);
  async function mutate(data: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const result = await api("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await load(true);
      return result;
    } finally {
      setBusy(false);
    }
  }
  const open = (id: string) => router.push("/projekte?projekt=" + id);
  const showEditor = (value: Editor) => {
    setFormError("");
    setEditor(value);
  };
  async function saveEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || busy) return;
    setFormError("");
    const fields = values(event.currentTarget);
    try {
      if (editor.type === "item") {
        const old = editor.item;
        const result = await mutate({
          ...fields,
          action: old ? "update" : "create",
          ...(old ? { id: old.id, version: old.version } : {}),
        });
        setEditor(null);
        if (!old) open(result.id);
        setNotice("Vorhaben gespeichert.");
      } else {
        const old = editor.task;
        await mutate({
          ...fields,
          action: old ? "task-update" : "task-create",
          ...(old
            ? { id: old.id, version: old.version }
            : { itemId: selected }),
        });
        setEditor(null);
        setNotice("Aufgabe gespeichert.");
      }
    } catch (e) {
      setFormError((e as Error).message);
    }
  }
  async function taskStatus(task: Task, status: TaskStatus) {
    try {
      await mutate({
        action: "task-update",
        id: task.id,
        version: task.version,
        title: task.title,
        assignee: task.assignee,
        due: dateInput(task.due),
        status,
      });
      setNotice("Aufgabenstatus aktualisiert.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function comment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = values(form);
    try {
      await mutate({ action: "comment", itemId: selected, ...fields });
      try {
        localStorage.setItem("e23-display-name", String(fields.author));
      } catch {}
      form.reset();
      setAuthor(String(fields.author));
      setNotice("Dein Gedanke ist geteilt.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const active = items.filter((i) => i.status === "active");
  const visible = items.filter(
    (i) =>
      (filter === "all"
        ? i.status === "active"
        : filter === "idea" || filter === "project"
          ? i.kind === filter && i.status === "active"
          : i.status === filter) &&
      `${i.title} ${i.description} ${i.owner}`
        .toLocaleLowerCase("de")
        .includes(search.toLocaleLowerCase("de")),
  );
  const current = detail?.item.id === selected ? detail : null;
  return (
    <div className="workspace">
      <a className="skip-link" href="#workspace-main">
        Zum Projektbereich
      </a>
      <header className="ws-header">
        <a href="/" className="wordmark" aria-label="E23 Manifest">
          E23<span>.</span>
        </a>
        <nav aria-label="Hauptnavigation">
          <a href="/">
            Manifest <ArrowUpRight size={14} />
          </a>
          <a href="/projekte" aria-current="page">
            Projekte & Ideen
          </a>
        </nav>
        <span className="ws-header-note">
          <span /> Ein gemeinsamer Arbeitsraum
        </span>
      </header>
      <div className="ws-layout">
        <aside className="ws-sidebar">
          <span className="ws-eyebrow">Unser Labor</span>
          <div className="ws-filters">
            {(
              [
                ["all", "Alles im Blick", Layers3],
                ["project", "Projekte", CircleDashed],
                ["idea", "Ideen", Lightbulb],
                ["completed", "Abgeschlossen", CircleCheck],
                ["archived", "Archiv", Archive],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                className={filter === key && !selected ? "selected" : ""}
                aria-pressed={filter === key && !selected}
                onClick={() => {
                  setFilter(key);
                  if (selected) router.push("/projekte");
                }}
              >
                <Icon size={18} />
                {label}
                <span>
                  {
                    items.filter((i) =>
                      key === "all"
                        ? i.status === "active"
                        : key === "project" || key === "idea"
                          ? i.kind === key && i.status === "active"
                          : i.status === key,
                    ).length
                  }
                </span>
              </button>
            ))}
          </div>
          <div className="ws-sidebar-note">
            <Sparkles size={25} />
            <p>
              Eine Idee ist
              <br />
              ein guter Anfang.
            </p>
            <span>
              Was könnte entstehen,
              <br />
              wenn wir sie teilen?
            </span>
          </div>
          <a className="ws-back" href="/">
            <ArrowLeft size={15} /> Zum Manifest
          </a>
        </aside>
        <main id="workspace-main" className="ws-main">
          {error && (
            <div className="ws-error" role="alert">
              <span>{error}</span>
              <button onClick={() => void load()}>
                <RefreshCw size={16} /> Neu laden
              </button>
              <a href="/?next=projekte">Zur Anmeldung</a>
            </div>
          )}
          {!selected ? (
            <>
              <section className="ws-intro">
                <div>
                  <span className="ws-eyebrow">
                    Von der Möglichkeit ins Machen
                  </span>
                  <h1>
                    Unser Labor<span>.</span>
                  </h1>
                  <p>Ideen teilen. Gemeinsam anfangen. Dinge weiterbringen.</p>
                </div>
                <button
                  className="ws-primary"
                  onClick={() => showEditor({ type: "item", kind: "project" })}
                >
                  <Plus size={18} /> Neues Projekt
                </button>
              </section>
              <div className="ws-overview">
                <div>
                  <strong>
                    {active
                      .filter((i) => i.kind === "project")
                      .length.toString()
                      .padStart(2, "0")}
                  </strong>
                  <span>Projekte in Bewegung</span>
                </div>
                <div>
                  <strong>
                    {active
                      .filter((i) => i.kind === "idea")
                      .length.toString()
                      .padStart(2, "0")}
                  </strong>
                  <span>Ideen mit Potenzial</span>
                </div>
                <div>
                  <strong>
                    {active
                      .reduce((s, i) => s + i.task_count - i.done_count, 0)
                      .toString()
                      .padStart(2, "0")}
                  </strong>
                  <span>Nächste Schritte</span>
                </div>
                <button
                  className="ws-idea-invite"
                  onClick={() => showEditor({ type: "item", kind: "idea" })}
                >
                  <Lightbulb size={25} />
                  <span>
                    Was geht dir
                    <br />
                    durch den Kopf?
                  </span>
                  <Plus size={21} />
                </button>
              </div>
              <div className="ws-list-head">
                <h2>
                  {
                    {
                      all: "Gemeinsam weiterdenken",
                      project: "Projekte in Bewegung",
                      idea: "Raum für Ideen",
                      completed: "Was wir geschafft haben",
                      archived: "Unser Archiv",
                    }[filter]
                  }{" "}
                  <span>{visible.length}</span>
                </h2>
                <label className="ws-search">
                  <Search size={17} />
                  <input
                    aria-label="Vorhaben suchen"
                    placeholder="Titel, Idee oder Name suchen"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              </div>
              {loading && items.length === 0 ? (
                <div className="ws-loading" role="status">
                  Vorhaben werden geladen …
                </div>
              ) : !visible.length ? (
                <section className="ws-empty">
                  <div className="ws-empty-mark" aria-hidden="true">
                    <span />
                    <span />
                    <Plus size={30} />
                  </div>
                  <h3>
                    {search
                      ? "Hier haben wir noch nichts gefunden."
                      : filter === "archived"
                        ? "Noch nichts im Archiv."
                        : filter === "completed"
                          ? "Die ersten Erfolge liegen vor uns."
                          : "Hier beginnt etwas Neues."}
                  </h3>
                  <p>
                    {search
                      ? "Versuche einen anderen Suchbegriff."
                      : "Eine Frage, eine Idee, ein gemeinsames Vorhaben. Gebt dem ersten Gedanken einen Platz."}
                  </p>
                  {!search &&
                    filter !== "archived" &&
                    filter !== "completed" && (
                      <button
                        className="ws-secondary"
                        onClick={() =>
                          showEditor({
                            type: "item",
                            kind: filter === "project" ? "project" : "idea",
                          })
                        }
                      >
                        <Plus size={16} />{" "}
                        {filter === "project"
                          ? "Erstes Projekt anlegen"
                          : "Erste Idee teilen"}
                      </button>
                    )}
                </section>
              ) : (
                <div className="ws-grid">
                  {visible.map((item) => (
                    <a
                      className={`ws-card ${item.kind}`}
                      key={item.id}
                      href={"/projekte?projekt=" + item.id}
                    >
                      <div className="ws-card-top">
                        <span className="ws-card-icon">
                          {item.kind === "idea" ? (
                            <Lightbulb size={23} />
                          ) : (
                            <Layers3 size={23} />
                          )}
                        </span>
                        <span className="ws-kind">
                          {item.status === "archived"
                            ? "Archiviert"
                            : item.status === "completed"
                              ? "Abgeschlossen"
                              : item.kind === "idea"
                                ? "Idee"
                                : "Projekt"}
                        </span>
                        <ArrowUpRight size={18} />
                      </div>
                      <h3>{item.title}</h3>
                      <p>
                        {item.description ||
                          "Noch offen, was daraus wird. Hier ist Platz zum Weiterdenken."}
                      </p>
                      <div className="ws-card-bottom">
                        <div className="ws-progress-label">
                          <span>
                            {item.task_count
                              ? `${item.done_count} von ${item.task_count} Aufgaben`
                              : "Noch keine Aufgaben"}
                          </span>
                          <strong>{progress(item)}%</strong>
                        </div>
                        <div
                          className="ws-progress"
                          role="progressbar"
                          aria-label={`Aufgabenfortschritt ${item.title}`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={progress(item)}
                        >
                          <span style={{ width: progress(item) + "%" }} />
                        </div>
                        <div className="ws-meta">
                          <span>
                            <UserRound size={14} />
                            {item.owner || "Gemeinsam"}
                          </span>
                          {item.due && (
                            <span>
                              <CalendarDays size={14} />
                              {dateLabel(item.due)}
                            </span>
                          )}
                          <span>
                            <MessageCircle size={14} />
                            {item.comment_count}
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </>
          ) : !current ? (
            <div className="ws-loading" role="status">
              {loading
                ? "Vorhaben wird geöffnet …"
                : "Das Vorhaben konnte nicht geladen werden."}
              <button
                className="ws-secondary"
                onClick={() => router.push("/projekte")}
              >
                Zur Übersicht
              </button>
            </div>
          ) : (
            <>
              <div className="ws-detail-top">
                <button
                  className="ws-text-button"
                  onClick={() => router.push("/projekte")}
                >
                  <ArrowLeft size={17} /> Alle Vorhaben
                </button>
                <button
                  className="ws-text-button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      setNotice(
                        "Link kopiert. Der Zugang bleibt passwortgeschützt.",
                      );
                    } catch {
                      setError(
                        "Der Link konnte nicht kopiert werden. Du kannst die Adresse aus der Browserzeile teilen.",
                      );
                    }
                  }}
                >
                  <Link2 size={16} /> Link teilen
                </button>
              </div>
              <section className="ws-project-head">
                <span className="ws-eyebrow">
                  {current.item.kind === "idea"
                    ? "Eine Idee mit Potenzial"
                    : "Ein gemeinsames Projekt"}{" "}
                  ·{" "}
                  {current.item.status === "active"
                    ? "Aktiv"
                    : current.item.status === "completed"
                      ? "Abgeschlossen"
                      : "Archiviert"}
                </span>
                <div className="ws-title-row">
                  <h1>{current.item.title}</h1>
                  <button
                    className="ws-secondary"
                    onClick={() =>
                      showEditor({ type: "item", item: current.item })
                    }
                  >
                    <Pencil size={16} /> Bearbeiten
                  </button>
                </div>
                <p className="ws-description">
                  {current.item.description ||
                    "Noch keine Beschreibung. Was möchtet ihr gemeinsam möglich machen?"}
                </p>
                <div className="ws-project-meta">
                  <span>
                    <UserRound size={16} />
                    {current.item.owner || "Zuständigkeit noch offen"}
                  </span>
                  <span>
                    <CalendarDays size={16} />
                    {current.item.due
                      ? dateLabel(current.item.due)
                      : "Ohne festen Termin"}
                  </span>
                  <span>
                    {current.item.kind === "idea"
                      ? "Im Bearbeiten-Dialog könnt ihr daraus ein Projekt machen."
                      : "Schritt für Schritt gemeinsam weiter."}
                  </span>
                </div>
              </section>
              <section className="ws-board-section">
                <div className="ws-list-head">
                  <div>
                    <h2>Nächste Schritte</h2>
                    <p>
                      {current.item.done_count} von {current.item.task_count}{" "}
                      Aufgaben erledigt · {progress(current.item)}%
                    </p>
                  </div>
                  <button
                    className="ws-primary"
                    disabled={busy || current.item.status !== "active"}
                    onClick={() => showEditor({ type: "task" })}
                  >
                    <Plus size={17} /> Aufgabe hinzufügen
                  </button>
                </div>
                <div
                  className="ws-progress ws-project-progress"
                  role="progressbar"
                  aria-label="Aufgabenfortschritt"
                  aria-valuenow={progress(current.item)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span style={{ width: progress(current.item) + "%" }} />
                </div>
                <div className="ws-board">
                  {(["todo", "doing", "done"] as const).map((status) => (
                    <section key={status} className={`ws-column ${status}`}>
                      <h3>
                        {status === "done" ? (
                          <CircleCheck size={16} />
                        ) : status === "doing" ? (
                          <CircleDashed size={16} />
                        ) : (
                          <Circle size={16} />
                        )}{" "}
                        {states[status]}
                        <span>
                          {
                            current.tasks.filter((t) => t.status === status)
                              .length
                          }
                        </span>
                      </h3>
                      <div className="ws-task-list">
                        {current.tasks
                          .filter((t) => t.status === status)
                          .map((task) => (
                            <article className="ws-task" key={task.id}>
                              <button
                                className="ws-task-title"
                                onClick={() =>
                                  showEditor({ type: "task", task })
                                }
                                aria-label={`Aufgabe bearbeiten: ${task.title}`}
                              >
                                {task.title}
                                <Pencil size={13} />
                              </button>
                              <div className="ws-task-meta">
                                <span>
                                  {task.assignee || "Noch nicht vergeben"}
                                </span>
                                {task.due && <span>{dateLabel(task.due)}</span>}
                              </div>
                              <label className="ws-status-select">
                                <span className="sr-only">
                                  Status für {task.title}
                                </span>
                                <select
                                  disabled={busy}
                                  value={task.status}
                                  onChange={(e) =>
                                    void taskStatus(
                                      task,
                                      e.target.value as TaskStatus,
                                    )
                                  }
                                >
                                  {Object.entries(states).map(
                                    ([key, label]) => (
                                      <option key={key} value={key}>
                                        {label}
                                      </option>
                                    ),
                                  )}
                                </select>
                                <ArrowRight size={13} />
                              </label>
                            </article>
                          ))}
                        {!current.tasks.some((t) => t.status === status) && (
                          <p className="ws-column-empty">
                            {status === "todo"
                              ? "Was ist der nächste Schritt?"
                              : status === "doing"
                                ? "Hier kommt Bewegung rein."
                                : "Hier werden Fortschritte sichtbar."}
                          </p>
                        )}
                      </div>
                    </section>
                  ))}
                </div>
              </section>
              <section className="ws-conversation">
                <div>
                  <span className="ws-eyebrow">Miteinander weiterdenken</span>
                  <h2>
                    Das Gespräch
                    <br />
                    geht weiter<span>.</span>
                  </h2>
                  <p>
                    Fragen, neue Perspektiven oder ein kurzer Zwischenstand:
                    Hier haben sie Platz.
                  </p>
                </div>
                <div className="ws-comments">
                  <div className="ws-comment-list">
                    {current.comments.length ? (
                      current.comments.map((c) => (
                        <article className="ws-comment" key={c.id}>
                          <div className="ws-avatar" aria-hidden="true">
                            {c.author.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <header>
                              <strong>{c.author}</strong>
                              <time dateTime={c.created_at}>
                                {new Intl.DateTimeFormat("de-DE", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }).format(new Date(c.created_at))}
                              </time>
                            </header>
                            <p>{c.body}</p>
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="ws-no-comments">
                        Noch ist es still. Welchen Gedanken möchtest du teilen?
                      </p>
                    )}
                  </div>
                  <form className="ws-comment-form" onSubmit={comment}>
                    <label>
                      Dein Name
                      <input
                        name="author"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        required
                        maxLength={80}
                        placeholder="Wie heißt du?"
                      />
                    </label>
                    <label>
                      Dein Beitrag
                      <textarea
                        name="body"
                        required
                        maxLength={4000}
                        rows={4}
                        placeholder="Ein Gedanke, eine Frage, ein nächster Schritt …"
                      />
                    </label>
                    <div>
                      <span>Für alle im E23 sichtbar.</span>
                      <button
                        className="ws-primary"
                        disabled={busy}
                        type="submit"
                      >
                        {busy ? "Wird gespeichert …" : "Gedanken teilen"}
                        <ArrowUpRight size={16} />
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            </>
          )}
          <footer className="ws-footer">
            <span>E23 · Mehr möglich. Miteinander.</span>
            <span>Gemeinsamer Stand · aktualisiert sich alle 20 Sekunden</span>
          </footer>
        </main>
      </div>
      {notice && (
        <div className="ws-toast" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
      {editor && (
        <EditorDialog
          title={
            editor.type === "item"
              ? editor.item
                ? "Vorhaben bearbeiten"
                : editor.kind === "idea"
                  ? "Eine Idee teilen"
                  : "Ein Projekt beginnen"
              : editor.task
                ? "Aufgabe bearbeiten"
                : "Ein nächster Schritt"
          }
          close={() => {
            if (!busy) setEditor(null);
          }}
        >
          <form className="ws-editor-form" onSubmit={saveEditor}>
            {formError && (
              <div className="ws-form-error" role="alert">
                {formError}
              </div>
            )}
            <label>
              Titel
              <input
                name="title"
                defaultValue={
                  editor.type === "item"
                    ? editor.item?.title
                    : editor.task?.title
                }
                required
                maxLength={160}
                autoFocus
                placeholder={
                  editor.type === "item"
                    ? "Was möchtet ihr möglich machen?"
                    : "Was ist zu tun?"
                }
              />
            </label>
            {editor.type === "item" ? (
              <>
                <label>
                  Beschreibung
                  <textarea
                    name="description"
                    defaultValue={editor.item?.description}
                    maxLength={8000}
                    rows={5}
                    placeholder="Worum geht es? Was wäre ein guter erster Schritt?"
                  />
                </label>
                <div className="ws-form-row">
                  <label>
                    Art
                    <select
                      name="kind"
                      defaultValue={
                        editor.item?.kind || editor.kind || "project"
                      }
                    >
                      <option value="idea">Idee</option>
                      <option value="project">Projekt</option>
                    </select>
                  </label>
                  <label>
                    Zuständig
                    <input
                      name="owner"
                      defaultValue={editor.item?.owner}
                      maxLength={80}
                      placeholder="Name oder Team"
                    />
                  </label>
                </div>
                <div className="ws-form-row">
                  <label>
                    Zieldatum
                    <input
                      name="due"
                      type="date"
                      defaultValue={dateInput(editor.item?.due || null)}
                    />
                  </label>
                  {editor.item && (
                    <label>
                      Status
                      <select name="status" defaultValue={editor.item.status}>
                        <option value="active">Aktiv</option>
                        <option value="completed">Abgeschlossen</option>
                        <option value="archived">Archiviert</option>
                      </select>
                    </label>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="ws-form-row">
                  <label>
                    Zuständig
                    <input
                      name="assignee"
                      defaultValue={editor.task?.assignee}
                      maxLength={80}
                      placeholder="Name oder Team"
                    />
                  </label>
                  <label>
                    Termin
                    <input
                      name="due"
                      type="date"
                      defaultValue={dateInput(editor.task?.due || null)}
                    />
                  </label>
                </div>
                {editor.task && (
                  <label>
                    Status
                    <select name="status" defaultValue={editor.task.status}>
                      {Object.entries(states).map(([k, v]) => (
                        <option value={k} key={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </>
            )}
            <div className="ws-dialog-actions">
              <button
                type="button"
                className="ws-secondary"
                onClick={() => setEditor(null)}
                disabled={busy}
              >
                Abbrechen
              </button>
              <button type="submit" className="ws-primary" disabled={busy}>
                {busy
                  ? "Wird gespeichert …"
                  : (editor.type === "item" ? editor.item : editor.task)
                    ? "Änderungen speichern"
                    : "Gemeinsam loslegen"}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </EditorDialog>
      )}
    </div>
  );
}
