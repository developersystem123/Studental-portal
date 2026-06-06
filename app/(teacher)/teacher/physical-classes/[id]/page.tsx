"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Label,
  Modal,
  Skeleton,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { formatDate } from "@/lib/utils";
import type {
  AttendanceStatus,
  PhysicalClass,
  PhysicalClassRosterEntry,
  PhysicalClassStatus,
} from "@/lib/mockData";

type Detail = {
  class: PhysicalClass;
  roster: PhysicalClassRosterEntry[];
  sessions: string[];
};

type Mark = AttendanceStatus | null;

const STATUS_BADGE: Record<PhysicalClassStatus, "info" | "success" | "default" | "danger"> = {
  upcoming: "info",
  ongoing: "success",
  completed: "default",
  cancelled: "danger",
};

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

function exportCSV(pc: PhysicalClass, roster: PhysicalClassRosterEntry[], sessions: string[]) {
  const header = ["Name", "Email", ...sessions.map((s) => formatDate(s.slice(0, 10))), "Rate (%)"];
  const rows = roster.map((s) => {
    const rate = s.attendanceRate;
    return [s.studentName, s.studentEmail, ...sessions.map(() => ""), `${rate}%`];
  });
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `attendance-${pc.title.replace(/\s+/g, "-").toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function RosterSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40 rounded" />
            <Skeleton className="h-2.5 w-52 rounded" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-2 w-28 rounded-full" />
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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${tints[tone]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-[var(--muted)] leading-tight">{label}</p>
        <p className="text-xl font-bold tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold flex items-center gap-1">
        <span className="text-[var(--muted)]">{icon}</span>
        {label}
      </p>
      <p className="font-medium text-[var(--foreground)] mt-0.5 break-words">{value}</p>
    </div>
  );
}

export default function TeacherPhysicalClassDetailPage() {
  const params = useParams<{ id: string }>();
  const toast = useToast();

  const [detail, setDetail] = React.useState<Detail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  const [sessionDate, setSessionDate] = React.useState(todayISO());
  const [marks, setMarks] = React.useState<Record<string, Mark>>({});
  const [loadingMarks, setLoadingMarks] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Filters
  const [studentSearch, setStudentSearch] = React.useState("");
  const [showAtRisk, setShowAtRisk] = React.useState(false);
  const [analyticsOpen, setAnalyticsOpen] = React.useState(false);

  const loadDetail = React.useCallback(async () => {
    const r = await fetch(`/api/teacher/physical-classes/${params.id}`);
    if (!r.ok) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const data = (await r.json()) as Detail;
    setDetail(data);
    setLoading(false);
  }, [params.id]);

  React.useEffect(() => { loadDetail(); }, [loadDetail]);

  React.useEffect(() => {
    if (!detail) return;
    let cancelled = false;
    setLoadingMarks(true);
    fetch(`/api/teacher/physical-classes/${params.id}/attendance?date=${sessionDate}`)
      .then((r) => (r.ok ? r.json() : { marks: [] }))
      .then((data: { marks: { studentId: string; status: AttendanceStatus }[] }) => {
        if (cancelled) return;
        const next: Record<string, Mark> = {};
        for (const s of detail.roster) next[s.studentId] = null;
        for (const m of data.marks) next[m.studentId] = m.status;
        setMarks(next);
      })
      .finally(() => !cancelled && setLoadingMarks(false));
    return () => { cancelled = true; };
  }, [detail, params.id, sessionDate]);

  function cycle(studentId: string) {
    setMarks((prev) => {
      const cur = prev[studentId] ?? null;
      return { ...prev, [studentId]: NEXT_MARK[cur === null ? "null" : cur] };
    });
  }

  function markAll(status: Mark) {
    if (!detail) return;
    const next: Record<string, Mark> = {};
    for (const s of detail.roster) next[s.studentId] = status;
    setMarks(next);
  }

  async function save() {
    if (!detail) return;
    setSaving(true);
    const payload = Object.entries(marks)
      .filter(([, v]) => v !== null)
      .map(([studentId, status]) => ({ studentId, status }));
    const r = await fetch(`/api/teacher/physical-classes/${params.id}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: sessionDate, marks: payload }),
    });
    setSaving(false);
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
    loadDetail();
  }

  if (loading) {
    return (
      <div className="space-y-6 fade-in">
        <Skeleton className="h-4 w-40 rounded" />
        <Card>
          <CardBody className="space-y-4">
            <Skeleton className="h-7 w-64 rounded" />
            <Skeleton className="h-4 w-40 rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <RosterSkeleton />
          </CardBody>
        </Card>
      </div>
    );
  }

  if (notFound || !detail) {
    return (
      <Card>
        <CardBody>
          <EmptyState
            icon={<Icon.AlertCircle size={28} />}
            title="Batch not found"
            description="This physical class doesn't exist or isn't assigned to you."
            action={
              <Link href="/teacher/physical-classes">
                <Button>Back to Physical Classes</Button>
              </Link>
            }
          />
        </CardBody>
      </Card>
    );
  }

  const pc = detail.class;
  const markedCount = Object.values(marks).filter((v) => v !== null).length;

  const sessions = detail.sessions.map((s) => s.slice(0, 10));

  // At-risk roster entries
  const atRiskRoster = detail.roster.filter(
    (s) => s.sessionsHeld > 0 && s.attendanceRate < AT_RISK_THRESHOLD,
  );

  // Session summary for the selected date (from current marks)
  const sessionSummary = React.useMemo(() => {
    const vals = Object.values(marks).filter((v) => v !== null) as AttendanceStatus[];
    return {
      present: vals.filter((v) => v === "present").length,
      late: vals.filter((v) => v === "late").length,
      absent: vals.filter((v) => v === "absent").length,
      excused: vals.filter((v) => v === "excused").length,
    };
  }, [marks]);

  // Trend: absent rate for last 8 sessions
  const overallAvgRate = detail.roster.length === 0
    ? 0
    : Math.round(
        detail.roster.reduce((s, r) => s + r.attendanceRate, 0) / detail.roster.length,
      );

  // Filtered visible roster
  const visibleRoster = React.useMemo(() => {
    let list = detail.roster;
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      list = list.filter(
        (s) =>
          s.studentName.toLowerCase().includes(q) ||
          s.studentEmail.toLowerCase().includes(q),
      );
    }
    if (showAtRisk) {
      const ids = new Set(atRiskRoster.map((s) => s.studentId));
      list = list.filter((s) => ids.has(s.studentId));
    }
    return list;
  }, [detail.roster, studentSearch, showAtRisk, atRiskRoster]);

  return (
    <div className="space-y-6 fade-in">
      <Link
        href="/teacher/physical-classes"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition"
      >
        <Icon.ArrowLeft size={15} /> Physical Classes
      </Link>

      {/* Header card */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">{pc.title}</h1>
              <p className="text-sm text-[var(--muted)]">{pc.courseTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_BADGE[pc.status]} className="capitalize">
                {pc.status}
              </Badge>
              {detail.roster.length > 0 && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setAnalyticsOpen(true)}>
                    <Icon.BarChart3 size={14} /> Analytics
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportCSV(pc, detail.roster, sessions)}
                  >
                    <Icon.Download size={14} /> Export CSV
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
            <Meta icon={<Icon.Pin size={14} />} label="Campus" value={pc.campus} />
            <Meta icon={<Icon.Home size={14} />} label="Room" value={pc.room} />
            <Meta icon={<Icon.Clock size={14} />} label="Timing" value={pc.batch} />
            <Meta icon={<Icon.Calendar size={14} />} label="Days" value={pc.daysOfWeek.join(", ")} />
            <Meta
              icon={<Icon.Users size={14} />}
              label="Enrolled"
              value={`${pc.enrolledCount} / ${pc.capacity}`}
            />
          </div>

          {/* Quick stats */}
          {detail.roster.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SummaryCard
                label="Sessions held"
                value={sessions.length}
                icon={<Icon.Calendar size={16} />}
                tone="primary"
              />
              <SummaryCard
                label="Avg attendance"
                value={`${overallAvgRate}%`}
                icon={<Icon.TrendingUp size={16} />}
                tone={overallAvgRate >= 75 ? "success" : overallAvgRate >= 50 ? "warning" : "danger"}
              />
              <SummaryCard
                label="Students"
                value={detail.roster.length}
                icon={<Icon.Users size={16} />}
                tone="default"
              />
              <SummaryCard
                label="At-risk"
                value={atRiskRoster.length}
                icon={<Icon.AlertCircle size={16} />}
                tone={atRiskRoster.length > 0 ? "danger" : "default"}
              />
            </div>
          )}
        </CardBody>
      </Card>

      {detail.roster.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.Users size={28} />}
              title="No students enrolled yet"
              description="Once an admin approves applications and places students into this batch, they appear here."
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <CardTitle>Mark attendance</CardTitle>
              <p className="text-xs text-[var(--muted)] mt-1">
                Click a student&apos;s cell to cycle present → late → absent → excused.
              </p>
            </div>
            <div className="flex items-end gap-2 flex-wrap">
              <div>
                <Label htmlFor="session-date">Session date</Label>
                <Input
                  id="session-date"
                  type="date"
                  value={sessionDate}
                  max={todayISO()}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="!w-44"
                />
              </div>
              <Button size="sm" variant="outline" onClick={() => markAll("present")}>
                All present
              </Button>
              <Button size="sm" variant="outline" onClick={() => markAll("absent")}>
                All absent
              </Button>
              <Button size="sm" variant="ghost" onClick={() => markAll(null)}>
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* Session history pills */}
            {sessions.length > 0 && (
              <div>
                <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider mb-2">
                  Recorded sessions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sessions
                    .slice()
                    .reverse()
                    .slice(0, 16)
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

            {/* Current session summary */}
            {markedCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {(["present", "late", "absent", "excused"] as const).map((s) => (
                  <span
                    key={s}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium ${MARK_STYLES[s]}`}
                  >
                    {sessionSummary[s]} {s}
                  </span>
                ))}
              </div>
            )}

            {/* Search + at-risk filter */}
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <div className="relative max-w-xs flex-1">
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
              {atRiskRoster.length > 0 && (
                <button
                  onClick={() => setShowAtRisk((v) => !v)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
                    showAtRisk
                      ? "bg-red-500/15 text-red-500 border-red-500/40"
                      : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <Icon.AlertCircle size={13} />
                  At-risk only ({atRiskRoster.length})
                </button>
              )}
              <div className="flex items-center gap-1 ml-auto text-xs text-[var(--muted)]">
                <span className="font-medium text-[var(--foreground)]">{visibleRoster.length}</span>
                {" "}of {detail.roster.length} students
              </div>
            </div>

            {/* Roster table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="font-medium py-2.5 px-3">Student</th>
                    <th className="font-medium py-2.5 px-3 text-center">
                      {formatDate(sessionDate)}
                    </th>
                    <th className="font-medium py-2.5 px-3 hidden sm:table-cell">P · L · A · E</th>
                    <th className="font-medium py-2.5 px-3 hidden sm:table-cell">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRoster.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-[var(--muted)]">
                        No students match your filter.
                      </td>
                    </tr>
                  ) : (
                    visibleRoster.map((s) => {
                      const mark = marks[s.studentId] ?? null;
                      const isAtRisk = s.sessionsHeld > 0 && s.attendanceRate < AT_RISK_THRESHOLD;
                      return (
                        <tr
                          key={s.studentId}
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
                                {s.studentName.slice(0, 1).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-medium truncate">{s.studentName}</p>
                                  {isAtRisk && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 font-semibold shrink-0">
                                      at-risk
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-[var(--muted)] truncate">
                                  {s.studentEmail}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => cycle(s.studentId)}
                              disabled={loadingMarks}
                              className={`px-3 h-8 rounded-lg text-xs font-semibold border transition capitalize disabled:opacity-50 ${
                                mark
                                  ? MARK_STYLES[mark]
                                  : "border-[var(--border)] text-[var(--muted)] bg-[var(--surface-2)] hover:bg-[var(--surface-2)]/70"
                              }`}
                            >
                              {mark ?? "—"}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 hidden sm:table-cell">
                            <div className="flex gap-1.5">
                              {(["present", "late", "absent", "excused"] as const).map((st) => (
                                <span
                                  key={st}
                                  className={`text-[11px] w-6 h-6 rounded flex items-center justify-center font-bold ${
                                    s[st] > 0
                                      ? MARK_STYLES[st]
                                      : "text-[var(--muted)] bg-[var(--surface-2)]"
                                  }`}
                                  title={`${s[st]} ${st}`}
                                >
                                  {s[st] > 0 ? s[st] : MARK_LABELS[st]}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 hidden sm:table-cell w-36">
                            {s.sessionsHeld === 0 ? (
                              <span className="text-xs text-[var(--muted)]">No data</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      s.attendanceRate >= 75
                                        ? "bg-emerald-500"
                                        : s.attendanceRate >= 50
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                    }`}
                                    style={{ width: `${s.attendanceRate}%` }}
                                  />
                                </div>
                                <span
                                  className={`text-xs w-9 text-right font-semibold ${
                                    s.attendanceRate >= 75
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : s.attendanceRate >= 50
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-red-500"
                                  }`}
                                >
                                  {s.attendanceRate}%
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

            {/* Save footer */}
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--muted)]">
                {markedCount} of {detail.roster.length} students marked for{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {formatDate(sessionDate)}
                </span>
                .
              </p>
              <Button onClick={save} loading={saving} disabled={loadingMarks || markedCount === 0}>
                <Icon.Save size={16} /> Save attendance
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Analytics modal */}
      <Modal
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        title="Batch Analytics"
        size="lg"
      >
        <div className="space-y-6">
          {/* Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Sessions held", value: sessions.length },
              { label: "Avg attendance", value: `${overallAvgRate}%` },
              { label: "Enrolled", value: detail.roster.length },
              { label: "At-risk", value: atRiskRoster.length },
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

          {/* At-risk students */}
          {atRiskRoster.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--muted)] font-semibold mb-3">
                At-risk students (below {AT_RISK_THRESHOLD}%)
              </p>
              <div className="space-y-2">
                {atRiskRoster.map((s) => (
                  <div
                    key={s.studentId}
                    className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20"
                  >
                    <div className="h-8 w-8 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {s.studentName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{s.studentName}</p>
                      <p className="text-xs text-[var(--muted)] truncate">{s.studentEmail}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-red-500">{s.attendanceRate}%</p>
                      <p className="text-[10px] text-[var(--muted)]">
                        {s.absent}A · {s.sessionsHeld} sessions
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full roster table */}
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
                  {detail.roster
                    .slice()
                    .sort((a, b) => a.attendanceRate - b.attendanceRate)
                    .map((s) => (
                      <tr key={s.studentId} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-2 px-3">
                          <p className="font-medium truncate max-w-[150px]">{s.studentName}</p>
                        </td>
                        <td className="py-2 px-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">
                          {s.present}
                        </td>
                        <td className="py-2 px-3 text-center text-amber-600 dark:text-amber-400 font-semibold">
                          {s.late}
                        </td>
                        <td className="py-2 px-3 text-center text-red-500 font-semibold">
                          {s.absent}
                        </td>
                        <td className="py-2 px-3 text-center text-sky-500 font-semibold">
                          {s.excused}
                        </td>
                        <td className="py-2 px-3 w-28">
                          {s.sessionsHeld === 0 ? (
                            <span className="text-xs text-[var(--muted)]">—</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    s.attendanceRate >= 75
                                      ? "bg-emerald-500"
                                      : s.attendanceRate >= 50
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{ width: `${s.attendanceRate}%` }}
                                />
                              </div>
                              <span className="text-xs w-8 text-right font-semibold">
                                {s.attendanceRate}%
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
        </div>
      </Modal>
    </div>
  );
}
