export type WorkStatus = "active" | "completed" | "archived";
export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "normal" | "high";
export type ChecklistItem = { text: string; done: boolean };
export type WorkItem = {
  id: string;
  title: string;
  description: string;
  kind: "idea" | "project";
  status: WorkStatus;
  owner: string;
  due: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  task_count: number;
  done_count: number;
  comment_count: number;
};
export type Task = {
  id: string;
  item_id: string;
  title: string;
  status: TaskStatus;
  assignee: string;
  due: string | null;
  description: string;
  priority: TaskPriority;
  /** Effort estimate in points; 0 means not estimated. */
  points: number;
  /** Comma-separated labels. */
  labels: string;
  checklist: ChecklistItem[];
  /** Sort key within a column; smaller comes first. */
  position: number;
  version: number;
  created_at: string;
};
export type Comment = {
  id: string;
  item_id: string;
  author: string;
  body: string;
  created_at: string;
};
export type Detail = { item: WorkItem; tasks: Task[]; comments: Comment[] };
