import Link from "next/link";
import Icon from "@/components/icons";
import { Badge, Card, CardBody } from "@/components/ui";
import { MediaCard } from "@/components/MediaCard";
import { BLOG_POSTS } from "@/lib/blogPosts";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Blog — EduPortal",
  description: "Stories about learning, product updates, career tips, and community.",
};

export default function BlogPage() {
  const sorted = [...BLOG_POSTS].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const [featured, ...rest] = sorted;

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
        <div className="absolute inset-0 hero-gradient pointer-events-none" />
        <div className="absolute -top-32 right-0 w-[600px] h-[500px] rounded-full bg-gradient-to-bl from-[var(--primary)]/10 via-transparent to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 lg:pt-20 pb-14">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="reveal-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold uppercase tracking-wider mb-5">
                <Icon.Book size={12} /> Blog
              </div>
              <h1 className="text-4xl sm:text-5xl xl:text-[3.3rem] font-bold tracking-tight leading-[1.1] text-balance">
                Stories from the <span className="gradient-text">EduPortal</span> community
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted leading-relaxed max-w-lg">
                Tutorials, product updates, career advice, and reflections on the science of learning.
              </p>
              <div className="mt-6 flex flex-wrap justify-center sm:justify-start items-center gap-3">
                {["All", "Product", "Learning", "Careers", "AI"].map((cat) => (
                  <span key={cat} className={`px-3 h-8 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                    cat === "All"
                      ? "bg-[var(--primary)] text-white border-transparent"
                      : "bg-surface border-border text-muted hover:text-foreground hover:border-border-strong"
                  }`}>
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: featured post preview card */}
            {featured && (
              <Link href={`/blog/${featured.slug}`} className="group hidden lg:block">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/12 card-interactive">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featured.thumbnail}
                    alt={featured.title}
                    className="w-full h-[300px] object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <Badge variant="primary" className="mb-2 backdrop-blur bg-white/20 text-white border-white/20">
                      {featured.category}
                    </Badge>
                    <h2 className="text-white font-bold text-lg leading-snug line-clamp-2">{featured.title}</h2>
                    <p className="text-white/70 text-xs mt-2 flex items-center gap-2">
                      <span>{featured.author}</span>·<span>{formatDate(featured.publishedAt)}</span>·<span>{featured.readMinutes} min read</span>
                    </p>
                  </div>
                  {/* Featured badge */}
                  <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold border border-white/20">
                    ✦ Featured
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Featured post (mobile) + grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Mobile featured */}
        {featured && (
          <div className="lg:hidden mb-8">
            <Link href={`/blog/${featured.slug}`} className="group block">
              <Card className="overflow-hidden">
                <div className="relative h-52">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={featured.thumbnail} alt={featured.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <Badge variant="primary" className="mb-2">✦ Featured · {featured.category}</Badge>
                    <h2 className="text-white font-bold text-lg leading-snug">{featured.title}</h2>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold">Latest posts</h2>
          <span className="text-sm text-[var(--muted)]">{BLOG_POSTS.length} articles</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((p) => (
            <MediaCard
              key={p.slug}
              href={`/blog/${p.slug}`}
              image={p.thumbnail}
              imageAlt={p.title}
              fallbackIcon={<Icon.Edit size={28} />}
              scrim={false}
              bodyClassName="p-4 space-y-2.5"
            >
              <div className="flex items-center gap-2">
                <Badge variant="default">{p.category}</Badge>
                <span className="text-[10px] text-[var(--muted-2)] flex items-center gap-1">
                  <Icon.Clock size={10} /> {p.readMinutes} min
                </span>
              </div>
              <h3 className="font-bold leading-snug group-hover:text-[var(--primary)] transition line-clamp-2">
                {p.title}
              </h3>
              <p className="text-sm text-[var(--muted)] line-clamp-2 flex-1">{p.excerpt}</p>
              <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                  {p.author[0]}
                </div>
                <span className="text-xs text-[var(--muted)]">{p.author} · {formatDate(p.publishedAt)}</span>
              </div>
            </MediaCard>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-14 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] p-6 sm:p-10 text-white">
          <div className="absolute inset-0 bg-dots opacity-15 mix-blend-overlay pointer-events-none" />
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold">Get the best posts in your inbox</h3>
              <p className="text-white/80 text-sm mt-1">Weekly digest of learning tips, product news, and career guides.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full sm:w-52 h-10 px-4 rounded-xl text-sm bg-white/15 border border-white/25 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
              />
              <button className="h-10 px-4 rounded-xl bg-white text-primary text-sm font-semibold hover:bg-white/90 transition w-full sm:w-auto">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
