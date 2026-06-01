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
  Textarea,
  useToast,
} from "@/components/ui";
import { useData } from "@/lib/store";
import type { CourseCategory, CourseLevel } from "@/lib/mockData";

const CATEGORIES: CourseCategory[] = ["Web Dev", "Data Science", "Design", "Business", "Languages", "Math"];
const LEVELS: CourseLevel[] = ["Beginner", "Intermediate", "Advanced"];

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

export default function AdminLearningPathsPage() {
  const toast = useToast();
  const [paths, setPaths] = React.useState<AdminPath[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [mode, setMode] = React.useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = React.useState<AdminPath | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const r = await fetch("/api/admin/learning-paths");
    const data = await r.json().catch(() => ({}));
    setPaths(data.paths ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const pathStats = React.useMemo(() => ({
    total: paths.length,
    featured: paths.filter((p) => p.featured).length,
    totalLearners: paths.reduce((s, p) => s + p.learners, 0),
  }), [paths]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return paths
      .filter((p) => categoryFilter === "all" || p.category === categoryFilter)
      .filter((p) => !q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [paths, query, categoryFilter]);

  async function handleDelete(id: string) {
    const r = await fetch(`/api/admin/learning-paths/${encodeURIComponent(id)}`, { method: "DELETE" });
    setConfirmDeleteId(null);
    if (r.ok) {
      toast.push({ title: "Learning path deleted", tone: "success" });
      load();
    } else {
      toast.push({ title: "Couldn't delete path", tone: "danger" });
    }
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Learning Paths</h1>
          <p className="mt-1 text-[var(--muted)]">Curate ordered tracks of courses for students to follow.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setMode("create");
          }}
        >
          <Icon.Plus size={16} /> New path
        </Button>
      </div>

      {paths.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total paths", value: pathStats.total, icon: <Icon.Route size={16} />, tint: "bg-[var(--primary-soft)] text-[var(--primary)]" },
            { label: "Featured", value: pathStats.featured, icon: <Icon.Star size={16} />, tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
            { label: "Total learners", value: pathStats.totalLearners, icon: <Icon.Users size={16} />, tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
          ].map((s) => (
            <Card key={s.label}>
              <CardBody className="flex items-center gap-3 !py-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${s.tint}`}>{s.icon}</div>
                <div className="min-w-0">
                  <p className="text-[11px] text-[var(--muted)]">{s.label}</p>
                  <p className="text-xl font-bold tracking-tight">{s.value}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <Input
              icon={<Icon.Search size={16} />}
              placeholder="Search paths by title or category…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="sm:max-w-xs"
            />
            <div className="flex flex-wrap gap-1.5">
              {["all", ...CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 h-8 rounded-lg text-xs font-medium transition capitalize ${categoryFilter === cat ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"}`}
                >
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-[var(--muted)] py-6 text-center">Loading…</p>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Icon.Route size={20} />}
              title={query || categoryFilter !== "all" ? "No paths match." : "No learning paths yet."}
              description={query || categoryFilter !== "all" ? "Try a different filter." : "Create your first learning path."}
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <Card key={p.id} className="overflow-hidden">
                  <div className="aspect-video">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.thumbnail} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                  <CardBody className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="primary">{p.category}</Badge>
                      <Badge variant="default">{p.level}</Badge>
                      {p.featured && (
                        <Badge variant="warning">
                          <Icon.Star size={11} /> Featured
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold leading-snug line-clamp-2">{p.title}</h3>
                    <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                      <span>{p.courseIds.length} courses</span>
                      <span>{p.learners} learners</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setEditing(p);
                          setMode("edit");
                        }}
                      >
                        <Icon.FilePen size={14} /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(p.id)}>
                        <Icon.Trash size={14} />
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <PathFormModal
        open={mode !== null}
        mode={mode}
        path={editing}
        onClose={() => setMode(null)}
        onSaved={() => {
          setMode(null);
          load();
        }}
      />

      <Modal
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete learning path?"
      >
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            This removes the path and its student enrolments. The courses themselves are not affected.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

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
    if (form.title.trim().length < 3) return setErr("Title is too short.");
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
        <div>
          <Label htmlFor="p-title">Title</Label>
          <Input
            id="p-title"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Full-Stack Web Developer"
          />
        </div>
        <div>
          <Label htmlFor="p-desc">Description</Label>
          <Textarea
            id="p-desc"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="What will students achieve by completing this path?"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="p-cat">Category</Label>
            <Select
              id="p-cat"
              value={form.category}
              onChange={(e) => update("category", e.target.value as CourseCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
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
                <option key={l} value={l}>
                  {l}
                </option>
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

        <div>
          <Label>Courses in this path ({form.courseIds.length} selected)</Label>
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
              <p className="text-sm text-[var(--muted)] p-3">No courses match.</p>
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
