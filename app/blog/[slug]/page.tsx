import { notFound, redirect } from "next/navigation";
import { authenticated } from "@/lib/auth";
import { formatDate, getPost, type Inline } from "@/lib/blog";
import { Arrow } from "../../marks";
import { MotionDirector } from "../../motion-director";
import { Overlap } from "../../typography";
import { BlogFooter, BlogHeader } from "../blog-chrome";
import { ReadProgress } from "../read-progress";
import "../blog.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getPost(slug);
  return { title: post ? `${post.title} — E23` : "Blog — E23" };
}

function Text({ parts }: { parts: Inline }) {
  return parts.map((part, i) =>
    part.strong ? <strong key={i}>{part.text}</strong> : part.text,
  );
}

export default async function PostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  if (!(await authenticated())) redirect(`/?next=blog/${slug}`);
  const post = await getPost(slug);
  if (!post) notFound();
  let chapter = 0;
  return (
    <>
      <MotionDirector />
      <ReadProgress />
      <BlogHeader />
      <main className="post">
        <header className="post-head" data-scroll>
          <a className="post-back" href="/blog">
            <Arrow /> Alle Beiträge
          </a>
          <div className="post-kicker">
            <span>Essay</span>
            <span>{formatDate(post.date)}</span>
            <span>{post.minutes} Min. Lesezeit</span>
          </div>
          <h1>{post.title}</h1>
          <p className="post-lede">{post.dek}</p>
          <Overlap variant="post" track={false} />
        </header>
        <article className="post-body">
          {post.blocks.map((block, i) => {
            switch (block.kind) {
              case "h2":
                chapter += 1;
                return (
                  <h2 key={i} data-reveal>
                    <span className="post-chapter">
                      {String(chapter).padStart(2, "0")}
                    </span>
                    {block.text}
                  </h2>
                );
              case "h3":
                return (
                  <h3 key={i} data-reveal>
                    {block.text}
                  </h3>
                );
              case "quote":
                return (
                  <blockquote key={i} data-reveal>
                    <Text parts={block.text} />
                  </blockquote>
                );
              case "statement":
                return (
                  <p key={i} className="post-statement" data-reveal>
                    {block.text}
                  </p>
                );
              default:
                return (
                  <p key={i} className={i === 0 ? "post-first" : undefined}>
                    <Text parts={block.text} />
                  </p>
                );
            }
          })}
          <div className="post-end" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </article>
        <nav className="post-foot" aria-label="Blog">
          <a href="/blog">
            <Arrow /> Zurück zu allen Beiträgen
          </a>
        </nav>
      </main>
      <BlogFooter />
    </>
  );
}
