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
  Select,
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

const NEXT_MARK: Record<string, Mark> = {
  null: "present",
  present: "late",
  late: "absent",
  absent: "excused",
  excused: null,
};

const todayISO = () => new Date().toISOString().slice(0, 10);

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

  React.useEffect(() => {
    if (!activeCourseId && courses.length > 0) setActiveCourseId(courses[0].id);
  }, [courses, activeCourseId]);

  const studentsInCourse = React.useMemo(
    () => students.filter((s) => s.courseId === activeCourseId),
    [students, activeCourseId],
  );

  // Load every attendance row for the active course.
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

  React.useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Rebuild the editable session whenever the date or the records change.
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

  // Per-student summary across every recorded session of this course.
  function summary(studentId: string) {
    let present = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;
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

  // Course-wide attendance stats
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

  return (
    <div className="space-y-6 fade-in">
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
          Teaching
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="mt-1 text-[var(--muted)]">
          Track who showed up. Click a cell to cycle status, then save the session.
        </p>
      </div>

      {/* Course-wide stats */}
      {courseStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Sessions recorded", value: courseStats.sessions, icon: <Icon.Calendar size={16} />, tint: "bg-[var(--primary-soft)] text-[var(--primary)]" },
            { label: "Overall rate", value: `${courseStats.rate}%`, icon: <Icon.TrendingUp size={16} />, tint: courseStats.rate >= 75 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : courseStats.rate >= 50 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-red-500/10 text-red-500" },
            { label: "Present marks", value: courseStats.present, icon: <Icon.CheckCircle size={16} />, tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
            { label: "Absent marks", value: courseStats.absent, icon: <Icon.X size={16} />, tint: courseStats.absent > 0 ? "bg-red-500/10 text-red-500" : "bg-[var(--surface-2)] text-[var(--muted)]" },
          ].map((s) => (
            <Card key={s.label}>
              <CardBody className="flex items-center gap-3 !py-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${s.tint}`}>{s.icon}</div>
                <div className="min-w-0">
                  <p className="text-[11px] text-[var(--muted)]">{s.label}</p>
                  <p className="text-xl font-bold tracking-tight">{s.value}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardBody className="space-y-4">
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
            <p className="text-sm text-[var(--muted)]">Loading attendance…</p>
          ) : studentsInCourse.length === 0 ? (
            <EmptyState
              icon={<Icon.User size={20} />}
              title="No students enrolled"
              description={`No one in ${activeCourse?.title ?? "this course"} yet.`}
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-2)]">
                <span>Click to cycle:</span>
                {(["present", "late", "absent", "excused"] as const).map((m) => (
                  <span
                    key={m}
                    className={`px-2 py-0.5 rounded-full border ${MARK_STYLES[m]} capitalize`}
                  >
                    {m}
                  </span>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                      <th className="font-medium py-2.5 px-3">Student</th>
                      <th className="font-medium py-2.5 px-3">{formatDate(sessionDate)}</th>
                      <th className="font-medium py-2.5 px-3 hidden md:table-cell">Sessions</th>
                      <th className="font-medium py-2.5 px-3">Attendance rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsInCourse.map((s) => {
                      const today = marks[s.userId] ?? null;
                      const sum = summary(s.userId);
                      return (
                        <tr
                          key={s.userId}
                          className="border-b border-[var(--border)] last:border-0"
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white text-xs font-semibold flex items-center justify-center">
                                {s.userName.slice(0, 1).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{s.userName}</p>
                                <p className="text-xs text-[var(--muted-2)] truncate">
                                  {s.userEmail}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => cycle(s.userId)}
                              className={`px-3 h-8 rounded-lg text-xs font-semibold border transition capitalize ${
                                today
                                  ? MARK_STYLES[today]
                                  : "border-[var(--border)] text-[var(--muted-2)] bg-[var(--surface-2)]"
                              }`}
                            >
                              {today ?? "—"}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 hidden md:table-cell text-[var(--muted)] text-xs">
                            {sum.present}P · {sum.late}L · {sum.absent}A · {sum.excused}E ({sum.total})
                          </td>
                          <td className="py-2.5 px-3 w-40">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                  style={{ width: `${sum.rate}%` }}
                                />
                              </div>
                              <span className="text-xs text-[var(--muted)] w-9 text-right">
                                {sum.rate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {courseSessions.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--muted-2)] font-semibold mt-3">
                    Recorded sessions
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {courseSessions
                      .slice(-12)
                      .reverse()
                      .map((d) => (
                        <button
                          key={d}
                          onClick={() => setSessionDate(d)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition ${
                            d === sessionDate
                              ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                              : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)]"
                          }`}
                        >
                          {formatDate(d)}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-1 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--muted)]">
                  {markedCount} of {studentsInCourse.length} students marked.
                </p>
                <Button onClick={save} loading={saving}>
                  <Icon.Save size={16} /> Save attendance
                </Button>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
