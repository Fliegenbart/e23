import { redirect } from "next/navigation";
import { authenticated } from "@/lib/auth";
import { formatDate, listPosts } from "@/lib/blog";
import { Arrow } from "../marks";
import { MotionDirector } from "../motion-director";
import { Line } from "../typography";
import { BlogFooter, BlogHeader } from "./blog-chrome";
import "./blog.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Blog — E23" };

export default async function BlogIndex() {
  if (!(await authenticated())) redirect("/?next=blog");
  const posts = await listPosts();
  return (
    <>
      <MotionDirector />
      <BlogHeader />
      <main className="blog">
        <section className="blog-intro">
          <span className="eyebrow">Blog / Intern</span>
          <h1>
            <Line index={0}>Gedanken</Line>
            <Line index={1}>
              <em>aus dem Labor.</em>
            </Line>
          </h1>
          <p>
            Was uns beschäftigt, bevor es fertig ist. Texte zum Weiterdenken –
            und zum Widersprechen.
          </p>
        </section>
        <ol className="post-list">
          {posts.map((post, i) => (
            <li key={post.slug} data-reveal>
              <a href={`/blog/${post.slug}`} className="post-row">
                <span className="post-num">
                  {String(posts.length - i).padStart(2, "0")}
                </span>
                <span className="post-text">
                  <span className="post-title">{post.title}</span>
                  <span className="post-dek">{post.dek}</span>
                </span>
                <span className="post-meta">
                  <span>{formatDate(post.date)}</span>
                  <span>{post.minutes} Min. Lesezeit</span>
                </span>
                <span className="post-go" aria-hidden="true">
                  <Arrow />
                </span>
              </a>
            </li>
          ))}
        </ol>
        {posts.length === 0 && (
          <p className="blog-empty">Noch keine Beiträge.</p>
        )}
      </main>
      <BlogFooter />
    </>
  );
}
