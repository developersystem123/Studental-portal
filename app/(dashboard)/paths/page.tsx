"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Card, CardBody, EmptyState, Progress, Skeleton, Tabs } from "@/components/ui";
import { MediaCard } from "@/components/MediaCard";
import Icon from "@/components/icons";
import { cn, formatHours } from "@/lib/utils";

type PathSummary = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  category: string;
  level: string;
  featured: boolean;
  courseCount: number;
  totalMinutes: number;
  learners: number;
  enrolled: boolean;
  progress: number;
};

type LevelFilter = "all" | "Beginner" | "Intermediate" | "Advanced";
type SortKey = "featured" | "popular" | "progress";

export default function LearningPathsPage() {
  const [paths, setPaths] = useState<PathSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "enrolled">("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [sort, setSort] = useState<SortKey>("featured");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/learning-paths");
        const data = r.ok ? await r.json() : { paths: [] };
        if (!cancelled) setPaths(data.paths ?? []);
      } catch {
        // Network errors silently fall through to empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(searchInput), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  const enrolled = useMemo(() => paths.filter((p) => p.enrolled), [paths]);
  const categories = useMemo(() => Array.from(new Set(paths.map((p) => p.category))).sort(), [paths]);

  const [catFilter, setCatFilter] = useState<string>("all");

  const shown = useMemo(() => {
    let list = tab === "enrolled" ? enrolled : paths;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    if (catFilter !== "all") list = list.filter((p) => p.category === catFilter);
    if (levelFilter !== "all") list = list.filter((p) => p.level === levelFilter);
    if (sort === "popular") list = [...list].sort((a, b) => b.learners - a.learners);
    else if (sort === "progress") list = [...list].sort((a, b) => b.progress - a.progress);
    else list = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return list;
  }, [paths, enrolled, tab, search, catFilter, levelFilter, sort]);

  const stats = useMemo(() => {
    const inProgress = enrolled.filter((p) => p.progress > 0 && p.progress < 100);
    const completed = enrolled.filter((p) => p.progress === 100);
    return { enrolled: enrolled.length, inProgress: inProgress.length, completed: completed.length };
  }, [enrolled]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Learning Paths</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Curated, step-by-step tracks that take you from beginner to job-ready.
          </p>
        </div>
        <Tabs
          value={tab}
          onChange={(v) => setTab(v as "all" | "enrolled")}
          options={[
            { value: "all", label: "All paths", count: paths.length },
            { value: "enrolled", label: "My paths", count: enrolled.length },
          ]}
        />
      </div>

      {/* Enrolled stats */}
      {!loading && enrolled.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Enrolled", value: stats.enrolled, color: "text-[var(--primary)]", icon: <Icon.Route size={16} /> },
            { label: "In progress", value: stats.inProgress, color: "text-amber-500", icon: <Icon.TrendingUp size={16} /> },
            { label: "Completed", value: stats.completed, color: "text-emerald-500", icon: <Icon.CheckCircle size={16} /> },
          ].map((s) => (
            <Card key={s.label}>
              <CardBody className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className={s.color}>{s.icon}</span>
                  <div>
                    <p className="text-lg font-bold leading-none">{s.value}</p>
                    <p className="text-[10px] text-[var(--muted)] mt-0.5">{s.label}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Search + filters */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Icon.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search paths by title, category…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(""); setSearch(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <Icon.X size={14} />
            </button>
          )}
        </div>

        {/* Category + level + sort */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Category pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setCatFilter("all")}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg font-medium transition",
                catFilter === "all" ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]",
              )}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCatFilter(catFilter === c ? "all" : c)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-lg font-medium transition",
                  catFilter === c ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-[var(--border)] hidden sm:block" />

          {/* Level filter */}
          {(["all", "Beginner", "Intermediate", "Advanced"] as LevelFilter[]).map((l) => (
            <button
              key={l}
              onClick={() => setLevelFilter(l)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg font-medium transition",
                levelFilter === l ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]",
              )}
            >
              {l === "all" ? "Any level" : l}
            </button>
          ))}

          <div className="sm:ml-auto flex items-center gap-1.5">
            <span className="text-xs text-[var(--muted)]">Sort:</span>
            {(["featured", "popular", "progress"] as SortKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setSort(k)}
                className={cn(
                  "text-xs px-2.5 py-1.5 rounded-lg font-medium transition capitalize",
                  sort === k ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]",
                )}
              >
                {k === "featured" ? "Featured" : k === "popular" ? "Popular" : "Progress"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      {!loading && (search || catFilter !== "all" || levelFilter !== "all") && (
        <p className="text-xs text-[var(--muted)]">
          {shown.length} path{shown.length !== 1 ? "s" : ""} found
          {search ? ` for "${search}"` : ""}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-72" />)}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon={<Icon.Route size={28} />}
          title={search || catFilter !== "all" || levelFilter !== "all" ? "No paths match" : tab === "enrolled" ? "No paths joined yet" : "No learning paths yet"}
          description={
            search || catFilter !== "all" || levelFilter !== "all"
              ? "Try adjusting your filters or search term."
              : tab === "enrolled"
                ? "Join a path to follow a structured track of courses."
                : "Check back soon — new paths are on the way."
          }
          action={
            (search || catFilter !== "all" || levelFilter !== "all") ? (
              <button
                onClick={() => { setSearchInput(""); setSearch(""); setCatFilter("all"); setLevelFilter("all"); }}
                className="text-xs px-4 py-2 rounded-lg bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition font-medium"
              >
                Clear all filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {shown.map((p) => <PathCard key={p.id} path={p} />)}
        </div>
      )}
    </div>
  );
}

function PathCard({ path }: { path: PathSummary }) {
  return (
    <MediaCard
      href={`/paths/${path.id}`}
      image={path.thumbnail}
      imageAlt={path.title}
      fallbackIcon={<Icon.Route size={30} />}
      bodyClassName="space-y-2"
      overlay={
        <>
          {path.featured && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-amber-950">
              <Icon.Star size={11} /> Featured
            </span>
          )}
          {path.enrolled && path.progress > 0 && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white">
              {path.progress}%
            </span>
          )}
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 text-white">
            <Icon.Route size={16} />
            <span className="text-xs font-medium">
              {path.courseCount} course{path.courseCount !== 1 ? "s" : ""} · {formatHours(path.totalMinutes)}
            </span>
          </div>
        </>
      }
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge variant="primary">{path.category}</Badge>
        <Badge variant="default">{path.level}</Badge>
        {path.enrolled && !path.progress && (
          <Badge variant="info">Enrolled</Badge>
        )}
        {path.progress === 100 && (
          <Badge variant="success">Completed</Badge>
        )}
      </div>
      <h3 className={cn(
        "font-semibold leading-snug line-clamp-2 group-hover:text-[var(--primary)] transition-colors",
        path.enrolled && path.progress < 100 ? "text-[var(--primary)]" : "",
      )}>
        {path.title}
      </h3>
      <p className="text-xs text-[var(--muted)] line-clamp-2 flex-1">{path.description}</p>
      {path.enrolled ? (
        <div className="pt-1 space-y-1">
          <Progress value={path.progress} />
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>{path.progress}% complete</span>
            <span className="text-[var(--primary)] font-medium">
              {path.progress === 100 ? "Review →" : "Continue →"}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-1 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1">
            <Icon.Users size={12} /> {path.learners.toLocaleString()} learner{path.learners !== 1 ? "s" : ""}
          </span>
          <span className="text-[var(--primary)] font-medium">Explore →</span>
        </div>
      )}
    </MediaCard>
  );
}
