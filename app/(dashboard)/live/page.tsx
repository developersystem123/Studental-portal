"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, useToast } from "@/components/ui";
import Icon from "@/components/icons";
import { cn, formatDate, formatTime } from "@/lib/utils";

type LiveClass = {
  id: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail: string;
  title: string;
  description: string;
  instructor: string;
  meetingUrl: string;
  scheduledAt: string;
  durationMinutes: number;
  status: "upcoming" | "live" | "ended" | "cancelled";
  attendees: number;
  maxAttendees: number | null;
};

type FilterStatus = "all" | "live" | "upcoming" | "ended";

const STATUS_BADGE: Record<LiveClass["status"], "primary" | "success" | "default" | "danger"> = {
  upcoming: "primary",
  live: "success",
  ended: "default",
  cancelled: "danger",
};

function useCountdown(targetIso: string | null) {
  const [display, setDisplay] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!targetIso) return;
    function tick() {
      const diff = new Date(targetIso!).getTime() - Date.now();
      if (diff <= 0) { setDisplay("Starting now"); return; }
      const totalSec = Math.floor(diff / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      if (h > 0) setDisplay(`${h}h ${m}m`);
      else if (m > 0) setDisplay(`${m}m ${s}s`);
      else setDisplay(`${s}s`);
    }
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [targetIso]);

  return display;
}

function addToCalendar(c: LiveClass) {
  const start = new Date(c.scheduledAt);
  const end = new Date(start.getTime() + c.durationMinutes * 60_000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${c.title}`,
    `DESCRIPTION:${c.courseTitle} · ${c.instructor}`,
    `URL:${c.meetingUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${c.title.replace(/\s+/g, "-")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function SkeletonRow() {
  return (
    <div className="flex gap-3 p-3 animate-pulse">
      <div className="h-16 w-24 rounded-lg bg-[var(--surface-2)] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/2 rounded bg-[var(--surface-2)]" />
        <div className="h-3 w-2/3 rounded bg-[var(--surface-2)]" />
        <div className="h-3 w-1/3 rounded bg-[var(--surface-2)]" />
      </div>
      <div className="h-8 w-16 rounded-lg bg-[var(--surface-2)] shrink-0 self-center" />
    </div>
  );
}

export default function LiveClassesPage() {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [reminders, setReminders] = useState<Set<string>>(new Set());
  const { push } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/live-classes");
        const data = await r.json();
        if (!cancelled) {
          if (r.ok) setClasses(data.classes ?? []);
          else push({ title: "Couldn't load live classes", tone: "danger" });
        }
      } catch {
        if (!cancelled) push({ title: "Network error", tone: "danger" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const live = useMemo(() => classes.filter((c) => c.status === "live"), [classes]);
  const upcoming = useMemo(() => classes.filter((c) => c.status === "upcoming"), [classes]);
  const past = useMemo(() => classes.filter((c) => c.status === "ended" || c.status === "cancelled"), [classes]);

  const nextUpcoming = upcoming[0] ?? null;

  const filtered = useMemo(() => {
    if (filter === "all") return classes;
    if (filter === "live") return live;
    if (filter === "upcoming") return upcoming;
    return past;
  }, [classes, filter, live, upcoming, past]);

  const stats = {
    total: classes.length,
    live: live.length,
    upcoming: upcoming.length,
    past: past.length,
  };

  function toggleReminder(id: string, title: string) {
    setReminders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        push({ title: `Reminder removed for "${title}"`, tone: "info" });
      } else {
        next.add(id);
        push({ title: `You'll be reminded about "${title}"`, tone: "success" });
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Live Classes</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Join live sessions and watch recordings.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total sessions", value: stats.total, color: "text-[var(--primary)]", icon: <Icon.Video size={16} /> },
          { label: "Live now", value: stats.live, color: "text-emerald-500", icon: <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse inline-block" /> },
          { label: "Upcoming", value: stats.upcoming, color: "text-blue-500", icon: <Icon.Clock size={16} /> },
          { label: "Past sessions", value: stats.past, color: "text-[var(--muted)]", icon: <Icon.Play size={16} /> },
        ].map((s) => (
          <Card key={s.label}>
            <CardBody className="py-3 px-4">
              <div className="flex items-center gap-2">
                <span className={s.color}>{s.icon}</span>
                <div>
                  <p className="text-lg font-bold leading-none">{loading ? "—" : s.value}</p>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5">{s.label}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Next upcoming countdown */}
      {!loading && nextUpcoming && (
        <NextSessionBanner c={nextUpcoming} />
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[var(--muted)]">Show:</span>
        {(["all", "live", "upcoming", "ended"] as FilterStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg font-medium transition capitalize",
              filter === f
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]",
            )}
          >
            {f === "all"
              ? `All (${stats.total})`
              : f === "live"
                ? `Live (${stats.live})`
                : f === "upcoming"
                  ? `Upcoming (${stats.upcoming})`
                  : `Past (${stats.past})`}
          </button>
        ))}
      </div>

      {loading ? (
        <Card>
          <CardHeader><CardTitle>Sessions</CardTitle></CardHeader>
          <CardBody className="space-y-2 p-2">
            {[0, 1, 2].map((i) => <SkeletonRow key={i} />)}
          </CardBody>
        </Card>
      ) : classes.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.Video size={28} />}
              title="No live classes"
              description="Enroll in courses that include live sessions."
            />
          </CardBody>
        </Card>
      ) : filter === "all" ? (
        <>
          {live.length > 0 && (
            <Card className="ring-2 ring-emerald-500/40 bg-emerald-500/5">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live now
                </CardTitle>
                <span className="text-xs text-emerald-600 font-medium">{live.length} session{live.length > 1 ? "s" : ""}</span>
              </CardHeader>
              <CardBody className="space-y-3">
                {live.map((c) => (
                  <ClassRow key={c.id} c={c} reminders={reminders} onReminder={toggleReminder} onCalendar={addToCalendar} />
                ))}
              </CardBody>
            </Card>
          )}

          {upcoming.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Upcoming</CardTitle></CardHeader>
              <CardBody className="space-y-3">
                {upcoming.map((c) => (
                  <ClassRow key={c.id} c={c} reminders={reminders} onReminder={toggleReminder} onCalendar={addToCalendar} />
                ))}
              </CardBody>
            </Card>
          )}

          {past.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Past sessions</CardTitle></CardHeader>
              <CardBody className="space-y-3">
                {past.map((c) => (
                  <ClassRow key={c.id} c={c} reminders={reminders} onReminder={toggleReminder} onCalendar={addToCalendar} />
                ))}
              </CardBody>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardHeader><CardTitle className="capitalize">{filter}</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {filtered.length === 0 ? (
              <p className="text-sm text-[var(--muted)] text-center py-6">No {filter} sessions.</p>
            ) : (
              filtered.map((c) => (
                <ClassRow key={c.id} c={c} reminders={reminders} onReminder={toggleReminder} onCalendar={addToCalendar} />
              ))
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function NextSessionBanner({ c }: { c: LiveClass }) {
  const countdown = useCountdown(c.scheduledAt);
  return (
    <div className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary-soft)]/30 px-5 py-4 flex items-center gap-4 flex-wrap">
      <div className="h-10 w-10 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center shrink-0">
        <Icon.Video size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--muted)] font-medium">Next session</p>
        <p className="text-sm font-semibold truncate">{c.title}</p>
        <p className="text-xs text-[var(--muted)]">{c.courseTitle} · {formatDate(c.scheduledAt)} at {formatTime(c.scheduledAt)}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-2xl font-bold text-[var(--primary)] tabular-nums">{countdown}</p>
        <p className="text-[10px] text-[var(--muted)]">until session starts</p>
      </div>
    </div>
  );
}

function ClassRow({
  c, reminders, onReminder, onCalendar,
}: {
  c: LiveClass;
  reminders: Set<string>;
  onReminder: (id: string, title: string) => void;
  onCalendar: (c: LiveClass) => void;
}) {
  const [now] = useState(() => Date.now());
  const start = new Date(c.scheduledAt);
  const isJoinable = c.status === "live" || (c.status === "upcoming" && start.getTime() - now < 15 * 60_000);
  const attendancePct = c.maxAttendees ? Math.min(100, Math.round((c.attendees / c.maxAttendees) * 100)) : null;
  const isFull = c.maxAttendees !== null && c.attendees >= c.maxAttendees;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition group">
      <div className="relative shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.courseThumbnail} alt="" className="h-16 w-24 rounded-lg object-cover" />
        {c.status === "live" && (
          <span className="absolute top-1 left-1 flex items-center gap-1 text-[10px] font-bold text-white bg-emerald-500 px-1.5 py-0.5 rounded-md">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold">{c.title}</p>
          <Badge variant={STATUS_BADGE[c.status]}>{c.status}</Badge>
          {isFull && <Badge variant="danger">Full</Badge>}
        </div>
        <p className="text-xs text-[var(--muted)] mt-0.5">{c.courseTitle} · {c.instructor}</p>
        {c.description && (
          <p className="text-xs text-[var(--muted-2)] mt-0.5 line-clamp-1">{c.description}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-[var(--muted-2)] mt-1 flex-wrap">
          <span className="flex items-center gap-1">
            <Icon.Calendar size={11} /> {formatDate(c.scheduledAt)} at {formatTime(c.scheduledAt)}
          </span>
          <span>·</span>
          <span>{c.durationMinutes}m</span>
          {c.maxAttendees && (
            <>
              <span>·</span>
              <span>{c.attendees}/{c.maxAttendees} attending</span>
            </>
          )}
        </div>
        {attendancePct !== null && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-[var(--border)] overflow-hidden max-w-[120px]">
              <div
                className={cn("h-full rounded-full transition-all", attendancePct >= 90 ? "bg-red-500" : "bg-[var(--primary)]")}
                style={{ width: `${attendancePct}%` }}
              />
            </div>
            <span className="text-[10px] text-[var(--muted-2)]">{attendancePct}% capacity</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
        {c.status !== "cancelled" && c.status !== "ended" && (
          <>
            <button
              onClick={() => onReminder(c.id, c.title)}
              className={cn(
                "p-2 rounded-lg border transition text-sm",
                reminders.has(c.id)
                  ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-soft)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]",
              )}
              title={reminders.has(c.id) ? "Remove reminder" : "Set reminder"}
            >
              <Icon.Bell size={14} />
            </button>
            <button
              onClick={() => onCalendar(c)}
              className="p-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition"
              title="Add to calendar"
            >
              <Icon.Calendar size={14} />
            </button>
          </>
        )}

        {c.status === "ended" ? (
          <a href={c.meetingUrl} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">
              <Icon.Play size={12} /> Recording
            </Button>
          </a>
        ) : c.status === "cancelled" ? (
          <Badge variant="danger">Cancelled</Badge>
        ) : (
          <a href={isJoinable ? c.meetingUrl : undefined} target={isJoinable ? "_blank" : undefined} rel="noreferrer">
            <Button
              size="sm"
              disabled={!isJoinable}
              className={c.status === "live" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
            >
              <Icon.Video size={12} />
              {c.status === "live" ? "Join now" : isJoinable ? "Join" : "Not yet open"}
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}
