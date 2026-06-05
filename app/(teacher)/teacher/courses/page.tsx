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

export default function TeacherCoursesPage() {
  const teacher = useTeacher();
  const [query, setQuery] = React.useState("");
  const [catFilter, setCatFilter] = React.useState<CourseCategory | "All">("All");
  const [lvlFilter, setLvlFilter] = React.useState<CourseLevel | "All">("All");
  const [sortKey, setSortKey] = React.useState<SortKey>("students");
  const [editing, setEditing] = React.useState<Course | null>(null);

  const courses = teacher.myCourses();
  const students = teacher.myStudents();

  const enrollmentMap = React.useMemo(() => {
    const map = new Map<string, { count: number; avgProgress: number }>();
    for (const c of courses) {
      const list = students.filter((s) => s.courseId === c.id);
      const avg = list.length ? Math.round(list.reduce((a, s) => a + s.progress, 0) / list.length) : 0;
      map.set(c.id, { count: list.length, avgProgress: avg });
    }
    return map;
  }, [courses, students]);

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

  return (
    <div className="space-y-6 fade-in">
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Teaching</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">My Courses</h1>
        <p className="mt-1 text-[var(--muted)]">
          Courses you&apos;re the instructor for. Edit content; admins handle catalog assignments.
        </p>
      </div>

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

                    <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-0.5">
                      <span>{c.chapters.length} chapters</span>
                      <span>{Math.round(c.durationMinutes / 60 * 10) / 10}h total</span>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/teacher/courses/${c.id}`} className="flex-1">
                        <Button size="sm" className="w-full">
                          <Icon.Book size={14} /> Edit Content
                        </Button>
                      </Link>
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
    </div>
  );
}

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
