"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import Icon from "@/components/icons";
import { relativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

type QuizSummary = {
  id: string;
  courseTitle: string;
  title: string;
  description: string;
  durationMinutes: number;
  passingScore: number;
  questionCount: number;
  lastAttempt: {
    id: string;
    percentage: number;
    passed: boolean;
    completedAt: string | null;
  } | null;
};

type FilterKey = "all" | "not-started" | "passed" | "failed";
type SortKey = "default" | "score-high" | "score-low" | "name";

function difficultyLabel(durationMinutes: number, questionCount: number): { label: string; color: string } {
  const score = durationMinutes / Math.max(1, questionCount);
  if (score >= 6) return { label: "Hard", color: "text-red-500" };
  if (score >= 3) return { label: "Medium", color: "text-amber-500" };
  return { label: "Easy", color: "text-emerald-500" };
}

function ScoreBar({ score, passing }: { score: number; passing: number }) {
  const passed = score >= passing;
  return (
    <div className="space-y-1">
      <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden relative">
        {/* Passing threshold marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[var(--border)] z-10"
          style={{ left: `${passing}%` }}
        />
        <div
          className={cn("h-full rounded-full transition-all", passed ? "bg-emerald-500" : "bg-red-400")}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-[var(--muted-2)]">
        <span>{score}% scored</span>
        <span>Pass: {passing}%</span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[var(--border)] p-5 space-y-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5 flex-1">
          <div className="h-4 w-2/3 rounded bg-[var(--surface-2)]" />
          <div className="h-3 w-1/2 rounded bg-[var(--surface-2)]" />
        </div>
        <div className="h-6 w-12 rounded-full bg-[var(--surface-2)]" />
      </div>
      <div className="h-3 w-full rounded bg-[var(--surface-2)]" />
      <div className="h-3 w-3/4 rounded bg-[var(--surface-2)]" />
      <div className="h-2 w-full rounded-full bg-[var(--surface-2)]" />
      <div className="h-9 w-full rounded-lg bg-[var(--surface-2)]" />
    </div>
  );
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("default");

  useEffect(() => {
    fetch("/api/quizzes")
      .then((r) => (r.ok ? r.json() : { quizzes: [] }))
      .then((data) => setQuizzes(data.quizzes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    total: quizzes.length,
    passed: quizzes.filter((q) => q.lastAttempt?.passed).length,
    failed: quizzes.filter((q) => q.lastAttempt && !q.lastAttempt.passed).length,
    notStarted: quizzes.filter((q) => !q.lastAttempt).length,
    avgScore: quizzes.filter((q) => q.lastAttempt).length > 0
      ? Math.round(quizzes.filter((q) => q.lastAttempt).reduce((s, q) => s + (q.lastAttempt?.percentage ?? 0), 0) / quizzes.filter((q) => q.lastAttempt).length)
      : 0,
  }), [quizzes]);

  const filtered = useMemo(() => {
    let list = quizzes.filter((q) => {
      if (filter === "not-started") return !q.lastAttempt;
      if (filter === "passed") return q.lastAttempt?.passed;
      if (filter === "failed") return q.lastAttempt && !q.lastAttempt.passed;
      return true;
    });
    if (sort === "score-high") list = [...list].sort((a, b) => (b.lastAttempt?.percentage ?? -1) - (a.lastAttempt?.percentage ?? -1));
    if (sort === "score-low") list = [...list].sort((a, b) => (a.lastAttempt?.percentage ?? 101) - (b.lastAttempt?.percentage ?? 101));
    if (sort === "name") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [quizzes, filter, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Quizzes</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Test your knowledge — your best attempt counts.</p>
        </div>
        {!loading && quizzes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted)]">Sort:</span>
            {(["default", "score-high", "score-low", "name"] as SortKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setSort(k)}
                className={cn(
                  "text-xs px-2.5 py-1.5 rounded-lg font-medium transition",
                  sort === k ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]",
                )}
              >
                {k === "default" ? "Default" : k === "score-high" ? "Score ↓" : k === "score-low" ? "Score ↑" : "A–Z"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {!loading && quizzes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total quizzes", value: stats.total, color: "text-[var(--primary)]", icon: <Icon.ListChecks size={16} /> },
            { label: "Passed", value: stats.passed, color: "text-emerald-500", icon: <Icon.CheckCircle size={16} /> },
            { label: "Not started", value: stats.notStarted, color: "text-amber-500", icon: <Icon.Clock size={16} /> },
            { label: "Avg score", value: stats.avgScore > 0 ? `${stats.avgScore}%` : "—", color: "text-blue-500", icon: <Icon.TrendingUp size={16} /> },
          ].map((s) => (
            <Card key={s.label}>
              <CardBody className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className={s.color}>{s.icon}</span>
                  <div>
                    <p className="text-lg font-bold leading-none">{s.value}</p>
                    <p className="text-[10px] text-[var(--muted)] mt-0.5">{s.label}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      {!loading && quizzes.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[var(--muted)]">Filter:</span>
          {([
            { key: "all", label: `All (${stats.total})` },
            { key: "not-started", label: `Not started (${stats.notStarted})` },
            { key: "passed", label: `Passed (${stats.passed})` },
            { key: "failed", label: `Failed (${stats.failed})` },
          ] as { key: FilterKey; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg font-medium transition",
                filter === key ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : quizzes.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.ListChecks size={28} />}
              title="No quizzes yet"
              description="Enroll in a course that has quizzes to see them here."
            />
          </CardBody>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.ListChecks size={28} />}
              title={`No ${filter.replace("-", " ")} quizzes`}
              description="Try a different filter."
              action={<Button variant="ghost" onClick={() => setFilter("all")}>Clear filter</Button>}
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((q) => {
            const diff = difficultyLabel(q.durationMinutes, q.questionCount);
            const attempted = !!q.lastAttempt;
            const passed = q.lastAttempt?.passed ?? false;
            return (
              <Card
                key={q.id}
                className={cn(
                  "transition",
                  passed ? "ring-1 ring-emerald-500/30" : "",
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="line-clamp-1">{q.title}</CardTitle>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{q.courseTitle}</p>
                    </div>
                    {q.lastAttempt ? (
                      <Badge variant={passed ? "success" : "danger"}>
                        {q.lastAttempt.percentage}%
                      </Badge>
                    ) : (
                      <span className={cn("text-[10px] font-semibold", diff.color)}>{diff.label}</span>
                    )}
                  </div>
                </CardHeader>
                <CardBody className="space-y-3">
                  <p className="text-sm text-[var(--muted)] line-clamp-2">{q.description}</p>

                  <div className="flex items-center gap-3 text-xs text-[var(--muted-2)] flex-wrap">
                    <span className="flex items-center gap-1"><Icon.Clock size={12} /> {q.durationMinutes}m</span>
                    <span>·</span>
                    <span>{q.questionCount} question{q.questionCount > 1 ? "s" : ""}</span>
                    <span>·</span>
                    <span>Pass: {q.passingScore}%</span>
                    {!attempted && <><span>·</span><span className={diff.color}>{diff.label}</span></>}
                  </div>

                  {q.lastAttempt && (
                    <ScoreBar score={q.lastAttempt.percentage} passing={q.passingScore} />
                  )}

                  {q.lastAttempt && (
                    <div className={cn(
                      "rounded-lg px-3 py-2 text-xs flex items-center justify-between",
                      passed ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400",
                    )}>
                      <span className="flex items-center gap-1.5">
                        {passed ? <Icon.CheckCircle size={13} /> : <Icon.AlertCircle size={13} />}
                        {passed ? "Passed" : `Need ${q.passingScore - q.lastAttempt.percentage}% more to pass`}
                      </span>
                      {q.lastAttempt.completedAt && (
                        <span className="text-[var(--muted-2)]">{relativeTime(q.lastAttempt.completedAt)}</span>
                      )}
                    </div>
                  )}

                  <Link href={`/quizzes/${q.id}`}>
                    <Button
                      size="sm"
                      variant={attempted && passed ? "outline" : "primary"}
                      className="w-full mt-1"
                    >
                      {!attempted ? "Start quiz" : passed ? "Retake" : "Try again"}{" "}
                      <Icon.ChevronRight size={14} />
                    </Button>
                  </Link>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
