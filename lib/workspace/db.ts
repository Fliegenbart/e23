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
export async function getDetail(id: string): Promise<Detail | null> {
  const sql = db();
  const [items, tasks, comments] = await sql.transaction(
    [
      sql`SELECT w.*, (SELECT count(*)::int FROM e23_tasks t WHERE t.item_id=w.id) AS task_count, (SELECT count(*)::int FROM e23_tasks t WHERE t.item_id=w.id AND t.status='done') AS done_count, (SELECT count(*)::int FROM e23_comments c WHERE c.item_id=w.id) AS comment_count FROM e23_work_items w WHERE w.id=${id}`,
      sql`SELECT * FROM e23_tasks WHERE item_id=${id} ORDER BY created_at`,
      sql`SELECT * FROM e23_comments WHERE item_id=${id} ORDER BY created_at`,
    ],
    { isolationLevel: "RepeatableRead", readOnly: true },
  );
  if (!items[0]) return null;
  return { item: items[0], tasks, comments } as Detail;
}
