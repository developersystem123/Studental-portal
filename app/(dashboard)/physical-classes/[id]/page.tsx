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
  Progress,
} from "@/components/ui";
import Icon from "@/components/icons";
import { formatDate } from "@/lib/utils";
import type {
  AttendanceStatus,
  MyPhysicalClass,
  PhysicalClassStatus,
} from "@/lib/mockData";

const STATUS_BADGE: Record<PhysicalClassStatus, "info" | "success" | "default" | "danger"> = {
  upcoming: "info",
  ongoing: "success",
  completed: "default",
  cancelled: "danger",
};

const ATT_BADGE: Record<AttendanceStatus, "success" | "danger" | "warning" | "info"> = {
  present: "success",
  absent: "danger",
  late: "warning",
  excused: "info",
};

export default function StudentPhysicalClassDetailPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = React.useState<MyPhysicalClass | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/physical-classes")
      .then((r) => r.json())
      .then((data) => {
        const found = (data.classes ?? []).find(
          (c: MyPhysicalClass) => c.class.id === params.id,
        );
        setItem(found ?? null);
      })
      .catch(() => setItem(null))
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

  if (!item) {
    return (
      <Card>
        <CardBody>
          <EmptyState
            icon={<Icon.AlertCircle size={28} />}
            title="Class not found"
            description="You're not enrolled in this physical class, or it no longer exists."
            action={
              <Link href="/physical-classes">
                <Button>Back to Physical Classes</Button>
              </Link>
            }
          />
        </CardBody>
      </Card>
    );
  }

  const pc = item.class;
  const sessions = [...item.attendance].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <Link
        href="/physical-classes"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition"
      >
        <Icon.ArrowLeft size={15} /> Physical Classes
      </Link>

      {/* Header */}
      <Card className="overflow-hidden">
        <div className="h-32 w-full relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pc.courseThumbnail} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <Badge variant={STATUS_BADGE[pc.status]} className="capitalize mb-1.5">
              {pc.status}
            </Badge>
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">{pc.title}</h1>
            <p className="text-sm text-white/80">{pc.courseTitle}</p>
          </div>
        </div>
        <CardBody className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Detail icon={<Icon.User size={15} />} label="Instructor" value={pc.instructorName} />
          <Detail icon={<Icon.Pin size={15} />} label="Campus" value={pc.campus} />
          <Detail icon={<Icon.Home size={15} />} label="Room" value={pc.room} />
          <Detail icon={<Icon.Clock size={15} />} label="Timing" value={pc.batch} />
          <Detail icon={<Icon.Calendar size={15} />} label="Days" value={pc.daysOfWeek.join(", ")} />
          <Detail icon={<Icon.Users size={15} />} label="Classmates" value={`${item.classmateCount} students`} />
          <Detail
            icon={<Icon.Calendar size={15} />}
            label="Starts"
            value={formatDate(pc.startDate)}
          />
          <Detail icon={<Icon.Calendar size={15} />} label="Ends" value={formatDate(pc.endDate)} />
          <Detail
            icon={<Icon.Book size={15} />}
            label="Level"
            value={`${pc.courseCategory} · ${pc.courseLevel}`}
          />
        </CardBody>
        {pc.notes && (
          <div className="px-5 pb-5">
            <div className="text-sm bg-[var(--surface-2)] rounded-xl px-4 py-3">
              <span className="font-semibold">Notes: </span>
              <span className="text-[var(--muted)]">{pc.notes}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Attendance summary */}
      <Card>
        <CardHeader>
          <CardTitle>My attendance</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <p className="text-3xl font-bold">{item.attendanceRate}%</p>
              <p className="text-xs text-[var(--muted)]">{item.sessionsHeld} sessions held</p>
            </div>
            <Progress value={item.attendanceRate} className="flex-1" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Tally label="Present" value={item.present} tone="text-emerald-500" />
            <Tally label="Late" value={item.late} tone="text-amber-500" />
            <Tally label="Absent" value={item.absent} tone="text-red-500" />
            <Tally label="Excused" value={item.excused} tone="text-sky-500" />
          </div>
        </CardBody>
      </Card>

      {/* Attendance history */}
      <Card>
        <CardHeader>
          <CardTitle>Session history</CardTitle>
        </CardHeader>
        <CardBody>
          {sessions.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No sessions recorded yet. Your attendance will appear here once classes begin.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {sessions.map((s) => (
                <li key={s.date} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm">
                    <Icon.Calendar size={14} className="text-[var(--muted-2)]" />
                    {formatDate(s.date)}
                  </span>
                  <div className="flex items-center gap-2">
                    {s.note && (
                      <span className="text-xs text-[var(--muted)] hidden sm:inline">{s.note}</span>
                    )}
                    <Badge variant={ATT_BADGE[s.status]} className="capitalize">
                      {s.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="h-8 w-8 rounded-lg bg-[var(--surface-2)] text-[var(--muted)] flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold">
          {label}
        </p>
        <p className="text-sm font-medium text-[var(--foreground)] break-words">{value}</p>
      </div>
    </div>
  );
}

function Tally({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] py-2.5 text-center">
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      <p className="text-[11px] text-[var(--muted)]">{label}</p>
    </div>
  );
}
