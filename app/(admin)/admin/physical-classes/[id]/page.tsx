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
  StatCard,
} from "@/components/ui";
import Icon from "@/components/icons";
import { formatDate } from "@/lib/utils";
import type {
  PhysicalClass,
  PhysicalClassRosterEntry,
  PhysicalClassStatus,
} from "@/lib/mockData";

type Detail = { class: PhysicalClass; roster: PhysicalClassRosterEntry[] };

const STATUS_BADGE: Record<PhysicalClassStatus, "info" | "success" | "default" | "danger"> = {
  upcoming: "info",
  ongoing: "success",
  completed: "default",
  cancelled: "danger",
};

function rateClass(rate: number) {
  if (rate >= 75) return "text-emerald-500";
  if (rate >= 50) return "text-amber-500";
  return "text-red-500";
}

export default function AdminPhysicalClassDetailPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = React.useState<Detail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [rosterQuery, setRosterQuery] = React.useState("");

  React.useEffect(() => {
    fetch(`/api/admin/physical-classes/${params.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        </CardBody>
      </Card>
    );
  }

  if (!detail) {
    return (
      <Card>
        <CardBody>
          <EmptyState
            icon={<Icon.AlertCircle size={28} />}
            title="Batch not found"
            description="This physical class no longer exists."
            action={
              <Link href="/admin/physical-classes">
                <Button>Back to Physical Classes</Button>
              </Link>
            }
          />
        </CardBody>
      </Card>
    );
  }

  const pc = detail.class;
  const roster = detail.roster;
  const avgRate =
    roster.length === 0
      ? 0
      : Math.round(roster.reduce((s, r) => s + r.attendanceRate, 0) / roster.length);

  const q = rosterQuery.trim().toLowerCase();
  const filteredRoster = q
    ? roster.filter(
        (s) =>
          s.studentName.toLowerCase().includes(q) ||
          s.studentEmail.toLowerCase().includes(q),
      )
    : roster;

  const fillPct = pc.capacity > 0 ? Math.min(100, Math.round((pc.enrolledCount / pc.capacity) * 100)) : 0;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/admin/physical-classes"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition"
        >
          <Icon.ArrowLeft size={15} /> Physical Classes
        </Link>
        <Badge variant={STATUS_BADGE[pc.status]} className="capitalize text-sm px-3 py-1">
          {pc.status}
        </Badge>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Batch detail</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{pc.title}</h1>
            <p className="text-sm text-[var(--muted)] mt-0.5">{pc.courseTitle}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Capacity fill</span>
              <span className={fillPct >= 90 ? "text-red-500 font-semibold" : fillPct >= 70 ? "text-amber-500 font-semibold" : "text-emerald-600 font-semibold"}>
                {pc.enrolledCount} / {pc.capacity} seats ({fillPct}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${fillPct >= 90 ? "bg-red-500" : fillPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
            <Meta icon={<Icon.User size={14} />} label="Instructor" value={pc.instructorName} />
            <Meta icon={<Icon.Pin size={14} />} label="Campus" value={pc.campus} />
            <Meta icon={<Icon.Home size={14} />} label="Room" value={pc.room} />
            <Meta icon={<Icon.Clock size={14} />} label="Timing" value={pc.batch} />
            <Meta icon={<Icon.Calendar size={14} />} label="Days" value={pc.daysOfWeek.join(", ")} />
            <Meta icon={<Icon.Calendar size={14} />} label="Starts" value={formatDate(pc.startDate)} />
            <Meta icon={<Icon.Calendar size={14} />} label="Ends" value={formatDate(pc.endDate)} />
            <Meta
              icon={<Icon.Book size={14} />}
              label="Course"
              value={`${pc.courseCategory} · ${pc.courseLevel}`}
            />
          </div>
          {pc.notes && (
            <div className="text-sm bg-[var(--surface-2)] rounded-xl px-4 py-3">
              <span className="font-semibold">Notes: </span>
              <span className="text-[var(--muted)]">{pc.notes}</span>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Enrolled"
          value={`${pc.enrolledCount} / ${pc.capacity}`}
          icon={<Icon.Users size={20} />}
        />
        <StatCard
          label="Seats left"
          value={Math.max(0, pc.capacity - pc.enrolledCount)}
          icon={<Icon.Tag size={20} />}
          tone="accent"
        />
        <StatCard
          label="Avg. attendance"
          value={`${avgRate}%`}
          icon={<Icon.CheckCircle size={20} />}
          tone={avgRate >= 75 ? "success" : "warning"}
        />
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between gap-3 flex-wrap !pb-3">
          <CardTitle>Roster ({roster.length})</CardTitle>
          {roster.length > 0 && (
            <Input
              icon={<Icon.Search size={14} />}
              placeholder="Search students…"
              value={rosterQuery}
              onChange={(e) => setRosterQuery(e.target.value)}
              className="w-56"
            />
          )}
        </CardHeader>
        <CardBody className="!pt-0">
          {roster.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No students enrolled yet. Approve in-person applications for this course and place
              them into this batch.
            </p>
          ) : filteredRoster.length === 0 ? (
            <p className="text-sm text-[var(--muted)] py-4 text-center">No students match your search.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--muted)] border-b border-[var(--border)] bg-[var(--surface-2)] text-xs uppercase tracking-wider">
                    <th className="font-semibold py-2.5 px-3">Student</th>
                    <th className="font-semibold py-2.5 px-3">Enrolled</th>
                    <th className="font-semibold py-2.5 px-3 hidden sm:table-cell">Sessions</th>
                    <th className="font-semibold py-2.5 px-3">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.map((s) => (
                    <tr
                      key={s.enrollmentId}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]/50"
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
                      <td className="py-2.5 px-3 text-[var(--muted)] text-xs">
                        {formatDate(s.enrolledAt)}
                      </td>
                      <td className="py-2.5 px-3 hidden sm:table-cell text-xs text-[var(--muted)]">
                        {s.present}P · {s.late}L · {s.absent}A · {s.excused}E ({s.sessionsHeld})
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${rateClass(s.attendanceRate).replace("text-", "bg-")}`}
                              style={{ width: `${s.attendanceRate}%` }}
                            />
                          </div>
                          <span className={`font-semibold text-xs ${rateClass(s.attendanceRate)}`}>
                            {s.attendanceRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rosterQuery && (
                <p className="text-xs text-[var(--muted)] px-3 py-2.5 border-t border-[var(--border)]">
                  Showing {filteredRoster.length} of {roster.length} students
                </p>
              )}
            </div>
          )}
        </CardBody>
      </Card>
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
