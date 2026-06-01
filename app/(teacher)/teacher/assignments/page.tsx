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

export default function TeacherAssignmentsPage() {
  const teacher = useTeacher();
  const toast = useToast();
  const courses = teacher.myCourses();

  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Assignment | null>(null);
  const [reviewingId, setReviewingId] = React.useState<string | null>(null);

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

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return assignments
      .filter((a) => filter === "all" || a.status === filter)
      .filter(
        (a) =>
          !q ||
          a.title.toLowerCase().includes(q) ||
          a.courseTitle.toLowerCase().includes(q),
      );
  }, [assignments, filter, query]);

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

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
            Teaching
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="mt-1 text-[var(--muted)]">
            Create work, set due dates, and grade student submissions.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          disabled={courses.length === 0}
        >
          <Icon.Plus size={16} /> New assignment
        </Button>
      </div>

      {/* Summary stats */}
      {assignments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard label="Total" value={counts.all} icon={<Icon.FilePen size={16} />} tint="bg-[var(--primary-soft)] text-[var(--primary)]" />
          <SummaryCard label="Submissions" value={totalSubmissions} icon={<Icon.ListChecks size={16} />} tint="bg-sky-500/10 text-sky-600 dark:text-sky-400" />
          <SummaryCard label="Pending grades" value={pendingGrades} icon={<Icon.Clock size={16} />} tint={pendingGrades > 0 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"} />
          <SummaryCard label="Overdue open" value={overdueCount} icon={<Icon.AlertCircle size={16} />} tint={overdueCount > 0 ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"} />
        </div>
      )}

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
            <Input
              icon={<Icon.Search size={16} />}
              placeholder="Search assignments…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="sm:max-w-xs"
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-40 rounded-xl bg-[var(--surface-2)] animate-pulse" />
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
                    : "Try a different filter."
              }
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((a) => {
                const graded = a.submissions.filter((s) => s.grade !== null).length;
                const ungraded = a.submissions.length - graded;
                const overdue = new Date(a.dueDate) < new Date() && a.status === "open";
                const gradePct = a.submissions.length > 0 ? Math.round((graded / a.submissions.length) * 100) : 100;
                return (
                  <Card key={a.id} className={overdue ? "border-red-500/40" : ""}>
                    <CardBody className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${overdue ? "bg-red-500/10 text-red-500" : "bg-[var(--primary-soft)] text-[var(--primary)]"}`}>
                          <Icon.FilePen size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{a.title}</p>
                          <p className="text-xs text-[var(--muted)] truncate">{a.courseTitle}</p>
                        </div>
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
                      <p className="text-sm text-[var(--muted)] line-clamp-2">{a.description}</p>
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <Stat label="Due" value={formatDate(a.dueDate)} />
                        <Stat label="Points" value={`${a.points}`} />
                        <Stat label="Graded" value={`${graded}/${a.submissions.length}`} />
                      </div>
                      {a.submissions.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-[var(--muted-2)] mb-1">
                            <span>Grading progress</span>
                            <span>{ungraded > 0 ? `${ungraded} pending` : "All graded"}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${ungraded > 0 ? "bg-amber-400" : "bg-emerald-500"}`}
                              style={{ width: `${gradePct}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                        <Button size="sm" variant="outline" onClick={() => setReviewingId(a.id)}>
                          <Icon.ListChecks size={14} /> Review ({a.submissions.length})
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(a);
                            setFormOpen(true);
                          }}
                        >
                          <Icon.Edit size={14} /> Edit
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      <AssignmentModal
        open={formOpen}
        initial={editing}
        courses={courses.map((c) => ({ id: c.id, title: c.title }))}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          load();
        }}
      />

      <ReviewModal
        assignment={reviewing}
        onClose={() => setReviewingId(null)}
        onGraded={load}
      />
    </div>
  );
}

function SummaryCard({ label, value, icon, tint }: { label: string; value: number; icon: React.ReactNode; tint: string }) {
  return (
    <Card>
      <CardBody className="flex items-center gap-3 !py-3">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-[11px] text-[var(--muted)]">{label}</p>
          <p className="text-xl font-bold tracking-tight">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--surface-2)] p-2.5">
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold">
        {label}
      </p>
      <p className="text-sm font-semibold mt-0.5 truncate">{value}</p>
    </div>
  );
}

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

  React.useEffect(() => {
    if (!open) return;
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
      {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    setSaving(false);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      toast.push({ title: "Couldn't save", description: e.error, tone: "danger" });
      return;
    }
    toast.push({ title: initial ? "Assignment updated" : "Assignment created", tone: "success" });
    onSaved();
  }

  async function remove() {
    if (!initial) return;
    const r = await fetch(`/api/teacher/assignments/${initial.id}`, { method: "DELETE" });
    if (r.ok) {
      toast.push({ title: "Assignment deleted", tone: "info" });
      onSaved();
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit assignment" : "New assignment"}
      size="lg"
    >
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
            <Select
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value })}
            >
              <option value="">Select a course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
            >
              <option value="draft">Draft (not visible)</option>
              <option value="open">Open (accepting submissions)</option>
              <option value="closed">Closed</option>
            </Select>
          </div>
          <div>
            <Label>Points</Label>
            <Input
              type="number"
              min={1}
              value={form.points}
              onChange={(e) => setForm({ ...form, points: e.target.value })}
            />
          </div>
          <div>
            <Label>Due date</Label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-2 pt-2 border-t border-[var(--border)]">
          {initial ? (
            <Button variant="danger" onClick={remove}>
              <Icon.Trash size={14} /> Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              loading={saving}
              disabled={!form.title.trim() || !form.courseId}
            >
              <Icon.Save size={14} /> {initial ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

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
  const [active, setActive] = React.useState<string | null>(null);
  const [gradeVal, setGradeVal] = React.useState("");
  const [feedback, setFeedback] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setActive(assignment?.submissions[0]?.studentId ?? null);
  }, [assignment]);

  React.useEffect(() => {
    if (!assignment || !active) return;
    const s = assignment.submissions.find((x) => x.studentId === active);
    setGradeVal(s?.grade === null || s?.grade === undefined ? "" : String(s.grade));
    setFeedback(s?.feedback ?? "");
  }, [assignment, active]);

  if (!assignment) return null;
  const current = assignment.submissions.find((s) => s.studentId === active) ?? null;

  async function saveGrade() {
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
    toast.push({ title: "Grade saved", tone: "success" });
    onGraded();
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Submissions · ${assignment.title}`}
      size="xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-[240px,1fr] min-h-[420px]">
        <aside className="border-r border-[var(--border)] max-h-[60vh] overflow-y-auto scrollbar-thin">
          {assignment.submissions.length === 0 ? (
            <p className="p-5 text-sm text-[var(--muted)]">No submissions yet.</p>
          ) : (
            <ul>
              {assignment.submissions.map((s) => (
                <li key={s.studentId}>
                  <button
                    onClick={() => setActive(s.studentId)}
                    className={`w-full text-left px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--surface-2)] transition ${
                      active === s.studentId ? "bg-[var(--primary-soft)]/40" : ""
                    }`}
                  >
                    <p className="text-sm font-medium truncate">{s.studentName}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {relativeTime(s.submittedAt)} ·{" "}
                      {s.grade === null ? "ungraded" : `${s.grade}/${assignment.points}`}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <section className="p-5 space-y-4">
          {current ? (
            <>
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--muted-2)] font-semibold">
                  Submission
                </p>
                <div className="mt-2 p-3 rounded-lg bg-[var(--surface-2)] text-sm whitespace-pre-wrap">
                  {current.content}
                </div>
                <p className="text-xs text-[var(--muted-2)] mt-1.5">
                  Submitted {relativeTime(current.submittedAt)}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Grade (max {assignment.points})</Label>
                  <Input
                    type="number"
                    min={0}
                    max={assignment.points}
                    value={gradeVal}
                    onChange={(e) => setGradeVal(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={saveGrade} loading={saving} className="w-full">
                    <Icon.Save size={14} /> Save grade
                  </Button>
                </div>
              </div>
              <div>
                <Label>Feedback</Label>
                <Textarea
                  rows={4}
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
