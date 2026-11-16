import "server-only";
import { neon } from "@neondatabase/serverless";
import type { Detail, WorkItem } from "./types";
export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("WORKSPACE_NOT_CONFIGURED");
  return neon(url);
}
export async function listItems(): Promise<WorkItem[]> {
  const sql = db();
  return (await sql`SELECT w.*, (SELECT count(*)::int FROM e23_tasks t WHERE t.item_id=w.id) AS task_count, (SELECT count(*)::int FROM e23_tasks t WHERE t.item_id=w.id AND t.status='done') AS done_count, (SELECT count(*)::int FROM e23_comments c WHERE c.item_id=w.id) AS comment_count FROM e23_work_items w ORDER BY w.created_at DESC`) as WorkItem[];
}
let tasksReady: Promise<unknown> | null = null;
/**
 * Adds the task detail columns on first use, so no separate migration step is
 * needed. Only adds; existing tasks keep their order (position = creation time).
 */
export function ensureTasks() {
  tasksReady ??= (async () => {
    const sql = db();
    const [state] = (await sql`SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='e23_tasks' AND column_name IN ('description','priority','points','labels','checklist','position') AND (column_name<>'position' OR is_nullable='NO')`) as {
      n: number;
    }[];
    if (state.n === 6) return;
    await sql.transaction([
      sql`ALTER TABLE e23_tasks ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT ''`,
      sql`ALTER TABLE e23_tasks ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high'))`,
      sql`ALTER TABLE e23_tasks ADD COLUMN IF NOT EXISTS points smallint NOT NULL DEFAULT 0`,
      sql`ALTER TABLE e23_tasks ADD COLUMN IF NOT EXISTS labels varchar(200) NOT NULL DEFAULT ''`,
      sql`ALTER TABLE e23_tasks ADD COLUMN IF NOT EXISTS checklist jsonb NOT NULL DEFAULT '[]'`,
      sql`ALTER TABLE e23_tasks ADD COLUMN IF NOT EXISTS position double precision`,
      sql`UPDATE e23_tasks SET position=extract(epoch FROM created_at) WHERE position IS NULL`,
      sql`ALTER TABLE e23_tasks ALTER COLUMN position SET DEFAULT extract(epoch FROM now())`,
      sql`ALTER TABLE e23_tasks ALTER COLUMN position SET NOT NULL`,
    ]);
  })().catch((error) => {
    tasksReady = null;
    throw error;
  });
  return tasksReady;
}
export async function getDetail(id: string): Promise<Detail | null> {
  await ensureTasks();
  const sql = db();
  const [items, tasks, comments] = await sql.transaction(
    [
      sql`SELECT w.*, (SELECT count(*)::int FROM e23_tasks t WHERE t.item_id=w.id) AS task_count, (SELECT count(*)::int FROM e23_tasks t WHERE t.item_id=w.id AND t.status='done') AS done_count, (SELECT count(*)::int FROM e23_comments c WHERE c.item_id=w.id) AS comment_count FROM e23_work_items w WHERE w.id=${id}`,
      sql`SELECT * FROM e23_tasks WHERE item_id=${id} ORDER BY position, created_at`,
      sql`SELECT * FROM e23_comments WHERE item_id=${id} ORDER BY created_at`,
    ],
    { isolationLevel: "RepeatableRead", readOnly: true },
  );
  if (!items[0]) return null;
  return { item: items[0], tasks, comments } as Detail;
}
