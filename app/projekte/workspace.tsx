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
  FolderOpen,
  ListChecks,
  Trash2,
  GripVertical,
} from "lucide-react";
import type {
  WorkItem,
  Detail,
  Task,
  TaskStatus,
  TaskPriority,
  ChecklistItem,
} from "@/lib/workspace/types";

type Filter = "all" | "project" | "idea" | "completed" | "archived";
type Editor =
  | { type: "item"; item?: WorkItem; kind?: "idea" | "project" }
  | { type: "task"; task?: Task };
const states: Record<TaskStatus, string> = {
  todo: "Offen",
  doing: "In Arbeit",
  done: "Erledigt",
};
const priorities: Record<TaskPriority, string> = {
  high: "Hoch",
  normal: "Normal",
  low: "Niedrig",
};
const pointSteps = [0, 1, 2, 3, 5, 8, 13];
const labelList = (labels: string) => [
  ...new Set(
    (labels || "")
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean),
  ),
];
const overdue = (task: Task) =>
  !!task.due &&
  task.status !== "done" &&
  task.due.slice(0, 10) < new Date().toISOString().slice(0, 10);
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
  wide,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      className={wide ? "ws-dialog wide" : "ws-dialog"}
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

/** Detail fields of one task; the checklist travels as JSON in a hidden input. */
function TaskFields({ task }: { task?: Task }) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    task?.checklist ?? [],
  );
  const [draft, setDraft] = useState("");
  const add = () => {
    const text = draft.trim();
    if (!text || checklist.length >= 40) return;
    setChecklist([...checklist, { text, done: false }]);
    setDraft("");
  };
  const done = checklist.filter((c) => c.done).length;
  return (
    <>
      <label>
        Beschreibung
        <textarea
          name="description"
          defaultValue={task?.description}
          maxLength={8000}
          rows={7}
          placeholder="Worum geht es? Was ist das Ziel, was gehört dazu, was nicht? Links, Kontext, offene Fragen …"
        />
      </label>
      <fieldset className="ws-checklist">
        <legend>
          Teilschritte
          {checklist.length > 0 && (
            <span>
              {done} von {checklist.length} erledigt
            </span>
          )}
        </legend>
        <input
          type="hidden"
          name="checklist"
          value={JSON.stringify(checklist.filter((c) => c.text.trim()))}
        />
        {checklist.map((entry, i) => (
          <div className="ws-check-row" key={i}>
            <input
              type="checkbox"
              checked={entry.done}
              aria-label={`Erledigt: ${entry.text}`}
              onChange={(e) =>
                setChecklist(
                  checklist.map((c, j) =>
                    j === i ? { ...c, done: e.target.checked } : c,
                  ),
                )
              }
            />
            <input
              value={entry.text}
              maxLength={200}
              aria-label={`Teilschritt ${i + 1}`}
              onChange={(e) =>
                setChecklist(
                  checklist.map((c, j) =>
                    j === i ? { ...c, text: e.target.value } : c,
                  ),
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
            />
            <button
              type="button"
              className="ws-icon"
              aria-label={`Teilschritt entfernen: ${entry.text}`}
              onClick={() => setChecklist(checklist.filter((_, j) => j !== i))}
            >
              <X size={15} />
            </button>
          </div>
        ))}
        <div className="ws-check-row ws-check-add">
          <Plus size={15} aria-hidden="true" />
          <input
            value={draft}
            maxLength={200}
            aria-label="Neuer Teilschritt"
            placeholder="Teilschritt hinzufügen und Enter drücken"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            onBlur={add}
          />
        </div>
      </fieldset>
      <div className="ws-form-row">
        <label>
          Zuständig
          <input
            name="assignee"
            defaultValue={task?.assignee}
            maxLength={80}
            placeholder="Name oder Team"
          />
        </label>
        <label>
          Termin
          <input
            name="due"
            type="date"
            defaultValue={dateInput(task?.due || null)}
          />
        </label>
      </div>
      <div className="ws-form-row">
        <label>
          Priorität
          <select name="priority" defaultValue={task?.priority || "normal"}>
            {Object.entries(priorities).map(([k, v]) => (
              <option value={k} key={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Aufwand (Punkte)
          <select name="points" defaultValue={String(task?.points ?? 0)}>
            {pointSteps.map((p) => (
              <option value={p} key={p}>
                {p || "Nicht geschätzt"}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="ws-form-row">
        <label>
          Labels
          <input
            name="labels"
            defaultValue={task?.labels}
            maxLength={200}
            placeholder="z. B. Inhalt, Technik, Kunde"
          />
        </label>
        {task && (
          <label>
            Status
            <select name="status" defaultValue={task.status}>
              {Object.entries(states).map(([k, v]) => (
                <option value={k} key={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </>
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
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<{
    status: TaskStatus;
    before: string | null;
  } | null>(null);
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
          points: Number(fields.points) || 0,
          checklist: JSON.parse(String(fields.checklist || "[]")),
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
  /** Changes status and/or place; shown at once, then confirmed by the server. */
  async function moveTask(task: Task, status: TaskStatus, position?: number) {
    setDetail((d) =>
      d && {
        ...d,
        tasks: d.tasks
          .map((t) =>
            t.id === task.id
              ? { ...t, status, position: position ?? t.position }
              : t,
          )
          .sort((a, b) => a.position - b.position),
      },
    );
    try {
      await mutate({
        action: "task-update",
        id: task.id,
        version: task.version,
        title: task.title,
        assignee: task.assignee,
        due: dateInput(task.due),
        status,
        ...(position === undefined ? {} : { position }),
      });
      if (status !== task.status) setNotice("Aufgabenstatus aktualisiert.");
    } catch (e) {
      setError((e as Error).message);
      void load(true);
    }
  }
  function dropTask(status: TaskStatus) {
    const task = detail?.tasks.find((t) => t.id === dragId);
    const before = over?.status === status ? over.before : null;
    setDragId(null);
    setOver(null);
    if (!task || !detail || busy) return;
    const column = detail.tasks.filter(
      (t) => t.status === status && t.id !== task.id,
    );
    const at = before ? column.findIndex((t) => t.id === before) : -1;
    const index = at < 0 ? column.length : at;
    const prev = column[index - 1];
    const next = column[index];
    const own = detail.tasks.filter((t) => t.status === status);
    const place = own.findIndex((t) => t.id === task.id);
    if (task.status === status && own[place + 1]?.id === next?.id) return;
    const position =
      prev && next
        ? (prev.position + next.position) / 2
        : prev
          ? prev.position + 1
          : next
            ? next.position - 1
            : Date.now() / 1000;
    void moveTask(task, status, position);
  }
  async function deleteTask(task: Task) {
    if (busy || !window.confirm(`Aufgabe „${task.title}“ wirklich löschen?`))
      return;
    setFormError("");
    try {
      await mutate({ action: "task-delete", id: task.id, version: task.version });
      setEditor(null);
      setNotice("Aufgabe gelöscht.");
    } catch (e) {
      setFormError((e as Error).message);
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
          <a
            className="ws-drive"
            href="https://drive.google.com/drive/folders/1jB27W1BnTGtVDW7hqcY6e-zIKUKQwMoY?usp=share_link"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Dateien & Dokumente – gemeinsamer Google-Drive-Ordner (öffnet in neuem Tab)"
          >
            <FolderOpen size={22} aria-hidden="true" />
            <span>
              <strong>Dateien & Dokumente</strong>
              <span>Unser gemeinsamer Ordner in Google Drive</span>
            </span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
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
                      {current.tasks.some((t) => t.points > 0) &&
                        ` · ${current.tasks
                          .filter((t) => t.status === "done")
                          .reduce(
                            (sum, t) => sum + t.points,
                            0,
                          )} von ${current.tasks.reduce((sum, t) => sum + t.points, 0)} Punkten`}
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
                    <section
                      key={status}
                      className={`ws-column ${status}${dragId && over?.status === status ? " drop" : ""}`}
                      onDragOver={(e) => {
                        if (!dragId) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (over?.status !== status)
                          setOver({ status, before: null });
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        dropTask(status);
                      }}
                    >
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
                          .map((task, index, column) => {
                            const labels = labelList(task.labels);
                            const list = task.checklist ?? [];
                            const checked = list.filter((c) => c.done).length;
                            return (
                              <article
                                className={`ws-task${task.id === dragId ? " dragging" : ""}${dragId && over?.before === task.id ? " drop-before" : ""}`}
                                key={task.id}
                                draggable={!busy}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData("text/plain", task.id);
                                  e.dataTransfer.effectAllowed = "move";
                                  setDragId(task.id);
                                }}
                                onDragEnd={() => {
                                  setDragId(null);
                                  setOver(null);
                                }}
                                onDragOver={(e) => {
                                  if (!dragId) return;
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const box =
                                    e.currentTarget.getBoundingClientRect();
                                  const before =
                                    e.clientY < box.top + box.height / 2
                                      ? task.id
                                      : (column[index + 1]?.id ?? null);
                                  if (
                                    over?.status !== status ||
                                    over.before !== before
                                  )
                                    setOver({ status, before });
                                }}
                              >
                                {(task.priority !== "normal" ||
                                  labels.length > 0) && (
                                  <div className="ws-task-tags">
                                    {task.priority !== "normal" && (
                                      <span
                                        className={`ws-priority ${task.priority}`}
                                      >
                                        {task.priority === "high"
                                          ? "Hohe Priorität"
                                          : "Niedrige Priorität"}
                                      </span>
                                    )}
                                    {labels.map((label) => (
                                      <span key={label}>{label}</span>
                                    ))}
                                  </div>
                                )}
                                <button
                                  className="ws-task-title"
                                  onClick={() =>
                                    showEditor({ type: "task", task })
                                  }
                                  aria-label={`Aufgabe öffnen: ${task.title}`}
                                >
                                  {task.title}
                                  <GripVertical size={14} aria-hidden="true" />
                                </button>
                                {task.description && (
                                  <p className="ws-task-desc">
                                    {task.description}
                                  </p>
                                )}
                                {list.length > 0 && (
                                  <div className="ws-task-checks">
                                    <ListChecks size={13} aria-hidden="true" />
                                    <span>
                                      {checked} von {list.length} Teilschritten
                                    </span>
                                    <i aria-hidden="true">
                                      <b
                                        style={{
                                          width:
                                            (checked / list.length) * 100 + "%",
                                        }}
                                      />
                                    </i>
                                  </div>
                                )}
                                <div className="ws-task-meta">
                                  <span>
                                    <UserRound size={12} aria-hidden="true" />
                                    {task.assignee || "Noch nicht vergeben"}
                                  </span>
                                  {task.due && (
                                    <span
                                      className={overdue(task) ? "overdue" : ""}
                                    >
                                      <CalendarDays
                                        size={12}
                                        aria-hidden="true"
                                      />
                                      {dateLabel(task.due)}
                                      {overdue(task) && " · überfällig"}
                                    </span>
                                  )}
                                  {task.points > 0 && (
                                    <span
                                      className="ws-points"
                                      title="Geschätzter Aufwand in Punkten"
                                    >
                                      {task.points} P
                                    </span>
                                  )}
                                </div>
                                <label className="ws-status-select">
                                  <span className="sr-only">
                                    Status für {task.title}
                                  </span>
                                  <select
                                    disabled={busy}
                                    value={task.status}
                                    onChange={(e) =>
                                      void moveTask(
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
                            );
                          })}
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
          wide={editor.type === "task"}
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
              <TaskFields task={editor.task} />
            )}
            <div className="ws-dialog-actions">
              {editor.type === "task" && editor.task && (
                <button
                  type="button"
                  className="ws-text-button ws-delete"
                  disabled={busy}
                  onClick={() =>
                    editor.task && void deleteTask(editor.task)
                  }
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
