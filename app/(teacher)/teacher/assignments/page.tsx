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
  Tabs,
  Textarea,
  useToast,
} from "@/components/ui";
import { useTeacher } from "@/lib/store";
import { formatDate, relativeTime } from "@/lib/utils";

type Status = "draft" | "open" | "closed";

type Submission = {
  studentId: string;
  studentName: string;
  submittedAt: string;
  content: string;
  grade: number | null;
  feedback: string;
};

type Assignment = {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  points: number;
  dueDate: string;
  status: Status;
  createdAt: string;
  submissions: Submission[];
};

type Filter = "all" | Status;
type SortKey = "due" | "created" | "submissions" | "title";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function dueCountdown(dueDate: string): { text: string; color: string } {
  const diff = Math.ceil(
    (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (diff < 0)
    return { text: `${Math.abs(diff)}d overdue`, color: "text-red-500 bg-red-500/10" };
  if (diff === 0)
    return { text: "Due today", color: "text-amber-600 bg-amber-500/10" };
  if (diff === 1)
    return { text: "Due tomorrow", color: "text-amber-600 bg-amber-500/10" };
  if (diff <= 4)
    return { text: `Due in ${diff}d`, color: "text-amber-500 bg-amber-500/10" };
  return { text: `Due in ${diff}d`, color: "text-[var(--muted)] bg-[var(--surface-2)]" };
}

function studentInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-violet-500/20 text-violet-600",
  "bg-sky-500/20 text-sky-600",
  "bg-emerald-500/20 text-emerald-600",
  "bg-amber-500/20 text-amber-600",
  "bg-rose-500/20 text-rose-600",
];

// ─── Summary card ─────────────────────────────────────────────────────────────
function SummaryCard({
  label,
  value,
  sub,
  icon,
  tint,
}: {
  label: string;
  value: number;
  sub?: string;
  icon: React.ReactNode;
  tint: string;
}) {
  return (
    <Card className="hover-lift">
      <CardBody className="flex items-center gap-3 !py-3">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-[var(--muted)] font-medium">{label}</p>
          <p className="text-xl font-bold tracking-tight leading-tight">{value}</p>
          {sub && <p className="text-[10px] text-[var(--muted-2)]">{sub}</p>}
        </div>
      </CardBody>
    </Card>
  );
}

// ─── Stat pill inside card ────────────────────────────────────────────────────
function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-[var(--surface-2)] p-2.5">
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="text-sm font-semibold mt-0.5 truncate">{value}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TeacherAssignmentsPage() {
  const teacher = useTeacher();
  const toast = useToast();
  const courses = teacher.myCourses();

  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");
  const [courseFilter, setCourseFilter] = React.useState("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("due");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Assignment | null>(null);
  const [reviewingId, setReviewingId] = React.useState<string | null>(null);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/teacher/assignments");
      const data = r.ok ? await r.json() : { assignments: [] };
      setAssignments(data.assignments ?? []);
    } catch {
      toast.push({ title: "Couldn't load assignments", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { load(); }, [load]);

  const courseOptions = React.useMemo(() => {
    const seen = new Map<string, string>();
    for (const a of assignments) {
      if (!seen.has(a.courseId)) seen.set(a.courseId, a.courseTitle);
    }
    return Array.from(seen.entries()).map(([id, title]) => ({ id, title }));
  }, [assignments]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = assignments
      .filter((a) => filter === "all" || a.status === filter)
      .filter((a) => courseFilter === "all" || a.courseId === courseFilter)
      .filter(
        (a) =>
          !q ||
          a.title.toLowerCase().includes(q) ||
          a.courseTitle.toLowerCase().includes(q),
      );
    result = [...result].sort((a, b) => {
      if (sortKey === "due") return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (sortKey === "created") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortKey === "submissions") return b.submissions.length - a.submissions.length;
      return a.title.localeCompare(b.title);
    });
    return result;
  }, [assignments, filter, courseFilter, query, sortKey]);

  const counts = {
    all: assignments.length,
    open: assignments.filter((a) => a.status === "open").length,
    draft: assignments.filter((a) => a.status === "draft").length,
    closed: assignments.filter((a) => a.status === "closed").length,
  };

  const reviewing = assignments.find((a) => a.id === reviewingId) ?? null;
  const pendingGrades = assignments.reduce((sum, a) => sum + a.submissions.filter((s) => s.grade === null).length, 0);
  const overdueCount = assignments.filter((a) => new Date(a.dueDate) < new Date() && a.status === "open").length;
  const totalSubmissions = assignments.reduce((sum, a) => sum + a.submissions.length, 0);
  const gradedTotal = assignments.reduce((sum, a) => sum + a.submissions.filter((s) => s.grade !== null).length, 0);

  async function quickStatus(a: Assignment, next: Status) {
    setTogglingId(a.id);
    const r = await fetch(`/api/teacher/assignments/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setTogglingId(null);
    if (r.ok) {
      toast.push({ title: `Assignment ${next === "open" ? "published" : next === "closed" ? "closed" : "set to draft"}`, tone: "success" });
      load();
    } else {
      toast.push({ title: "Couldn't update status", tone: "danger" });
    }
  }

  const hasActiveFilters = filter !== "all" || courseFilter !== "all" || query.trim();

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Teaching</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="mt-1 text-[var(--muted)]">
            Create work, set due dates, and grade student submissions.
          </p>
        </div>
        <Button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          disabled={courses.length === 0}
        >
          <Icon.Plus size={16} /> New assignment
        </Button>
      </div>

      {/* Stats */}
      {assignments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard
            label="Total"
            value={counts.all}
            sub={`${counts.open} open · ${counts.draft} draft`}
            icon={<Icon.FilePen size={16} />}
            tint="bg-[var(--primary-soft)] text-[var(--primary)]"
          />
          <SummaryCard
            label="Submissions"
            value={totalSubmissions}
            sub={`${gradedTotal} graded`}
            icon={<Icon.ListChecks size={16} />}
            tint="bg-sky-500/10 text-sky-600 dark:text-sky-400"
          />
          <SummaryCard
            label="Pending Grades"
            value={pendingGrades}
            sub={pendingGrades > 0 ? "needs grading" : "all caught up!"}
            icon={<Icon.Clock size={16} />}
            tint={pendingGrades > 0 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}
          />
          <SummaryCard
            label="Overdue Open"
            value={overdueCount}
            sub={overdueCount > 0 ? "still accepting" : "none overdue"}
            icon={<Icon.AlertCircle size={16} />}
            tint={overdueCount > 0 ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}
          />
        </div>
      )}

      <Card>
        <CardBody className="space-y-4">
          {/* Filters row */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="overflow-x-auto w-full sm:w-auto pb-0.5">
                <Tabs
                  value={filter}
                  onChange={(v) => setFilter(v as Filter)}
                  options={[
                    { value: "all", label: "All", count: counts.all },
                    { value: "open", label: "Open", count: counts.open },
                    { value: "draft", label: "Draft", count: counts.draft },
                    { value: "closed", label: "Closed", count: counts.closed },
                  ]}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                icon={<Icon.Search size={16} />}
                placeholder="Search assignments…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
              />
              {courseOptions.length > 1 && (
                <Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="!h-10 sm:!w-52">
                  <option value="all">All courses</option>
                  {courseOptions.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </Select>
              )}
              <Select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="!h-10 sm:!w-44">
                <option value="due">Sort: Due date</option>
                <option value="created">Sort: Newest</option>
                <option value="submissions">Sort: Most submissions</option>
                <option value="title">Sort: Title A–Z</option>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-48 rounded-xl bg-[var(--surface-2)] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Icon.FilePen size={20} />}
              title={assignments.length === 0 ? "No assignments yet" : "Nothing matches"}
              description={
                courses.length === 0
                  ? "You need a course assigned before you can create assignments."
                  : assignments.length === 0
                  ? "Create your first assignment to get started."
                  : "Try a different filter or clear your search."
              }
              action={hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={() => { setQuery(""); setFilter("all"); setCourseFilter("all"); }}>
                  Clear filters
                </Button>
              ) : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((a) => {
                const graded = a.submissions.filter((s) => s.grade !== null).length;
                const ungraded = a.submissions.length - graded;
                const overdue = new Date(a.dueDate) < new Date() && a.status === "open";
                const gradePct = a.submissions.length > 0 ? Math.round((graded / a.submissions.length) * 100) : 100;
                const countdown = dueCountdown(a.dueDate);
                const toggling = togglingId === a.id;

                return (
                  <Card
                    key={a.id}
                    className={`transition-shadow hover:shadow-md ${overdue ? "border-red-500/40" : ""}`}
                  >
                    <CardBody className="space-y-3">
                      {/* Header row */}
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${overdue ? "bg-red-500/10 text-red-500" : a.status === "draft" ? "bg-amber-500/10 text-amber-500" : "bg-[var(--primary-soft)] text-[var(--primary)]"}`}>
                          <Icon.FilePen size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{a.title}</p>
                          <p className="text-xs text-[var(--muted)] truncate">{a.courseTitle}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Due countdown chip */}
                          {a.status === "open" && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${countdown.color}`}>
                              {countdown.text}
                            </span>
                          )}
                          {overdue ? (
                            <Badge variant="danger">Overdue</Badge>
                          ) : a.status === "open" ? (
                            <Badge variant="success">Open</Badge>
                          ) : a.status === "draft" ? (
                            <Badge variant="warning">Draft</Badge>
                          ) : (
                            <Badge variant="default">Closed</Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-[var(--muted)] line-clamp-2">{a.description}</p>

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-2 pt-0.5">
                        <Stat label="Due" value={formatDate(a.dueDate)} icon={<Icon.Calendar size={10} />} />
                        <Stat label="Points" value={`${a.points} pts`} icon={<Icon.Award size={10} />} />
                        <Stat label="Graded" value={`${graded}/${a.submissions.length}`} icon={<Icon.CheckCircle size={10} />} />
                      </div>

                      {/* Grading progress */}
                      {a.submissions.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-[var(--muted-2)] mb-1">
                            <span>Grading progress</span>
                            <span className={ungraded > 0 ? "text-amber-500 font-medium" : "text-emerald-500 font-medium"}>
                              {ungraded > 0 ? `${ungraded} pending` : "All graded ✓"}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${ungraded > 0 ? "bg-amber-400" : "bg-emerald-500"}`}
                              style={{ width: `${gradePct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Submission avatars */}
                      {a.submissions.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1.5">
                            {a.submissions.slice(0, 5).map((s, i) => (
                              <span
                                key={s.studentId}
                                title={s.studentName}
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold ring-2 ring-[var(--surface)] ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                              >
                                {studentInitials(s.studentName)}
                              </span>
                            ))}
                            {a.submissions.length > 5 && (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold ring-2 ring-[var(--surface)] bg-[var(--surface-2)] text-[var(--muted)]">
                                +{a.submissions.length - 5}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[var(--muted)]">
                            {a.submissions.length} submission{a.submissions.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}

                      {/* Actions row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--border)]">
                        {/* Quick status toggle */}
                        <div>
                          {a.status === "draft" && (
                            <Button size="sm" variant="outline" onClick={() => quickStatus(a, "open")} loading={toggling}>
                              <Icon.PlayCircle size={13} /> Publish
                            </Button>
                          )}
                          {a.status === "open" && (
                            <Button size="sm" variant="outline" onClick={() => quickStatus(a, "closed")} loading={toggling}>
                              <Icon.X size={13} /> Close
                            </Button>
                          )}
                          {a.status === "closed" && (
                            <Button size="sm" variant="outline" onClick={() => quickStatus(a, "open")} loading={toggling}>
                              <Icon.Play size={13} /> Reopen
                            </Button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setReviewingId(a.id)}>
                            <Icon.ListChecks size={14} />
                            Review ({a.submissions.length})
                            {ungraded > 0 && (
                              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">{ungraded}</span>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setEditing(a); setFormOpen(true); }}
                          >
                            <Icon.Edit size={14} /> Edit
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Footer count */}
          {filtered.length > 0 && (
            <p className="text-xs text-[var(--muted-2)] border-t border-[var(--border)] pt-3">
              Showing {filtered.length} of {assignments.length} assignments
              {hasActiveFilters && (
                <button
                  className="ml-2 text-[var(--primary)] hover:underline"
                  onClick={() => { setQuery(""); setFilter("all"); setCourseFilter("all"); }}
                >
                  Clear filters
                </button>
              )}
            </p>
          )}
        </CardBody>
      </Card>

      <AssignmentModal
        open={formOpen}
        initial={editing}
        courses={courses.map((c) => ({ id: c.id, title: c.title }))}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); load(); }}
      />

      <ReviewModal
        assignment={reviewing}
        onClose={() => setReviewingId(null)}
        onGraded={load}
      />
    </div>
  );
}

// ─── Assignment create/edit modal ─────────────────────────────────────────────
function defaultDue() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

function AssignmentModal({
  open,
  initial,
  courses,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial: Assignment | null;
  courses: { id: string; title: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    courseId: "",
    points: "100",
    dueDate: defaultDue(),
    status: "draft" as Status,
  });
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setErr(null);
    if (initial) {
      setForm({
        title: initial.title,
        description: initial.description,
        courseId: initial.courseId,
        points: String(initial.points),
        dueDate: initial.dueDate.slice(0, 10),
        status: initial.status,
      });
    } else {
      setForm({
        title: "",
        description: "",
        courseId: courses[0]?.id ?? "",
        points: "100",
        dueDate: defaultDue(),
        status: "draft",
      });
    }
  }, [open, initial, courses]);

  async function submit() {
    setErr(null);
    if (!form.title.trim()) return setErr("Title is required.");
    if (!form.courseId) return setErr("Select a course.");
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description,
      courseId: form.courseId,
      points: Number(form.points),
      dueDate: new Date(form.dueDate).toISOString(),
      status: form.status,
    };
    const r = await fetch(
      initial ? `/api/teacher/assignments/${initial.id}` : "/api/teacher/assignments",
      { method: initial ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
    );
    setSaving(false);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      setErr(e.error ?? "Couldn't save.");
      return;
    }
    toast.push({ title: initial ? "Assignment updated" : "Assignment created", tone: "success" });
    onSaved();
  }

  async function remove() {
    if (!initial) return;
    if (!confirm(`Delete "${initial.title}"? This cannot be undone.`)) return;
    const r = await fetch(`/api/teacher/assignments/${initial.id}`, { method: "DELETE" });
    if (r.ok) {
      toast.push({ title: "Assignment deleted", tone: "info" });
      onSaved();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit assignment" : "New assignment"} size="lg">
      <div className="p-5 space-y-4">
        <div>
          <Label>Title</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Final Project: Build a Todo App"
            maxLength={140}
          />
        </div>
        <div>
          <Label>Instructions</Label>
          <Textarea
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What should students submit?"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Course</Label>
            <Select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
              <option value="">Select a course…</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })}>
              <option value="draft">Draft (not visible)</option>
              <option value="open">Open (accepting submissions)</option>
              <option value="closed">Closed</option>
            </Select>
          </div>
          <div>
            <Label>Points</Label>
            <Input type="number" min={1} value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} />
          </div>
          <div>
            <Label>Due date</Label>
            <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
        </div>
        {err && (
          <p className="text-sm text-[var(--danger)] bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{err}</p>
        )}
        <div className="flex flex-wrap justify-between gap-2 pt-2 border-t border-[var(--border)]">
          {initial ? (
            <Button variant="danger" onClick={remove}>
              <Icon.Trash size={14} /> Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={submit} loading={saving} disabled={!form.title.trim() || !form.courseId}>
              <Icon.Save size={14} /> {initial ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Review / grading modal ───────────────────────────────────────────────────
function ReviewModal({
  assignment,
  onClose,
  onGraded,
}: {
  assignment: Assignment | null;
  onClose: () => void;
  onGraded: () => void;
}) {
  const toast = useToast();
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [gradeVal, setGradeVal] = React.useState("");
  const [feedback, setFeedback] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [localGrades, setLocalGrades] = React.useState<Record<string, number | null>>({});

  React.useEffect(() => {
    if (!assignment) return;
    setActiveIdx(0);
    setLocalGrades({});
  }, [assignment]);

  const subs = assignment?.submissions ?? [];
  const current = subs[activeIdx] ?? null;

  React.useEffect(() => {
    if (!current) return;
    const local = localGrades[current.studentId];
    const grade = local !== undefined ? local : current.grade;
    setGradeVal(grade === null || grade === undefined ? "" : String(grade));
    setFeedback(current.feedback ?? "");
  }, [current?.studentId, activeIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!assignment) return null;

  const gradedCount = subs.filter((s) => {
    const local = localGrades[s.studentId];
    return local !== undefined ? local !== null : s.grade !== null;
  }).length;

  async function saveGrade(autoAdvance = false) {
    if (!assignment || !current) return;
    setSaving(true);
    const grade = gradeVal === "" ? null : Number(gradeVal);
    const r = await fetch(`/api/teacher/assignments/${assignment.id}/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: current.studentId, grade, feedback }),
    });
    setSaving(false);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      toast.push({ title: "Couldn't save grade", description: e.error, tone: "danger" });
      return;
    }
    setLocalGrades((prev) => ({ ...prev, [current.studentId]: grade }));
    toast.push({ title: "Grade saved", tone: "success" });
    onGraded();
    if (autoAdvance && activeIdx < subs.length - 1) {
      setActiveIdx((i) => i + 1);
    }
  }

  return (
    <Modal open={true} onClose={onClose} title={`Review · ${assignment.title}`} size="xl">
      {/* Progress bar */}
      <div className="px-5 pt-3 pb-0">
        <div className="flex items-center justify-between text-[11px] text-[var(--muted)] mb-1.5">
          <span>Grading progress</span>
          <span className={gradedCount === subs.length && subs.length > 0 ? "text-emerald-500 font-semibold" : "font-semibold"}>
            {gradedCount}/{subs.length} graded
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${gradedCount === subs.length && subs.length > 0 ? "bg-emerald-500" : "bg-[var(--primary)]"}`}
            style={{ width: subs.length > 0 ? `${Math.round((gradedCount / subs.length) * 100)}%` : "0%" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[220px,1fr] min-h-[420px] mt-3">
        {/* Sidebar — student list */}
        <aside className="border-r border-[var(--border)] max-h-[60vh] overflow-y-auto scrollbar-thin">
          {subs.length === 0 ? (
            <p className="p-5 text-sm text-[var(--muted)]">No submissions yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {subs.map((s, i) => {
                const localG = localGrades[s.studentId];
                const isGraded = localG !== undefined ? localG !== null : s.grade !== null;
                const gradeDisplay = localG !== undefined
                  ? (localG !== null ? `${localG}/${assignment.points}` : "ungraded")
                  : (s.grade !== null ? `${s.grade}/${assignment.points}` : "ungraded");
                return (
                  <li key={s.studentId}>
                    <button
                      onClick={() => setActiveIdx(i)}
                      className={`w-full text-left px-4 py-3 hover:bg-[var(--surface-2)] transition flex items-center gap-2.5 ${activeIdx === i ? "bg-[var(--primary-soft)]/40" : ""}`}
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                        {studentInitials(s.studentName)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{s.studentName}</p>
                        <p className={`text-[11px] ${isGraded ? "text-emerald-500" : "text-amber-500"}`}>
                          {gradeDisplay}
                        </p>
                      </div>
                      {isGraded ? (
                        <Icon.CheckCircle size={13} className="shrink-0 text-emerald-500" />
                      ) : (
                        <Icon.Clock size={13} className="shrink-0 text-amber-400" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Main grading panel */}
        <section className="p-5 space-y-4">
          {current ? (
            <>
              {/* Student nav */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{current.studentName}</p>
                  <p className="text-xs text-[var(--muted)]">Submitted {relativeTime(current.submittedAt)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                    disabled={activeIdx === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)] disabled:opacity-30 transition"
                  >
                    <Icon.ChevronLeft size={14} />
                  </button>
                  <span className="text-xs text-[var(--muted)] px-1">{activeIdx + 1}/{subs.length}</span>
                  <button
                    onClick={() => setActiveIdx((i) => Math.min(subs.length - 1, i + 1))}
                    disabled={activeIdx === subs.length - 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)] disabled:opacity-30 transition"
                  >
                    <Icon.ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Submission content */}
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--muted-2)] font-semibold mb-2">
                  Submission
                </p>
                <div className="p-3 rounded-xl bg-[var(--surface-2)] text-sm whitespace-pre-wrap max-h-40 overflow-y-auto scrollbar-thin border border-[var(--border)]">
                  {current.content}
                </div>
              </div>

              {/* Grade + feedback */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Grade (max {assignment.points})</Label>
                  <Input
                    type="number"
                    min={0}
                    max={assignment.points}
                    value={gradeVal}
                    onChange={(e) => setGradeVal(e.target.value)}
                    placeholder="Enter grade…"
                  />
                </div>
                <div className="flex flex-col justify-end gap-2">
                  <Button onClick={() => saveGrade(false)} loading={saving} variant="outline">
                    <Icon.Save size={14} /> Save grade
                  </Button>
                  {activeIdx < subs.length - 1 && (
                    <Button onClick={() => saveGrade(true)} loading={saving}>
                      <Icon.Save size={14} /> Save & Next
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label>Feedback</Label>
                <Textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Notes for the student…"
                />
              </div>
            </>
          ) : (
            <EmptyState
              icon={<Icon.ListChecks size={20} />}
              title="No submissions yet"
              description="Students' submissions for this assignment will appear here."
            />
          )}
        </section>
      </div>
    </Modal>
  );
}
