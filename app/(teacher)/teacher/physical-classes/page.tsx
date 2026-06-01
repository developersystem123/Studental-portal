"use client";

import * as React from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  StatCard,
} from "@/components/ui";
import Icon from "@/components/icons";
import { formatDate } from "@/lib/utils";
import type { PhysicalClass, PhysicalClassStatus } from "@/lib/mockData";

const STATUS_BADGE: Record<PhysicalClassStatus, "info" | "success" | "default" | "danger"> = {
  upcoming: "info",
  ongoing: "success",
  completed: "default",
  cancelled: "danger",
};

export default function TeacherPhysicalClassesPage() {
  const [classes, setClasses] = React.useState<PhysicalClass[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/teacher/physical-classes")
      .then((r) => r.json())
      .then((data) => setClasses(data.classes ?? []))
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }, []);

  const totalSeats = classes.reduce((s, c) => s + c.capacity, 0);
  const totalEnrolled = classes.reduce((s, c) => s + c.enrolledCount, 0);
  const ongoing = classes.filter((c) => c.status === "ongoing").length;

  return (
    <div className="space-y-6 fade-in">
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
          Teaching
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Physical Classes</h1>
        <p className="mt-1 text-[var(--muted)]">
          Your in-person batches — open one to view the roster and mark attendance.
        </p>
      </div>

      {!loading && classes.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Batches" value={classes.length} icon={<Icon.Calendar size={20} />} />
          <StatCard
            label="Students enrolled"
            value={`${totalEnrolled} / ${totalSeats}`}
            icon={<Icon.Users size={20} />}
            tone="accent"
          />
          <StatCard
            label="Ongoing now"
            value={ongoing}
            icon={<Icon.PlayCircle size={20} />}
            tone="success"
          />
        </div>
      )}

      {loading ? (
        <Card>
          <CardBody>
            <p className="text-sm text-[var(--muted)]">Loading…</p>
          </CardBody>
        </Card>
      ) : classes.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.Calendar size={28} />}
              title="No physical classes assigned"
              description="An admin needs to create an in-person batch and assign it to you. Once they do, it appears here."
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => {
            const full = c.enrolledCount >= c.capacity;
            return (
              <Card key={c.id} className="flex flex-col">
                <CardBody className="space-y-3 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold leading-tight">{c.title}</h3>
                      <p className="text-xs text-[var(--muted)] mt-0.5 truncate">{c.courseTitle}</p>
                    </div>
                    <Badge variant={STATUS_BADGE[c.status]} className="capitalize shrink-0">
                      {c.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-[var(--muted)]">
                    <span className="flex items-center gap-1.5">
                      <Icon.Pin size={13} className="text-[var(--muted-2)]" /> {c.campus}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Icon.Home size={13} className="text-[var(--muted-2)]" /> Room {c.room}
                    </span>
                    <span className="flex items-center gap-1.5 col-span-2">
                      <Icon.Clock size={13} className="text-[var(--muted-2)]" /> {c.batch}
                    </span>
                    <span className="flex items-center gap-1.5 col-span-2">
                      <Icon.Calendar size={13} className="text-[var(--muted-2)]" />
                      {formatDate(c.startDate)} – {formatDate(c.endDate)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {c.daysOfWeek.map((d) => (
                      <span
                        key={d}
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--primary-soft)] text-[var(--primary)]"
                      >
                        {d}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-2 border-t border-[var(--border)] flex items-center justify-between gap-3">
                    <span
                      className={`text-sm font-medium ${full ? "text-amber-500" : "text-[var(--muted)]"}`}
                    >
                      <Icon.Users size={14} className="inline -mt-0.5 mr-1" />
                      {c.enrolledCount} / {c.capacity}
                    </span>
                    <Link href={`/teacher/physical-classes/${c.id}`}>
                      <Button size="sm">
                        Roster &amp; attendance <Icon.ChevronRight size={14} />
                      </Button>
                    </Link>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
