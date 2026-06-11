"use client";

import * as React from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  Skeleton,
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

const STATUS_FILTERS: { label: string; value: PhysicalClassStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

function ClassCardSkeleton() {
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full rounded" />
          ))}
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-10 rounded" />
          <Skeleton className="h-5 w-10 rounded" />
        </div>
        <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
      </CardBody>
    </Card>
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

export default function TeacherPhysicalClassesPage() {
  const [classes, setClasses] = React.useState<PhysicalClass[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<PhysicalClassStatus | "all">("all");

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
  const fillRate = totalSeats === 0 ? 0 : Math.round((totalEnrolled / totalSeats) * 100);

  const visibleClasses = React.useMemo(() => {
    let list = classes;
    if (statusFilter !== "all") list = list.filter((c) => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.courseTitle.toLowerCase().includes(q) ||
          c.campus.toLowerCase().includes(q) ||
          c.batch.toLowerCase().includes(q),
      );
    }
    return list;
  }, [classes, statusFilter, search]);

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: classes.length };
    for (const c of classes) counts[c.status] = (counts[c.status] ?? 0) + 1;
    return counts;
  }, [classes]);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
          Teaching
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Physical Classes</h1>
        <p className="mt-1 text-[var(--muted)]">
          Your in-person batches — open one to view the roster and mark attendance.
        </p>
      </div>

      {/* Stats */}
      {!loading && classes.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard
            label="Total batches"
            value={classes.length}
            icon={<Icon.Calendar size={16} />}
            tone="primary"
          />
          <SummaryCard
            label="Students enrolled"
            value={`${totalEnrolled} / ${totalSeats}`}
            icon={<Icon.Users size={16} />}
            tone="success"
          />
          <SummaryCard
            label="Fill rate"
            value={`${fillRate}%`}
            icon={<Icon.TrendingUp size={16} />}
            tone={fillRate >= 75 ? "success" : fillRate >= 40 ? "warning" : "default"}
          />
          <SummaryCard
            label="Ongoing now"
            value={ongoing}
            icon={<Icon.PlayCircle size={16} />}
            tone={ongoing > 0 ? "success" : "default"}
          />
        </div>
      )}

      {/* Search + status filter */}
      {!loading && classes.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative max-w-xs flex-1">
            <Icon.Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
            />
            <Input
              placeholder="Search batches…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="!pl-8 !h-9 !text-sm"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map((f) => {
              const count = statusCounts[f.value] ?? 0;
              const active = statusFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition flex items-center gap-1.5 ${
                    active
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  {f.label}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      active ? "bg-white/20 text-white" : "bg-[var(--surface-2)] text-[var(--muted)]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ClassCardSkeleton key={i} />
          ))}
        </div>
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
      ) : visibleClasses.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.Search size={24} />}
              title="No batches match"
              description="Try adjusting your search or clearing the filter."
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleClasses.map((c) => {
            const fillPct = c.capacity === 0 ? 0 : Math.round((c.enrolledCount / c.capacity) * 100);
            const full = c.enrolledCount >= c.capacity;
            const spotsLeft = c.capacity - c.enrolledCount;
            return (
              <Card key={c.id} className="flex flex-col hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
                <CardBody className="space-y-3 flex-1 flex flex-col min-w-0">
                  {/* Title + status */}
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold leading-tight line-clamp-2 break-words">{c.title}</h3>
                      <p className="text-xs text-[var(--muted)] mt-0.5 truncate">{c.courseTitle}</p>
                    </div>
                    <Badge variant={STATUS_BADGE[c.status]} className="capitalize shrink-0">
                      {c.status}
                    </Badge>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-[var(--muted)]">
                    <span className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                      <Icon.Pin size={12} className="text-[var(--muted)] shrink-0" />
                      <span className="truncate">{c.campus}</span>
                    </span>
                    <span className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                      <Icon.Home size={12} className="text-[var(--muted)] shrink-0" />
                      <span className="truncate">Room {c.room}</span>
                    </span>
                    <span className="flex items-center gap-1.5 col-span-2 min-w-0 overflow-hidden">
                      <Icon.Clock size={12} className="text-[var(--muted)] shrink-0" />
                      <span className="truncate">{c.batch}</span>
                    </span>
                    <span className="flex items-center gap-1.5 col-span-2 min-w-0 overflow-hidden">
                      <Icon.Calendar size={12} className="text-[var(--muted)] shrink-0" />
                      <span className="truncate">{formatDate(c.startDate)} – {formatDate(c.endDate)}</span>
                    </span>
                  </div>

                  {/* Days chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {c.daysOfWeek.map((d) => (
                      <span
                        key={d}
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--primary-soft,oklch(0.93_0.05_270))] text-[var(--primary)]"
                      >
                        {d}
                      </span>
                    ))}
                  </div>

                  {/* Fill rate bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--muted)]">
                        {full ? (
                          <span className="text-amber-500 font-semibold">Full</span>
                        ) : (
                          <span>{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left</span>
                        )}
                      </span>
                      <span className={`font-semibold ${full ? "text-amber-500" : "text-[var(--muted)]"}`}>
                        {c.enrolledCount} / {c.capacity}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          fillPct >= 90 ? "bg-amber-500" : fillPct >= 60 ? "bg-[var(--primary)]" : "bg-[var(--primary)]"
                        }`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-auto pt-2 border-t border-[var(--border)] flex items-center justify-end min-w-0">
                    <Link href={`/teacher/physical-classes/${c.id}`} className="min-w-0">
                      <Button size="sm" className="w-full sm:w-auto">
                        <span className="truncate">Roster &amp; attendance</span> <Icon.ChevronRight size={14} className="shrink-0" />
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
