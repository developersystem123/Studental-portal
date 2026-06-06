"use client";

import * as React from "react";
import Icon from "@/components/icons";
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  Label,
  Modal,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";
import { useTeacher } from "@/lib/store";
import { formatTime } from "@/lib/utils";

type EventType = "class" | "exam" | "assignment" | "meeting" | "event";
type MainView = "upcoming" | "week" | "all" | "calendar";

type ScheduleEvent = {
  id: string;
  title: string;
  description: string | null;
  type: EventType;
  startTime: string;
  endTime: string;
  location: string | null;
  courseId: string | null;
  courseTitle: string | null;
};

const TYPE_META: Record<EventType, { label: string; icon: React.ReactNode; tint: string; dot: string }> = {
  class:      { label: "Class",        icon: <Icon.Video size={13} />,       tint: "from-emerald-600 to-green-500",   dot: "bg-emerald-500" },
  meeting:    { label: "Office Hours", icon: <Icon.User size={13} />,        tint: "from-teal-500 to-cyan-500",       dot: "bg-teal-500" },
  assignment: { label: "Deadline",     icon: <Icon.AlertCircle size={13} />, tint: "from-rose-500 to-red-500",        dot: "bg-rose-500" },
  exam:       { label: "Exam",         icon: <Icon.FilePen size={13} />,     tint: "from-amber-500 to-orange-500",    dot: "bg-amber-500" },
  event:      { label: "Event",        icon: <Icon.Calendar size={13} />,    tint: "from-violet-500 to-purple-500",   dot: "bg-violet-500" },
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

type FormState = {
  title: string; type: EventType; courseId: string;
  date: string; time: string; durationMinutes: string;
  location: string; description: string;
};

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, icon, tint, sub }: {
  label: string; value: number; icon: React.ReactNode; tint: string; sub?: string;
}) {
  return (
    <Card className="hover-lift">
      <CardBody className="flex items-center gap-3 !py-3">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>{icon}</div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</p>
          <p className="text-xl font-bold leading-tight">{value}</p>
          {sub && <p className="text-[10px] text-[var(--muted-2)]">{sub}</p>}
        </div>
      </CardBody>
    </Card>
  );
}

// ─── Calendar view ─────────────────────────────────────────────────────────────
function CalendarView({
  events, todayStr, onEdit, onAddOnDay,
}: {
  events: ScheduleEvent[]; todayStr: string;
  onEdit: (e: ScheduleEvent) => void; onAddOnDay: (date: string) => void;
}) {
  const [monthDate, setMonthDate] = React.useState(() => new Date());
  const [selectedDay, setSelectedDay] = React.useState<string>(todayStr);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDow + lastDay) / 7) * 7;

  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const e of events) {
      const k = e.startTime.slice(0, 10);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    }
    return map;
  }, [events]);

  const selectedEvents = (eventsByDay.get(selectedDay) ?? []).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  function prevMonth() { setMonthDate(new Date(year, month - 1)); }
  function nextMonth() { setMonthDate(new Date(year, month + 1)); }
  function goToday()   { setMonthDate(new Date()); setSelectedDay(todayStr); }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,260px] gap-4">
      {/* Calendar grid */}
      <div>
        {/* Month header */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] transition">
            <Icon.ChevronLeft size={15} />
          </button>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold">{MONTHS[month]} {year}</h3>
            <button onClick={goToday} className="text-xs text-[var(--primary)] hover:underline px-1.5 py-0.5 rounded border border-[var(--primary)]/30 hover:bg-[var(--primary)]/5 transition">
              Today
            </button>
          </div>
          <button onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] transition">
            <Icon.ChevronRight size={15} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: totalCells }, (_, i) => {
            const dayNum = i - firstDow + 1;
            if (dayNum < 1 || dayNum > lastDay) return <div key={`e-${i}`} className="min-h-[68px]" />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const dayEvents = eventsByDay.get(dateStr) ?? [];
            const isToday    = dateStr === todayStr;
            const isSelected = dateStr === selectedDay;
            const isPast     = dateStr < todayStr;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDay(dateStr)}
                className={`min-h-[68px] p-1.5 rounded-xl text-left transition flex flex-col border ${
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]"
                    : isToday
                    ? "border-[var(--primary)]/40 bg-[var(--primary)]/5"
                    : "border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-2)]"
                }`}
              >
                <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                  isToday ? "bg-[var(--primary)] text-white" : isPast ? "text-[var(--muted-2)]" : ""
                }`}>
                  {dayNum}
                </span>
                <div className="flex flex-wrap gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span key={e.id} className={`w-2 h-2 rounded-full ${TYPE_META[e.type].dot}`} title={e.title} />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[9px] text-[var(--muted)] font-semibold">+{dayEvents.length - 3}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-[var(--border)]">
          {(Object.entries(TYPE_META) as [EventType, typeof TYPE_META[EventType]][]).map(([, m]) => (
            <div key={m.label} className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
              <span className={`w-2 h-2 rounded-full ${m.dot}`} />
              {m.label}
            </div>
          ))}
        </div>
      </div>

      {/* Side panel */}
      <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-3 space-y-2 self-start">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">
            {new Date(selectedDay + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </p>
          {selectedDay === todayStr && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-white">Today</span>
          )}
        </div>

        {selectedEvents.length === 0 ? (
          <p className="text-xs text-[var(--muted)] py-2">No events on this day.</p>
        ) : (
          <div className="space-y-1.5">
            {selectedEvents.map((e) => {
              const meta = TYPE_META[e.type];
              const start = new Date(e.startTime);
              const dur = Math.round((new Date(e.endTime).getTime() - start.getTime()) / 60000);
              return (
                <button
                  key={e.id}
                  onClick={() => onEdit(e)}
                  className="w-full text-left rounded-lg bg-[var(--surface)] border border-[var(--border)] p-2.5 hover:border-[var(--primary)]/40 hover:shadow-sm transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-md text-white bg-gradient-to-br ${meta.tint} shrink-0`}>
                      {meta.icon}
                    </span>
                    <p className="text-xs font-semibold truncate">{e.title}</p>
                  </div>
                  <p className="text-[11px] text-[var(--muted)] mt-1">
                    {formatTime(start)} · {dur}min {e.location ? `· ${e.location}` : ""}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        <button
          onClick={() => onAddOnDay(selectedDay)}
          className="w-full flex items-center justify-center gap-1 text-xs text-[var(--primary)] hover:underline pt-1"
        >
          <Icon.Plus size={11} /> Add event on this day
        </button>
      </div>
    </div>
  );
}

// ─── Event row in list view ───────────────────────────────────────────────────
function EventRow({
  event, todayStr, onEdit,
}: {
  event: ScheduleEvent; todayStr: string; onEdit: (e: ScheduleEvent) => void;
}) {
  const meta = TYPE_META[event.type];
  const start = new Date(event.startTime);
  const dur = Math.round((new Date(event.endTime).getTime() - start.getTime()) / 60000);
  const isToday = event.startTime.slice(0, 10) === todayStr;
  const now = Date.now();

  function countdown(): { label: string; color: string } {
    const ms = new Date(event.startTime).getTime() - now;
    if (ms < 0) {
      const past = Math.abs(ms);
      const pastDays = Math.floor(past / 86400000);
      if (pastDays === 0) return { label: "Earlier today", color: "text-[var(--muted-2)]" };
      return { label: `${pastDays}d ago`, color: "text-[var(--muted-2)]" };
    }
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return { label: `In ${mins}m`, color: "text-amber-600 dark:text-amber-400" };
    const hrs = Math.floor(ms / 3600000);
    if (hrs < 24) return { label: `In ${hrs}h`, color: "text-amber-500" };
    const days = Math.floor(ms / 86400000);
    if (days === 1) return { label: "Tomorrow", color: "text-[var(--muted)]" };
    if (days <= 3) return { label: `In ${days}d`, color: "text-[var(--muted)]" };
    return { label: `In ${days}d`, color: "text-[var(--muted-2)]" };
  }

  const cd = countdown();

  return (
    <div className={`group flex items-center gap-4 p-3.5 rounded-xl border transition cursor-pointer ${
      isToday
        ? "border-[var(--primary)]/40 bg-[var(--primary)]/5"
        : "border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--surface-2)]/50"
    }`} onClick={() => onEdit(event)}>
      {/* Date badge */}
      <div className={`h-11 w-11 rounded-xl flex flex-col items-center justify-center text-white bg-gradient-to-br ${meta.tint} shrink-0`}>
        <span className="text-[9px] uppercase font-bold opacity-90 leading-none">
          {start.toLocaleDateString(undefined, { month: "short" })}
        </span>
        <span className="text-lg font-bold leading-tight">{start.getDate()}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {isToday && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-white font-bold uppercase tracking-wider">Today</span>
          )}
          <p className="font-semibold text-sm truncate">{event.title}</p>
          <Badge variant="default" className="text-[10px]">
            {meta.icon} {meta.label}
          </Badge>
        </div>
        <p className="text-xs text-[var(--muted)] mt-0.5 truncate">
          {event.courseTitle ?? "No course"} · {formatTime(start)} · {dur}min
          {event.location ? ` · ${event.location}` : ""}
        </p>
        {event.description && (
          <p className="text-xs text-[var(--muted-2)] mt-0.5 truncate">{event.description}</p>
        )}
      </div>

      {/* Countdown */}
      <span className={`text-xs font-semibold shrink-0 ${cd.color}`}>{cd.label}</span>

      {/* Edit hint */}
      <Icon.ChevronRight size={14} className="text-[var(--muted-2)] opacity-0 group-hover:opacity-100 transition shrink-0" />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TeacherSchedulePage() {
  const teacher = useTeacher();
  const courses = teacher.myCourses();
  const toast = useToast();

  const [events, setEvents]     = React.useState<ScheduleEvent[]>([]);
  const [loading, setLoading]   = React.useState(true);
  const [view, setView]         = React.useState<MainView>("upcoming");
  const [typeFilter, setTypeFilter] = React.useState<EventType | "all">("all");
  const [query, setQuery]       = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing]   = React.useState<ScheduleEvent | null>(null);
  const [saving, setSaving]     = React.useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const now = Date.now();
  const inOneWeek = now + 1000 * 60 * 60 * 24 * 7;

  const blank = (date?: string): FormState => ({
    title: "", type: "class", courseId: "",
    date: date ?? todayStr,
    time: "10:00", durationMinutes: "60",
    location: "", description: "",
  });
  const [form, setForm] = React.useState<FormState>(blank());

  const load = React.useCallback(async () => {
    const r = await fetch("/api/schedule");
    const data = r.ok ? await r.json() : { events: [] };
    setEvents(data.events ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  // ── Stats ──
  const totalEvents    = events.length;
  const todayEvents    = events.filter((e) => e.startTime.slice(0, 10) === todayStr).length;
  const thisWeekEvents = events.filter((e) => { const t = new Date(e.startTime).getTime(); return t >= now && t <= inOneWeek; }).length;
  const pastEvents     = events.filter((e) => new Date(e.startTime).getTime() < now).length;

  // ── Filter + sort for list view ──
  const sorted = [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const listFiltered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((e) => {
      const t = new Date(e.startTime).getTime();
      if (view === "upcoming" && t < now) return false;
      if (view === "week" && (t < now || t > inOneWeek)) return false;
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (q && !e.title.toLowerCase().includes(q) && !(e.courseTitle ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [sorted, view, typeFilter, query, now, inOneWeek]);

  // ── Group by date ──
  const groupedByDate = React.useMemo(() => {
    const groups = new Map<string, ScheduleEvent[]>();
    for (const e of listFiltered) {
      const key = e.startTime.slice(0, 10);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    }
    return Array.from(groups.entries());
  }, [listFiltered]);

  function formatDateHeader(dateStr: string) {
    const d = new Date(dateStr + "T12:00:00");
    if (dateStr === todayStr) return "Today";
    const tomorrow = new Date(now + 86400000).toISOString().slice(0, 10);
    if (dateStr === tomorrow) return "Tomorrow";
    return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  }

  // ── Form helpers ──
  function openCreate(date?: string) {
    setEditing(null);
    setForm(blank(date));
    setFormOpen(true);
  }

  function openEdit(e: ScheduleEvent) {
    setEditing(e);
    const start = new Date(e.startTime);
    const dur = Math.round((new Date(e.endTime).getTime() - start.getTime()) / 60000);
    setForm({
      title: e.title, type: e.type, courseId: e.courseId ?? "",
      date: start.toISOString().slice(0, 10),
      time: start.toTimeString().slice(0, 5),
      durationMinutes: String(dur || 60),
      location: e.location ?? "", description: e.description ?? "",
    });
    setFormOpen(true);
  }

  function duplicate(e: ScheduleEvent) {
    setEditing(null);
    const start = new Date(e.startTime);
    const dur = Math.round((new Date(e.endTime).getTime() - start.getTime()) / 60000);
    setForm({
      title: `${e.title} (copy)`, type: e.type, courseId: e.courseId ?? "",
      date: start.toISOString().slice(0, 10),
      time: start.toTimeString().slice(0, 5),
      durationMinutes: String(dur || 60),
      location: e.location ?? "", description: e.description ?? "",
    });
    setFormOpen(true);
  }

  async function submit() {
    if (!form.title.trim()) {
      toast.push({ title: "Title is required", tone: "danger" });
      return;
    }
    setSaving(true);
    const start = new Date(`${form.date}T${form.time}:00`);
    const end = new Date(start.getTime() + Number(form.durationMinutes || 60) * 60000);
    const payload = {
      title: form.title.trim(), type: form.type,
      courseId: form.courseId || null,
      startTime: start.toISOString(), endTime: end.toISOString(),
      location: form.location.trim() || null,
      description: form.description.trim() || null,
    };
    const r = await fetch(editing ? `/api/schedule/${editing.id}` : "/api/schedule", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      toast.push({ title: "Couldn't save event", description: e.error, tone: "danger" });
      return;
    }
    toast.push({ title: editing ? "Event updated" : "Event created", tone: "success" });
    setFormOpen(false);
    load();
  }

  async function remove(e: ScheduleEvent) {
    if (!confirm(`Delete "${e.title}"?`)) return;
    const r = await fetch(`/api/schedule/${e.id}`, { method: "DELETE" });
    if (r.ok) {
      toast.push({ title: "Event deleted", tone: "info" });
      setFormOpen(false);
      load();
    }
  }

  const VIEW_OPTIONS: { key: MainView; label: string; icon: React.ReactNode }[] = [
    { key: "upcoming", label: "Upcoming",  icon: <Icon.TrendingUp size={13} /> },
    { key: "week",     label: "This Week", icon: <Icon.Clock size={13} /> },
    { key: "all",      label: "All",       icon: <Icon.ListChecks size={13} /> },
    { key: "calendar", label: "Calendar",  icon: <Icon.Calendar size={13} /> },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Teaching</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="mt-1 text-[var(--muted)]">
            Your classes, office hours, deadlines, and exams in one place.
          </p>
        </div>
        <Button onClick={() => openCreate()}>
          <Icon.Plus size={16} /> Add event
        </Button>
      </div>

      {/* Stats */}
      {events.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatPill label="Total Events"  value={totalEvents}    icon={<Icon.Calendar size={16} />} tint="bg-[var(--primary-soft)] text-[var(--primary)]"              sub="all time" />
          <StatPill label="Today"         value={todayEvents}    icon={<Icon.Clock size={16} />}    tint="bg-amber-500/10 text-amber-600 dark:text-amber-400"          sub={todayEvents > 0 ? "scheduled" : "nothing today"} />
          <StatPill label="This Week"     value={thisWeekEvents} icon={<Icon.TrendingUp size={16} />} tint="bg-sky-500/10 text-sky-600 dark:text-sky-400"              sub="next 7 days" />
          <StatPill label="Past Events"   value={pastEvents}     icon={<Icon.CheckCircle size={16} />} tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" sub="completed" />
        </div>
      )}

      {/* Today's banner */}
      {todayEvents > 0 && (
        <div className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[var(--primary)]/15 flex items-center justify-center shrink-0">
            <Icon.Bell size={15} className="text-[var(--primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--primary)]">
              {todayEvents} event{todayEvents !== 1 ? "s" : ""} today
            </p>
            <p className="text-xs text-[var(--muted)] truncate">
              {events.filter((e) => e.startTime.slice(0, 10) === todayStr).map((e) => e.title).join(" · ")}
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardBody className="space-y-4">
          {/* View tabs */}
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] gap-3 items-center">
            <div className="grid grid-cols-4 gap-1.5 min-w-0 w-full">
              {VIEW_OPTIONS.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`inline-flex w-full items-center justify-center gap-1.5 px-2 xl:px-3 h-8 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                    view === key
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Search — only in list views */}
            {view !== "calendar" && (
              <Input
                icon={<Icon.Search size={14} />}
                placeholder="Search events…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full !h-8 text-sm"
              />
            )}
          </div>

          {/* Type filter chips — list views only */}
          {view !== "calendar" && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setTypeFilter("all")}
                className={`inline-flex items-center gap-1 px-2.5 h-7 rounded-full text-xs font-semibold transition border ${
                  typeFilter === "all"
                    ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--foreground)]/40"
                }`}
              >
                All
                <span className="ml-0.5 text-[10px]">({events.length})</span>
              </button>
              {(Object.entries(TYPE_META) as [EventType, typeof TYPE_META[EventType]][]).map(([key, meta]) => {
                const count = events.filter((e) => e.type === key).length;
                if (count === 0) return null;
                return (
                  <button
                    key={key}
                    onClick={() => setTypeFilter(key === typeFilter ? "all" : key)}
                    className={`inline-flex items-center gap-1 px-2.5 h-7 rounded-full text-xs font-semibold transition border ${
                      typeFilter === key
                        ? `bg-gradient-to-r ${meta.tint} text-white border-transparent`
                        : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--foreground)]/40"
                    }`}
                  >
                    {meta.icon} {meta.label}
                    <span className="ml-0.5 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-[var(--surface-2)] animate-pulse" />
              ))}
            </div>
          ) : view === "calendar" ? (
            <CalendarView events={events} todayStr={todayStr} onEdit={openEdit} onAddOnDay={openCreate} />
          ) : listFiltered.length === 0 ? (
            <EmptyState
              icon={<Icon.Calendar size={20} />}
              title={events.length === 0 ? "Nothing scheduled" : "No events match"}
              description={
                events.length === 0
                  ? "Add a class, office hour, or exam to get started."
                  : "Try a different filter or clear the search."
              }
              action={
                events.length === 0 ? (
                  <Button onClick={() => openCreate()}>
                    <Icon.Plus size={14} /> Add event
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => { setQuery(""); setTypeFilter("all"); }}>
                    Clear filters
                  </Button>
                )
              }
            />
          ) : (
            <div className="space-y-4">
              {groupedByDate.map(([dateStr, dayEvents]) => (
                <div key={dateStr}>
                  {/* Date header */}
                  <div className="flex items-center gap-2 mb-2">
                    <p className={`text-xs font-bold uppercase tracking-wider ${dateStr === todayStr ? "text-[var(--primary)]" : "text-[var(--muted)]"}`}>
                      {formatDateHeader(dateStr)}
                    </p>
                    <div className="flex-1 h-px bg-[var(--border)]" />
                    <span className="text-[10px] text-[var(--muted-2)]">
                      {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {dayEvents.map((e) => (
                      <EventRow key={e.id} event={e} todayStr={todayStr} onEdit={openEdit} />
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-xs text-[var(--muted-2)] pt-1 border-t border-[var(--border)]">
                {listFiltered.length} event{listFiltered.length !== 1 ? "s" : ""}
                {listFiltered.length !== events.length && ` (filtered from ${events.length})`}
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Event form modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} size="lg" title={editing ? "Edit event" : "New event"}>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Lecture 5 — Hooks Deep Dive"
                maxLength={120}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as EventType })}>
                {(Object.entries(TYPE_META) as [EventType, typeof TYPE_META[EventType]][]).map(([k, m]) => (
                  <option key={k} value={k}>{m.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Course (optional)</Label>
              <Select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                <option value="">No course</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
            <div>
              <Label>Duration (min)</Label>
              <Input type="number" min={5} step={5} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Room 204 / Zoom link" />
            </div>
            <div className="sm:col-span-2">
              <Label>Notes</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>

          {/* Type preview strip */}
          {form.type && (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-white text-sm font-medium bg-gradient-to-r ${TYPE_META[form.type].tint}`}>
              {TYPE_META[form.type].icon}
              <span>{TYPE_META[form.type].label}</span>
              {form.date && form.time && (
                <span className="ml-auto text-xs opacity-90">
                  {new Date(`${form.date}T${form.time}`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} at {form.time}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap justify-between gap-2 pt-2 border-t border-[var(--border)]">
            <div className="flex gap-2">
              {editing && (
                <>
                  <Button type="button" variant="danger" onClick={() => remove(editing)}>
                    <Icon.Trash size={14} /> Delete
                  </Button>
                  <Button type="button" variant="outline" onClick={() => duplicate(editing)} disabled={saving}>
                    <Icon.Copy size={14} /> Duplicate
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={submit} loading={saving}>
                <Icon.Save size={14} /> {editing ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
