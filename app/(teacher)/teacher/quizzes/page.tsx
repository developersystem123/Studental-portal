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
import { useTeacher } from "@/lib/store";
import { relativeTime, cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Question = {
  id?: string;
  prompt: string;
  options: string[];
  answerIndex: number;
};

type Attempt = {
  studentId: string;
  studentName: string;
  score: number;
  percentage: number;
  completedAt: string;
};

type Quiz = {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  durationMinutes: number;
  passingScore: number;
  createdAt: string;
  questions: Question[];
  attempts: Attempt[];
};

type SortKey = "newest" | "attempts" | "avg_desc" | "avg_asc";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function passRate(quiz: Quiz) {
  if (quiz.attempts.length === 0) return null;
  return Math.round(
    (quiz.attempts.filter((a) => a.percentage >= quiz.passingScore).length /
      quiz.attempts.length) *
      100,
  );
}

function avgScore(quiz: Quiz) {
  if (quiz.attempts.length === 0) return 0;
  return Math.round(
    quiz.attempts.reduce((s, a) => s + a.percentage, 0) / quiz.attempts.length,
  );
}

function rateColor(rate: number | null) {
  if (rate === null) return "bg-[var(--border)]";
  if (rate >= 70) return "bg-emerald-500";
  if (rate >= 45) return "bg-amber-400";
  return "bg-red-500";
}

function exportCSV(quiz: Quiz) {
  const header = ["Student", "Score", "Percentage", "Result", "Completed"];
  const rows = quiz.attempts.map((a) => [
    `"${a.studentName}"`,
    a.score,
    `${a.percentage}%`,
    a.percentage >= quiz.passingScore ? "Passed" : "Failed",
    new Date(a.completedAt).toLocaleString(),
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${quiz.title.replace(/\s+/g, "_")}_results.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeacherQuizzesPage() {
  const teacher = useTeacher();
  const toast = useToast();
  const courses = teacher.myCourses();

  const [quizzes, setQuizzes] = React.useState<Quiz[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [courseFilter, setCourseFilter] = React.useState("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("newest");
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Quiz | null>(null);
  const [statsId, setStatsId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Quiz | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [duplicating, setDuplicating] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/teacher/quizzes");
      const data = r.ok ? await r.json() : { quizzes: [] };
      setQuizzes(data.quizzes ?? []);
    } catch {
      toast.push({ title: "Couldn't load quizzes", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  // ── Aggregate stats ──────────────────────────────────────────────────────
  const overallStats = React.useMemo(() => {
    const totalAttempts = quizzes.reduce((s, q) => s + q.attempts.length, 0);
    const allPerc = quizzes.flatMap((q) => q.attempts.map((a) => a.percentage));
    const overallAvg = allPerc.length
      ? Math.round(allPerc.reduce((s, p) => s + p, 0) / allPerc.length)
      : 0;
    const passedCount = quizzes.reduce(
      (s, q) =>
        s + q.attempts.filter((a) => a.percentage >= q.passingScore).length,
      0,
    );
    const overallPassRate = totalAttempts
      ? Math.round((passedCount / totalAttempts) * 100)
      : 0;
    return { totalAttempts, overallAvg, overallPassRate };
  }, [quizzes]);

  // ── Filtered + sorted list ───────────────────────────────────────────────
  const courseOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    quizzes.forEach((q) => map.set(q.courseId, q.courseTitle));
    return Array.from(map.entries());
  }, [quizzes]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return quizzes
      .filter((z) => {
        if (courseFilter !== "all" && z.courseId !== courseFilter) return false;
        if (!q) return true;
        return z.title.toLowerCase().includes(q) || z.courseTitle.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (sortKey === "newest")
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortKey === "attempts") return b.attempts.length - a.attempts.length;
        if (sortKey === "avg_desc") return avgScore(b) - avgScore(a);
        if (sortKey === "avg_asc") return avgScore(a) - avgScore(b);
        return 0;
      });
  }, [quizzes, query, courseFilter, sortKey]);

  const stats = quizzes.find((q) => q.id === statsId) ?? null;

  // ── Delete ───────────────────────────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const r = await fetch(`/api/teacher/quizzes/${deleteTarget.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    if (r.ok) {
      toast.push({ title: "Quiz deleted", tone: "info" });
      setDeleteTarget(null);
      load();
    } else {
      toast.push({ title: "Couldn't delete quiz", tone: "danger" });
    }
  }

  // ── Duplicate ────────────────────────────────────────────────────────────
  async function duplicate(quiz: Quiz) {
    setDuplicating(quiz.id);
    const payload = {
      courseId: quiz.courseId,
      title: `${quiz.title} (Copy)`,
      description: quiz.description,
      durationMinutes: quiz.durationMinutes,
      passingScore: quiz.passingScore,
      questions: quiz.questions.map((q) => ({
        prompt: q.prompt,
        options: q.options,
        answerIndex: q.answerIndex,
      })),
    };
    const r = await fetch("/api/teacher/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setDuplicating(null);
    if (r.ok) {
      toast.push({ title: "Quiz duplicated", tone: "success" });
      load();
    } else {
      toast.push({ title: "Couldn't duplicate quiz", tone: "danger" });
    }
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
            Teaching
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Quizzes</h1>
          <p className="mt-1 text-[var(--muted)]">
            Build MCQs for your courses and track student results.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
          disabled={courses.length === 0}
        >
          <Icon.Plus size={16} /> New quiz
        </Button>
      </div>

      {/* Stats bar */}
      {!loading && quizzes.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard
            icon={<Icon.ListChecks size={16} />}
            label="Total Quizzes"
            value={String(quizzes.length)}
            tone="primary"
          />
          <SummaryCard
            icon={<Icon.Users size={16} />}
            label="Total Attempts"
            value={String(overallStats.totalAttempts)}
            tone="default"
          />
          <SummaryCard
            icon={<Icon.TrendingUp size={16} />}
            label="Avg Score"
            value={overallStats.totalAttempts ? `${overallStats.overallAvg}%` : "—"}
            tone="info"
          />
          <SummaryCard
            icon={<Icon.Award size={16} />}
            label="Pass Rate"
            value={overallStats.totalAttempts ? `${overallStats.overallPassRate}%` : "—"}
            tone={
              overallStats.overallPassRate >= 70
                ? "success"
                : overallStats.overallPassRate >= 45
                  ? "warning"
                  : "danger"
            }
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Input
                icon={<Icon.Search size={16} />}
                placeholder="Search quizzes…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {courseOptions.length > 1 && (
              <Select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="sm:w-52"
              >
                <option value="all">All courses</option>
                {courseOptions.map(([id, title]) => (
                  <option key={id} value={id}>
                    {title}
                  </option>
                ))}
              </Select>
            )}
            <Select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="sm:w-44"
            >
              <option value="newest">Newest first</option>
              <option value="attempts">Most attempts</option>
              <option value="avg_desc">Highest avg</option>
              <option value="avg_asc">Lowest avg</option>
            </Select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-52 rounded-xl bg-[var(--surface-2)] animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Icon.ListChecks size={20} />}
              title={quizzes.length === 0 ? "No quizzes yet" : "Nothing matches"}
              description={
                courses.length === 0
                  ? "You need a course assigned before building a quiz."
                  : quizzes.length === 0
                    ? "Create your first quiz for one of your courses."
                    : "Try a different search or filter."
              }
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((q) => (
                <QuizCard
                  key={q.id}
                  quiz={q}
                  onResults={() => setStatsId(q.id)}
                  onEdit={() => {
                    setEditing(q);
                    setEditorOpen(true);
                  }}
                  onDuplicate={() => duplicate(q)}
                  onDelete={() => setDeleteTarget(q)}
                  duplicating={duplicating === q.id}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Quiz editor modal */}
      <QuizEditor
        open={editorOpen}
        initial={editing}
        courses={courses.map((c) => ({ id: c.id, title: c.title }))}
        onClose={() => setEditorOpen(false)}
        onSaved={() => {
          setEditorOpen(false);
          load();
        }}
      />

      {/* Results modal */}
      <ResultsModal
        quiz={stats}
        onClose={() => setStatsId(null)}
        onExport={() => {
          if (stats) {
            exportCSV(stats);
            toast.push({ title: "CSV exported", tone: "success" });
          }
        }}
      />

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete quiz?"
        size="sm"
      >
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            <span className="font-semibold text-[var(--foreground)]">
              {deleteTarget?.title}
            </span>{" "}
            and all its student attempts will be permanently deleted. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting}>
              <Icon.Trash size={14} /> Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

type SummaryTone = "primary" | "default" | "info" | "success" | "warning" | "danger";

const SUMMARY_STYLES: Record<
  SummaryTone,
  { bg: string; icon: string; value: string }
> = {
  primary: {
    bg: "bg-[var(--primary-soft)]",
    icon: "text-[var(--primary)]",
    value: "text-[var(--primary)]",
  },
  default: {
    bg: "bg-[var(--surface-2)]",
    icon: "text-[var(--muted)]",
    value: "text-[var(--foreground)]",
  },
  info: {
    bg: "bg-blue-500/10",
    icon: "text-blue-600 dark:text-blue-400",
    value: "text-blue-700 dark:text-blue-300",
  },
  success: {
    bg: "bg-emerald-500/10",
    icon: "text-emerald-600 dark:text-emerald-400",
    value: "text-emerald-700 dark:text-emerald-300",
  },
  warning: {
    bg: "bg-amber-500/10",
    icon: "text-amber-600 dark:text-amber-400",
    value: "text-amber-700 dark:text-amber-300",
  },
  danger: {
    bg: "bg-red-500/10",
    icon: "text-red-600 dark:text-red-400",
    value: "text-red-700 dark:text-red-300",
  },
};

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: SummaryTone;
}) {
  const s = SUMMARY_STYLES[tone];
  return (
    <div className={cn("rounded-xl p-3.5 flex items-center gap-3", s.bg)}>
      <span className={cn("shrink-0", s.icon)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold">
          {label}
        </p>
        <p className={cn("text-xl font-bold leading-tight", s.value)}>{value}</p>
      </div>
    </div>
  );
}

// ─── Quiz Card ────────────────────────────────────────────────────────────────

function QuizCard({
  quiz,
  onResults,
  onEdit,
  onDuplicate,
  onDelete,
  duplicating,
}: {
  quiz: Quiz;
  onResults: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  duplicating: boolean;
}) {
  const avg = avgScore(quiz);
  const rate = passRate(quiz);
  const passed = quiz.attempts.filter((a) => a.percentage >= quiz.passingScore).length;

  return (
    <Card className="hover-lift">
      <CardBody className="space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
            <Icon.ListChecks size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold leading-snug truncate">{quiz.title}</p>
            <p className="text-xs text-[var(--muted)] truncate mt-0.5">{quiz.courseTitle}</p>
          </div>
        </div>

        {/* Description */}
        {quiz.description && (
          <p className="text-sm text-[var(--muted)] line-clamp-2">{quiz.description}</p>
        )}

        {/* Meta chips */}
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)] font-medium">
            <Icon.Clock size={11} /> {quiz.durationMinutes} min
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)] font-medium">
            <Icon.Award size={11} /> Pass at {quiz.passingScore}%
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)] font-medium">
            {quiz.questions.length} Q
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Attempts" value={`${quiz.attempts.length}`} />
          <MiniStat label="Avg score" value={quiz.attempts.length ? `${avg}%` : "—"} />
          <MiniStat
            label="Passed"
            value={quiz.attempts.length ? `${passed}/${quiz.attempts.length}` : "—"}
          />
        </div>

        {/* Pass rate bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
            <span>Pass rate</span>
            <span className="font-semibold">{rate !== null ? `${rate}%` : "No attempts"}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", rateColor(rate))}
              style={{ width: rate !== null ? `${rate}%` : "0%" }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--border)]">
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={onDuplicate}
              loading={duplicating}
              title="Duplicate quiz"
            >
              <Icon.Copy size={13} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              title="Delete quiz"
              className="text-[var(--danger)] hover:bg-red-500/10"
            >
              <Icon.Trash size={13} />
            </Button>
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" onClick={onResults}>
              <Icon.BarChart3 size={13} /> Results
            </Button>
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Icon.Edit size={13} /> Edit
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--surface-2)] p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold">
        {label}
      </p>
      <p className="text-sm font-bold mt-0.5">{value}</p>
    </div>
  );
}

// ─── Results Modal ────────────────────────────────────────────────────────────

type AttemptSortKey = "score_desc" | "score_asc" | "name" | "date";

function ResultsModal({
  quiz,
  onClose,
  onExport,
}: {
  quiz: Quiz | null;
  onClose: () => void;
  onExport: () => void;
}) {
  const [sort, setSort] = React.useState<AttemptSortKey>("score_desc");

  if (!quiz) return null;

  const avg = avgScore(quiz);
  const passed = quiz.attempts.filter((a) => a.percentage >= quiz.passingScore);
  const rate = passRate(quiz);
  const highest = quiz.attempts.reduce((m, a) => Math.max(m, a.percentage), 0);

  // Score distribution: 5 buckets
  const buckets = [
    { label: "0–20", min: 0, max: 20 },
    { label: "21–40", min: 21, max: 40 },
    { label: "41–60", min: 41, max: 60 },
    { label: "61–80", min: 61, max: 80 },
    { label: "81–100", min: 81, max: 100 },
  ].map((b) => ({
    ...b,
    count: quiz.attempts.filter((a) => a.percentage >= b.min && a.percentage <= b.max).length,
  }));
  const maxBucket = Math.max(...buckets.map((b) => b.count), 1);

  const sorted = [...quiz.attempts].sort((a, b) => {
    if (sort === "score_desc") return b.percentage - a.percentage;
    if (sort === "score_asc") return a.percentage - b.percentage;
    if (sort === "name") return a.studentName.localeCompare(b.studentName);
    return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
  });

  return (
    <Modal open={true} onClose={onClose} title={`Results · ${quiz.title}`} size="lg">
      <div className="p-5 space-y-5 max-h-[78vh] overflow-y-auto scrollbar-thin">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniStat label="Attempts" value={`${quiz.attempts.length}`} />
          <MiniStat label="Avg Score" value={quiz.attempts.length ? `${avg}%` : "—"} />
          <MiniStat
            label="Passed"
            value={
              quiz.attempts.length
                ? `${passed.length}/${quiz.attempts.length}`
                : "—"
            }
          />
          <MiniStat
            label="Pass Rate"
            value={rate !== null ? `${rate}%` : "—"}
          />
        </div>

        {quiz.attempts.length === 0 ? (
          <EmptyState
            icon={<Icon.ListChecks size={20} />}
            title="No attempts yet"
            description="Once students take this quiz, their results appear here."
          />
        ) : (
          <>
            {/* Score distribution */}
            <div>
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
                Score distribution
              </p>
              <div className="flex items-end gap-2 h-20">
                {buckets.map((b) => (
                  <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-[var(--muted)] font-medium">
                      {b.count > 0 ? b.count : ""}
                    </span>
                    <div className="w-full rounded-t-md bg-[var(--surface-2)] flex flex-col justify-end overflow-hidden h-14">
                      <div
                        className={cn(
                          "w-full rounded-t-md transition-all",
                          b.min >= 61 ? "bg-emerald-500" : b.min >= 41 ? "bg-amber-400" : "bg-red-400",
                        )}
                        style={{
                          height: `${Math.round((b.count / maxBucket) * 100)}%`,
                          minHeight: b.count > 0 ? "4px" : "0",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--muted-2)]">{b.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--muted)]">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-red-400 shrink-0" /> {"<"}41%
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-amber-400 shrink-0" /> 41–60%
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-emerald-500 shrink-0" /> {"≥"}61%
                </span>
                {quiz.attempts.length > 0 && (
                  <span className="ml-auto">Highest: {highest}%</span>
                )}
              </div>
            </div>

            {/* Table controls */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Select
                value={sort}
                onChange={(e) => setSort(e.target.value as AttemptSortKey)}
                className="w-44 text-sm"
              >
                <option value="score_desc">Score: High → Low</option>
                <option value="score_asc">Score: Low → High</option>
                <option value="name">Name A → Z</option>
                <option value="date">Most recent</option>
              </Select>
              <Button size="sm" variant="outline" onClick={onExport}>
                <Icon.Download size={13} /> Export CSV
              </Button>
            </div>

            {/* Attempts table */}
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface-2)]">
                  <tr className="text-left text-[var(--muted)] text-xs uppercase tracking-wider">
                    <th className="py-2.5 px-3 font-semibold">Student</th>
                    <th className="py-2.5 px-3 font-semibold">Score</th>
                    <th className="py-2.5 px-3 font-semibold">Result</th>
                    <th className="py-2.5 px-3 font-semibold hidden md:table-cell">
                      Completed
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {sorted.map((a, i) => (
                    <tr key={`${a.studentId}-${i}`} className="hover:bg-[var(--surface-2)]/50 transition-colors">
                      <td className="py-3 px-3 font-medium">{a.studentName}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span>{a.percentage}%</span>
                          <div className="h-1.5 w-16 rounded-full bg-[var(--surface-2)] overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                a.percentage >= quiz.passingScore
                                  ? "bg-emerald-500"
                                  : "bg-red-400",
                              )}
                              style={{ width: `${a.percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {a.percentage >= quiz.passingScore ? (
                          <Badge variant="success">Passed</Badge>
                        ) : (
                          <Badge variant="danger">Failed</Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell text-[var(--muted)] text-xs">
                        {relativeTime(a.completedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ─── Quiz Editor ──────────────────────────────────────────────────────────────

let qKey = 0;
const newQuestion = (): Question => ({
  id: `new-${qKey++}`,
  prompt: "",
  options: ["", "", "", ""],
  answerIndex: 0,
});

function QuizEditor({
  open,
  initial,
  courses,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial: Quiz | null;
  courses: { id: string; title: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [meta, setMeta] = React.useState({
    title: "",
    description: "",
    courseId: "",
    durationMinutes: "15",
    passingScore: "60",
  });
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (initial) {
      setMeta({
        title: initial.title,
        description: initial.description,
        courseId: initial.courseId,
        durationMinutes: String(initial.durationMinutes),
        passingScore: String(initial.passingScore),
      });
      setQuestions(initial.questions.map((q) => ({ ...q, options: [...q.options] })));
    } else {
      setMeta({
        title: "",
        description: "",
        courseId: courses[0]?.id ?? "",
        durationMinutes: "15",
        passingScore: "60",
      });
      setQuestions([newQuestion()]);
    }
  }, [open, initial, courses]);

  function updateQ(i: number, patch: Partial<Question>) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  function updateOpt(i: number, oi: number, value: string) {
    setQuestions((qs) =>
      qs.map((q, idx) =>
        idx === i ? { ...q, options: q.options.map((o, x) => (x === oi ? value : o)) } : q,
      ),
    );
  }

  function addOption(qi: number) {
    setQuestions((qs) =>
      qs.map((q, idx) =>
        idx === qi && q.options.length < 6 ? { ...q, options: [...q.options, ""] } : q,
      ),
    );
  }

  function removeOption(qi: number, oi: number) {
    setQuestions((qs) =>
      qs.map((q, idx) => {
        if (idx !== qi || q.options.length <= 2) return q;
        const newOpts = q.options.filter((_, x) => x !== oi);
        const newAnswer =
          q.answerIndex >= oi
            ? Math.max(0, q.answerIndex - 1)
            : q.answerIndex;
        return { ...q, options: newOpts, answerIndex: newAnswer };
      }),
    );
  }

  function moveQuestion(from: number, to: number) {
    if (to < 0 || to >= questions.length) return;
    setQuestions((qs) => {
      const next = [...qs];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  const valid =
    meta.title.trim().length >= 3 &&
    meta.courseId &&
    questions.length > 0 &&
    questions.every((q) => q.prompt.trim() && q.options.every((o) => o.trim()));

  async function save() {
    setSaving(true);
    const payload = {
      courseId: meta.courseId,
      title: meta.title,
      description: meta.description,
      durationMinutes: Number(meta.durationMinutes),
      passingScore: Number(meta.passingScore),
      questions: questions.map((q) => ({
        prompt: q.prompt,
        options: q.options,
        answerIndex: q.answerIndex,
      })),
    };
    const r = await fetch(
      initial ? `/api/teacher/quizzes/${initial.id}` : "/api/teacher/quizzes",
      {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    setSaving(false);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      toast.push({ title: "Couldn't save quiz", description: (e as { error?: string }).error, tone: "danger" });
      return;
    }
    toast.push({ title: initial ? "Quiz updated" : "Quiz created", tone: "success" });
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit quiz" : "New quiz"} size="xl">
      <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto scrollbar-thin">
        {/* Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Title</Label>
            <Input
              value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })}
              placeholder="e.g. Week 3 — Closures & Scope"
              maxLength={140}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={meta.description}
              onChange={(e) => setMeta({ ...meta, description: e.target.value })}
              placeholder="Brief description of what this quiz covers…"
            />
          </div>
          <div>
            <Label>Course</Label>
            <Select
              value={meta.courseId}
              onChange={(e) => setMeta({ ...meta, courseId: e.target.value })}
              disabled={!!initial}
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
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              min={1}
              max={180}
              value={meta.durationMinutes}
              onChange={(e) => setMeta({ ...meta, durationMinutes: e.target.value })}
            />
          </div>
          <div>
            <Label>Passing score (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={meta.passingScore}
              onChange={(e) => setMeta({ ...meta, passingScore: e.target.value })}
            />
          </div>
        </div>

        {/* Questions */}
        <div className="border-t border-[var(--border)] pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold">
              Questions{" "}
              <span className="text-sm font-normal text-[var(--muted)]">
                ({questions.length})
              </span>
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuestions((qs) => [...qs, newQuestion()])}
            >
              <Icon.Plus size={14} /> Add question
            </Button>
          </div>

          <div className="space-y-4">
            {questions.map((q, qi) => (
              <div
                key={q.id ?? qi}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
              >
                {/* Question header */}
                <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-2)] border-b border-[var(--border)]">
                  <span className="h-6 w-6 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-xs font-bold flex items-center justify-center shrink-0">
                    {qi + 1}
                  </span>
                  <div className="flex-1" />
                  {/* Reorder */}
                  <button
                    type="button"
                    onClick={() => moveQuestion(qi, qi - 1)}
                    disabled={qi === 0}
                    className="h-6 w-6 rounded flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] disabled:opacity-30 transition"
                    title="Move up"
                  >
                    <Icon.ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(qi, qi + 1)}
                    disabled={qi === questions.length - 1}
                    className="h-6 w-6 rounded flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] disabled:opacity-30 transition"
                    title="Move down"
                    style={{ transform: "rotate(180deg)" }}
                  >
                    <Icon.ArrowUp size={13} />
                  </button>
                  {/* Remove question */}
                  <button
                    type="button"
                    onClick={() =>
                      setQuestions((qs) => qs.filter((_, x) => x !== qi))
                    }
                    className="h-6 w-6 rounded flex items-center justify-center text-[var(--danger)] hover:bg-red-500/10 transition"
                    title="Remove question"
                  >
                    <Icon.Trash size={13} />
                  </button>
                </div>

                {/* Question body */}
                <div className="p-3 space-y-3">
                  <Input
                    value={q.prompt}
                    onChange={(e) => updateQ(qi, { prompt: e.target.value })}
                    placeholder="Type your question here…"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="relative">
                        <label
                          className={cn(
                            "flex items-center gap-2 rounded-lg border p-2 pr-8 transition cursor-pointer",
                            q.answerIndex === oi
                              ? "border-[var(--primary)] bg-[var(--primary-soft)]/40"
                              : "border-[var(--border)] hover:border-[var(--border-strong)]",
                          )}
                        >
                          <input
                            type="radio"
                            name={`ans-${q.id ?? qi}`}
                            checked={q.answerIndex === oi}
                            onChange={() => updateQ(qi, { answerIndex: oi })}
                            className="h-4 w-4 shrink-0 accent-[var(--primary)]"
                          />
                          <span className="text-xs font-bold text-[var(--muted)] w-4 shrink-0">
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <input
                            className="flex-1 bg-transparent text-sm focus:outline-none min-w-0"
                            value={opt}
                            onChange={(e) => updateOpt(qi, oi, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                          />
                        </label>
                        {/* Remove option button */}
                        {q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(qi, oi)}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded flex items-center justify-center text-[var(--muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition"
                            title="Remove option"
                          >
                            <Icon.X size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add option */}
                  {q.options.length < 6 && (
                    <button
                      type="button"
                      onClick={() => addOption(qi)}
                      className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
                    >
                      <Icon.Plus size={12} /> Add option
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!valid} loading={saving}>
            <Icon.Save size={14} /> {initial ? "Save changes" : "Create quiz"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
