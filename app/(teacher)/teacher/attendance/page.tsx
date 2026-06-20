"use client";

import * as React from "react";
import Icon from "@/components/icons";
import {
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  Label,
  Modal,
  Select,
  Skeleton,
  useToast,
} from "@/components/ui";
import { useTeacher } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import type { AttendanceStatus } from "@/lib/mockData";

type Mark = AttendanceStatus | null;
type Record_ = { studentId: string; date: string; status: AttendanceStatus };

const MARK_STYLES: Record<AttendanceStatus, string> = {
  present: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40",
  late: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40",
  absent: "bg-red-500/15 text-red-500 border-red-500/40",
  excused: "bg-sky-500/15 text-sky-500 border-sky-500/40",
};

const MARK_LABELS: Record<AttendanceStatus, string> = {
  present: "P",
  late: "L",
  absent: "A",
  excused: "E",
};

const NEXT_MARK: Record<string, Mark> = {
  null: "present",
  present: "late",
  late: "absent",
  absent: "excused",
  excused: null,
};

const AT_RISK_THRESHOLD = 75;

const todayISO = () => new Date().toISOString().slice(0, 10);

function exportCSV(
  courseName: string,
  students: { userId: string; userName: string; userEmail: string }[],
  records: Record_[],
  sessions: string[],
) {
  const header = ["Name", "Email", ...sessions.map(formatDate), "Rate (%)"];
  const rows = students.map((s) => {
    let p = 0, l = 0, a = 0, e = 0;
    const cells = sessions.map((d) => {
      const rec = records.find((r) => r.studentId === s.userId && r.date.slice(0, 10) === d);
      if (!rec) return "";
      if (rec.status === "present") p++;
      else if (rec.status === "late") l++;
      else if (rec.status === "absent") a++;
      else e++;
      return rec.status;
    });
    const total = p + l + a + e;
    const rate = total === 0 ? 0 : Math.round(((p + l * 0.5) / total) * 100);
    return [s.userName, s.userEmail, ...cells, `${rate}%`];
  });
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `attendance-${courseName.replace(/\s+/g, "-").toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function AttendanceSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-36 rounded" />
            <Skeleton className="h-2.5 w-48 rounded" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-2 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "primary";
}) {
  const tints = {
    default: "bg-[var(--surface-2)] text-[var(--muted)]",
    primary: "bg-[oklch(0.93_0.05_270)] text-[var(--primary)]",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    danger: "bg-red-500/10 text-red-500",
  };
  return (
    <Card>
      <CardBody className="flex items-center gap-3 !py-3">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${tints[tone]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-[var(--muted)] leading-tight">{label}</p>
          <p className="text-xl font-bold tracking-tight">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}

export default function TeacherAttendancePage() {
  const teacher = useTeacher();
  const toast = useToast();
  const courses = teacher.myCourses();
  const students = teacher.myStudents();

  const [activeCourseId, setActiveCourseId] = React.useState("");
  const [sessionDate, setSessionDate] = React.useState(todayISO());
  const [records, setRecords] = React.useState<Record_[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [marks, setMarks] = React.useState<Record<string, Mark>>({});
  const [saving, setSaving] = React.useState(false);

  const [studentSearch, setStudentSearch] = React.useState("");
  const [showAtRisk, setShowAtRisk] = React.useState(false);
  const [analyticsOpen, setAnalyticsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!activeCourseId && courses.length > 0) setActiveCourseId(courses[0].id);
  }, [courses, activeCourseId]);

  const studentsInCourse = React.useMemo(
    () => students.filter((s) => s.courseId === activeCourseId),
    [students, activeCourseId],
  );

  const loadRecords = React.useCallback(async () => {
    if (!activeCourseId) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/teacher/attendance?courseId=${activeCourseId}`);
      const data = r.ok ? await r.json() : { records: [] };
      setRecords(data.records ?? []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [activeCourseId]);

  React.useEffect(() => { loadRecords(); }, [loadRecords]);

  React.useEffect(() => {
    const next: Record<string, Mark> = {};
    for (const s of studentsInCourse) next[s.userId] = null;
    for (const rec of records) {
      if (rec.date.slice(0, 10) === sessionDate) next[rec.studentId] = rec.status;
    }
    setMarks(next);
  }, [records, sessionDate, studentsInCourse]);

  function cycle(studentId: string) {
    setMarks((prev) => {
      const cur = prev[studentId] ?? null;
      return { ...prev, [studentId]: NEXT_MARK[cur === null ? "null" : cur] };
    });
  }

  function markAll(value: Mark) {
    const next: Record<string, Mark> = {};
    for (const s of studentsInCourse) next[s.userId] = value;
    setMarks(next);
  }

  function summary(studentId: string) {
    let present = 0, late = 0, absent = 0, excused = 0;
    for (const rec of records) {
      if (rec.studentId !== studentId) continue;
      if (rec.status === "present") present++;
      else if (rec.status === "late") late++;
      else if (rec.status === "absent") absent++;
      else if (rec.status === "excused") excused++;
    }
    const total = present + late + absent + excused;
    const rate = total === 0 ? 0 : Math.round(((present + late * 0.5) / total) * 100);
    return { present, late, absent, excused, total, rate };
  }

  async function save() {
    if (!activeCourseId) return;
    setSaving(true);
    const payload = Object.entries(marks)
      .filter(([, v]) => v !== null)
      .map(([studentId, status]) => ({ studentId, status }));
    try {
      const r = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: activeCourseId, date: sessionDate, marks: payload }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        toast.push({ title: "Couldn't save attendance", description: e.error, tone: "danger" });
        return;
      }
      toast.push({
        title: "Attendance saved",
        description: `${payload.length} student(s) marked for ${formatDate(sessionDate)}.`,
        tone: "success",
      });
      await loadRecords();
    } finally {
      setSaving(false);
    }
  }

  const courseSessions = React.useMemo(
    () => [...new Set(records.map((r) => r.date.slice(0, 10)))].sort(),
    [records],
  );

  const activeCourse = courses.find((c) => c.id === activeCourseId);
  const markedCount = Object.values(marks).filter((v) => v !== null).length;

  const courseStats = React.useMemo(() => {
    if (!activeCourseId || records.length === 0) return null;
    let present = 0, late = 0, absent = 0, excused = 0;
    for (const r of records) {
      if (r.status === "present") present++;
      else if (r.status === "late") late++;
      else if (r.status === "absent") absent++;
      else if (r.status === "excused") excused++;
    }
    const total = present + late + absent + excused;
    const rate = total === 0 ? 0 : Math.round(((present + late * 0.5) / total) * 100);
    return { present, late, absent, excused, total, rate, sessions: courseSessions.length };
  }, [records, activeCourseId, courseSessions]);

  const sessionStats = React.useMemo(() => {
    const sessionRecords = records.filter((r) => r.date.slice(0, 10) === sessionDate);
    const present = sessionRecords.filter((r) => r.status === "present").length;
    const late = sessionRecords.filter((r) => r.status === "late").length;
    const absent = sessionRecords.filter((r) => r.status === "absent").length;
    const excused = sessionRecords.filter((r) => r.status === "excused").length;
    return { present, late, absent, excused, total: sessionRecords.length };
  }, [records, sessionDate]);

  const trendData = React.useMemo(() => {
    return courseSessions.slice(-8).map((d) => {
      const sessionRecs = records.filter((r) => r.date.slice(0, 10) === d);
      const absent = sessionRecs.filter((r) => r.status === "absent").length;
      const total = sessionRecs.length;
      return { date: d, absentRate: total === 0 ? 0 : Math.round((absent / total) * 100) };
    });
  }, [records, courseSessions]);

  const atRiskStudents = React.useMemo(() => {
    return studentsInCourse.filter((s) => {
      const sum = summary(s.userId);
      return sum.total > 0 && sum.rate < AT_RISK_THRESHOLD;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentsInCourse, records]);

  const visibleStudents = React.useMemo(() => {
    let list = studentsInCourse;
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      list = list.filter(
        (s) => s.userName.toLowerCase().includes(q) || s.userEmail.toLowerCase().includes(q),
      );
    }
    if (showAtRisk) {
      const atRiskIds = new Set(atRiskStudents.map((s) => s.userId));
      list = list.filter((s) => atRiskIds.has(s.userId));
    }
    return list;
  }, [studentsInCourse, studentSearch, showAtRisk, atRiskStudents]);

  const trendMax = Math.max(...trendData.map((d) => d.absentRate), 1);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
            Teaching
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="mt-1 text-[var(--muted)]">
            Track who showed up. Click a cell to cycle status, then save the session.
          </p>
        </div>
        {courseStats && (
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => setAnalyticsOpen(true)}>
              <Icon.BarChart3 size={15} /> Analytics
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                exportCSV(
                  activeCourse?.title ?? "course",
                  studentsInCourse,
                  records,
                  courseSessions,
                )
              }
            >
              <Icon.Download size={15} /> Export CSV
            </Button>
          </div>
        )}
      </div>

      {/* Stats bar */}
      {courseStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard
            label="Sessions recorded"
            value={courseStats.sessions}
            icon={<Icon.Calendar size={16} />}
            tone="primary"
          />
          <SummaryCard
            label="Overall rate"
            value={`${courseStats.rate}%`}
            icon={<Icon.TrendingUp size={16} />}
            tone={courseStats.rate >= 75 ? "success" : courseStats.rate >= 50 ? "warning" : "danger"}
          />
          <SummaryCard
            label="Present marks"
            value={courseStats.present}
            icon={<Icon.CheckCircle size={16} />}
            tone="success"
          />
          <SummaryCard
            label="At-risk students"
            value={atRiskStudents.length}
            icon={<Icon.AlertCircle size={16} />}
            tone={atRiskStudents.length > 0 ? "danger" : "default"}
          />
        </div>
      )}

      {/* Main session card */}
      <Card>
        <CardBody className="space-y-4">
          {/* Controls row */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end sm:flex-wrap">
            <div>
              <Label htmlFor="at-course">Course</Label>
              <Select
                id="at-course"
                value={activeCourseId}
                onChange={(e) => setActiveCourseId(e.target.value)}
                className="!w-64"
              >
                {courses.length === 0 && <option value="">No courses</option>}
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="at-date">Session date</Label>
              <Input
                id="at-date"
                type="date"
                value={sessionDate}
                max={todayISO()}
                onChange={(e) => setSessionDate(e.target.value)}
                className="!w-48"
              />
            </div>
            <div className="flex gap-2 ml-auto flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => markAll("present")}
                disabled={studentsInCourse.length === 0}
              >
                All present
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => markAll("absent")}
                disabled={studentsInCourse.length === 0}
              >
                All absent
              </Button>
              <Button size="sm" variant="ghost" onClick={() => markAll(null)}>
                Clear
              </Button>
            </div>
          </div>

          {!activeCourseId ? (
            <EmptyState
              icon={<Icon.Book size={20} />}
              title="No courses"
              description="An admin needs to assign you a course first."
            />
          ) : loading ? (
            <AttendanceSkeleton />
          ) : studentsInCourse.length === 0 ? (
            <EmptyState
              icon={<Icon.Users size={20} />}
              title="No students enrolled"
              description={`No one in ${activeCourse?.title ?? "this course"} yet.`}
            />
          ) : (
            <>
              {/* Session summary chips */}
              {sessionStats.total > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(["present", "late", "absent", "excused"] as const).map((s) => (
                    <span
                      key={s}
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium ${MARK_STYLES[s]}`}
                    >
                      {sessionStats[s]} {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Search + filter bar */}
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <div className="relative flex-1 max-w-xs">
                  <Icon.Search
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
                  />
                  <Input
                    placeholder="Search students…"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="!pl-8 !h-8 !text-sm"
                  />
                </div>
                {atRiskStudents.length > 0 && (
                  <button
                    onClick={() => setShowAtRisk((v) => !v)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
                      showAtRisk
                        ? "bg-red-500/15 text-red-500 border-red-500/40"
                        : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    <Icon.AlertCircle size={13} />
                    At-risk only ({atRiskStudents.length})
                  </button>
                )}
                <div className="flex items-center gap-1 ml-auto text-xs text-[var(--muted)]">
                  <span className="font-medium text-[var(--foreground)]">{visibleStudents.length}</span>
                  {" "}of {studentsInCourse.length} students
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                <span>Click to cycle:</span>
                {(["present", "late", "absent", "excused"] as const).map((m) => (
                  <span key={m} className={`px-2 py-0.5 rounded-full border ${MARK_STYLES[m]} capitalize`}>
                    {m}
                  </span>
                ))}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--muted)] border-b border-border">
                      <th className="font-medium py-2.5 px-3">Student</th>
                      <th className="font-medium py-2.5 px-3 text-center whitespace-nowrap">
                        {formatDate(sessionDate)}
                      </th>
                      <th className="font-medium py-2.5 px-3 hidden md:table-cell whitespace-nowrap">P · L · A · E</th>
                      <th className="font-medium py-2.5 px-3 w-36 whitespace-nowrap">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleStudents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-sm text-[var(--muted)]">
                          No students match your filter.
                        </td>
                      </tr>
                    ) : (
                      visibleStudents.map((s) => {
                        const today = marks[s.userId] ?? null;
                        const sum = summary(s.userId);
                        const isAtRisk = sum.total > 0 && sum.rate < AT_RISK_THRESHOLD;
                        return (
                          <tr
                            key={s.userId}
                            className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]/50 transition-colors"
                          >
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`h-8 w-8 rounded-full text-white text-xs font-semibold flex items-center justify-center shrink-0 ${
                                    isAtRisk
                                      ? "bg-red-500"
                                      : "bg-gradient-to-br from-[var(--primary)] to-[var(--accent)]"
                                  }`}
                                >
                                  {s.userName.slice(0, 1).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-medium truncate">{s.userName}</p>
                                    {isAtRisk && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 font-semibold shrink-0">
                                        at-risk
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-[var(--muted)] truncate">
                                    {s.userEmail}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => cycle(s.userId)}
                                className={`px-3 h-8 rounded-lg text-xs font-semibold border transition capitalize ${
                                  today
                                    ? MARK_STYLES[today]
                                    : "border-[var(--border)] text-[var(--muted)] bg-[var(--surface-2)] hover:bg-[var(--surface-2)]/70"
                                }`}
                              >
                                {today ?? "—"}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 hidden md:table-cell">
                              <div className="flex gap-1.5">
                                {(["present", "late", "absent", "excused"] as const).map((st) => (
                                  <span
                                    key={st}
                                    className={`text-[11px] w-6 h-6 rounded flex items-center justify-center font-bold ${
                                      sum[st] > 0
                                        ? MARK_STYLES[st]
                                        : "text-[var(--muted)] bg-[var(--surface-2)]"
                                    }`}
                                    title={`${sum[st]} ${st}`}
                                  >
                                    {sum[st] > 0 ? sum[st] : MARK_LABELS[st]}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 w-36">
                              {sum.total === 0 ? (
                                <span className="text-xs text-[var(--muted)]">No data</span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        sum.rate >= 75
                                          ? "bg-emerald-500"
                                          : sum.rate >= 50
                                          ? "bg-amber-500"
                                          : "bg-red-500"
                                      }`}
                                      style={{ width: `${sum.rate}%` }}
                                    />
                                  </div>
                                  <span
                                    className={`text-xs w-9 text-right font-semibold ${
                                      sum.rate >= 75
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : sum.rate >= 50
                                        ? "text-amber-600 dark:text-amber-400"
                                        : "text-red-500"
                                    }`}
                                  >
                                    {sum.rate}%
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Session history */}
              {courseSessions.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--muted)] font-semibold mt-1 mb-2">
                    Recorded sessions
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {courseSessions
                      .slice(-16)
                      .reverse()
                      .map((d) => {
                        const absentCount = records.filter(
                          (r) => r.date.slice(0, 10) === d && r.status === "absent",
                        ).length;
                        return (
                          <button
                            key={d}
                            onClick={() => setSessionDate(d)}
                            className={`text-xs px-2.5 py-1 rounded-full border transition flex items-center gap-1 ${
                              d === sessionDate
                                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                                : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)]"
                            }`}
                          >
                            {formatDate(d)}
                            {absentCount > 0 && (
                              <span
                                className={`font-bold ${
                                  d === sessionDate ? "text-white/80" : "text-red-500"
                                }`}
                              >
                                ·{absentCount}A
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Save footer */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-border">
                <p className="text-xs text-muted">
                  {markedCount} of {studentsInCourse.length} students marked for{" "}
                  <span className="font-medium text-foreground">
                    {formatDate(sessionDate)}
                  </span>
                  .
                </p>
                <Button className="self-end sm:self-auto shrink-0" onClick={save} loading={saving} disabled={markedCount === 0}>
                  <Icon.Save size={16} /> Save attendance
                </Button>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Analytics modal */}
      <Modal
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        title="Attendance Analytics"
        size="lg"
      >
        <div className="p-5 max-h-[80vh] overflow-y-auto space-y-6">
          {/* Course overview */}
          {courseStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Sessions", value: courseStats.sessions },
                { label: "Overall rate", value: `${courseStats.rate}%` },
                { label: "Late marks", value: courseStats.late },
                { label: "Excused marks", value: courseStats.excused },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-[var(--border)] p-3 text-center"
                >
                  <p className="text-[11px] text-[var(--muted)]">{s.label}</p>
                  <p className="text-2xl font-bold mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Absent rate trend */}
          {trendData.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--muted)] font-semibold mb-3">
                Absent rate — last {trendData.length} sessions
              </p>
              <div className="flex items-end gap-2 h-28">
                {trendData.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <span className="text-[10px] text-[var(--muted)] font-medium">
                      {d.absentRate}%
                    </span>
                    <div className="w-full flex items-end" style={{ height: 72 }}>
                      <div
                        className={`w-full rounded-t-md transition-all ${
                          d.absentRate >= 30
                            ? "bg-red-500"
                            : d.absentRate >= 15
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{
                          height: `${Math.max(4, (d.absentRate / trendMax) * 72)}px`,
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-[var(--muted)] truncate w-full text-center">
                      {formatDate(d.date).replace(/,.*/, "")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* At-risk students */}
          {atRiskStudents.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--muted)] font-semibold mb-3">
                At-risk students (below {AT_RISK_THRESHOLD}%)
              </p>
              <div className="space-y-2">
                {atRiskStudents.map((s) => {
                  const sum = summary(s.userId);
                  return (
                    <div
                      key={s.userId}
                      className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20"
                    >
                      <div className="h-8 w-8 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {s.userName.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{s.userName}</p>
                        <p className="text-xs text-[var(--muted)] truncate">{s.userEmail}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-red-500">{sum.rate}%</p>
                        <p className="text-[10px] text-[var(--muted)]">
                          {sum.absent}A · {sum.total} total
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Per-student summary table */}
          {studentsInCourse.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--muted)] font-semibold mb-3">
                Student summary
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                      <th className="font-medium py-2 px-3">Student</th>
                      <th className="font-medium py-2 px-3 text-center">P</th>
                      <th className="font-medium py-2 px-3 text-center">L</th>
                      <th className="font-medium py-2 px-3 text-center">A</th>
                      <th className="font-medium py-2 px-3 text-center">E</th>
                      <th className="font-medium py-2 px-3">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsInCourse
                      .map((s) => ({ s, sum: summary(s.userId) }))
                      .sort((a, b) => a.sum.rate - b.sum.rate)
                      .map(({ s, sum }) => (
                        <tr key={s.userId} className="border-b border-[var(--border)] last:border-0">
                          <td className="py-2 px-3">
                            <p className="font-medium truncate max-w-[160px]">{s.userName}</p>
                          </td>
                          <td className="py-2 px-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">
                            {sum.present}
                          </td>
                          <td className="py-2 px-3 text-center text-amber-600 dark:text-amber-400 font-semibold">
                            {sum.late}
                          </td>
                          <td className="py-2 px-3 text-center text-red-500 font-semibold">
                            {sum.absent}
                          </td>
                          <td className="py-2 px-3 text-center text-sky-500 font-semibold">
                            {sum.excused}
                          </td>
                          <td className="py-2 px-3 w-28">
                            {sum.total === 0 ? (
                              <span className="text-xs text-[var(--muted)]">—</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      sum.rate >= 75
                                        ? "bg-emerald-500"
                                        : sum.rate >= 50
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                    }`}
                                    style={{ width: `${sum.rate}%` }}
                                  />
                                </div>
                                <span className="text-xs w-8 text-right font-semibold">
                                  {sum.rate}%
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
