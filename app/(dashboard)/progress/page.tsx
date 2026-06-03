"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Progress,
  StatCard,
} from "@/components/ui";
import Icon from "@/components/icons";
import { BarChart, Heatmap, LineChart, RadialBars } from "@/components/charts";
import {
  ACTIVITY_HEATMAP,
  HOURS_BY_CATEGORY,
  QUIZ_SCORE_HISTORY,
  SKILL_MASTERY,
  STUDY_STREAK,
  STUDY_TIME_OF_DAY,
  WEEKLY_HOURS,
} from "@/lib/mockData";
import { formatDate, formatHours } from "@/lib/utils";

type ProgressData = {
  stats: {
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    totalMinutesLearned: number;
    certificates: number;
    averageQuizScore: number;
    quizzesTaken: number;
    assignmentsSubmitted: number;
    assignmentsGraded: number;
  };
  enrollments: {
    courseId: string;
    courseTitle: string;
    progress: number;
    completed: boolean;
    category: string;
  }[];
  recentQuizzes: { id: string; quizTitle: string; percentage: number; passed: boolean; completedAt: string | null }[];
  byCategory: Record<string, { enrolled: number; minutesLearned: number }>;
};

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  if (loading) return <p className="text-sm text-[var(--muted)] p-6">Loading…</p>;
  if (error || !data) {
    return (
      <EmptyState
        icon={<Icon.BarChart3 size={28} />}
        title="Couldn't load progress"
        description="Something went wrong fetching your analytics. Please try refreshing the page."
      />
    );
  }

  const { stats, enrollments, recentQuizzes, byCategory } = data;
  const categoryEntries = Object.entries(byCategory);
  const maxCatMinutes = Math.max(1, ...categoryEntries.map(([, v]) => v.minutesLearned));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Progress & Analytics</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Your learning at a glance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Hours learned" value={formatHours(stats.totalMinutesLearned)} icon={<Icon.Clock size={20} />} tone="primary" />
        <StatCard label="Courses completed" value={`${stats.completedCourses}/${stats.totalCourses}`} icon={<Icon.Award size={20} />} tone="success" />
        <StatCard label="Avg quiz score" value={`${stats.averageQuizScore}%`} icon={<Icon.TrendingUp size={20} />} tone="accent" />
        <StatCard label="Assignments" value={`${stats.assignmentsGraded}/${stats.assignmentsSubmitted}`} delta="graded" icon={<Icon.FilePen size={20} />} tone="warning" />
      </div>

      {/* Live charts: weekly hours + quiz scores trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Weekly learning hours</CardTitle>
              <p className="text-xs text-[var(--muted)] mt-1">Past 7 days</p>
            </div>
            {(() => {
              const lastWeek = WEEKLY_HOURS.slice(-7);
              const thisHalf = lastWeek.slice(3).reduce((s, d) => s + d.hours, 0);
              const prevHalf = lastWeek.slice(0, 3).reduce((s, d) => s + d.hours, 0);
              const delta = prevHalf === 0 ? null : Math.round(((thisHalf - prevHalf) / prevHalf) * 100);
              return delta !== null ? (
                <Badge variant={delta >= 0 ? "primary" : "warning"}>
                  {delta >= 0 ? <Icon.TrendingUp size={12} /> : <Icon.TrendingUp size={12} className="rotate-180" />}
                  {delta >= 0 ? "+" : ""}{delta}%
                </Badge>
              ) : null;
            })()}
          </CardHeader>
          <CardBody>
            <div className="h-56">
              <LineChart data={WEEKLY_HOURS} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Quiz scores over time</CardTitle>
              <p className="text-xs text-[var(--muted)] mt-1">
                Avg {Math.round(QUIZ_SCORE_HISTORY.reduce((s, q) => s + q.score, 0) / QUIZ_SCORE_HISTORY.length)}% · {QUIZ_SCORE_HISTORY.length} attempts
              </p>
            </div>
            <Badge variant="success">
              <Icon.TrendingUp size={12} /> Trending up
            </Badge>
          </CardHeader>
          <CardBody>
            <div className="h-56">
              <LineChart
                data={QUIZ_SCORE_HISTORY.map((q, i) => ({ day: `Q${i + 1}`, hours: q.score }))}
                yFormatter={(v) => `${Math.round(v)}%`}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Activity heatmap */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Study activity heatmap</CardTitle>
            <p className="text-xs text-[var(--muted)] mt-1">
              Last 12 weeks · current streak {STUDY_STREAK.current}d (best {STUDY_STREAK.longest}d)
            </p>
          </div>
          <Badge variant="success">{STUDY_STREAK.daysActiveThisYear} active days this year</Badge>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto scrollbar-thin">
            <div className="min-w-[560px] h-44">
              <Heatmap cells={ACTIVITY_HEATMAP} weeks={12} />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Skill mastery radial + hours-by-category bars + time-of-day */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Skill mastery</CardTitle>
            <p className="text-xs text-[var(--muted)] mt-1">Where you stand across tracks</p>
          </CardHeader>
          <CardBody>
            <div className="flex items-center justify-center">
              <RadialBars
                data={SKILL_MASTERY.map((s) => ({ label: s.category, value: s.mastery, color: s.color }))}
                size={200}
              />
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              {SKILL_MASTERY.map((s) => (
                <li key={s.category} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="truncate">{s.category}</span>
                  </span>
                  <span className="text-[var(--muted)] tabular-nums">{s.mastery}%</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hours by category</CardTitle>
            <p className="text-xs text-[var(--muted)] mt-1">This semester</p>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <BarChart data={HOURS_BY_CATEGORY} valueLabel={(v) => `${v}h`} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Best study hours</CardTitle>
            <p className="text-xs text-[var(--muted)] mt-1">When you focus most</p>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2.5">
              {STUDY_TIME_OF_DAY.map((b) => {
                const max = Math.max(...STUDY_TIME_OF_DAY.map((x) => x.minutes), 1);
                const pct = (b.minutes / max) * 100;
                return (
                  <li key={b.bucket} className="flex items-center gap-2">
                    <span className="text-xs text-[var(--muted)] w-10 shrink-0 tabular-nums">{b.bucket}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--muted-2)] w-12 text-right tabular-nums">{b.minutes}m</span>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Course progress</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            {enrollments.length === 0 ? (
              <EmptyState icon={<Icon.Book size={24} />} title="No courses yet" description="Enroll in a course to track progress." />
            ) : (
              enrollments.map((e) => (
                <div key={e.courseId}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium line-clamp-1">{e.courseTitle}</p>
                    <Badge variant={e.completed ? "success" : "primary"}>
                      {e.completed ? "Done" : `${e.progress}%`}
                    </Badge>
                  </div>
                  <Progress value={e.progress} />
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Time spent by category</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {categoryEntries.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No data yet.</p>
            ) : (
              categoryEntries.map(([cat, info]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span>{cat.replace(/_/g, " ")}</span>
                    <span className="text-[var(--muted)]">{formatHours(info.minutesLearned)}</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
                      style={{ width: `${(info.minutesLearned / maxCatMinutes) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent quiz attempts</CardTitle></CardHeader>
        <CardBody className="p-0">
          {recentQuizzes.length === 0 ? (
            <EmptyState icon={<Icon.ListChecks size={24} />} title="No quiz attempts" description="Take a quiz to see results here." />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {recentQuizzes.map((a) => (
                <li key={a.id} className="p-4 flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${a.passed ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
                    {a.passed ? <Icon.CheckCircle size={18} /> : <Icon.AlertCircle size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.quizTitle}</p>
                    <p className="text-xs text-[var(--muted-2)]">
                      {a.passed ? "Passed" : "Did not pass"} · {a.completedAt ? formatDate(a.completedAt) : "—"}
                    </p>
                  </div>
                  <Badge variant={a.passed ? "success" : "warning"}>{a.percentage}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
