import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/icons";
import { Badge, Button, Card, CardBody } from "@/components/ui";
import { BLOG_POSTS } from "@/lib/blogPosts";
import { formatDate } from "@/lib/utils";

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return { title: "Post not found" };
  return {
    title: `${post.title} — EduPortal Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const related = BLOG_POSTS.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 2);

  // Naive markdown renderer (## → h2, **text** → bold, blank line → para)
  const blocks = post.body.split(/\n\n+/);

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
      <Link href="/blog" className="text-xs text-[var(--muted)] hover:text-[var(--primary)]">
        ← All posts
      </Link>

      <Badge variant="primary" className="mt-4">{post.category}</Badge>
      <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">{post.title}</h1>
      <p className="mt-3 text-[var(--muted)] text-lg">{post.excerpt}</p>
      <p className="mt-5 text-xs text-[var(--muted-2)] flex items-center gap-3">
        <span className="font-semibold text-[var(--foreground)]">{post.author}</span>
        <span>·</span>
        <span>{formatDate(post.publishedAt)}</span>
        <span>·</span>
        <span>{post.readMinutes} min read</span>
      </p>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={post.thumbnail} alt="" className="mt-8 w-full h-64 sm:h-80 object-cover rounded-2xl" />

      <div className="mt-10 space-y-5 text-[var(--foreground)] leading-relaxed">
        {blocks.map((b, i) => {
          if (b.startsWith("## ")) {
            return <h2 key={i} className="text-2xl font-bold mt-8 mb-2">{b.slice(3)}</h2>;
          }
          // Render bold within paragraph
          const parts = b.split(/(\*\*[^*]+\*\*)/g);
          return (
            <p key={i} className="text-base">
              {parts.map((part, idx) =>
                part.startsWith("**") && part.endsWith("**") ? (
                  <strong key={idx}>{part.slice(2, -2)}</strong>
                ) : (
                  <span key={idx}>{part}</span>
                )
              )}
            </p>
          );
        })}
      </div>

      {related.length > 0 && (
        <section className="mt-16 pt-10 border-t border-[var(--border)]">
          <h2 className="text-xl font-bold mb-6">Related posts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {related.map((r) => (
              <Link key={r.slug} href={`/blog/${r.slug}`} className="group">
                <Card>
                  <CardBody>
                    <Badge variant="default">{r.category}</Badge>
                    <p className="mt-2 font-semibold group-hover:text-[var(--primary)]">{r.title}</p>
                    <p className="text-sm text-[var(--muted)] mt-1 line-clamp-2">{r.excerpt}</p>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Card className="mt-16 bg-gradient-to-br from-[var(--primary-soft)] to-transparent">
        <CardBody className="text-center py-8">
          <p className="text-xl font-bold">Like this post?</p>
          <p className="text-sm text-[var(--muted)] mt-2 mb-5">
            Join EduPortal and start learning with AI tutoring today.
          </p>
          <Link href="/register"><Button>Get started free <Icon.ChevronRight size={14} /></Button></Link>
        </CardBody>
      </Card>
    </article>
  );
}
