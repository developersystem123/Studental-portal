"use client";

import * as React from "react";
import Link from "next/link";
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
import { useTeacher } from "@/lib/store";
import type { TeacherStudentRow } from "@/lib/store";
import type { Course, CourseCategory, CourseLevel } from "@/lib/mockData";

const CATEGORIES: CourseCategory[] = ["Web Dev", "Data Science", "Design", "Business", "Languages", "Math"];
const LEVELS: CourseLevel[] = ["Beginner", "Intermediate", "Advanced"];

type FormState = {
  title: string;
  description: string;
  category: CourseCategory;
  level: CourseLevel;
  price: string;
  durationMinutes: string;
  tags: string;
};

type SortKey = "title" | "students" | "rating";

// ─── Stats banner ────────────────────────────────────────────────────────────
function StatPill({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: "primary" | "success" | "info" | "warning";
}) {
  const bg = {
    primary: "bg-[var(--primary)]/10 text-[var(--primary)]",
    success: "bg-emerald-500/10 text-emerald-500",
    info: "bg-sky-500/10 text-sky-500",
    warning: "bg-amber-500/10 text-amber-500",
  }[color];
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-xl border border-border bg-surface px-3 py-3 hover-lift">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted truncate">{label}</p>
        <p className="text-lg font-bold leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-muted">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Initials avatar ──────────────────────────────────────────────────────────
function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const colors = [
    "bg-violet-500/20 text-violet-600",
    "bg-sky-500/20 text-sky-600",
    "bg-emerald-500/20 text-emerald-600",
    "bg-amber-500/20 text-amber-600",
    "bg-rose-500/20 text-rose-600",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${color}`}>
      {initials}
    </span>
  );
}

// ─── Course students modal ────────────────────────────────────────────────────
function CourseStudentsModal({
  course,
  students,
  onClose,
}: {
  course: Course | null;
  students: TeacherStudentRow[];
  onClose: () => void;
}) {
  const [search, setSearch] = React.useState("");

  const enrolled = React.useMemo(() => {
    if (!course) return [];
    const q = search.trim().toLowerCase();
    return students
      .filter((s) => s.courseId === course.id)
      .filter((s) => !q || s.userName.toLowerCase().includes(q) || s.userEmail.toLowerCase().includes(q))
      .sort((a, b) => b.progress - a.progress);
  }, [course, students, search]);

  React.useEffect(() => {
    if (!course) setSearch("");
  }, [course]);

  const completedCount = enrolled.filter((s) => s.completed).length;
  const avgProgress = enrolled.length
    ? Math.round(enrolled.reduce((a, s) => a + s.progress, 0) / enrolled.length)
    : 0;

  return (
    <Modal open={course !== null} onClose={onClose} title={course?.title ?? ""} size="lg">
      <div className="p-5 space-y-4">
        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-[var(--surface-2)] p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Enrolled</p>
            <p className="text-2xl font-bold mt-0.5">{enrolled.length}</p>
          </div>
          <div className="rounded-xl bg-[var(--surface-2)] p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Completed</p>
            <p className="text-2xl font-bold mt-0.5 text-emerald-500">{completedCount}</p>
          </div>
          <div className="rounded-xl bg-[var(--surface-2)] p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Avg Progress</p>
            <p className="text-2xl font-bold mt-0.5">{avgProgress}%</p>
          </div>
        </div>

        {/* Search */}
        <Input
          icon={<Icon.Search size={15} />}
          placeholder="Search students…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* List */}
        {enrolled.length === 0 ? (
          <EmptyState
            icon={<Icon.Users size={20} />}
            title={search ? "No students match your search." : "No students enrolled yet."}
            description={search ? "Try a different name or email." : "Share this course to get students started."}
          />
        ) : (
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {enrolled.map((s) => (
              <div
                key={s.userId}
                className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 hover:bg-[var(--surface-2)] transition-colors"
              >
                <InitialsAvatar name={s.userName} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{s.userName}</p>
                    {s.completed ? (
                      <Badge variant="success" className="shrink-0 text-[10px]">Completed</Badge>
                    ) : (
                      <span className="text-xs font-bold text-[var(--muted)] shrink-0">{s.progress}%</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--muted)] truncate">{s.userEmail}</p>
                  {/* Progress bar */}
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${s.progress}%`,
                        background: s.completed
                          ? "var(--success, #10b981)"
                          : s.progress >= 50
                          ? "var(--primary)"
                          : "var(--warning, #f59e0b)",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TeacherCoursesPage() {
  const teacher = useTeacher();
  const [query, setQuery] = React.useState("");
  const [catFilter, setCatFilter] = React.useState<CourseCategory | "All">("All");
  const [lvlFilter, setLvlFilter] = React.useState<CourseLevel | "All">("All");
  const [sortKey, setSortKey] = React.useState<SortKey>("students");
  const [editing, setEditing] = React.useState<Course | null>(null);
  const [viewingStudents, setViewingStudents] = React.useState<Course | null>(null);

  const courses = teacher.myCourses();
  const students = teacher.myStudents();
  const stats = teacher.stats();

  const enrollmentMap = React.useMemo(() => {
    const map = new Map<string, { count: number; avgProgress: number }>();
    for (const c of courses) {
      const list = students.filter((s) => s.courseId === c.id);
      const avg = list.length ? Math.round(list.reduce((a, s) => a + s.progress, 0) / list.length) : 0;
      map.set(c.id, { count: list.length, avgProgress: avg });
    }
    return map;
  }, [courses, students]);

  const estimatedRevenue = React.useMemo(
    () => courses.reduce((sum, c) => sum + c.price * (enrollmentMap.get(c.id)?.count ?? 0), 0),
    [courses, enrollmentMap],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = courses.filter((c) => {
      if (catFilter !== "All" && c.category !== catFilter) return false;
      if (lvlFilter !== "All" && c.level !== lvlFilter) return false;
      if (!q) return true;
      return c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
    });
    result = [...result].sort((a, b) => {
      if (sortKey === "students") return (enrollmentMap.get(b.id)?.count ?? 0) - (enrollmentMap.get(a.id)?.count ?? 0);
      if (sortKey === "rating") return b.rating - a.rating;
      return a.title.localeCompare(b.title);
    });
    return result;
  }, [courses, query, catFilter, lvlFilter, sortKey, enrollmentMap]);

  const hasFilters = catFilter !== "All" || lvlFilter !== "All" || query.trim();

  const completionRate =
    stats.students > 0 ? Math.min(100, Math.round((stats.completions / stats.students) * 100)) : 0;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Teaching</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">My Courses</h1>
        <p className="mt-1 text-[var(--muted)]">
          Courses you&apos;re the instructor for. Edit content; admins handle catalog assignments.
        </p>
      </div>

      {/* Stats banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatPill
          icon={<Icon.Book size={18} />}
          label="Total Courses"
          value={stats.courses}
          color="primary"
        />
        <StatPill
          icon={<Icon.Users size={18} />}
          label="Total Students"
          value={stats.students}
          color="info"
        />
        <StatPill
          icon={<Icon.Award size={18} />}
          label="Completions"
          value={stats.completions}
          sub={`${completionRate}% rate`}
          color="success"
        />
        <StatPill
          icon={<Icon.DollarSign size={18} />}
          label="Est. Revenue"
          value={`$${estimatedRevenue.toLocaleString()}`}
          sub="across all courses"
          color="warning"
        />
      </div>

      {/* Courses card */}
      <Card>
        <CardBody className="space-y-4">
          {/* Filters row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              icon={<Icon.Search size={16} />}
              placeholder="Search your courses…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value as CourseCategory | "All")} className="!h-10 sm:!w-44">
              <option value="All">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select value={lvlFilter} onChange={(e) => setLvlFilter(e.target.value as CourseLevel | "All")} className="!h-10 sm:!w-40">
              <option value="All">All levels</option>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
            <Select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="!h-10 sm:!w-40">
              <option value="students">Most students</option>
              <option value="rating">Highest rated</option>
              <option value="title">A → Z</option>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Icon.Book size={20} />}
              title={hasFilters ? "No courses match your filters." : "No courses assigned to you yet."}
              description={
                hasFilters
                  ? "Try adjusting the search or filters."
                  : "An admin needs to add a course with you listed as the instructor."
              }
              action={hasFilters ? (
                <Button variant="outline" size="sm" onClick={() => { setQuery(""); setCatFilter("All"); setLvlFilter("All"); }}>
                  Clear filters
                </Button>
              ) : undefined}
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((c) => {
                const enroll = enrollmentMap.get(c.id) ?? { count: 0, avgProgress: 0 };
                return (
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

                    {/* Enrollment stats */}
                    <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                      <div className="rounded-lg bg-[var(--surface-2)] px-2 py-1.5 text-center">
                        <p className="text-[10px] text-[var(--muted-2)] font-semibold uppercase tracking-wider">Students</p>
                        <p className="text-sm font-bold mt-0.5">{enroll.count}</p>
                      </div>
                      <div className="rounded-lg bg-[var(--surface-2)] px-2 py-1.5 text-center">
                        <p className="text-[10px] text-[var(--muted-2)] font-semibold uppercase tracking-wider">Avg</p>
                        <p className="text-sm font-bold mt-0.5">{enroll.avgProgress}%</p>
                      </div>
                      <div className="rounded-lg bg-[var(--surface-2)] px-2 py-1.5 text-center">
                        <p className="text-[10px] text-[var(--muted-2)] font-semibold uppercase tracking-wider">Rating</p>
                        <p className="text-sm font-bold mt-0.5">★ {c.rating}</p>
                      </div>
                    </div>

                    {/* Per-course progress bar */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-[var(--muted)] mb-1">
                        <span>Avg completion</span>
                        <span className="font-semibold">{enroll.avgProgress}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[var(--surface-2)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--primary)] transition-all duration-700"
                          style={{ width: `${enroll.avgProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-0.5">
                      <span>{c.chapters.length} chapters</span>
                      <span>{Math.round(c.durationMinutes / 60 * 10) / 10}h total</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/teacher/courses/${c.id}`} className="flex-1">
                        <Button size="sm" className="w-full">
                          <Icon.Book size={14} /> Edit Content
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingStudents(c)}
                        title="View enrolled students"
                      >
                        <Icon.Users size={14} />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(c)} title="Edit course info">
                        <Icon.FilePen size={14} />
                      </Button>
                    </div>
                  </MediaCard>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      <EditCourseModal course={editing} onClose={() => setEditing(null)} />
      <CourseStudentsModal
        course={viewingStudents}
        students={students}
        onClose={() => setViewingStudents(null)}
      />
    </div>
  );
}

// ─── Edit course modal ────────────────────────────────────────────────────────
function EditCourseModal({ course, onClose }: { course: Course | null; onClose: () => void }) {
  const teacher = useTeacher();
  const toast = useToast();
  const [form, setForm] = React.useState<FormState>({
    title: "",
    description: "",
    category: "Web Dev",
    level: "Beginner",
    price: "0",
    durationMinutes: "60",
    tags: "",
  });
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!course) return;
    setForm({
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      price: String(course.price),
      durationMinutes: String(course.durationMinutes),
      tags: course.tags.join(", "),
    });
    setErr(null);
  }, [course]);

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;
    setErr(null);
    if (form.title.trim().length < 3) return setErr("Title is too short.");
    if (form.description.trim().length < 10) return setErr("Description should be at least 10 characters.");
    const price = Number(form.price);
    const duration = Number(form.durationMinutes);
    if (!Number.isFinite(price) || price < 0) return setErr("Price must be 0 or a positive number.");
    if (!Number.isFinite(duration) || duration <= 0) return setErr("Duration must be a positive number.");

    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const res = await teacher.updateMyCourse(course.id, {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      level: form.level,
      price,
      durationMinutes: duration,
      tags,
    });
    if (!res.ok) return setErr(res.error || "Couldn't save changes.");
    toast.push({ title: "Course updated", tone: "success" });
    onClose();
  }

  return (
    <Modal open={course !== null} onClose={onClose} title="Edit course" size="lg">
      <form onSubmit={submit} className="p-5 space-y-4">
        <div>
          <Label htmlFor="tc-title">Title</Label>
          <Input id="tc-title" value={form.title} onChange={(e) => update("title", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="tc-desc">Description</Label>
          <Textarea id="tc-desc" value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} />
        </div>
        <div>
          <Label htmlFor="tc-tags">Tags (comma-separated)</Label>
          <Input id="tc-tags" value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="React, TypeScript" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="tc-cat">Category</Label>
            <Select id="tc-cat" value={form.category} onChange={(e) => update("category", e.target.value as CourseCategory)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="tc-lvl">Level</Label>
            <Select id="tc-lvl" value={form.level} onChange={(e) => update("level", e.target.value as CourseLevel)}>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="tc-price">Price (USD)</Label>
            <Input id="tc-price" type="number" min="0" step="1" value={form.price} onChange={(e) => update("price", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="tc-dur">Duration (min)</Label>
            <Input id="tc-dur" type="number" min="1" step="1" value={form.durationMinutes} onChange={(e) => update("durationMinutes", e.target.value)} />
          </div>
        </div>
        {err && (
          <p className="text-sm text-[var(--danger)] bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{err}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </Modal>
  );
}
