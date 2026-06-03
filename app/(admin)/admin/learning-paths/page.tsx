"use client";

import * as React from "react";
import Icon from "@/components/icons";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Checkbox,
  EmptyState,
  Input,
  Label,
  Modal,
  Select,
  StatCard,
  Textarea,
  useToast,
} from "@/components/ui";
import { useData } from "@/lib/store";
import type { CourseCategory, CourseLevel } from "@/lib/mockData";

const CATEGORIES: CourseCategory[] = [
  "Web Dev", "Data Science", "Design", "Business", "Languages", "Math",
];
const LEVELS: CourseLevel[] = ["Beginner", "Intermediate", "Advanced"];

type SortKey = "featured" | "learners" | "courses" | "title";
type ViewMode = "grid" | "list";

type AdminPath = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  category: CourseCategory;
  level: CourseLevel;
  featured: boolean;
  learners: number;
  courseIds: string[];
  courseTitles: string[];
};

const CAT_COLORS: Record<CourseCategory, string> = {
  "Web Dev":      "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "Data Science": "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  "Design":       "bg-pink-500/15 text-pink-600 dark:text-pink-400",
  "Business":     "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "Languages":    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "Math":         "bg-blue-500/15 text-blue-600 dark:text-blue-400",
};

const LEVEL_COLORS: Record<CourseLevel, string> = {
  "Beginner":     "bg-green-500/15 text-green-600 dark:text-green-400",
  "Intermediate": "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  "Advanced":     "bg-red-500/15 text-red-600 dark:text-red-400",
};

function exportCSV(paths: AdminPath[]) {
  const header = ["Title", "Category", "Level", "Featured", "Courses", "Learners", "Description"];
  const rows = paths.map((p) => [
    `"${p.title.replace(/"/g, '""')}"`,
    p.category,
    p.level,
    p.featured ? "Yes" : "No",
    p.courseIds.length,
    p.learners,
    `"${p.description.replace(/"/g, '""')}"`,
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "learning-paths.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminLearningPathsPage() {
  const toast = useToast();
  const [paths, setPaths] = React.useState<AdminPath[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [levelFilter, setLevelFilter] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("featured");
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [mode, setMode] = React.useState<"create" | "edit" | "view" | null>(null);
  const [editing, setEditing] = React.useState<AdminPath | null>(null);
  const [viewing, setViewing] = React.useState<AdminPath | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const r = await fetch("/api/admin/learning-paths");
    const data = await r.json().catch(() => ({}));
    setPaths(data.paths ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const pathStats = React.useMemo(() => ({
    total: paths.length,
    featured: paths.filter((p) => p.featured).length,
    totalLearners: paths.reduce((s, p) => s + p.learners, 0),
    avgCourses: paths.length
      ? Math.round(paths.reduce((s, p) => s + p.courseIds.length, 0) / paths.length)
      : 0,
  }), [paths]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return paths
      .filter((p) => categoryFilter === "all" || p.category === categoryFilter)
      .filter((p) => levelFilter === "all" || p.level === levelFilter)
      .filter(
        (p) => !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        if (sortKey === "featured") {
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          return b.learners - a.learners;
        }
        if (sortKey === "learners") return b.learners - a.learners;
        if (sortKey === "courses") return b.courseIds.length - a.courseIds.length;
        return a.title.localeCompare(b.title);
      });
  }, [paths, query, categoryFilter, levelFilter, sortKey]);

  async function handleDelete(id: string) {
    const r = await fetch(`/api/admin/learning-paths/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    setConfirmDeleteId(null);
    if (r.ok) {
      toast.push({ title: "Learning path deleted", tone: "success" });
      load();
    } else {
      toast.push({ title: "Couldn't delete path", tone: "danger" });
    }
  }

  async function toggleFeatured(p: AdminPath) {
    setTogglingId(p.id);
    const r = await fetch(`/api/admin/learning-paths/${encodeURIComponent(p.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !p.featured }),
    });
    setTogglingId(null);
    if (r.ok) {
      setPaths((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, featured: !x.featured } : x)),
      );
      setViewing((v) => (v?.id === p.id ? { ...v, featured: !v.featured } : v));
      toast.push({
        title: p.featured ? "Removed from featured" : "Marked as featured",
        tone: "success",
      });
    } else {
      toast.push({ title: "Couldn't update path", tone: "danger" });
    }
  }

  function openView(p: AdminPath) {
    setViewing(p);
    setMode("view");
  }

  const hasFilter = query || categoryFilter !== "all" || levelFilter !== "all";

  return (
    <div className="space-y-6 fade-in">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
            Manage
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Learning Paths</h1>
          <p className="mt-1 text-[var(--muted)]">
            Curate ordered tracks of courses for students to follow.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => exportCSV(filtered)}>
            <Icon.Download size={15} /> Export CSV
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setMode("create");
            }}
          >
            <Icon.Plus size={16} /> New path
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total paths"
          value={pathStats.total}
          icon={<Icon.Route size={18} />}
          tone="primary"
        />
        <StatCard
          label="Featured"
          value={pathStats.featured}
          icon={<Icon.Star size={18} />}
          tone="warning"
        />
        <StatCard
          label="Total learners"
          value={pathStats.totalLearners}
          icon={<Icon.Users size={18} />}
          tone="success"
        />
        <StatCard
          label="Avg courses / path"
          value={pathStats.avgCourses}
          icon={<Icon.Book size={18} />}
          tone="accent"
        />
      </div>

      {/* ── Main card ── */}
      <Card>
        <CardBody className="space-y-4">
          {/* Toolbar row 1: search · level · sort · view toggle — all in one row */}
          <div className="flex items-center gap-2">
            <Input
              icon={<Icon.Search size={16} />}
              placeholder="Search paths…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 min-w-0 max-w-xs"
            />
            <div className="flex items-center gap-2 shrink-0">
              <Select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="h-9 text-xs !py-0 w-[120px]"
              >
                <option value="all">All levels</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </Select>
              <Select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="h-9 text-xs !py-0 w-[148px]"
              >
                <option value="featured">Featured first</option>
                <option value="learners">Most learners</option>
                <option value="courses">Most courses</option>
                <option value="title">A → Z</option>
              </Select>
              {/* View toggle */}
              <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
                <button
                  onClick={() => setViewMode("grid")}
                  title="Grid view"
                  className={`h-9 w-9 flex items-center justify-center transition ${
                    viewMode === "grid"
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Icon.BarChart3 size={15} className="rotate-90" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  title="List view"
                  className={`h-9 w-9 flex items-center justify-center transition ${
                    viewMode === "list"
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Icon.ListChecks size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Toolbar row 2: category chips */}
          <div className="flex flex-wrap gap-1.5">
            {["all", ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 h-7 rounded-full text-xs font-medium transition ${
                  categoryFilter === cat
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {cat === "all" ? "All categories" : cat}
              </button>
            ))}
          </div>

          {/* ── Content ── */}
          {loading ? (
            <p className="text-sm text-[var(--muted)] py-10 text-center flex items-center justify-center gap-2">
              <Icon.Loader size={16} className="animate-spin" /> Loading paths…
            </p>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Icon.Route size={20} />}
              title={hasFilter ? "No paths match." : "No learning paths yet."}
              description={
                hasFilter
                  ? "Try adjusting your filters or search query."
                  : "Create your first learning path to get started."
              }
              action={
                !hasFilter && (
                  <Button onClick={() => { setEditing(null); setMode("create"); }}>
                    <Icon.Plus size={16} /> New path
                  </Button>
                )
              }
            />
          ) : viewMode === "grid" ? (
            /* ── GRID VIEW ── */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <Card
                  key={p.id}
                  className="overflow-hidden group hover:-translate-y-0.5 transition-all duration-200 hover:shadow-md"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.thumbnail}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Quick featured star */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFeatured(p); }}
                      disabled={togglingId === p.id}
                      title={p.featured ? "Remove from featured" : "Mark as featured"}
                      className={`absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center shadow-md transition ${
                        p.featured
                          ? "bg-amber-400 text-amber-900"
                          : "bg-black/40 text-white/80 hover:bg-black/60 opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <Icon.Star size={13} />
                    </button>
                    {/* Level pill on thumbnail */}
                    <span
                      className={`absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm ${LEVEL_COLORS[p.level]}`}
                    >
                      {p.level}
                    </span>
                  </div>

                  <CardBody className="space-y-3">
                    {/* Category + featured badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CAT_COLORS[p.category]}`}>
                        {p.category}
                      </span>
                      {p.featured && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Icon.Star size={9} /> Featured
                        </span>
                      )}
                    </div>

                    {/* Title — clickable to view details */}
                    <h3
                      className="font-semibold leading-snug line-clamp-2 cursor-pointer hover:text-[var(--primary)] transition"
                      onClick={() => openView(p)}
                    >
                      {p.title}
                    </h3>

                    {/* Course list preview */}
                    {p.courseTitles.length > 0 && (
                      <ol className="space-y-1">
                        {p.courseTitles.slice(0, 3).map((t, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                            <span className="shrink-0 h-4 w-4 rounded bg-[var(--surface-2)] flex items-center justify-center font-bold text-[9px]">
                              {i + 1}
                            </span>
                            <span className="truncate">{t}</span>
                          </li>
                        ))}
                        {p.courseTitles.length > 3 && (
                          <li className="text-[11px] text-[var(--muted)] pl-5 italic">
                            +{p.courseTitles.length - 3} more
                          </li>
                        )}
                      </ol>
                    )}

                    {/* Footer stats */}
                    <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-1 border-t border-[var(--border)]">
                      <span className="flex items-center gap-1">
                        <Icon.Book size={12} /> {p.courseIds.length} course{p.courseIds.length !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon.Users size={12} /> {p.learners} learner{p.learners !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Card actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => { setEditing(p); setMode("edit"); }}
                      >
                        <Icon.FilePen size={13} /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openView(p)}
                        title="View details"
                      >
                        <Icon.Eye size={13} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDeleteId(p.id)}
                        title="Delete"
                      >
                        <Icon.Trash size={13} />
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            /* ── LIST VIEW ── */
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="font-medium py-2.5 px-3">Path</th>
                    <th className="font-medium py-2.5 px-3 hidden md:table-cell">Category</th>
                    <th className="font-medium py-2.5 px-3 hidden sm:table-cell">Level</th>
                    <th className="font-medium py-2.5 px-3 text-center">Courses</th>
                    <th className="font-medium py-2.5 px-3 text-center">Learners</th>
                    <th className="font-medium py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]/50 transition group"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-20 shrink-0 rounded-lg overflow-hidden hidden sm:block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.thumbnail}
                              alt={p.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p
                                className="font-semibold truncate cursor-pointer hover:text-[var(--primary)] transition"
                                onClick={() => openView(p)}
                              >
                                {p.title}
                              </p>
                              {p.featured && (
                                <Icon.Star size={12} className="text-amber-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-[var(--muted)] truncate max-w-[260px]">
                              {p.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${CAT_COLORS[p.category]}`}>
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 hidden sm:table-cell">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLORS[p.level]}`}>
                          {p.level}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant="primary">{p.courseIds.length}</Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant={p.learners > 0 ? "success" : "default"}>
                          {p.learners}
                        </Badge>
                      </td>
                      <td
                        className="py-3 px-3 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleFeatured(p)}
                            disabled={togglingId === p.id}
                            title={p.featured ? "Remove featured" : "Mark featured"}
                            className={`h-8 w-8 inline-flex items-center justify-center rounded-lg transition ${
                              p.featured
                                ? "text-amber-500 hover:bg-amber-500/10"
                                : "text-[var(--muted)] hover:text-amber-500 hover:bg-amber-500/10"
                            }`}
                          >
                            <Icon.Star size={14} />
                          </button>
                          <button
                            onClick={() => openView(p)}
                            title="View details"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition"
                          >
                            <Icon.Eye size={14} />
                          </button>
                          <button
                            onClick={() => { setEditing(p); setMode("edit"); }}
                            title="Edit"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition"
                          >
                            <Icon.FilePen size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(p.id)}
                            title="Delete"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-red-500/10 text-[var(--muted)] hover:text-[var(--danger)] transition"
                          >
                            <Icon.Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Count */}
          {!loading && filtered.length > 0 && (
            <p className="text-xs text-[var(--muted)]">
              Showing {filtered.length} of {paths.length} path{paths.length !== 1 ? "s" : ""}
            </p>
          )}
        </CardBody>
      </Card>

      {/* ── Path detail modal ── */}
      <PathDetailModal
        open={mode === "view"}
        path={viewing}
        togglingId={togglingId}
        onClose={() => setMode(null)}
        onEdit={(p) => {
          setMode(null);
          setTimeout(() => { setEditing(p); setMode("edit"); }, 60);
        }}
        onToggleFeatured={toggleFeatured}
      />

      {/* ── Create / Edit modal ── */}
      <PathFormModal
        open={mode === "create" || mode === "edit"}
        mode={mode === "edit" ? "edit" : "create"}
        path={editing}
        onClose={() => setMode(null)}
        onSaved={() => { setMode(null); load(); }}
      />

      {/* ── Delete confirm ── */}
      <Modal
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete learning path?"
      >
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            This removes the path and its student enrolments. The courses themselves are not
            affected.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Path detail modal                                                        */
/* ──────────────────────────────────────────────────────────────────────── */

function PathDetailModal({
  open,
  path,
  togglingId,
  onClose,
  onEdit,
  onToggleFeatured,
}: {
  open: boolean;
  path: AdminPath | null;
  togglingId: string | null;
  onClose: () => void;
  onEdit: (p: AdminPath) => void;
  onToggleFeatured: (p: AdminPath) => void;
}) {
  if (!path) return null;

  return (
    <Modal open={open} onClose={onClose} title="Path details" size="md">
      <div className="p-5 space-y-5">
        {/* Thumbnail */}
        <div className="aspect-video rounded-xl overflow-hidden shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={path.thumbnail}
            alt={path.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Title + featured toggle */}
        <div className="flex items-start gap-2 justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-bold leading-snug">{path.title}</h2>
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${CAT_COLORS[path.category]}`}>
                {path.category}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLORS[path.level]}`}>
                {path.level}
              </span>
              {path.featured && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Icon.Star size={9} /> Featured
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => onToggleFeatured(path)}
            disabled={togglingId === path.id}
            title={path.featured ? "Remove featured" : "Mark featured"}
            className={`shrink-0 h-9 w-9 rounded-xl flex items-center justify-center transition ${
              path.featured
                ? "text-amber-500 bg-amber-500/10"
                : "text-[var(--muted)] hover:text-amber-500 hover:bg-amber-500/10"
            }`}
          >
            <Icon.Star size={16} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Courses",
              value: path.courseIds.length,
              icon: <Icon.Book size={13} />,
              cls: "text-sky-500 bg-sky-500/10",
            },
            {
              label: "Learners",
              value: path.learners,
              icon: <Icon.Users size={13} />,
              cls: "text-emerald-500 bg-emerald-500/10",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-center"
            >
              <div className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 mb-1.5 ${s.cls}`}>
                {s.icon} {s.label}
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        <div>
          <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-1.5">
            About this path
          </p>
          <p className="text-sm text-[var(--foreground)] leading-relaxed">{path.description}</p>
        </div>

        {/* Course track */}
        {path.courseTitles.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
              Course track ({path.courseTitles.length} courses)
            </p>
            <ol className="space-y-1.5">
              {path.courseTitles.map((t, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm">
                  <span className="h-5 w-5 shrink-0 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span className="truncate">{t}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex gap-2 pt-1 border-t border-[var(--border)]">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button onClick={() => onEdit(path)}>
            <Icon.FilePen size={14} /> Edit path
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Create / Edit form modal                                                 */
/* ──────────────────────────────────────────────────────────────────────── */

type FormState = {
  title: string;
  description: string;
  category: CourseCategory;
  level: CourseLevel;
  featured: boolean;
  courseIds: string[];
};

const emptyForm: FormState = {
  title: "",
  description: "",
  category: "Web Dev",
  level: "Beginner",
  featured: false,
  courseIds: [],
};

function PathFormModal({
  open,
  mode,
  path,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: "create" | "edit" | null;
  path: AdminPath | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { courses } = useData();
  const toast = useToast();
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [courseQuery, setCourseQuery] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (mode === "edit" && path) {
      setForm({
        title: path.title,
        description: path.description,
        category: path.category,
        level: path.level,
        featured: path.featured,
        courseIds: path.courseIds,
      });
    } else {
      setForm(emptyForm);
    }
    setCourseQuery("");
    setErr(null);
  }, [open, mode, path]);

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleCourse(id: string) {
    setForm((f) => ({
      ...f,
      courseIds: f.courseIds.includes(id)
        ? f.courseIds.filter((c) => c !== id)
        : [...f.courseIds, id],
    }));
  }

  const visibleCourses = React.useMemo(() => {
    const q = courseQuery.trim().toLowerCase();
    return courses.filter((c) => !q || c.title.toLowerCase().includes(q));
  }, [courses, courseQuery]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (form.title.trim().length < 3) return setErr("Title is too short (min 3 chars).");
    if (form.description.trim().length < 10)
      return setErr("Description should be at least 10 characters.");
    if (form.courseIds.length === 0) return setErr("Add at least one course to the path.");

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      level: form.level,
      featured: form.featured,
      courseIds: form.courseIds,
    };
    const r =
      mode === "edit" && path
        ? await fetch(`/api/admin/learning-paths/${encodeURIComponent(path.id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/learning-paths", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
    const data = await r.json().catch(() => ({}));
    setSaving(false);
    if (!r.ok) {
      setErr(data.error ?? "Couldn't save the path.");
      return;
    }
    toast.push({ title: mode === "edit" ? "Path updated" : "Path created", tone: "success" });
    onSaved();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Edit learning path" : "New learning path"}
      size="lg"
    >
      <form onSubmit={submit} className="p-5 space-y-4">
        {/* Title */}
        <div>
          <Label htmlFor="p-title">Title</Label>
          <Input
            id="p-title"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Full-Stack Web Developer"
            maxLength={120}
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="p-desc">Description</Label>
          <Textarea
            id="p-desc"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="What will students achieve by completing this path?"
            rows={3}
          />
          <p className="text-[11px] text-[var(--muted)] mt-1 text-right">
            {form.description.length} chars
          </p>
        </div>

        {/* Category · Level · Featured */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="p-cat">Category</Label>
            <Select
              id="p-cat"
              value={form.category}
              onChange={(e) => update("category", e.target.value as CourseCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="p-lvl">Level</Label>
            <Select
              id="p-lvl"
              value={form.level}
              onChange={(e) => update("level", e.target.value as CourseLevel)}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-end pb-2.5">
            <Checkbox
              checked={form.featured}
              onChange={(v) => update("featured", v)}
              label="Featured"
            />
          </div>
        </div>

        {/* Course picker */}
        <div>
          <Label>
            Courses in this path
            <span className="ml-1 text-[var(--muted)] font-normal">
              ({form.courseIds.length} selected)
            </span>
          </Label>
          <p className="text-xs text-[var(--muted)] mb-2">
            Courses appear to students in the order you select them.
          </p>
          <Input
            icon={<Icon.Search size={16} />}
            placeholder="Search courses…"
            value={courseQuery}
            onChange={(e) => setCourseQuery(e.target.value)}
            className="mb-2"
          />
          <div className="max-h-56 overflow-y-auto scrollbar-thin rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
            {visibleCourses.length === 0 ? (
              <p className="text-sm text-[var(--muted)] p-3 text-center">No courses match.</p>
            ) : (
              visibleCourses.map((c) => {
                const idx = form.courseIds.indexOf(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCourse(c.id)}
                    className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-[var(--surface-2)] transition"
                  >
                    <span
                      className={
                        "h-5 w-5 shrink-0 rounded-md border flex items-center justify-center text-[10px] font-bold " +
                        (idx >= 0
                          ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                          : "border-[var(--border-strong)]")
                      }
                    >
                      {idx >= 0 ? idx + 1 : ""}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium truncate">{c.title}</span>
                      <span className="block text-xs text-[var(--muted)]">
                        {c.category} · {c.level}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {err && (
          <p className="text-sm text-[var(--danger)] bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
            {err}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {mode === "edit" ? "Save changes" : "Create path"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
