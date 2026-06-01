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

// Tap a cell to cycle through the states.
const NEXT_MARK: Record<string, Mark> = {
  null: "present",
  present: "late",
  late: "absent",
  absent: "excused",
  excused: null,
};

const todayISO = () => new Date().toISOString().slice(0, 10);

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

  React.useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // Load the attendance sheet for the selected date.
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
    return () => {
      cancelled = true;
    };
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
    loadDetail(); // refresh roster summaries + session list
  }

  if (loading) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        </CardBody>
      </Card>
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

  return (
    <div className="space-y-6 fade-in">
      <Link
        href="/teacher/physical-classes"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition"
      >
        <Icon.ArrowLeft size={15} /> Physical Classes
      </Link>

      {/* Header */}
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">{pc.title}</h1>
              <p className="text-sm text-[var(--muted)]">{pc.courseTitle}</p>
            </div>
            <Badge variant={STATUS_BADGE[pc.status]} className="capitalize">
              {pc.status}
            </Badge>
          </div>
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
        <>
          {/* Attendance marking */}
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
                <Button size="sm" variant="ghost" onClick={() => markAll(null)}>
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              {detail.sessions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-[var(--muted-2)] mr-1">Recorded sessions:</span>
                  {detail.sessions
                    .slice()
                    .reverse()
                    .slice(0, 12)
                    .map((s) => {
                      const day = s.slice(0, 10);
                      return (
                        <button
                          key={s}
                          onClick={() => setSessionDate(day)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition ${
                            day === sessionDate
                              ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                              : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)]"
                          }`}
                        >
                          {formatDate(s)}
                        </button>
                      );
                    })}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                      <th className="font-medium py-2.5 px-3">Student</th>
                      <th className="font-medium py-2.5 px-3">
                        {formatDate(sessionDate)}
                      </th>
                      <th className="font-medium py-2.5 px-3 hidden sm:table-cell">
                        Overall attendance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.roster.map((s) => {
                      const mark = marks[s.studentId] ?? null;
                      return (
                        <tr
                          key={s.studentId}
                          className="border-b border-[var(--border)] last:border-0"
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                                {s.studentName.slice(0, 1).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{s.studentName}</p>
                                <p className="text-xs text-[var(--muted-2)] truncate">
                                  {s.studentEmail}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => cycle(s.studentId)}
                              disabled={loadingMarks}
                              className={`px-3 h-8 rounded-lg text-xs font-semibold border transition capitalize disabled:opacity-50 ${
                                mark
                                  ? MARK_STYLES[mark]
                                  : "border-[var(--border)] text-[var(--muted-2)] bg-[var(--surface-2)]"
                              }`}
                            >
                              {mark ?? "—"}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 hidden sm:table-cell">
                            <div className="flex items-center gap-2 max-w-[14rem]">
                              <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                  style={{ width: `${s.attendanceRate}%` }}
                                />
                              </div>
                              <span className="text-xs text-[var(--muted)] w-9 text-right">
                                {s.attendanceRate}%
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--muted-2)] mt-0.5">
                              {s.present}P · {s.late}L · {s.absent}A · {s.excused}E ({s.sessionsHeld})
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-xs text-[var(--muted)]">
                  {markedCount} of {detail.roster.length} students marked.
                </p>
                <Button onClick={save} loading={saving} disabled={loadingMarks}>
                  <Icon.Save size={16} /> Save attendance
                </Button>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold flex items-center gap-1">
        <span className="text-[var(--muted-2)]">{icon}</span>
        {label}
      </p>
      <p className="font-medium text-[var(--foreground)] mt-0.5 break-words">{value}</p>
    </div>
  );
}
