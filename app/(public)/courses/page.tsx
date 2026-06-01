"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/icons";
import { Badge, Button, EmptyState, useToast } from "@/components/ui";
import { MediaCard } from "@/components/MediaCard";
import { PhysicalApplicationModal } from "@/components/course/PhysicalApplicationModal";
import { COURSES, type Course, type CourseCategory } from "@/lib/mockData";
import { formatHours } from "@/lib/utils";
import { useAuth } from "@/lib/store";
import { cn } from "@/lib/utils";

const categories: { value: "All" | CourseCategory; icon: React.ReactNode }[] = [
  { value: "All",          icon: <Icon.Compass size={14} /> },
  { value: "Web Dev",      icon: <Icon.Globe size={14} /> },
  { value: "Data Science", icon: <Icon.BarChart3 size={14} /> },
  { value: "Design",       icon: <Icon.Sparkles size={14} /> },
  { value: "Business",     icon: <Icon.TrendingUp size={14} /> },
  { value: "Languages",    icon: <Icon.MessageSquare size={14} /> },
  { value: "Math",         icon: <Icon.ListChecks size={14} /> },
];

const levels = ["All levels", "Beginner", "Intermediate", "Advanced"] as const;
type Level = (typeof levels)[number];

const SORT_OPTIONS = [
  { value: "popular",  label: "Most popular" },
  { value: "rating",   label: "Top rated" },
  { value: "newest",   label: "Newest" },
  { value: "price-lo", label: "Price: Low to high" },
  { value: "price-hi", label: "Price: High to low" },
] as const;
type Sort = (typeof SORT_OPTIONS)[number]["value"];

export default function PublicCoursesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [cat, setCat]     = React.useState<"All" | CourseCategory>("All");
  const [q, setQ]         = React.useState("");
  const [level, setLevel] = React.useState<Level>("All levels");
  const [sort, setSort]   = React.useState<Sort>("popular");
  const [physicalCourse, setPhysicalCourse] = React.useState<Course | null>(null);

  // Read ?category= from URL on mount
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const initial = params.get("category");
    const catValues = categories.map((c) => c.value);
    if (initial && catValues.includes(initial as CourseCategory)) {
      setCat(initial as CourseCategory);
    }
  }, []);

  function handleApplyInPerson(c: Course) {
    if (!user) {
      toast.push({ title: "Sign in to apply", description: "Create a free account to apply for in-person classes.", tone: "info" });
      router.push("/register");
      return;
    }
    if (user.role !== "Student") {
      toast.push({ title: "Student accounts only", tone: "danger" });
      return;
    }
    setPhysicalCourse(c);
  }

  const filtered = React.useMemo(() => {
    let list = COURSES.filter((c) => {
      if (cat !== "All" && c.category !== cat) return false;
      if (level !== "All levels" && c.level !== level) return false;
      if (q.trim() && !c.title.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    if (sort === "rating")   list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === "price-lo") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-hi") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [cat, level, q, sort]);

  const hasFilters = cat !== "All" || level !== "All levels" || q.trim();

  const totalCourses   = COURSES.length;
  const totalFree      = COURSES.filter((c) => c.price === 0).length;
  const avgRating      = (COURSES.reduce((s, c) => s + c.rating, 0) / COURSES.length).toFixed(1);

  return (
    <div className="min-h-screen">
      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />
        <div className="absolute inset-0 hero-gradient pointer-events-none" />
        <div className="absolute -top-32 right-0 w-[600px] h-[500px] rounded-full bg-gradient-to-bl from-[var(--primary)]/10 via-[var(--accent)]/5 to-transparent pointer-events-none blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-48 rounded-full bg-[var(--primary)]/5 pointer-events-none blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-16 pb-12">
          <div className="grid lg:grid-cols-2 gap-8 xl:gap-16 items-center">

            {/* ── Left: Text ── */}
            <div className="reveal-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-[var(--primary)] text-xs font-semibold mb-5">
                <Icon.Compass size={12} /> Course Catalog
              </div>

              <h1 className="text-4xl sm:text-5xl xl:text-[3.4rem] font-bold tracking-tight leading-[1.12] text-balance">
                Find a course that{" "}
                <span className="gradient-text">moves you forward</span>.
              </h1>

              <p className="mt-4 text-base sm:text-lg text-[var(--muted)] max-w-lg leading-relaxed">
                Hand-picked, expert-led courses with built-in AI help.{" "}
                <span className="text-[var(--foreground)] font-semibold">Free to browse</span> — sign up to start learning.
              </p>

              {/* CTA row */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href={user ? "/dashboard" : "/register"}>
                  <Button size="lg">
                    {user ? "Go to dashboard" : "Start learning free"}
                    <Icon.ChevronRight size={16} />
                  </Button>
                </Link>
                <Link href="#catalog">
                  <Button variant="outline" size="lg">
                    <Icon.Compass size={16} /> Browse catalog
                  </Button>
                </Link>
              </div>

              {/* Stat pills */}
              <div className="mt-7 flex flex-wrap items-center gap-2.5">
                <StatPill icon={<Icon.Book size={13} />}     label={`${totalCourses}+ courses`} />
                <StatPill icon={<Icon.Star size={13} />}     label={`${avgRating} avg. rating`} />
                <StatPill icon={<Icon.Sparkles size={13} />} label={`${totalFree} free`} />
                <StatPill icon={<Icon.Users size={13} />}    label="12k+ learners" />
              </div>
            </div>

            {/* ── Right: Course showcase ── */}
            <div className="hidden lg:block relative">
              {/* Main card: Trending courses */}
              <div className="relative bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-xl shadow-black/8 overflow-hidden">
                {/* Card header */}
                <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-gradient-to-r from-[var(--surface-2)]/80 to-transparent">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                      <Icon.TrendingUp size={13} />
                    </div>
                    <span className="text-sm font-bold">Trending Courses</span>
                  </div>
                  <span className="text-xs text-[var(--muted)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full font-medium">
                    {totalCourses} total
                  </span>
                </div>

                {/* Course mini-list */}
                <div className="divide-y divide-[var(--border)]">
                  {COURSES.slice(0, 4).map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-[var(--surface-2)] transition-colors group">
                      {/* Rank */}
                      <span className={cn(
                        "w-5 text-center text-xs font-bold shrink-0",
                        i === 0 ? "text-amber-500" : "text-[var(--muted-2)]",
                      )}>
                        {i === 0 ? "🔥" : `${i + 1}`}
                      </span>

                      {/* Thumbnail */}
                      <div className="h-11 w-16 rounded-lg overflow-hidden shrink-0 bg-[var(--surface-2)]">
                        {c.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--primary)]">
                            <Icon.Book size={18} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold line-clamp-1 text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                          {c.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-0.5 text-xs text-amber-500 font-semibold">
                            <Icon.Star size={10} className="fill-amber-500" /> {c.rating}
                          </span>
                          <span className="text-xs text-[var(--muted)]">{c.category}</span>
                          <span className="text-xs text-[var(--muted)]">{formatHours(c.durationMinutes)}</span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="shrink-0 text-right">
                        {c.price === 0 ? (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Free</span>
                        ) : (
                          <span className="text-sm font-bold text-[var(--foreground)]">${c.price}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Card footer */}
                <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--surface-2)]/50">
                  <button
                    onClick={() => { const el = document.getElementById("catalog"); el?.scrollIntoView({ behavior: "smooth" }); }}
                    className="w-full text-xs font-semibold text-[var(--primary)] hover:underline flex items-center justify-center gap-1"
                  >
                    View all {totalCourses} courses <Icon.ChevronRight size={12} />
                  </button>
                </div>
              </div>

              {/* Floating badge — rating */}
              <div className="absolute -top-4 -right-4 flex items-center gap-2 bg-[var(--surface)] rounded-2xl px-4 py-2.5 border border-[var(--border)] shadow-lg shadow-black/8 pop-in" style={{ animationDelay: "0.3s" }}>
                <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Icon.Star size={15} className="fill-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-none">{avgRating}</p>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5">Avg. rating</p>
                </div>
              </div>

              {/* Floating badge — students */}
              <div className="absolute -bottom-4 -left-4 flex items-center gap-2 bg-[var(--surface)] rounded-2xl px-4 py-2.5 border border-[var(--border)] shadow-lg shadow-black/8 pop-in" style={{ animationDelay: "0.45s" }}>
                <div className="h-8 w-8 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] shrink-0">
                  <Icon.Users size={15} />
                </div>
                <div>
                  <p className="text-sm font-bold leading-none">12k+</p>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5">Active learners</p>
                </div>
              </div>

              {/* AI badge */}
              <div className="absolute top-1/2 -left-5 -translate-y-1/2 flex items-center gap-1.5 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white rounded-xl px-3 py-2 shadow-lg shadow-green-500/25 pop-in" style={{ animationDelay: "0.6s" }}>
                <Icon.Sparkles size={13} />
                <span className="text-[11px] font-bold">AI Powered</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Sticky filter bar ─────────────────────────── */}
      <section className="sticky top-16 z-20 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border)] shadow-sm shadow-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
          {/* Row 1: search + sort */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Icon.Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
              <input
                type="search"
                placeholder="Search courses…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className={cn(
                  "w-full h-10 pl-10 pr-4 rounded-xl text-sm",
                  "bg-[var(--surface)] border border-[var(--border)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/35 focus:border-[var(--border-strong)]",
                  "placeholder:text-[var(--muted-2)] text-[var(--foreground)] transition-all",
                )}
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition"
                >
                  <Icon.X size={14} />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative hidden sm:block">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className={cn(
                  "h-10 pl-3 pr-8 rounded-xl text-sm appearance-none cursor-pointer",
                  "bg-[var(--surface)] border border-[var(--border)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/35",
                  "text-[var(--foreground)] transition-all",
                )}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <Icon.ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
            </div>

            {/* Level pills (desktop) */}
            <div className="hidden lg:flex items-center gap-1 ml-auto">
              {levels.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={cn(
                    "px-3 h-9 rounded-lg text-xs font-medium transition-all",
                    level === l
                      ? "bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20"
                      : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] border border-transparent",
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: category pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-thin">
            {categories.map(({ value, icon }) => {
              const count = COURSES.filter((c) => value === "All" || c.category === value).length;
              const active = cat === value;
              return (
                <button
                  key={value}
                  onClick={() => setCat(value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0",
                    active
                      ? "bg-[var(--primary)] text-white shadow-sm shadow-green-500/20"
                      : "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]",
                  )}
                >
                  <span className={active ? "text-white" : "text-[var(--primary)]"}>{icon}</span>
                  {value}
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                    active ? "bg-white/20 text-white" : "bg-[var(--surface-2)] text-[var(--muted-2)]",
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Results ───────────────────────────────────── */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results bar */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm text-[var(--muted)]">
              <span className="text-[var(--foreground)] font-bold text-base">{filtered.length}</span>
              {" "}course{filtered.length === 1 ? "" : "s"} found
            </p>
            {/* Active filter pills */}
            {hasFilters && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {cat !== "All" && (
                  <ActiveFilterPill label={cat} onRemove={() => setCat("All")} />
                )}
                {level !== "All levels" && (
                  <ActiveFilterPill label={level} onRemove={() => setLevel("All levels")} />
                )}
                {q.trim() && (
                  <ActiveFilterPill label={`"${q}"`} onRemove={() => setQ("")} />
                )}
                <button
                  onClick={() => { setCat("All"); setLevel("All levels"); setQ(""); }}
                  className="text-xs text-[var(--muted)] hover:text-[var(--danger)] transition underline underline-offset-2"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Mobile sort */}
          <div className="flex items-center gap-2 sm:hidden">
            <Icon.Filter size={14} className="text-[var(--muted)]" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="text-xs bg-transparent text-[var(--foreground)] focus:outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<Icon.Compass size={28} />}
              title="No courses match your filters"
              description="Try a different category, level, or keyword to find what you're looking for."
              action={
                <Button variant="outline" onClick={() => { setCat("All"); setLevel("All levels"); setQ(""); }}>
                  <Icon.X size={14} /> Reset all filters
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((c, i) => (
              <div
                key={c.id}
                className="fade-in"
                style={{ animationDelay: `${Math.min(i * 0.04, 0.3)}s` }}
              >
                <MediaCard
                  image={c.thumbnail}
                  imageAlt={c.title}
                  fallbackIcon={<Icon.Book size={30} />}
                  bodyClassName="space-y-0"
                  overlay={
                    <>
                      <Link
                        href={user ? `/my-courses` : `/register`}
                        aria-label={c.title}
                        className="absolute inset-0 pointer-events-auto"
                      />
                      <Badge
                        variant="primary"
                        className="absolute top-3 left-3 backdrop-blur-sm bg-white/90 dark:bg-black/50 shadow-sm"
                      >
                        {c.category}
                      </Badge>
                      {c.price === 0 && (
                        <Badge variant="success" className="absolute top-3 right-3 shadow-sm">
                          Free
                        </Badge>
                      )}
                      {/* Rating chip on image */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-semibold">
                        <Icon.Star size={11} className="text-amber-400 fill-amber-400" />
                        {c.rating}
                        <span className="text-white/60 font-normal ml-0.5">({c.reviews.toLocaleString()})</span>
                      </div>
                    </>
                  }
                >
                  {/* Card body */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col">
                    {/* Title + instructor */}
                    <div>
                      <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-[var(--primary)] transition-colors text-[var(--foreground)]">
                        {c.title}
                      </h3>
                      <p className="text-xs text-[var(--muted)] mt-1 flex items-center gap-1">
                        <Icon.User size={11} /> {c.instructor}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed flex-1">
                      {c.description}
                    </p>

                    {/* Meta row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        c.level === "Beginner"     && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                        c.level === "Intermediate" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                        c.level === "Advanced"     && "bg-red-500/10 text-red-600 dark:text-red-400",
                      )}>
                        {c.level}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
                        <Icon.Clock size={11} /> {formatHours(c.durationMinutes)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
                        <Icon.Book size={11} /> {c.chapters.length} chapters
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-[var(--border)]" />

                    {/* Price + CTA */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold tracking-tight">
                          {c.price === 0 ? (
                            <span className="text-[var(--success)]">Free</span>
                          ) : (
                            `$${c.price}`
                          )}
                        </span>
                      </div>
                      <Link
                        href={user ? `/my-courses` : `/register`}
                        className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all"
                      >
                        {user ? "Open" : "Enroll"} <Icon.ChevronRight size={12} />
                      </Link>
                    </div>

                    {/* In-person CTA */}
                    <button
                      type="button"
                      onClick={() => handleApplyInPerson(c)}
                      className="w-full h-9 rounded-xl border border-dashed border-[var(--border-strong)] text-xs font-medium text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary-soft)] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Icon.Pin size={12} /> Apply for in-person class
                    </button>
                  </div>
                </MediaCard>
              </div>
            ))}
          </div>
        )}
      </section>

      <PhysicalApplicationModal
        course={physicalCourse}
        open={!!physicalCourse}
        onClose={() => setPhysicalCourse(null)}
      />

      {/* ── CTA banner ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--primary)] via-[color-mix(in_oklab,var(--primary)_75%,var(--accent))] to-[var(--accent)] p-1">
          {/* Inner card */}
          <div className="relative rounded-[20px] overflow-hidden bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] p-8 sm:p-10">
            {/* Dot pattern overlay */}
            <div className="absolute inset-0 bg-dots opacity-15 mix-blend-overlay pointer-events-none" />
            {/* Glow */}
            <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/8 blur-3xl pointer-events-none" />

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white font-medium mb-4">
                  <Icon.Sparkles size={11} /> Powered by AI
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  Not sure where to start?
                </h2>
                <p className="mt-2 text-white/80 text-sm sm:text-base leading-relaxed">
                  Tell us your goals and our AI will suggest a personalised learning path. Or just sign up free and explore at your own pace.
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/75">
                  <span className="flex items-center gap-1.5"><Icon.CheckCircle size={12} /> No credit card required</span>
                  <span className="flex items-center gap-1.5"><Icon.CheckCircle size={12} /> Free forever plan</span>
                  <span className="flex items-center gap-1.5"><Icon.CheckCircle size={12} /> AI tutor included</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link href={user ? "/dashboard" : "/register"}>
                  <Button
                    size="lg"
                    className="bg-white text-[var(--primary)] hover:bg-white/90 shadow-lg shadow-black/20 font-semibold"
                  >
                    {user ? "Open dashboard" : "Start for free"} <Icon.ChevronRight size={16} />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                  >
                    Talk to us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── Small helpers ── */
function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-medium text-[var(--muted)] shadow-sm">
      <span className="text-[var(--primary)]">{icon}</span>
      {label}
    </span>
  );
}

function ActiveFilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 h-6 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-xs font-semibold border border-[var(--primary)]/20">
      {label}
      <button
        onClick={onRemove}
        className="h-4 w-4 rounded-full hover:bg-[var(--primary)] hover:text-white flex items-center justify-center transition-all ml-0.5"
      >
        <Icon.X size={9} />
      </button>
    </span>
  );
}
