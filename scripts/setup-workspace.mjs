import { neon } from "@neondatabase/serverless";
try {
  process.loadEnvFile(".env.local");
} catch {}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
const sql = neon(process.env.DATABASE_URL);
await sql.transaction([
  sql`CREATE TABLE IF NOT EXISTS e23_work_items (id uuid PRIMARY KEY, title varchar(160) NOT NULL, description text NOT NULL DEFAULT '', kind text NOT NULL CHECK(kind IN ('idea','project')), status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','archived')), owner varchar(80) NOT NULL DEFAULT '', due date, version integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`,
  sql`CREATE TABLE IF NOT EXISTS e23_tasks (id uuid PRIMARY KEY, item_id uuid NOT NULL REFERENCES e23_work_items(id) ON DELETE CASCADE, title varchar(160) NOT NULL, status text NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','doing','done')), assignee varchar(80) NOT NULL DEFAULT '', due date, version integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now())`,
  sql`CREATE TABLE IF NOT EXISTS e23_comments (id uuid PRIMARY KEY, item_id uuid NOT NULL REFERENCES e23_work_items(id) ON DELETE CASCADE, author varchar(80) NOT NULL, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`,
  sql`CREATE INDEX IF NOT EXISTS e23_tasks_item_idx ON e23_tasks(item_id)`,
  sql`CREATE INDEX IF NOT EXISTS e23_comments_item_idx ON e23_comments(item_id)`,
]);
console.log("E23 workspace schema ready. No demo data inserted.");
