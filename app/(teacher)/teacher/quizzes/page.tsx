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
import { relativeTime } from "@/lib/utils";

type Question = { id?: string; prompt: string; options: string[]; answerIndex: number };
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

export default function TeacherQuizzesPage() {
  const teacher = useTeacher();
  const toast = useToast();
  const courses = teacher.myCourses();

  const [quizzes, setQuizzes] = React.useState<Quiz[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Quiz | null>(null);
  const [statsId, setStatsId] = React.useState<string | null>(null);

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

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return quizzes;
    return quizzes.filter(
      (z) => z.title.toLowerCase().includes(q) || z.courseTitle.toLowerCase().includes(q),
    );
  }, [quizzes, query]);

  const stats = quizzes.find((q) => q.id === statsId) ?? null;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
            Teaching
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Quizzes</h1>
          <p className="mt-1 text-[var(--muted)]">
            Build MCQs for a course and track student results.
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

      <Card>
        <CardBody className="space-y-4">
          <Input
            icon={<Icon.Search size={16} />}
            placeholder="Search quizzes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {loading ? (
            <p className="text-sm text-[var(--muted)]">Loading…</p>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Icon.ListChecks size={20} />}
              title={quizzes.length === 0 ? "No quizzes yet" : "Nothing matches"}
              description={
                courses.length === 0
                  ? "You need a course assigned before building a quiz."
                  : quizzes.length === 0
                    ? "Create a quiz with a few MCQs for one of your courses."
                    : "Try another search."
              }
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((q) => {
                const avg =
                  q.attempts.length === 0
                    ? 0
                    : Math.round(
                        q.attempts.reduce((s, a) => s + a.percentage, 0) / q.attempts.length,
                      );
                return (
                  <Card key={q.id}>
                    <CardBody className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                          <Icon.ListChecks size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{q.title}</p>
                          <p className="text-xs text-[var(--muted)] truncate">{q.courseTitle}</p>
                        </div>
                      </div>
                      <p className="text-sm text-[var(--muted)] line-clamp-2">{q.description}</p>
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <MiniStat label="Questions" value={`${q.questions.length}`} />
                        <MiniStat label="Attempts" value={`${q.attempts.length}`} />
                        <MiniStat label="Avg score" value={`${avg}%`} />
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                        <Button size="sm" variant="outline" onClick={() => setStatsId(q.id)}>
                          <Icon.BarChart3 size={14} /> Results
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(q);
                            setEditorOpen(true);
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

      <StatsModal quiz={stats} onClose={() => setStatsId(null)} />
    </div>
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
      setQuestions(initial.questions.map((q) => ({ ...q })));
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
      toast.push({ title: "Couldn't save quiz", description: e.error, tone: "danger" });
      return;
    }
    toast.push({ title: "Quiz saved", tone: "success" });
    onSaved();
  }

  async function remove() {
    if (!initial) return;
    const r = await fetch(`/api/teacher/quizzes/${initial.id}`, { method: "DELETE" });
    if (r.ok) {
      toast.push({ title: "Quiz deleted", tone: "info" });
      onSaved();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit quiz" : "New quiz"} size="xl">
      <div className="p-5 space-y-5">
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
            />
          </div>
          <div>
            <Label>Course</Label>
            <Select
              value={meta.courseId}
              onChange={(e) => setMeta({ ...meta, courseId: e.target.value })}
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
            <Label>Duration (min)</Label>
            <Input
              type="number"
              min={1}
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

        <div className="border-t border-[var(--border)] pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold">Questions ({questions.length})</p>
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
              <Card key={q.id ?? qi} className="border-[var(--border-strong)]">
                <CardBody className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="h-6 w-6 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-xs font-bold flex items-center justify-center shrink-0">
                      {qi + 1}
                    </span>
                    <Input
                      value={q.prompt}
                      onChange={(e) => updateQ(qi, { prompt: e.target.value })}
                      placeholder="Question text"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuestions((qs) => qs.filter((_, x) => x !== qi))}
                      aria-label="Remove"
                    >
                      <Icon.Trash size={16} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, oi) => (
                      <label
                        key={oi}
                        className={`flex items-center gap-2 rounded-lg border p-2 transition ${
                          q.answerIndex === oi
                            ? "border-[var(--primary)] bg-[var(--primary-soft)]/40"
                            : "border-[var(--border)]"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`ans-${q.id ?? qi}`}
                          checked={q.answerIndex === oi}
                          onChange={() => updateQ(qi, { answerIndex: oi })}
                          className="h-4 w-4"
                        />
                        <span className="text-xs font-bold text-[var(--muted)] w-4">
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <input
                          className="flex-1 bg-transparent text-sm focus:outline-none"
                          value={opt}
                          onChange={(e) => updateOpt(qi, oi, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        />
                      </label>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-between gap-2 pt-2 border-t border-[var(--border)]">
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
            <Button onClick={save} disabled={!valid} loading={saving}>
              <Icon.Save size={14} /> Save quiz
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function StatsModal({ quiz, onClose }: { quiz: Quiz | null; onClose: () => void }) {
  if (!quiz) return null;
  const total = quiz.questions.length || 1;
  const passing = quiz.attempts.filter((a) => a.percentage >= quiz.passingScore).length;
  const avg =
    quiz.attempts.length === 0
      ? 0
      : Math.round(quiz.attempts.reduce((s, a) => s + a.percentage, 0) / quiz.attempts.length);

  return (
    <Modal open={true} onClose={onClose} title={`Results · ${quiz.title}`} size="lg">
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="Attempts" value={`${quiz.attempts.length}`} />
          <MiniStat label="Avg score" value={`${avg}%`} />
          <MiniStat label="Passed" value={`${passing}/${quiz.attempts.length}`} />
        </div>
        {quiz.attempts.length === 0 ? (
          <EmptyState
            icon={<Icon.ListChecks size={20} />}
            title="No attempts yet"
            description="Once students take the quiz, their results show here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="py-2.5 px-3 font-medium">Student</th>
                  <th className="py-2.5 px-3 font-medium">Score</th>
                  <th className="py-2.5 px-3 font-medium">Result</th>
                  <th className="py-2.5 px-3 font-medium hidden md:table-cell">Completed</th>
                </tr>
              </thead>
              <tbody>
                {quiz.attempts.map((a) => (
                  <tr key={a.studentId} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-3 px-3 font-medium">{a.studentName}</td>
                    <td className="py-3 px-3">
                      {a.score}/{total} · {a.percentage}%
                    </td>
                    <td className="py-3 px-3">
                      {a.percentage >= quiz.passingScore ? (
                        <Badge variant="success">Passed</Badge>
                      ) : (
                        <Badge variant="danger">Failed</Badge>
                      )}
                    </td>
                    <td className="py-3 px-3 hidden md:table-cell text-[var(--muted)]">
                      {relativeTime(a.completedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
