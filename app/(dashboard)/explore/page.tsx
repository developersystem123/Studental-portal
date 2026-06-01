"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Card, CardBody, Input, Select, useToast } from "@/components/ui";
import { CourseCard } from "@/components/course/CourseCard";
import { PhysicalApplicationModal } from "@/components/course/PhysicalApplicationModal";
import Icon from "@/components/icons";
import { COURSES, type Course, type CourseCategory, type CourseLevel } from "@/lib/mockData";
import { useData } from "@/lib/store";
import { cn } from "@/lib/utils";

const CATEGORIES: CourseCategory[] = ["Web Dev", "Data Science", "Design", "Business", "Languages", "Math"];
const LEVELS: CourseLevel[] = ["Beginner", "Intermediate", "Advanced"];

export default function ExplorePage() {
  const { enrollments, enroll, addNotification } = useData();
  const toast = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [cats, setCats] = useState<Set<CourseCategory>>(new Set());
  const [levels, setLevels] = useState<Set<CourseLevel>>(new Set());
  const [priceFree, setPriceFree] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<"popular" | "rating" | "newest" | "priceLow" | "priceHigh">("popular");
  const [physicalCourse, setPhysicalCourse] = useState<Course | null>(null);
  const [wishedIds, setWishedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((data: { items?: { courseId: string }[] }) => {
        setWishedIds(new Set((data.items ?? []).map((i) => i.courseId)));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQ(searchInput), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const enrolledIds = useMemo(() => new Set(enrollments.map((e) => e.courseId)), [enrollments]);

  const filtered = useMemo(() => {
    const list = COURSES.filter((c) => {
      if (q && !c.title.toLowerCase().includes(q.toLowerCase()) && !c.tags.join(" ").toLowerCase().includes(q.toLowerCase())) return false;
      if (cats.size > 0 && !cats.has(c.category)) return false;
      if (levels.size > 0 && !levels.has(c.level)) return false;
      if (priceFree && c.price !== 0) return false;
      if (c.rating < minRating) return false;
      return true;
    });
    switch (sort) {
      case "rating":
        return [...list].sort((a, b) => b.rating - a.rating);
      case "priceLow":
        return [...list].sort((a, b) => a.price - b.price);
      case "priceHigh":
        return [...list].sort((a, b) => b.price - a.price);
      case "newest":
        return [...list].reverse();
      default:
        return [...list].sort((a, b) => b.reviews - a.reviews);
    }
  }, [q, cats, levels, priceFree, minRating, sort]);

  const activeFilters = useMemo(() => {
    const filters: { label: string; onClear: () => void }[] = [];
    cats.forEach((cat) =>
      filters.push({ label: cat, onClear: () => toggle(cats, cat, setCats) }),
    );
    levels.forEach((lvl) =>
      filters.push({ label: lvl, onClear: () => toggle(levels, lvl, setLevels) }),
    );
    if (priceFree) filters.push({ label: "Free only", onClear: () => setPriceFree(false) });
    if (minRating > 0) filters.push({ label: `${minRating}+ stars`, onClear: () => setMinRating(0) });
    return filters;
  }, [cats, levels, priceFree, minRating]);

  function toggle<T>(set: Set<T>, val: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    setter(next);
  }

  function handleEnroll(id: string, title: string) {
    enroll(id);
    addNotification({
      type: "achievement",
      title: "Enrolled!",
      message: `You're now enrolled in ${title}.`,
    });
    toast.push({ title: "Enrolled", description: title, tone: "success" });
  }

  async function toggleWishlist(courseId: string, title: string) {
    if (wishedIds.has(courseId)) {
      try {
        await fetch(`/api/wishlist?courseId=${encodeURIComponent(courseId)}`, { method: "DELETE" });
      } catch {
        // optimistically update even on network error
      }
      setWishedIds((prev) => {
        const next = new Set(prev);
        next.delete(courseId);
        return next;
      });
      toast.push({ title: "Removed from wishlist", description: title, tone: "info" });
    } else {
      try {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId }),
        });
      } catch {
        // optimistically update even on network error
      }
      setWishedIds((prev) => new Set(prev).add(courseId));
      toast.push({ title: "Saved to wishlist", description: title, tone: "success" });
    }
  }

  function clearAll() {
    setSearchInput("");
    setQ("");
    setCats(new Set());
    setLevels(new Set());
    setPriceFree(false);
    setMinRating(0);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Explore courses</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Discover new topics and skills.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <Card className="h-fit lg:sticky lg:top-20">
          <CardBody className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">Search</p>
              <div className="relative">
                <Input
                  placeholder="Search…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  icon={<Icon.Search size={16} />}
                />
                {searchInput && (
                  <button
                    onClick={() => { setSearchInput(""); setQ(""); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition"
                    title="Clear search"
                  >
                    <Icon.X size={12} />
                  </button>
                )}
              </div>
            </div>
            <FilterGroup
              title="Category"
              count={cats.size > 0 ? cats.size : undefined}
            >
              {CATEGORIES.map((c) => (
                <Chip key={c} active={cats.has(c)} onClick={() => toggle(cats, c, setCats)}>{c}</Chip>
              ))}
            </FilterGroup>
            <FilterGroup
              title="Level"
              count={levels.size > 0 ? levels.size : undefined}
            >
              {LEVELS.map((l) => (
                <Chip key={l} active={levels.has(l)} onClick={() => toggle(levels, l, setLevels)}>{l}</Chip>
              ))}
            </FilterGroup>
            <FilterGroup title="Price">
              <Chip active={priceFree} onClick={() => setPriceFree(!priceFree)}>Free only</Chip>
            </FilterGroup>
            <FilterGroup title="Minimum rating">
              <div className="flex gap-1.5 flex-wrap">
                {[0, 4, 4.5, 4.8].map((r) => (
                  <button
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={cn(
                      "px-2.5 h-8 rounded-lg text-xs border transition",
                      minRating === r
                        ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                        : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]",
                    )}
                  >
                    {r === 0 ? "Any" : `${r}+`}
                  </button>
                ))}
              </div>
            </FilterGroup>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
            >
              <Icon.X size={14} /> Clear all
            </Button>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-[var(--muted)]">{filtered.length} courses found</p>
            <Select
              className="w-48"
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
            >
              <option value="popular">Most popular</option>
              <option value="rating">Top rated</option>
              <option value="newest">Newest</option>
              <option value="priceLow">Price: low to high</option>
              <option value="priceHigh">Price: high to low</option>
            </Select>
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-[var(--muted)]">Active:</span>
              {activeFilters.map((f) => (
                <button
                  key={f.label}
                  onClick={f.onClear}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-red-500/10 hover:text-red-500 transition"
                >
                  {f.label} <Icon.X size={10} />
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-10 text-center space-y-3">
              <Icon.Search size={28} className="mx-auto text-[var(--muted)]" />
              <p className="font-medium">No courses match your filters</p>
              <p className="text-sm text-[var(--muted)]">
                {activeFilters.length > 0
                  ? `${activeFilters.length} filter${activeFilters.length !== 1 ? "s" : ""} active — try clearing some.`
                  : "Try a different search term."}
              </p>
              {activeFilters.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-sm text-[var(--primary)] hover:underline font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((c) => (
                <div key={c.id} className="relative">
                  <CourseCard course={c} href={`/my-courses/${c.id}`} />
                  <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
                    {enrolledIds.has(c.id) ? (
                      <Badge variant="success">
                        <Icon.Check size={12} /> Enrolled
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEnroll(c.id, c.title);
                        }}
                      >
                        Enroll
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="soft"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPhysicalCourse(c);
                      }}
                      title="Apply for in-person classes"
                    >
                      <Icon.Calendar size={12} /> In-person
                    </Button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(c.id, c.title);
                      }}
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center transition",
                        wishedIds.has(c.id)
                          ? "bg-red-500/90 text-white"
                          : "bg-black/40 hover:bg-red-500/80 text-white",
                      )}
                      title={wishedIds.has(c.id) ? "Remove from wishlist" : "Save to wishlist"}
                    >
                      <Icon.Heart size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <PhysicalApplicationModal
        course={physicalCourse}
        open={!!physicalCourse}
        onClose={() => setPhysicalCourse(null)}
      />
    </div>
  );
}

function FilterGroup({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
        {title}
        {count !== undefined && (
          <span className="ml-1.5 text-[var(--primary)]">({count})</span>
        )}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 h-8 rounded-lg text-xs border transition",
        active
          ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
          : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]",
      )}
    >
      {children}
    </button>
  );
}
