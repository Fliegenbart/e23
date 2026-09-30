import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Internal blog: one Markdown file per post in content/blog/<slug>.md,
 * with a small front matter block (title, dek, date). Only the Markdown
 * the posts actually use is supported: ## / ### headings, > quotes,
 * **bold** and plain paragraphs.
 */

export type Inline = { text: string; strong: boolean }[];
export type Block =
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "quote"; text: Inline }
  | { kind: "statement"; text: string }
  | { kind: "p"; text: Inline };

export type PostMeta = {
  slug: string;
  title: string;
  dek: string;
  date: string;
  minutes: number;
};
export type Post = PostMeta & { blocks: Block[] };

const dir = path.join(process.cwd(), "content", "blog");
const slugPattern = /^[a-z0-9-]+$/;

function inline(text: string): Inline {
  return text
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**")
        ? { text: part.slice(2, -2), strong: true }
        : { text: part, strong: false },
    );
}

function parse(slug: string, source: string): Post {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);
  const meta: Record<string, string> = {};
  for (const line of (match?.[1] ?? "").split("\n")) {
    const at = line.indexOf(":");
    if (at > 0) meta[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  const body = match ? source.slice(match[0].length) : source;
  const blocks: Block[] = body
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim().replace(/\s*\n\s*/g, " "))
    .filter(Boolean)
    .map((chunk): Block => {
      if (chunk.startsWith("### ")) return { kind: "h3", text: chunk.slice(4) };
      if (chunk.startsWith("## ")) return { kind: "h2", text: chunk.slice(3) };
      if (chunk.startsWith("> "))
        return { kind: "quote", text: inline(chunk.replace(/^>\s?/gm, "")) };
      if (/^\*\*[^*]+\*\*$/.test(chunk))
        return { kind: "statement", text: chunk.slice(2, -2) };
      return { kind: "p", text: inline(chunk) };
    });
  const words = body.split(/\s+/).filter(Boolean).length;
  return {
    slug,
    title: meta.title ?? slug,
    dek: meta.dek ?? "",
    date: meta.date ?? "",
    minutes: Math.max(1, Math.round(words / 200)),
    blocks,
  };
}

export async function getPost(slug: string): Promise<Post | null> {
  if (!slugPattern.test(slug)) return null;
  try {
    return parse(slug, await readFile(path.join(dir, `${slug}.md`), "utf8"));
  } catch {
    return null;
  }
}

export async function listPosts(): Promise<PostMeta[]> {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md"));
  const posts = await Promise.all(
    files.map(async (file) => {
      const post = await getPost(file.slice(0, -3));
      if (!post) return null;
      const { blocks: _blocks, ...meta } = post;
      return meta;
    }),
  );
  return posts
    .filter((p): p is PostMeta => p !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function formatDate(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  return Number.isNaN(d.getTime())
    ? date
    : d.toLocaleDateString("de-DE", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Berlin",
      });
}
