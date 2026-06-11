"use client";

import * as React from "react";
import Icon from "@/components/icons";
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  Label,
  Modal,
  Select,
  StatCard,
  Textarea,
  useToast,
} from "@/components/ui";
import { useAdmin, useData } from "@/lib/store";
import type { Course, CourseCategory, CourseLevel } from "@/lib/mockData";
import { cn, formatHours } from "@/lib/utils";

const CATEGORIES: CourseCategory[] = ["Web Dev", "Data Science", "Design", "Business", "Languages", "Math"];
const LEVELS: CourseLevel[] = ["Beginner", "Intermediate", "Advanced"];
const USD_TO_PKR = 280;

const CATEGORY_COLORS: Record<CourseCategory, string> = {
  "Web Dev":      "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "Data Science": "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  "Design":       "bg-pink-500/15 text-pink-600 dark:text-pink-400",
  "Business":     "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "Languages":    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "Math":         "bg-blue-500/15 text-blue-600 dark:text-blue-400",
};

const defaultThumb = (a = "#16a34a", b = "#4ade80") =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs><rect width='600' height='400' fill='url(%23g)'/></svg>`,
  )}`;

type FormState = {
  title: string; description: string; instructor: string;
  category: CourseCategory; level: CourseLevel;
  price: string; pricePkr: string; durationMinutes: string; tags: string;
};
const emptyForm: FormState = {
  title: "", description: "", instructor: "",
  category: "Web Dev", level: "Beginner",
  price: "0", pricePkr: "0", durationMinutes: "60", tags: "",
};

type SortKey = "title" | "price" | "rating" | "chapters";
type ViewMode = "grid" | "list";

function exportCSV(courses: Course[]) {
  const header = ["Title", "Instructor", "Category", "Level", "Price (USD)", "Price (PKR)", "Chapters", "Duration (min)", "Rating", "Tags"];
  const rows = courses.map((c) => [
    `"${c.title.replace(/"/g, '""')}"`,
    `"${c.instructor}"`,
    c.category, c.level,
    c.price,
    Math.round(c.price * USD_TO_PKR),
    c.chapters.length,
    c.durationMinutes,
    c.rating,
    `"${c.tags.join(", ")}"`,
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "courses.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminCoursesPage() {
  const { courses } = useData();
  const admin = useAdmin();
  const toast = useToast();

  const [query, setQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [levelFilter, setLevelFilter] = React.useState<string>("all");
  const [priceFilter, setPriceFilter] = React.useState<"all" | "free" | "paid">("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("title");
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [mode, setMode] = React.useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = React.useState<Course | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [duplicating, setDuplicating] = React.useState<string | null>(null);

  const stats = React.useMemo(() => ({
    total: courses.length,
    free: courses.filter((c) => c.price === 0).length,
    paid: courses.filter((c) => c.price > 0).length,
    totalChapters: courses.reduce((s, c) => s + c.chapters.length, 0),
    avgRating: courses.length ? (courses.reduce((s, c) => s + c.rating, 0) / courses.length).toFixed(1) : "–",
  }), [courses]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses
      .filter((c) => categoryFilter === "all" || c.category === categoryFilter)
      .filter((c) => levelFilter === "all" || c.level === levelFilter)
      .filter((c) => priceFilter === "all" || (priceFilter === "free" ? c.price === 0 : c.price > 0))
      .filter((c) => !q || c.title.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortKey === "price") return a.price - b.price;
        if (sortKey === "rating") return b.rating - a.rating;
        if (sortKey === "chapters") return b.chapters.length - a.chapters.length;
        return a.title.localeCompare(b.title);
      });
  }, [courses, query, categoryFilter, levelFilter, priceFilter, sortKey]);

  const activeFilters = [
    categoryFilter !== "all" && { key: "cat", label: categoryFilter, clear: () => setCategoryFilter("all") },
    levelFilter !== "all" && { key: "lvl", label: levelFilter, clear: () => setLevelFilter("all") },
    priceFilter !== "all" && { key: "price", label: priceFilter === "free" ? "Free" : "Paid", clear: () => setPriceFilter("all") },
    query.trim() && { key: "q", label: `"${query.trim()}"`, clear: () => setQuery("") },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  async function handleDuplicate(c: Course) {
    setDuplicating(c.id);
    await new Promise((r) => setTimeout(r, 400));
    await admin.addCourse({
      ...c,
      title: `${c.title} (Copy)`,
      slug: undefined,
    });
    setDuplicating(null);
    toast.push({ title: "Course duplicated", tone: "success" });
  }

  function handleDelete(id: string) {
    admin.deleteCourse(id);
    setConfirmDeleteId(null);
    toast.push({ title: "Course deleted", tone: "success" });
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">Courses</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Add, edit, and remove courses from the catalog.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => { exportCSV(filtered); toast.push({ title: "CSV exported", tone: "success" }); }} className="flex-1 sm:flex-none justify-center">
            <Icon.Download size={15} /> Export CSV
          </Button>
          <Button onClick={() => { setEditing(null); setMode("create"); }} className="flex-1 sm:flex-none justify-center">
            <Icon.Plus size={16} /> New course
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total courses"   value={stats.total}         icon={<Icon.Book size={16} />}       tone="primary" delta="In catalog" />
        <StatCard label="Free courses"    value={stats.free}          icon={<Icon.CheckCircle size={16} />} tone="success" delta="No charge" />
        <StatCard label="Paid courses"    value={stats.paid}          icon={<Icon.DollarSign size={16} />}  tone="accent"  delta="Revenue generating" />
        <StatCard label="Total chapters"  value={stats.totalChapters} icon={<Icon.ListChecks size={16} />}  tone="warning" delta="Across all courses" />
        <StatCard label="Avg rating"      value={stats.avgRating}     icon={<Icon.Star size={16} />}        tone="primary" delta="Out of 5.0" />
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="space-y-3">
          {/* Row 1: Search + view toggle */}
          <div className="flex gap-2 items-center">
            <Input
              icon={<Icon.Search size={15} />}
              placeholder="Search by title, instructor, or category…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="!h-9 flex-1"
            />
            {/* View toggle */}
            <div className="flex shrink-0 border border-[var(--border)] rounded-lg overflow-hidden h-9">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("px-2.5 transition", viewMode === "grid" ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "text-[var(--muted)] hover:bg-[var(--surface-2)]")}
                title="Grid view"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("px-2.5 border-l border-[var(--border)] transition", viewMode === "list" ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "text-[var(--muted)] hover:bg-[var(--surface-2)]")}
                title="List view"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Row 2: Dropdown filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="!h-9 w-full">
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="!h-9 w-full">
              <option value="all">All levels</option>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
            <Select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value as "all" | "free" | "paid")} className="!h-9 w-full">
              <option value="all">All prices</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </Select>
            <Select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="!h-9 w-full">
              <option value="title">Sort: Title</option>
              <option value="price">Sort: Price</option>
              <option value="rating">Sort: Rating</option>
              <option value="chapters">Sort: Chapters</option>
            </Select>
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[var(--muted)]">Filters:</span>
              {activeFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={f.clear}
                  className="inline-flex items-center gap-1 text-xs px-2 h-6 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-semibold hover:brightness-95 transition"
                >
                  {f.label} <Icon.X size={11} />
                </button>
              ))}
              <button
                onClick={() => { setQuery(""); setCategoryFilter("all"); setLevelFilter("all"); setPriceFilter("all"); }}
                className="text-xs text-[var(--muted)] hover:text-[var(--danger)] transition"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Results */}
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Icon.Book size={20} />}
              title={activeFilters.length > 0 ? "No courses match." : "No courses yet."}
              description={activeFilters.length > 0 ? "Try adjusting your filters." : "Create your first course to get started."}
              action={activeFilters.length === 0 && <Button onClick={() => setMode("create")}><Icon.Plus size={16} /> New course</Button>}
            />
          ) : viewMode === "grid" ? (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((c) => (
                  <CourseGridCard
                    key={c.id}
                    course={c}
                    duplicating={duplicating === c.id}
                    onEdit={() => { setEditing(c); setMode("edit"); }}
                    onDuplicate={() => handleDuplicate(c)}
                    onDelete={() => setConfirmDeleteId(c.id)}
                  />
                ))}
              </div>
              <p className="text-xs text-[var(--muted)]">
                Showing <span className="font-semibold text-[var(--foreground)]">{filtered.length}</span> of <span className="font-semibold text-[var(--foreground)]">{courses.length}</span> courses
              </p>
            </>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                      <th className="text-left px-4 py-3 font-semibold text-[var(--muted)] text-xs uppercase tracking-wider">Course</th>
                      <th className="text-left px-4 py-3 font-semibold text-[var(--muted)] text-xs uppercase tracking-wider">Category</th>
                      <th className="text-left px-4 py-3 font-semibold text-[var(--muted)] text-xs uppercase tracking-wider">Level</th>
                      <th className="text-left px-4 py-3 font-semibold text-[var(--muted)] text-xs uppercase tracking-wider">Price</th>
                      <th className="text-left px-4 py-3 font-semibold text-[var(--muted)] text-xs uppercase tracking-wider">Rating</th>
                      <th className="text-left px-4 py-3 font-semibold text-[var(--muted)] text-xs uppercase tracking-wider">Duration</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filtered.map((c) => (
                      <tr key={c.id} className="hover:bg-[var(--surface-2)] transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={c.thumbnail} alt={c.title} className="h-10 w-14 rounded-lg object-cover shrink-0 border border-[var(--border)]" />
                            <div className="min-w-0">
                              <p className="font-semibold truncate max-w-[220px]">{c.title}</p>
                              <p className="text-xs text-[var(--muted)] truncate">{c.instructor}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", CATEGORY_COLORS[c.category])}>
                            {c.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted)] text-xs">{c.level}</td>
                        <td className="px-4 py-3">
                          {c.price === 0 ? (
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Free</span>
                          ) : (
                            <div>
                              <p className="font-semibold text-xs">${c.price}</p>
                              <p className="text-[10px] text-[var(--muted)]">₨{(c.price * USD_TO_PKR).toLocaleString()}</p>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-xs font-medium">
                            <Icon.Star size={12} className="text-amber-500" /> {c.rating}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted)] text-xs">{formatHours(c.durationMinutes)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => { setEditing(c); setMode("edit"); }} className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)] transition" title="Edit">
                              <Icon.FilePen size={14} />
                            </button>
                            <button onClick={() => handleDuplicate(c)} className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)] transition" title="Duplicate">
                              <Icon.Copy size={14} />
                            </button>
                            <button onClick={() => setConfirmDeleteId(c.id)} className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition" title="Delete">
                              <Icon.Trash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Showing <span className="font-semibold text-[var(--foreground)]">{filtered.length}</span> of <span className="font-semibold text-[var(--foreground)]">{courses.length}</span> courses
              </p>
            </>
          )}
        </CardBody>
      </Card>

      <CourseFormModal open={mode !== null} mode={mode} course={editing} onClose={() => setMode(null)} />

      <Modal open={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)} title="Delete course?">
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            This removes the course and clears related enrollments and certificates. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}>
              <Icon.Trash size={14} /> Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ── Grid card ─────────────────────────────────────────────────────────────── */
function CourseGridCard({
  course: c, duplicating, onEdit, onDuplicate, onDelete,
}: {
  course: Course;
  duplicating: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--primary)]/30 hover:shadow-lg transition-all duration-200">
      {/* Thumbnail */}
      <div className="relative h-40 overflow-hidden bg-[var(--surface-2)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap">
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", CATEGORY_COLORS[c.category])}>{c.category}</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/30 text-white backdrop-blur-sm">{c.level}</span>
        </div>
        {/* Price bottom-right */}
        <div className="absolute bottom-2.5 right-2.5">
          {c.price === 0 ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">Free</span>
          ) : (
            <div className="text-right">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-sm">${c.price}</span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-[var(--primary)] transition">{c.title}</h3>
          <p className="text-xs text-[var(--muted)] mt-0.5">{c.instructor}</p>
        </div>
        <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">{c.description}</p>

        {/* Meta row */}
        <div className="flex items-center justify-between text-xs text-[var(--muted)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Icon.Star size={11} className="text-amber-500" />{c.rating}</span>
            <span className="flex items-center gap-1"><Icon.Clock size={11} />{formatHours(c.durationMinutes)}</span>
            <span className="flex items-center gap-1"><Icon.Book size={11} />{c.chapters.length} ch.</span>
          </div>
          {c.price > 0 && (
            <span className="text-[10px] text-[var(--muted-2)]">₨{(c.price * USD_TO_PKR).toLocaleString()}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t border-[var(--border)]">
          <Button size="sm" variant="outline" className="flex-1" onClick={onEdit}>
            <Icon.FilePen size={13} /> Edit
          </Button>
          <button
            onClick={onDuplicate}
            disabled={duplicating}
            title="Duplicate"
            className="p-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/30 hover:bg-[var(--primary-soft)] disabled:opacity-50 transition"
          >
            <Icon.Copy size={14} />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="p-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--danger)] hover:border-red-400/30 hover:bg-red-500/10 transition"
          >
            <Icon.Trash size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Course form modal ─────────────────────────────────────────────────────── */
function CourseFormModal({ open, mode, course, onClose }: {
  open: boolean; mode: "create" | "edit" | null; course: Course | null; onClose: () => void;
}) {
  const admin = useAdmin();
  const toast = useToast();
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (mode === "edit" && course) {
      setForm({
        title: course.title, description: course.description, instructor: course.instructor,
        category: course.category, level: course.level,
        price: String(course.price), pricePkr: String(Math.round(course.price * USD_TO_PKR)),
        durationMinutes: String(course.durationMinutes), tags: course.tags.join(", "),
      });
    } else {
      setForm(emptyForm);
    }
    setErr(null);
  }, [open, mode, course]);

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (form.title.trim().length < 3)         return setErr("Title must be at least 3 characters.");
    if (form.description.trim().length < 10)  return setErr("Description must be at least 10 characters.");
    if (form.instructor.trim().length < 2)    return setErr("Instructor name is required.");
    const price = Number(form.price);
    const duration = Number(form.durationMinutes);
    if (!Number.isFinite(price) || price < 0) return setErr("Price must be 0 or a positive number.");
    if (!Number.isFinite(duration) || duration <= 0) return setErr("Duration must be a positive number of minutes.");

    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = {
      title: form.title.trim(), description: form.description.trim(),
      instructor: form.instructor.trim(), category: form.category, level: form.level,
      price, durationMinutes: duration, tags,
      thumbnail: course?.thumbnail ?? defaultThumb(),
    };

    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    if (mode === "edit" && course) {
      admin.updateCourse(course.id, payload);
      toast.push({ title: "Course updated", tone: "success" });
    } else {
      admin.addCourse(payload);
      toast.push({ title: "Course created", tone: "success" });
    }
    setSaving(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={mode === "edit" ? "Edit course" : "New course"} size="lg">
      <form onSubmit={submit} className="p-5 space-y-4">
        <div>
          <Label htmlFor="c-title">Title</Label>
          <Input id="c-title" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Intro to Python" />
        </div>
        <div>
          <Label htmlFor="c-desc">Description</Label>
          <Textarea id="c-desc" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="What will students learn?" rows={3} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="c-instr">Instructor</Label>
            <Input id="c-instr" value={form.instructor} onChange={(e) => update("instructor", e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <Label htmlFor="c-tags">Tags (comma-separated)</Label>
            <Input id="c-tags" value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="React, TypeScript" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="c-cat">Category</Label>
            <Select id="c-cat" value={form.category} onChange={(e) => update("category", e.target.value as CourseCategory)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="c-lvl">Level</Label>
            <Select id="c-lvl" value={form.level} onChange={(e) => update("level", e.target.value as CourseLevel)}>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="c-price">Price (USD $)</Label>
            <Input id="c-price" type="number" min="0" step="1" value={form.price}
              onChange={(e) => {
                const usd = e.target.value;
                setForm((f) => ({ ...f, price: usd, pricePkr: usd === "" ? "" : String(Math.round(Number(usd) * USD_TO_PKR)) }));
              }}
            />
          </div>
          <div>
            <Label htmlFor="c-pkr">Price (PKR ₨)</Label>
            <Input id="c-pkr" type="number" min="0" step="1" value={form.pricePkr}
              onChange={(e) => {
                const pkr = e.target.value;
                setForm((f) => ({ ...f, pricePkr: pkr, price: pkr === "" ? "" : String(Math.round(Number(pkr) / USD_TO_PKR)) }));
              }}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="c-dur">Duration (minutes)</Label>
          <Input id="c-dur" type="number" min="1" step="1" value={form.durationMinutes} onChange={(e) => update("durationMinutes", e.target.value)} className="sm:max-w-[160px]" />
        </div>
        {err && (
          <p className="text-sm text-[var(--danger)] bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg flex items-center gap-2">
            <Icon.AlertCircle size={14} className="shrink-0" /> {err}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving}>
            {mode === "edit" ? "Save changes" : "Create course"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
