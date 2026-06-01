"use client";

import * as React from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Progress,
  Skeleton,
  StatCard,
  Tabs,
} from "@/components/ui";
import Icon from "@/components/icons";
import { cn, formatDate } from "@/lib/utils";
import type { MyPhysicalClass, PhysicalClassStatus } from "@/lib/mockData";

const STATUS_BADGE: Record<PhysicalClassStatus, "info" | "success" | "default" | "danger"> = {
  upcoming: "info",
  ongoing: "success",
  completed: "default",
  cancelled: "danger",
};

const STATUS_LABEL: Record<PhysicalClassStatus, string> = {
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  completed: "Completed",
  cancelled: "Cancelled",
};

function rateTone(rate: number): "success" | "warning" | "danger" {
  if (rate >= 75) return "success";
  if (rate >= 50) return "warning";
  return "danger";
}

const RATE_COLOR = {
  success: "text-emerald-500",
  warning: "text-amber-500",
  danger: "text-red-500",
};

const RATE_BAR = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

function nextSessionDate(daysOfWeek: string[]): string {
  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const today = new Date();
  const todayDay = today.getDay();
  let minDiff = Infinity;
  for (const d of daysOfWeek) {
    const targetDay = dayMap[d];
    if (targetDay === undefined) continue;
    let diff = targetDay - todayDay;
    if (diff < 0) diff += 7;
    if (diff === 0) diff = 0;
    if (diff < minDiff) minDiff = diff;
  }
  if (minDiff === Infinity) return "N/A";
  if (minDiff === 0) return "Today";
  if (minDiff === 1) return "Tomorrow";
  const next = new Date(today);
  next.setDate(today.getDate() + minDiff);
  return next.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function StudentPhysicalClassesPage() {
  const [classes, setClasses] = React.useState<MyPhysicalClass[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<PhysicalClassStatus | "all">("all");
  const [search, setSearch] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  React.useEffect(() => {
    fetch("/api/physical-classes")
      .then((r) => r.json())
      .then((data) => setClasses(data.classes ?? []))
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }, []);

  const active = classes.filter((c) => c.enrollmentStatus === "active");
  const avgRate = active.length === 0 ? 0 : Math.round(active.reduce((s, c) => s + c.attendanceRate, 0) / active.length);
  const totalSessions = classes.reduce((s, c) => s + c.sessionsHeld, 0);
  const lowAttendance = active.filter((c) => c.attendanceRate < 75);

  const statusCounts = React.useMemo(() => {
    const all = classes.length;
    const ongoing = classes.filter((c) => c.class.status === "ongoing").length;
    const upcoming = classes.filter((c) => c.class.status === "upcoming").length;
    const completed = classes.filter((c) => c.class.status === "completed").length;
    return { all, ongoing, upcoming, completed };
  }, [classes]);

  const filtered = React.useMemo(() => {
    let list = statusFilter === "all" ? classes : classes.filter((c) => c.class.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.class.courseTitle.toLowerCase().includes(q) ||
        c.class.title.toLowerCase().includes(q) ||
        c.class.campus.toLowerCase().includes(q),
      );
    }
    return list;
  }, [classes, statusFilter, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Physical Classes</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Your in-person class batches, schedules and attendance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/applications">
            <Button variant="outline" size="sm">
              <Icon.FilePen size={15} /> Applications
            </Button>
          </Link>
          <Link href="/explore">
            <Button variant="soft" size="sm">
              <Icon.Compass size={15} /> Browse courses
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : classes.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Enrolled batches"
            value={active.length}
            icon={<Icon.Calendar size={20} />}
            tone="primary"
          />
          <StatCard
            label="Avg attendance"
            value={`${avgRate}%`}
            icon={<Icon.CheckCircle size={20} />}
            tone={avgRate >= 75 ? "success" : "warning"}
          />
          <StatCard
            label="Sessions held"
            value={totalSessions}
            icon={<Icon.Clock size={20} />}
            tone="accent"
          />
          <StatCard
            label="Completed"
            value={statusCounts.completed}
            icon={<Icon.Award size={20} />}
            tone="success"
          />
        </div>
      ) : null}

      {/* Low attendance warning */}
      {!loading && lowAttendance.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700/40 px-4 py-3 flex items-start gap-3">
          <Icon.AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-700 dark:text-amber-400">Low attendance warning</p>
            <p className="text-amber-600/90 dark:text-amber-400/80 text-xs mt-0.5">
              {lowAttendance.length === 1
                ? `${lowAttendance[0].class.courseTitle} has ${lowAttendance[0].attendanceRate}% attendance — below the 75% requirement.`
                : `${lowAttendance.length} classes have attendance below 75%. Improve attendance to avoid issues.`}
            </p>
          </div>
        </div>
      )}

      {/* Filters + search */}
      {!loading && classes.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <Tabs
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as PhysicalClassStatus | "all")}
            options={[
              { value: "all", label: "All", count: statusCounts.all },
              { value: "ongoing", label: "Ongoing", count: statusCounts.ongoing },
              { value: "upcoming", label: "Upcoming", count: statusCounts.upcoming },
              { value: "completed", label: "Completed", count: statusCounts.completed },
            ]}
          />
          <div className="flex items-center gap-2 sm:ml-auto">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search classes…"
              icon={<Icon.Search size={15} />}
              className="h-9 w-full sm:w-52"
            />
            {/* Grid / List toggle */}
            <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1 gap-1 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "h-7 w-7 flex items-center justify-center rounded-lg transition",
                  viewMode === "grid" ? "bg-[var(--surface)] shadow-sm text-[var(--primary)]" : "text-[var(--muted)]",
                )}
              >
                <svg width="13" height="13" viewBox="0 0 12 12" fill="currentColor">
                  <rect x="0" y="0" width="5" height="5" rx="1" /><rect x="7" y="0" width="5" height="5" rx="1" />
                  <rect x="0" y="7" width="5" height="5" rx="1" /><rect x="7" y="7" width="5" height="5" rx="1" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "h-7 w-7 flex items-center justify-center rounded-lg transition",
                  viewMode === "list" ? "bg-[var(--surface)] shadow-sm text-[var(--primary)]" : "text-[var(--muted)]",
                )}
              >
                <Icon.Menu size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton className="h-36 rounded-b-none rounded-t-2xl" />
              <CardBody className="space-y-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8" />
              </CardBody>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.Calendar size={28} />}
              title={
                classes.length === 0
                  ? "No physical classes yet"
                  : search
                    ? "No matching classes"
                    : `No ${statusFilter} classes`
              }
              description={
                classes.length === 0
                  ? "Apply for a course's in-person classes. Once approved and placed in a batch, it shows up here."
                  : "Try a different filter or search term."
              }
              action={
                classes.length === 0 ? (
                  <Link href="/applications">
                    <Button><Icon.FilePen size={16} /> View applications</Button>
                  </Link>
                ) : undefined
              }
            />
          </CardBody>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((c) => <GridClassCard key={c.enrollmentId} item={c} />)}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{filtered.length} class{filtered.length !== 1 ? "es" : ""}</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <ul className="divide-y divide-[var(--border)]">
              {filtered.map((c) => <ListClassRow key={c.enrollmentId} item={c} />)}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

/* ── Grid card ───────────────────────────────────────────────────── */
function GridClassCard({ item }: { item: MyPhysicalClass }) {
  const pc = item.class;
  const tone = rateTone(item.attendanceRate);
  const next = pc.status === "ongoing" || pc.status === "upcoming" ? nextSessionDate(pc.daysOfWeek) : null;

  return (
    <Card className="overflow-hidden flex flex-col">
      {/* Thumbnail */}
      <div className="relative h-36 bg-[var(--surface-2)] shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pc.courseThumbnail} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute top-2 right-2 flex gap-1.5">
          <Badge variant={STATUS_BADGE[pc.status]} className="capitalize backdrop-blur">
            {STATUS_LABEL[pc.status]}
          </Badge>
          {item.attendanceRate < 75 && pc.status === "ongoing" && (
            <Badge variant="danger" className="backdrop-blur">⚠ Low attendance</Badge>
          )}
        </div>
        {next && (
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur text-white text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1">
            <Icon.Calendar size={10} /> Next: {next}
          </div>
        )}
      </div>

      <CardBody className="flex-1 flex flex-col space-y-3">
        {/* Title */}
        <div>
          <h3 className="font-semibold leading-tight">{pc.title}</h3>
          <p className="text-xs text-[var(--muted)] mt-0.5">{pc.courseTitle}</p>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Info icon={<Icon.Pin size={12} />} label={pc.campus} />
          <Info icon={<Icon.Home size={12} />} label={`Room ${pc.room}`} />
          <Info icon={<Icon.Clock size={12} />} label={pc.batch} />
          <Info icon={<Icon.User size={12} />} label={pc.instructorName} />
        </div>

        {/* Days */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {pc.daysOfWeek.map((d) => (
            <span key={d} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
              {d}
            </span>
          ))}
          <span className="text-[10px] text-[var(--muted)] ml-auto">
            {formatDate(pc.startDate)} – {formatDate(pc.endDate)}
          </span>
        </div>

        {/* Attendance bar */}
        <div className="mt-auto pt-3 border-t border-[var(--border)] space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--muted)]">Attendance</span>
            <span className={cn("font-bold tabular-nums", RATE_COLOR[tone])}>
              {item.attendanceRate}%
              <span className="text-[var(--muted)] font-normal ml-1">({item.sessionsHeld} sessions)</span>
            </span>
          </div>
          <div className="h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", RATE_BAR[tone])}
              style={{ width: `${item.attendanceRate}%` }}
            />
          </div>
          {/* Attendance breakdown pills */}
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="text-emerald-500">✓ {item.present} present</span>
            {item.late > 0 && <span className="text-amber-500">~ {item.late} late</span>}
            {item.absent > 0 && <span className="text-red-500">✗ {item.absent} absent</span>}
            {item.excused > 0 && <span className="text-sky-500">◎ {item.excused} excused</span>}
          </div>
        </div>

        {/* CTA */}
        <Link href={`/physical-classes/${pc.id}`} className="block">
          <Button variant="outline" size="sm" className="w-full">
            View details <Icon.ChevronRight size={13} />
          </Button>
        </Link>
      </CardBody>
    </Card>
  );
}

/* ── List row ────────────────────────────────────────────────────── */
function ListClassRow({ item }: { item: MyPhysicalClass }) {
  const pc = item.class;
  const tone = rateTone(item.attendanceRate);
  const next = pc.status === "ongoing" || pc.status === "upcoming" ? nextSessionDate(pc.daysOfWeek) : null;

  return (
    <li className="px-5 py-4 flex items-center gap-4 hover:bg-[var(--surface-2)] transition group">
      <div className="h-12 w-16 rounded-lg overflow-hidden bg-[var(--surface-2)] shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pc.courseThumbnail} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold truncate">{pc.title}</p>
          <Badge variant={STATUS_BADGE[pc.status]} className="capitalize shrink-0">
            {STATUS_LABEL[pc.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-[var(--muted)] flex-wrap">
          <span className="flex items-center gap-1"><Icon.Pin size={11} />{pc.campus}</span>
          <span className="flex items-center gap-1"><Icon.Clock size={11} />{pc.batch}</span>
          <span className="flex items-center gap-1"><Icon.User size={11} />{pc.instructorName}</span>
          {next && <span className="flex items-center gap-1 text-[var(--primary)]"><Icon.Calendar size={11} />Next: {next}</span>}
        </div>
      </div>
      {/* Attendance */}
      <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 w-28">
        <span className={cn("text-sm font-bold tabular-nums", RATE_COLOR[tone])}>{item.attendanceRate}%</span>
        <div className="h-1.5 w-full bg-[var(--surface-2)] rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full", RATE_BAR[tone])} style={{ width: `${item.attendanceRate}%` }} />
        </div>
        <span className="text-[10px] text-[var(--muted)]">{item.sessionsHeld} sessions</span>
      </div>
      <Link href={`/physical-classes/${pc.id}`} className="shrink-0 opacity-0 group-hover:opacity-100 transition">
        <Button size="sm" variant="outline"><Icon.ChevronRight size={14} /></Button>
      </Link>
    </li>
  );
}

function Info({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[var(--muted)] min-w-0 text-xs">
      <span className="text-[var(--muted-2)] shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </span>
  );
}
