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
  Textarea,
  useToast,
} from "@/components/ui";
import { MediaCard } from "@/components/MediaCard";
import { useAdmin, useData } from "@/lib/store";
import type { Course, CourseCategory, CourseLevel } from "@/lib/mockData";

const CATEGORIES: CourseCategory[] = ["Web Dev", "Data Science", "Design", "Business", "Languages", "Math"];
const LEVELS: CourseLevel[] = ["Beginner", "Intermediate", "Advanced"];

const defaultThumb = (a = "#16a34a", b = "#4ade80") =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs><rect width='600' height='400' fill='url(%23g)'/></svg>`,
  )}`;

type FormState = {
  title: string;
  description: string;
  instructor: string;
  category: CourseCategory;
  level: CourseLevel;
  price: string;
  durationMinutes: string;
  tags: string;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  instructor: "",
  category: "Web Dev",
  level: "Beginner",
  price: "0",
  durationMinutes: "60",
  tags: "",
};

type SortKey = "title" | "price" | "chapters";

export default function AdminCoursesPage() {
  const { courses } = useData();
  const admin = useAdmin();
  const toast = useToast();
  const [query, setQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [levelFilter, setLevelFilter] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("title");
  const [mode, setMode] = React.useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = React.useState<Course | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses
      .filter((c) => categoryFilter === "all" || c.category === categoryFilter)
      .filter((c) => levelFilter === "all" || c.level === levelFilter)
      .filter(
        (c) =>
          !q ||
          c.title.toLowerCase().includes(q) ||
          c.instructor.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        if (sortKey === "price") return a.price - b.price;
        if (sortKey === "chapters") return b.chapters.length - a.chapters.length;
        return a.title.localeCompare(b.title);
      });
  }, [courses, query, categoryFilter, levelFilter, sortKey]);

  function startCreate() {
    setEditing(null);
    setMode("create");
  }
  function startEdit(c: Course) {
    setEditing(c);
    setMode("edit");
  }

  function handleDelete(id: string) {
    admin.deleteCourse(id);
    setConfirmDeleteId(null);
    toast.push({ title: "Course deleted", tone: "success" });
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Courses</h1>
          <p className="mt-1 text-[var(--muted)]">Add, edit, and remove courses from the catalog.</p>
        </div>
        <Button onClick={startCreate}>
          <Icon.Plus size={16} /> New course
        </Button>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <Input
              icon={<Icon.Search size={16} />}
              placeholder="Search by title, instructor, or category…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="sm:max-w-xs"
            />
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="!h-9 !w-36">
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="!h-9 !w-32">
                <option value="all">All levels</option>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </Select>
              <Select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="!h-9 !w-32">
                <option value="title">Sort: Title</option>
                <option value="price">Sort: Price</option>
                <option value="chapters">Sort: Chapters</option>
              </Select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Icon.Book size={20} />}
              title={query || categoryFilter !== "all" || levelFilter !== "all" ? "No courses match." : "No courses yet."}
              description={query || categoryFilter !== "all" || levelFilter !== "all" ? "Try a different filter." : "Create your first course."}
              action={!query && categoryFilter === "all" && levelFilter === "all" && <Button onClick={startCreate}><Icon.Plus size={16} /> New course</Button>}
            />
          ) : (
            <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((c) => (
                <MediaCard
                  key={c.id}
                  image={c.thumbnail}
                  imageAlt={c.title}
                  fallbackIcon={<Icon.Book size={30} />}
                  bodyClassName="space-y-3"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="primary">{c.category}</Badge>
                    <Badge variant="default">{c.level}</Badge>
                    {c.price === 0 ? (
                      <Badge variant="success">Free</Badge>
                    ) : (
                      <Badge variant="info">${c.price}</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold leading-snug line-clamp-2">{c.title}</h3>
                  <p className="text-xs text-[var(--muted)] line-clamp-2">{c.description}</p>
                  <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-1">
                    <span>{c.instructor}</span>
                    <span>{c.chapters.length} chapters</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => startEdit(c)}>
                      <Icon.FilePen size={14} /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(c.id)}>
                      <Icon.Trash size={14} />
                    </Button>
                  </div>
                </MediaCard>
              ))}
            </div>
            <p className="text-xs text-[var(--muted)] pt-1">
              Showing {filtered.length} of {courses.length} courses
            </p>
            </>
          )}
        </CardBody>
      </Card>

      <CourseFormModal
        open={mode !== null}
        mode={mode}
        course={editing}
        onClose={() => setMode(null)}
      />

      <Modal open={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)} title="Delete course?">
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            This removes the course from the catalog and clears any enrollments / certificates that reference it.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CourseFormModal({
  open,
  mode,
  course,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit" | null;
  course: Course | null;
  onClose: () => void;
}) {
  const admin = useAdmin();
  const toast = useToast();
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (mode === "edit" && course) {
      setForm({
        title: course.title,
        description: course.description,
        instructor: course.instructor,
        category: course.category,
        level: course.level,
        price: String(course.price),
        durationMinutes: String(course.durationMinutes),
        tags: course.tags.join(", "),
      });
    } else {
      setForm(emptyForm);
    }
    setErr(null);
  }, [open, mode, course]);

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (form.title.trim().length < 3) return setErr("Title is too short.");
    if (form.description.trim().length < 10) return setErr("Description should be at least 10 characters.");
    if (form.instructor.trim().length < 2) return setErr("Instructor name is required.");

    const price = Number(form.price);
    const duration = Number(form.durationMinutes);
    if (!Number.isFinite(price) || price < 0) return setErr("Price must be 0 or a positive number.");
    if (!Number.isFinite(duration) || duration <= 0) return setErr("Duration must be a positive number of minutes.");

    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      instructor: form.instructor.trim(),
      category: form.category,
      level: form.level,
      price,
      durationMinutes: duration,
      tags,
      thumbnail: course?.thumbnail ?? defaultThumb(),
    };

    if (mode === "edit" && course) {
      admin.updateCourse(course.id, payload);
      toast.push({ title: "Course updated", tone: "success" });
    } else {
      admin.addCourse(payload);
      toast.push({ title: "Course added", tone: "success" });
    }
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
          <Textarea id="c-desc" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="What will students learn?" rows={4} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="c-instr">Instructor</Label>
            <Input id="c-instr" value={form.instructor} onChange={(e) => update("instructor", e.target.value)} />
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
            <Label htmlFor="c-price">Price (USD)</Label>
            <Input id="c-price" type="number" min="0" step="1" value={form.price} onChange={(e) => update("price", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="c-dur">Duration (min)</Label>
            <Input id="c-dur" type="number" min="1" step="1" value={form.durationMinutes} onChange={(e) => update("durationMinutes", e.target.value)} />
          </div>
        </div>
        {err && (
          <p className="text-sm text-[var(--danger)] bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{err}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">{mode === "edit" ? "Save changes" : "Create course"}</Button>
        </div>
      </form>
    </Modal>
  );
}
