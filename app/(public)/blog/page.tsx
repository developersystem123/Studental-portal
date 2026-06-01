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
  const [featured, ...rest] = [...BLOG_POSTS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 lg:pt-20 text-center">
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Blog</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight">
          Stories from the <span className="gradient-text">EduPortal</span> community
        </h1>
        <p className="mt-4 text-lg text-[var(--muted)] max-w-2xl mx-auto">
          Tutorials, product updates, career advice, and reflections on learning.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Featured */}
        <Link href={`/blog/${featured.slug}`} className="group block">
          <Card className="overflow-hidden grid md:grid-cols-2 gap-0">
            <div className="relative h-64 md:h-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featured.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
            <CardBody className="p-8 flex flex-col justify-center">
              <Badge variant="primary">{featured.category}</Badge>
              <h2 className="mt-3 text-2xl sm:text-3xl font-bold group-hover:text-[var(--primary)] transition">
                {featured.title}
              </h2>
              <p className="mt-3 text-[var(--muted)]">{featured.excerpt}</p>
              <p className="mt-4 text-xs text-[var(--muted-2)] flex items-center gap-3">
                <span>{featured.author}</span>
                <span>·</span>
                <span>{formatDate(featured.publishedAt)}</span>
                <span>·</span>
                <span>{featured.readMinutes} min read</span>
              </p>
            </CardBody>
          </Card>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {rest.map((p) => (
            <MediaCard
              key={p.slug}
              href={`/blog/${p.slug}`}
              image={p.thumbnail}
              imageAlt={p.title}
              fallbackIcon={<Icon.Edit size={28} />}
              scrim={false}
            >
              <Badge variant="default">{p.category}</Badge>
              <h3 className="mt-3 text-lg font-semibold group-hover:text-[var(--primary)] transition line-clamp-2">
                {p.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)] line-clamp-3 flex-1">{p.excerpt}</p>
              <p className="mt-4 text-xs text-[var(--muted-2)] flex items-center gap-2">
                <Icon.Clock size={12} /> {p.readMinutes} min · {formatDate(p.publishedAt)}
              </p>
            </MediaCard>
          ))}
        </div>
      </section>
    </div>
  );
}
