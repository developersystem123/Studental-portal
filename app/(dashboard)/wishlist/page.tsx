"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, CardBody, EmptyState, Skeleton, useToast } from "@/components/ui";
import Icon from "@/components/icons";
import { useData } from "@/lib/store";
import { formatHours, relativeTime, cn } from "@/lib/utils";

type Item = {
  id: string;
  courseId: string;
  addedAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnail: string;
    instructor: string;
    category: string;
    level: string;
    price: number;
    rating: number;
    reviews: number;
    durationMinutes: number;
    chapterCount: number;
  };
};

type SortKey = "newest" | "oldest" | "price-low" | "price-high" | "rating" | "duration";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "price-low", label: "Price ↑" },
  { key: "price-high", label: "Price ↓" },
  { key: "rating", label: "Rating" },
  { key: "duration", label: "Duration" },
];

function sortItems(items: Item[], key: SortKey): Item[] {
  const copy = [...items];
  switch (key) {
    case "newest":
      return copy.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    case "oldest":
      return copy.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
    case "price-low":
      return copy.sort((a, b) => a.course.price - b.course.price);
    case "price-high":
      return copy.sort((a, b) => b.course.price - a.course.price);
    case "rating":
      return copy.sort((a, b) => b.course.rating - a.course.rating);
    case "duration":
      return copy.sort((a, b) => b.course.durationMinutes - a.course.durationMinutes);
  }
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] card-shadow overflow-hidden animate-pulse">
      <div className="aspect-video bg-[var(--surface-2)]" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-[var(--surface-2)] rounded-lg w-3/4" />
        <div className="h-3 bg-[var(--surface-2)] rounded-lg w-1/2" />
        <div className="h-3 bg-[var(--surface-2)] rounded-lg w-2/3" />
        <div className="h-8 bg-[var(--surface-2)] rounded-xl w-full mt-2" />
      </div>
    </div>
  );
}

type WishlistCardProps = {
  item: Item;
  enrolledIds: Set<string>;
  removing: Set<string>;
  enrolling: Set<string>;
  onRemove: (courseId: string) => void;
  onEnroll: (courseId: string) => void;
};

function WishlistCard({ item, enrolledIds, removing, enrolling, onRemove, onEnroll }: WishlistCardProps) {
  const { course, addedAt } = item;
  const isEnrolled = enrolledIds.has(course.id);
  const isRemoving = removing.has(course.id);
  const isEnrolling = enrolling.has(course.id);

  return (
    <div className="group rounded-2xl bg-[var(--surface)] border border-[var(--border)] card-shadow overflow-hidden flex flex-col">
      <div className="relative aspect-video overflow-hidden bg-[var(--surface-2)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <Badge
          variant="primary"
          className="absolute top-2 left-2 backdrop-blur-sm bg-[var(--primary-soft)]/90"
        >
          {course.category}
        </Badge>

        {course.price === 0 && (
          <Badge
            variant="success"
            className="absolute bottom-2 left-2 backdrop-blur-sm"
          >
            Free
          </Badge>
        )}

        <button
          onClick={() => onRemove(course.id)}
          disabled={isRemoving}
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/40 hover:bg-red-500/80 flex items-center justify-center text-white transition-colors disabled:opacity-60"
          title="Remove from wishlist"
        >
          {isRemoving ? <Icon.Loader size={14} /> : <Icon.X size={14} />}
        </button>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <Link
            href={`/my-courses/${course.id}`}
            className="font-semibold text-sm leading-snug line-clamp-2 hover:text-[var(--primary)] transition-colors"
          >
            {course.title}
          </Link>
          <p className="text-xs text-[var(--muted)] mt-1">{course.instructor}</p>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant="default">{course.level}</Badge>
        </div>

        <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1">
            <Icon.Star size={12} className="text-amber-400" />
            {course.rating.toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <Icon.Clock size={12} />
            {formatHours(course.durationMinutes)}
          </span>
          <span className="flex items-center gap-1">
            <Icon.Book size={12} />
            {course.chapterCount} ch.
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)]">
          <div>
            <p className="font-semibold text-sm">
              {course.price === 0 ? "Free" : `$${course.price}`}
            </p>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">
              Saved {relativeTime(addedAt)}
            </p>
          </div>

          {isEnrolled ? (
            <Badge variant="success" className="flex items-center gap-1">
              <Icon.Check size={11} />
              Enrolled
            </Badge>
          ) : (
            <Button
              size="sm"
              loading={isEnrolling}
              onClick={() => onEnroll(course.id)}
            >
              Enroll
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { enroll, enrollments } = useData();
  const { push } = useToast();

  const enrolledIds = new Set(enrollments.map((e) => e.courseId));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/wishlist");
        const data = r.ok ? await r.json() : { items: [] };
        if (!cancelled) setItems(data.items ?? []);
      } catch {
        // silently fall through to empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);
  }

  async function handleRemove(courseId: string) {
    setRemoving((prev) => new Set(prev).add(courseId));
    try {
      await fetch(`/api/wishlist?courseId=${encodeURIComponent(courseId)}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.courseId !== courseId));
      push({ title: "Removed from wishlist", tone: "info" });
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(courseId);
        return next;
      });
    }
  }

  async function enrollAndRemove(courseId: string) {
    setEnrolling((prev) => new Set(prev).add(courseId));
    try {
      await enroll(courseId);
      await fetch(`/api/wishlist?courseId=${encodeURIComponent(courseId)}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.courseId !== courseId));
      push({ title: "Enrolled successfully!", tone: "success" });
    } finally {
      setEnrolling((prev) => {
        const next = new Set(prev);
        next.delete(courseId);
        return next;
      });
    }
  }

  async function enrollAllFree() {
    const freeCourseIds = items
      .filter((i) => i.course.price === 0 && !enrolledIds.has(i.course.id))
      .map((i) => i.course.id);
    await Promise.all(freeCourseIds.map((id) => enrollAndRemove(id)));
  }

  const sorted = sortItems(items, sortKey);

  const trimmed = debouncedQuery.trim().toLowerCase();
  const shown = trimmed
    ? sorted.filter(
        ({ course }) =>
          course.title.toLowerCase().includes(trimmed) ||
          course.instructor.toLowerCase().includes(trimmed) ||
          course.category.toLowerCase().includes(trimmed),
      )
    : sorted;

  const freeUnenrolledCount = items.filter(
    (i) => i.course.price === 0 && !enrolledIds.has(i.course.id),
  ).length;

  const totalMinutes = items.reduce((s, { course }) => s + course.durationMinutes, 0);
  const totalValue = items.reduce((s, { course }) => s + course.price, 0);
  const avgRating =
    items.length > 0
      ? items.reduce((s, { course }) => s + course.rating, 0) / items.length
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Wishlist</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Saved courses you plan to take.</p>
        </div>
        {!loading && freeUnenrolledCount > 0 && (
          <Button onClick={enrollAllFree} variant="soft" size="sm">
            <Icon.Check size={14} />
            Enroll all free ({freeUnenrolledCount})
          </Button>
        )}
      </div>

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardBody className="flex items-start gap-3 p-4">
              <div className="h-10 w-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                <Icon.Heart size={18} />
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Saved courses</p>
                <p className="text-xl font-bold">{items.length}</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex items-start gap-3 p-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Icon.Clock size={18} />
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Total content</p>
                <p className="text-xl font-bold">{formatHours(totalMinutes)}</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex items-start gap-3 p-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Icon.DollarSign size={18} />
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">List value</p>
                <p className="text-xl font-bold">{totalValue === 0 ? "Free" : `$${totalValue}`}</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex items-start gap-3 p-4">
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                <Icon.Star size={18} />
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Avg rating</p>
                <p className="text-xl font-bold">{avgRating.toFixed(1)} ★</p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.Heart size={28} />}
              title="Your wishlist is empty"
              description="Browse the catalog and save courses for later."
              action={
                <Link href="/explore">
                  <Button>
                    <Icon.Compass size={14} />
                    Explore
                  </Button>
                </Link>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--muted)] pointer-events-none">
                <Icon.Search size={16} />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search by title, instructor, or category…"
                className={cn(
                  "w-full h-11 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)]",
                  "placeholder:text-[var(--muted-2)] pl-10 pr-10 text-sm transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent",
                )}
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setDebouncedQuery(""); }}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  <Icon.X size={16} />
                </button>
              )}
            </div>

            {debouncedQuery && (
              <p className="text-xs text-[var(--muted)] px-1">
                {shown.length} course{shown.length !== 1 ? "s" : ""} found for &ldquo;{debouncedQuery}&rdquo;
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {SORT_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSortKey(key)}
                  className={cn(
                    "px-3 h-8 rounded-full text-xs font-medium transition-all border",
                    sortKey === key
                      ? "bg-[var(--primary)] text-white border-transparent"
                      : "bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {shown.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState
                  icon={<Icon.Search size={28} />}
                  title="No courses match"
                  description={`No results for "${debouncedQuery}". Try a different search term.`}
                  action={
                    <Button variant="outline" size="sm" onClick={() => { setQuery(""); setDebouncedQuery(""); }}>
                      <Icon.X size={14} />
                      Clear search
                    </Button>
                  }
                />
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {shown.map((item) => (
                <WishlistCard
                  key={item.id}
                  item={item}
                  enrolledIds={enrolledIds}
                  removing={removing}
                  enrolling={enrolling}
                  onRemove={handleRemove}
                  onEnroll={enrollAndRemove}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
