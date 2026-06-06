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
  useToast,
} from "@/components/ui";
import { useTeacher } from "@/lib/store";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Column = { id: string; courseId: string; label: string; weight: number; order: number };
type Entry  = { columnId: string; studentId: string; score: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function letterGrade(total: number): string {
  if (total >= 90) return "A";
  if (total >= 80) return "B";
  if (total >= 70) return "C";
  if (total >= 60) return "D";
  return "F";
}

const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  B: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  C: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  D: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  F: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
};

function cellColor(score: number | null): string {
  if (score === null) return "";
  if (score >= 85) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
  if (score >= 70) return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
  return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30";
}

function totalBarColor(total: number): string {
  if (total >= 80) return "bg-emerald-500";
  if (total >= 60) return "bg-amber-400";
  return "bg-red-500";
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeacherGradesPage() {
  const teacher = useTeacher();
  const toast   = useToast();
  const courses  = teacher.myCourses();
  const students = teacher.myStudents();

  const [columns,       setColumns]       = React.useState<Column[]>([]);
  const [entries,       setEntries]        = React.useState<Entry[]>([]);
  const [loading,       setLoading]        = React.useState(true);
  const [activeCourseId, setActiveCourseId] = React.useState("");
  const [columnEditor,  setColumnEditor]   = React.useState(false);
  const [studentSearch, setStudentSearch]  = React.useState("");
  const [showAtRisk,    setShowAtRisk]     = React.useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = React.useCallback(async () => {
    try {
      const r    = await fetch("/api/teacher/grades");
      const data = r.ok ? await r.json() : { columns: [], entries: [] };
      setColumns(data.columns ?? []);
      setEntries(data.entries  ?? []);
    } catch {
      toast.push({ title: "Couldn't load gradebook", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => {
    if (!activeCourseId && courses.length > 0) setActiveCourseId(courses[0].id);
  }, [courses, activeCourseId]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const activeCols   = React.useMemo(() => columns.filter((c) => c.courseId === activeCourseId), [columns, activeCourseId]);
  const activeCourse = courses.find((c) => c.id === activeCourseId);

  const studentsInCourse = React.useMemo(() => {
    const base = students.filter((s) => s.courseId === activeCourseId);
    const q    = studentSearch.trim().toLowerCase();
    const filtered = q ? base.filter((s) => s.userName.toLowerCase().includes(q)) : base;
    return showAtRisk ? filtered : filtered; // filtering applied below in render
  }, [students, activeCourseId, studentSearch, showAtRisk]);

  const scoreOf = React.useCallback(
    (columnId: string, studentId: string) =>
      entries.find((e) => e.columnId === columnId && e.studentId === studentId)?.score ?? null,
    [entries],
  );

  function weightedTotal(studentId: string): number {
    if (activeCols.length === 0) return 0;
    const totalWeight = activeCols.reduce((s, c) => s + (c.weight || 0), 0) || 1;
    let acc = 0;
    for (const col of activeCols) {
      const v = scoreOf(col.id, studentId);
      if (typeof v === "number") acc += (v * (col.weight || 0)) / totalWeight;
    }
    return Math.round(acc);
  }

  function missingCount(studentId: string): number {
    return activeCols.filter((c) => scoreOf(c.id, studentId) === null).length;
  }

  // ── Aggregate stats ───────────────────────────────────────────────────────
  const stats = React.useMemo(() => {
    const base = students.filter((s) => s.courseId === activeCourseId);
    if (base.length === 0 || activeCols.length === 0) {
      return { classAvg: 0, passRate: 0, atRiskCount: 0 };
    }
    const totals    = base.map((s) => weightedTotal(s.userId));
    const classAvg  = Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
    const passRate  = Math.round((totals.filter((t) => t >= 60).length / totals.length) * 100);
    const atRiskCount = totals.filter((t) => t < 60).length;
    return { classAvg, passRate, atRiskCount };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, activeCourseId, activeCols, entries]);

  // ── Grade distribution ────────────────────────────────────────────────────
  const gradeDist = React.useMemo(() => {
    const base = students.filter((s) => s.courseId === activeCourseId);
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    base.forEach((s) => {
      const g = letterGrade(weightedTotal(s.userId));
      counts[g]++;
    });
    const max = Math.max(...Object.values(counts), 1);
    return { counts, max };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, activeCourseId, activeCols, entries]);

  // ── Filtered student list for table ──────────────────────────────────────
  const visibleStudents = React.useMemo(() => {
    let list = studentsInCourse;
    if (showAtRisk) list = list.filter((s) => weightedTotal(s.userId) < 60);
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentsInCourse, showAtRisk, activeCols, entries]);

  // ── Save score ────────────────────────────────────────────────────────────
  async function saveScore(columnId: string, studentId: string, score: number | null) {
    await fetch("/api/teacher/grades", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columnId, studentId, score }),
    });
    load();
  }

  // ── Export CSV ────────────────────────────────────────────────────────────
  function exportCsv() {
    const all = students.filter((s) => s.courseId === activeCourseId);
    if (activeCols.length === 0 || all.length === 0) {
      toast.push({ title: "Nothing to export", tone: "warning" });
      return;
    }
    const esc   = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = ["Student", "Email", ...activeCols.map((c) => c.label), "Total (%)", "Grade"].join(",");
    const rows   = all.map((s) => {
      const total = weightedTotal(s.userId);
      return [
        esc(s.userName),
        esc(s.userEmail),
        ...activeCols.map((c) => scoreOf(c.id, s.userId) ?? ""),
        total,
        letterGrade(total),
      ].join(",");
    });
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `gradebook-${activeCourse?.title?.replace(/\s+/g, "_") ?? activeCourseId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.push({ title: "CSV exported", tone: "success" });
  }

  // ── Render helpers ────────────────────────────────────────────────────────
  const allStudentsInCourse = students.filter((s) => s.courseId === activeCourseId);
  const hasData             = !loading && activeCourseId && allStudentsInCourse.length > 0 && activeCols.length > 0;

  return (
    <div className="space-y-6 fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Teaching</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Gradebook</h1>
          <p className="mt-1 text-[var(--muted)]">Track student performance with weighted columns and grade analytics.</p>
        </div>
      </div>

      {/* ── Stats bar ── */}
      {hasData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard icon={<Icon.Users size={16} />}     label="Students"    value={String(allStudentsInCourse.length)} tone="default" />
          <SummaryCard icon={<Icon.ListChecks size={16} />} label="Columns"    value={String(activeCols.length)}          tone="primary" />
          <SummaryCard icon={<Icon.TrendingUp size={16} />} label="Class Avg"  value={`${stats.classAvg}%`}
            tone={stats.classAvg >= 80 ? "success" : stats.classAvg >= 60 ? "warning" : "danger"} />
          <SummaryCard icon={<Icon.Award size={16} />}      label="Pass Rate"  value={`${stats.passRate}%`}
            tone={stats.passRate >= 70 ? "success" : stats.passRate >= 50 ? "warning" : "danger"} />
        </div>
      )}

      {/* ── Main gradebook card ── */}
      <Card>
        <CardBody className="space-y-4">

          {/* Controls row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Label htmlFor="course-pick" className="mb-0 shrink-0">Course:</Label>
              <Select
                id="course-pick"
                value={activeCourseId}
                onChange={(e) => { setActiveCourseId(e.target.value); setStudentSearch(""); setShowAtRisk(false); }}
                className="!h-9 !w-56"
              >
                {courses.length === 0 && <option value="">No courses</option>}
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => setColumnEditor(true)} disabled={!activeCourseId}>
                <Icon.Edit size={14} /> Manage columns
              </Button>
              <Button variant="outline" onClick={exportCsv} disabled={!activeCourseId}>
                <Icon.Download size={14} /> Export CSV
              </Button>
            </div>
          </div>

          {/* Search + filter row (only when data present) */}
          {hasData && (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  icon={<Icon.Search size={15} />}
                  placeholder="Search students…"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowAtRisk((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-2 px-3 h-9 rounded-lg border text-sm font-medium transition",
                  showAtRisk
                    ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                    : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]",
                )}
              >
                <Icon.AlertCircle size={14} />
                At risk ({stats.atRiskCount})
              </button>
            </div>
          )}

          {/* Body */}
          {loading ? (
            <GradebookSkeleton />
          ) : !activeCourseId ? (
            <EmptyState icon={<Icon.Book size={20} />} title="No courses yet"
              description="An admin needs to assign you a course before you can grade." />
          ) : allStudentsInCourse.length === 0 ? (
            <EmptyState icon={<Icon.Users size={20} />} title="No students enrolled"
              description={`No one has enrolled in ${activeCourse?.title ?? "this course"} yet.`} />
          ) : activeCols.length === 0 ? (
            <EmptyState icon={<Icon.ListChecks size={20} />} title="Add a grade column first"
              description="Columns are weighted (e.g., Midterm 30%, Final 50%, HW 20%)."
              action={<Button onClick={() => setColumnEditor(true)}><Icon.Plus size={14} /> Add column</Button>} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface-2)]">
                  <tr className="text-left text-[var(--muted)] text-xs uppercase tracking-wider">
                    <th className="font-semibold py-3 px-3 sticky left-0 bg-[var(--surface-2)] min-w-[180px]">Student</th>
                    {activeCols.map((c) => (
                      <th key={c.id} className="font-semibold py-3 px-3 min-w-[110px]">
                        <p className="truncate max-w-[130px] normal-case text-sm text-[var(--foreground)]">{c.label}</p>
                        <p className="text-[10px] text-[var(--muted-2)] mt-0.5 font-normal normal-case">{c.weight}% weight</p>
                      </th>
                    ))}
                    <th className="font-semibold py-3 px-3 min-w-[130px]">Total</th>
                    <th className="font-semibold py-3 px-3 min-w-[70px]">Grade</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border)]">
                  {visibleStudents.length === 0 ? (
                    <tr>
                      <td colSpan={activeCols.length + 3} className="py-10 text-center text-sm text-[var(--muted)]">
                        No students match the current filter.
                      </td>
                    </tr>
                  ) : (
                    visibleStudents.map((s) => {
                      const total   = weightedTotal(s.userId);
                      const grade   = letterGrade(total);
                      const missing = missingCount(s.userId);
                      const atRisk  = total < 60;

                      return (
                        <tr key={s.userId}
                          className={cn(
                            "hover:bg-[var(--surface-2)]/50 transition-colors",
                            atRisk && "bg-red-500/[0.03]",
                          )}
                        >
                          {/* Student cell */}
                          <td className="py-2.5 px-3 sticky left-0 bg-inherit">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={cn(
                                "h-8 w-8 rounded-full text-white font-bold flex items-center justify-center text-xs shrink-0",
                                atRisk
                                  ? "bg-red-500"
                                  : "bg-gradient-to-br from-[var(--primary)] to-[var(--accent)]",
                              )}>
                                {s.userName.slice(0, 1).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate max-w-[160px]">{s.userName}</p>
                                {missing > 0 && (
                                  <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 mt-0.5">
                                    <Icon.AlertCircle size={10} /> {missing} missing
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Score cells */}
                          {activeCols.map((c) => (
                            <td key={c.id} className="py-2.5 px-3">
                              <GradeCell
                                initial={scoreOf(c.id, s.userId)}
                                onSave={(score) => saveScore(c.id, s.userId, score)}
                              />
                            </td>
                          ))}

                          {/* Total with progress bar */}
                          <td className="py-2.5 px-3">
                            <div className="space-y-1 w-24">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm">{total}%</span>
                                {atRisk && (
                                  <span className="text-[10px] text-red-500 font-medium">Risk</span>
                                )}
                              </div>
                              <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full transition-all", totalBarColor(total))}
                                  style={{ width: `${total}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Letter grade badge */}
                          <td className="py-2.5 px-3">
                            <span className={cn(
                              "inline-block px-2 py-0.5 rounded-md text-xs font-bold border",
                              GRADE_COLORS[grade],
                            )}>
                              {grade}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Class average footer row */}
                  {visibleStudents.length > 0 && (() => {
                    const classAvg = Math.round(
                      allStudentsInCourse.reduce((sum, s) => sum + weightedTotal(s.userId), 0) /
                      allStudentsInCourse.length,
                    );
                    return (
                      <tr className="bg-[var(--surface-2)]/80 border-t-2 border-[var(--border-strong)]">
                        <td className="py-3 px-3 sticky left-0 bg-[var(--surface-2)]/80">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                            Class avg
                          </span>
                        </td>
                        {activeCols.map((c) => {
                          const scores  = allStudentsInCourse
                            .map((s) => scoreOf(c.id, s.userId))
                            .filter((v): v is number => v !== null);
                          const colAvg  = scores.length
                            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                            : null;
                          return (
                            <td key={c.id} className="py-3 px-3">
                              {colAvg !== null ? (
                                <span className={cn(
                                  "inline-block px-2 py-0.5 rounded text-xs font-semibold border",
                                  cellColor(colAvg),
                                )}>
                                  {colAvg}
                                </span>
                              ) : (
                                <span className="text-xs text-[var(--muted-2)]">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-3 px-3">
                          <span className={cn(
                            "text-sm font-bold",
                            classAvg >= 80 ? "text-emerald-600 dark:text-emerald-400"
                              : classAvg >= 60 ? "text-amber-600 dark:text-amber-400"
                              : "text-red-500",
                          )}>
                            {classAvg}%
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={cn(
                            "inline-block px-2 py-0.5 rounded-md text-xs font-bold border",
                            GRADE_COLORS[letterGrade(classAvg)],
                          )}>
                            {letterGrade(classAvg)}
                          </span>
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Grade distribution + Grade scale ── */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Grade distribution */}
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon.BarChart3 size={16} className="text-[var(--primary)]" />
                <p className="font-semibold">Grade distribution</p>
              </div>
              <div className="space-y-2">
                {(["A", "B", "C", "D", "F"] as const).map((g) => {
                  const count   = gradeDist.counts[g];
                  const pct     = Math.round((count / Math.max(allStudentsInCourse.length, 1)) * 100);
                  const barPct  = Math.round((count / gradeDist.max) * 100);
                  return (
                    <div key={g} className="flex items-center gap-3">
                      <span className={cn(
                        "w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center border shrink-0",
                        GRADE_COLORS[g],
                      )}>
                        {g}
                      </span>
                      <div className="flex-1 h-6 bg-[var(--surface-2)] rounded-md overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-md transition-all flex items-center px-2",
                            g === "A" ? "bg-emerald-500"
                            : g === "B" ? "bg-blue-500"
                            : g === "C" ? "bg-amber-400"
                            : g === "D" ? "bg-orange-400"
                            : "bg-red-500",
                          )}
                          style={{ width: `${barPct}%`, minWidth: count > 0 ? "2rem" : "0" }}
                        >
                          {count > 0 && (
                            <span className="text-white text-[11px] font-semibold">{count}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-[var(--muted)] w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Grade scale + at-risk list */}
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon.Award size={16} className="text-[var(--primary)]" />
                <p className="font-semibold">Grade scale</p>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {([
                  { g: "A", range: "90–100" },
                  { g: "B", range: "80–89" },
                  { g: "C", range: "70–79" },
                  { g: "D", range: "60–69" },
                  { g: "F", range: "0–59" },
                ] as const).map(({ g, range }) => (
                  <div key={g} className={cn("rounded-lg border p-2 text-center", GRADE_COLORS[g])}>
                    <p className="text-base font-bold">{g}</p>
                    <p className="text-[10px] opacity-80 mt-0.5">{range}</p>
                  </div>
                ))}
              </div>

              {/* At-risk students quick list */}
              {stats.atRiskCount > 0 && (
                <div className="mt-1 pt-3 border-t border-[var(--border)]">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 mb-2">
                    <Icon.AlertCircle size={12} /> At-risk students ({stats.atRiskCount})
                  </p>
                  <ul className="space-y-1.5">
                    {allStudentsInCourse
                      .filter((s) => weightedTotal(s.userId) < 60)
                      .map((s) => {
                        const total = weightedTotal(s.userId);
                        return (
                          <li key={s.userId} className="flex items-center justify-between text-sm">
                            <span className="truncate max-w-[200px] text-[var(--foreground)]">{s.userName}</span>
                            <span className={cn(
                              "ml-2 px-2 py-0.5 rounded text-xs font-bold border shrink-0",
                              GRADE_COLORS["F"],
                            )}>
                              {total}%
                            </span>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}
            </CardBody>
          </Card>

        </div>
      )}

      {/* ── Column editor modal ── */}
      <ColumnEditor
        open={columnEditor}
        onClose={() => setColumnEditor(false)}
        courseId={activeCourseId}
        courseTitle={activeCourse?.title ?? ""}
        columns={activeCols}
        onChanged={load}
      />
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

type SummaryTone = "primary" | "default" | "success" | "warning" | "danger";
const SUMMARY_STYLES: Record<SummaryTone, { bg: string; icon: string; value: string }> = {
  primary: { bg: "bg-[var(--primary-soft)]",  icon: "text-[var(--primary)]",              value: "text-[var(--primary)]" },
  default: { bg: "bg-[var(--surface-2)]",      icon: "text-[var(--muted)]",                value: "text-[var(--foreground)]" },
  success: { bg: "bg-emerald-500/10",          icon: "text-emerald-600 dark:text-emerald-400", value: "text-emerald-700 dark:text-emerald-300" },
  warning: { bg: "bg-amber-500/10",            icon: "text-amber-600 dark:text-amber-400",  value: "text-amber-700 dark:text-amber-300" },
  danger:  { bg: "bg-red-500/10",              icon: "text-red-600 dark:text-red-400",      value: "text-red-700 dark:text-red-300" },
};

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: SummaryTone }) {
  const s = SUMMARY_STYLES[tone];
  return (
    <div className={cn("rounded-xl p-3.5 flex items-center gap-3", s.bg)}>
      <span className={cn("shrink-0", s.icon)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold">{label}</p>
        <p className={cn("text-xl font-bold leading-tight", s.value)}>{value}</p>
      </div>
    </div>
  );
}

// ─── Gradebook Skeleton ───────────────────────────────────────────────────────

function GradebookSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-10 rounded-lg bg-[var(--surface-2)]" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-12 rounded-lg bg-[var(--surface-2)]" />
      ))}
    </div>
  );
}

// ─── Grade Cell ───────────────────────────────────────────────────────────────

function GradeCell({ initial, onSave }: { initial: number | null; onSave: (score: number | null) => void }) {
  const [val, setVal] = React.useState(initial === null ? "" : String(initial));
  React.useEffect(() => { setVal(initial === null ? "" : String(initial)); }, [initial]);

  return (
    <input
      type="number"
      min={0}
      max={100}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        const next = val === "" ? null : Math.max(0, Math.min(100, Number(val)));
        if (next !== initial) onSave(next);
      }}
      className={cn(
        "w-16 h-8 rounded-lg border px-2 text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-colors",
        cellColor(initial) || "bg-[var(--surface-2)] border-[var(--border)] text-[var(--muted)]",
      )}
      placeholder="—"
    />
  );
}

// ─── Column Editor ────────────────────────────────────────────────────────────

const TEMPLATES = [
  { label: "Midterm",     weight: 30 },
  { label: "Final Exam",  weight: 40 },
  { label: "Assignments", weight: 20 },
  { label: "Quiz",        weight: 10 },
  { label: "Project",     weight: 25 },
  { label: "Attendance",  weight: 5  },
];

function ColumnEditor({
  open, onClose, courseId, courseTitle, columns, onChanged,
}: {
  open: boolean; onClose: () => void; courseId: string; courseTitle: string;
  columns: Column[]; onChanged: () => void;
}) {
  const toast        = useToast();
  const [adding, setAdding] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const totalWeight = columns.reduce((s, c) => s + (c.weight || 0), 0);
  const weightOk    = totalWeight === 100;

  async function addColumn(label: string, weight: number) {
    setAdding(true);
    await fetch("/api/teacher/grades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, label, weight }),
    });
    setAdding(false);
    onChanged();
  }

  async function updateColumn(id: string, patch: { label?: string; weight?: number }) {
    await fetch(`/api/teacher/grades/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    onChanged();
  }

  async function removeColumn(id: string) {
    await fetch(`/api/teacher/grades/${id}`, { method: "DELETE" });
    setDeleteId(null);
    onChanged();
  }

  async function autoDistribute() {
    if (columns.length === 0) return;
    const base  = Math.floor(100 / columns.length);
    const extra = 100 - base * columns.length;
    await Promise.all(
      columns.map((c, i) =>
        fetch(`/api/teacher/grades/${c.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weight: base + (i === 0 ? extra : 0) }),
        }),
      ),
    );
    onChanged();
    toast.push({ title: "Weights distributed evenly", tone: "success" });
  }

  return (
    <Modal open={open} onClose={onClose} title="Manage grade columns" size="lg">
      <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin">

        <p className="text-sm text-[var(--muted)]">
          For <span className="font-semibold text-[var(--foreground)]">{courseTitle}</span>.
          All column weights should total <span className="font-semibold">100%</span>.
        </p>

        {/* Weight progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--muted)]">Total weight</span>
            <span className={cn("font-bold", weightOk ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
              {totalWeight}%
              {weightOk ? " ✓" : totalWeight > 100 ? " — exceeds 100%" : " — incomplete"}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", weightOk ? "bg-emerald-500" : totalWeight > 100 ? "bg-red-500" : "bg-amber-400")}
              style={{ width: `${Math.min(totalWeight, 100)}%` }}
            />
          </div>
        </div>

        {/* Column list */}
        {columns.length === 0 ? (
          <p className="text-sm text-[var(--muted-2)] py-4 text-center">No columns yet. Add one below.</p>
        ) : (
          <div className="space-y-2">
            {columns.map((c) => (
              <ColumnRow
                key={c.id}
                column={c}
                onUpdate={(patch) => updateColumn(c.id, patch)}
                onRemove={() => setDeleteId(c.id)}
              />
            ))}
          </div>
        )}

        {/* Add controls */}
        <div className="border-t border-[var(--border)] pt-3 space-y-3">

          {/* Quick templates */}
          <div>
            <p className="text-xs font-semibold text-[var(--muted)] mb-2 uppercase tracking-wider">Quick add</p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => addColumn(t.label, t.weight)}
                  disabled={adding}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3,var(--surface-2))] border border-[var(--border)] text-[var(--foreground)] transition font-medium"
                >
                  <Icon.Plus size={11} /> {t.label} ({t.weight}%)
                </button>
              ))}
            </div>
          </div>

          {/* Custom add */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => addColumn(`Item ${columns.length + 1}`, 10)} loading={adding}>
              <Icon.Plus size={14} /> Custom column
            </Button>
            {columns.length > 1 && (
              <Button variant="outline" onClick={autoDistribute}>
                <Icon.Filter size={14} /> Auto-distribute
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-1 border-t border-[var(--border)]">
          <Button onClick={() => { toast.push({ title: "Columns saved", tone: "success" }); onClose(); }}>
            <Icon.CheckCircle size={14} /> Done
          </Button>
        </div>
      </div>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete column?" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            This will permanently delete the column and all student scores in it.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteId && removeColumn(deleteId)}>
              <Icon.Trash size={14} /> Delete
            </Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}

// ─── Column Row ───────────────────────────────────────────────────────────────

function ColumnRow({
  column, onUpdate, onRemove,
}: {
  column: Column;
  onUpdate: (patch: { label?: string; weight?: number }) => void;
  onRemove: () => void;
}) {
  const [label,  setLabel]  = React.useState(column.label);
  const [weight, setWeight] = React.useState(String(column.weight));

  React.useEffect(() => { setLabel(column.label); setWeight(String(column.weight)); }, [column.label, column.weight]);

  return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex-1">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => label.trim() !== column.label && onUpdate({ label: label.trim() || column.label })}
          placeholder="Column name"
          className="!h-8"
        />
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Input
          type="number"
          min={0}
          max={100}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={() => Number(weight) !== column.weight && onUpdate({ weight: Number(weight) })}
          className="!h-8 !w-16 text-center"
        />
        <span className="text-xs text-[var(--muted)] font-medium">%</span>
      </div>
      <button
        onClick={onRemove}
        className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--danger)] hover:bg-red-500/10 transition shrink-0"
        title="Delete column"
      >
        <Icon.Trash size={14} />
      </button>
    </div>
  );
}
