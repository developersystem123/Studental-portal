"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Select,
  Textarea,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { cn, formatDate, formatTime } from "@/lib/utils";

type EventType = "class" | "exam" | "assignment" | "meeting" | "event";

type Event = {
  id: string;
  title: string;
  description: string | null;
  type: EventType;
  startTime: string;
  endTime: string;
  location: string | null;
  meetingUrl: string | null;
  courseId: string | null;
  courseTitle: string | null;
};

const TYPE_STYLES: Record<EventType, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
  class:      { bg: "bg-violet-500/10", text: "text-violet-600", border: "border-violet-300/40", icon: <Icon.Book size={14} />, label: "Class" },
  exam:       { bg: "bg-red-500/10",    text: "text-red-600",    border: "border-red-300/40",    icon: <Icon.FilePen size={14} />, label: "Exam" },
  assignment: { bg: "bg-amber-500/10",  text: "text-amber-600",  border: "border-amber-300/40",  icon: <Icon.FilePen size={14} />, label: "Assignment" },
  meeting:    { bg: "bg-sky-500/10",    text: "text-sky-600",    border: "border-sky-300/40",    icon: <Icon.Video size={14} />, label: "Meeting" },
  event:      { bg: "bg-emerald-500/10",text: "text-emerald-600",border: "border-emerald-300/40",icon: <Icon.Calendar size={14} />, label: "Event" },
};

type FilterType = "all" | EventType;

function relativeLabel(iso: string, nowMs: number): string {
  const diff = new Date(iso).getTime() - nowMs;
  if (diff < 0) return "";
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `in ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `in ${h}h`;
  const d = Math.floor(h / 24);
  return `in ${d}d`;
}

function durationLabel(startIso: string, endIso: string): string {
  const m = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 p-4 animate-pulse">
      <div className="h-10 w-10 rounded-lg bg-[var(--surface-2)] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/2 rounded bg-[var(--surface-2)]" />
        <div className="h-3 w-1/3 rounded bg-[var(--surface-2)]" />
      </div>
    </div>
  );
}

// Build a 7-day calendar strip (today + next 6 days), with dot if event on that day
function WeekStrip({ events, now }: { events: Event[]; now: number }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    return d;
  });
  const eventDays = new Set(events.map((e) => new Date(e.startTime).toDateString()));
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((d, i) => {
        const key = d.toDateString();
        const hasEvent = eventDays.has(key);
        const isToday = i === 0;
        return (
          <div
            key={key}
            className={cn(
              "flex flex-col items-center gap-1 py-2 rounded-xl transition",
              isToday ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-2)] text-[var(--muted)]",
            )}
          >
            <span className="text-[10px] font-medium">{labels[d.getDay()]}</span>
            <span className={cn("text-sm font-bold", isToday ? "text-white" : "text-[var(--foreground)]")}>
              {d.getDate()}
            </span>
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                hasEvent
                  ? isToday
                    ? "bg-white"
                    : "bg-[var(--primary)]"
                  : "opacity-0",
              )}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function SchedulePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Event | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [form, setForm] = useState({
    title: "", description: "", type: "event" as EventType,
    startTime: "", endTime: "", location: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { push } = useToast();
  const [now] = useState(() => Date.now());

  async function load() {
    try {
      const r = await fetch("/api/schedule");
      const data = await r.json();
      if (r.ok) setEvents(data.events ?? []);
      else push({ title: "Couldn't load events", tone: "danger" });
    } catch {
      push({ title: "Network error", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/schedule");
        const data = await r.json();
        if (!cancelled) {
          if (r.ok) setEvents(data.events ?? []);
          else push({ title: "Couldn't load events", tone: "danger" });
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

  function openAdd() {
    setEditTarget(null);
    setForm({ title: "", description: "", type: "event", startTime: "", endTime: "", location: "" });
    setOpen(true);
  }

  function openEdit(e: Event) {
    setEditTarget(e);
    const toLocal = (iso: string) => {
      const d = new Date(iso);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setForm({
      title: e.title,
      description: e.description ?? "",
      type: e.type,
      startTime: toLocal(e.startTime),
      endTime: toLocal(e.endTime),
      location: e.location ?? "",
    });
    setOpen(true);
  }

  async function save() {
    if (!form.title || !form.startTime || !form.endTime) {
      push({ title: "Missing fields", description: "Title, start, and end are required.", tone: "warning" });
      return;
    }
    if (new Date(form.endTime) <= new Date(form.startTime)) {
      push({ title: "End must be after start", tone: "warning" });
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description || undefined,
      type: form.type,
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
      location: form.location || undefined,
    };
    const url = editTarget ? `/api/schedule/${editTarget.id}` : "/api/schedule";
    const method = editTarget ? "PATCH" : "POST";
    try {
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) { push({ title: "Couldn't save", tone: "danger" }); return; }
      push({ title: editTarget ? "Event updated" : "Event added", tone: "success" });
      setOpen(false);
      setEditTarget(null);
      load();
    } catch {
      push({ title: "Network error — couldn't save event", tone: "danger" });
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setDeleteId(id);
    try {
      const r = await fetch(`/api/schedule/${id}`, { method: "DELETE" });
      if (!r.ok) { push({ title: "Couldn't delete event", tone: "danger" }); return; }
      load();
    } catch {
      push({ title: "Network error", tone: "danger" });
    } finally {
      setDeleteId(null);
    }
  }

  const upcoming = useMemo(
    () => events.filter((e) => new Date(e.endTime).getTime() >= now),
    [events, now],
  );
  const past = useMemo(
    () => events.filter((e) => new Date(e.endTime).getTime() < now),
    [events, now],
  );

  const todayEvents = upcoming.filter((e) => isToday(e.startTime));
  const laterEvents = upcoming.filter((e) => !isToday(e.startTime));

  function filterEvents(list: Event[]) {
    if (filter === "all") return list;
    return list.filter((e) => e.type === filter);
  }

  const grouped = filterEvents(laterEvents).reduce<Record<string, Event[]>>((acc, e) => {
    const key = new Date(e.startTime).toDateString();
    acc[key] = acc[key] ?? [];
    acc[key].push(e);
    return acc;
  }, {});

  const stats = {
    total: events.length,
    upcoming: upcoming.length,
    today: todayEvents.length,
    past: past.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Schedule</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Classes, exams, and personal events.</p>
        </div>
        <Button onClick={openAdd}><Icon.Plus size={14} /> Add event</Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total events", value: stats.total, color: "text-[var(--primary)]", icon: <Icon.Calendar size={16} /> },
          { label: "Upcoming", value: stats.upcoming, color: "text-blue-500", icon: <Icon.Clock size={16} /> },
          { label: "Today", value: stats.today, color: "text-emerald-500", icon: <Icon.Sparkles size={16} /> },
          { label: "Past events", value: stats.past, color: "text-[var(--muted)]", icon: <Icon.Check size={16} /> },
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

      {/* Week strip */}
      {!loading && (
        <Card>
          <CardBody className="py-3 px-4">
            <p className="text-xs font-medium text-[var(--muted)] mb-2">This week</p>
            <WeekStrip events={upcoming} now={now} />
          </CardBody>
        </Card>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[var(--muted)]">Filter:</span>
        {(["all", "class", "exam", "assignment", "meeting", "event"] as FilterType[]).map((f) => (
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
            {f === "all" ? "All" : TYPE_STYLES[f].label}
          </button>
        ))}
      </div>

      {loading ? (
        <Card>
          <CardHeader><CardTitle>Upcoming</CardTitle></CardHeader>
          <CardBody className="p-0">
            {[0, 1, 2].map((i) => <SkeletonRow key={i} />)}
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Today section */}
          {filterEvents(todayEvents).length > 0 && (
            <Card className="ring-2 ring-[var(--primary)]/30 bg-[var(--primary-soft)]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--primary)] animate-pulse" />
                  Today
                </CardTitle>
              </CardHeader>
              <CardBody className="p-0">
                {filterEvents(todayEvents).map((e) => (
                  <EventRow key={e.id} e={e} now={now} onEdit={openEdit} onDelete={remove} deleting={deleteId === e.id} />
                ))}
              </CardBody>
            </Card>
          )}

          {/* Upcoming by date */}
          <Card>
            <CardHeader><CardTitle>Upcoming</CardTitle></CardHeader>
            <CardBody className="p-0">
              {Object.keys(grouped).length === 0 ? (
                <EmptyState
                  icon={<Icon.Calendar size={28} />}
                  title="Nothing scheduled"
                  description={filter !== "all" ? `No ${filter} events upcoming.` : "Add an event or wait for course events."}
                  action={<Button onClick={openAdd}><Icon.Plus size={14} /> Add event</Button>}
                />
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {Object.entries(grouped).map(([day, items]) => (
                    <li key={day}>
                      <div className="px-5 py-2.5 bg-[var(--surface-2)] text-xs font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center justify-between">
                        <span>{formatDate(day)}</span>
                        <span className="text-[10px] text-[var(--muted-2)]">{items.length} event{items.length > 1 ? "s" : ""}</span>
                      </div>
                      {items.map((e) => (
                        <EventRow key={e.id} e={e} now={now} onEdit={openEdit} onDelete={remove} deleting={deleteId === e.id} />
                      ))}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Past events */}
          {past.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Past events</CardTitle>
                  <span className="text-xs text-[var(--muted)]">{past.length} event{past.length > 1 ? "s" : ""}</span>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <ul className="divide-y divide-[var(--border)]">
                  {past.slice(0, 10).map((e) => {
                    const s = TYPE_STYLES[e.type];
                    return (
                      <li key={e.id} className="p-4 flex items-center gap-3 opacity-60">
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", s.bg, s.text)}>
                          {s.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{e.title}</p>
                          <p className="text-xs text-[var(--muted-2)]">{formatDate(e.startTime)} · {formatTime(e.startTime)} · {durationLabel(e.startTime, e.endTime)}</p>
                        </div>
                        <Badge variant="default" className={cn("text-[10px]", s.text, s.bg)}>{e.type}</Badge>
                      </li>
                    );
                  })}
                </ul>
              </CardBody>
            </Card>
          )}
        </>
      )}

      {/* Add / Edit modal */}
      <Modal open={open} onClose={() => { setOpen(false); setEditTarget(null); }} title={editTarget ? "Edit event" : "Add event"} size="lg">
        {(() => {
          const s = TYPE_STYLES[form.type];
          const hasDuration = form.startTime && form.endTime && new Date(form.endTime) > new Date(form.startTime);
          const dur = hasDuration ? durationLabel(new Date(form.startTime).toISOString(), new Date(form.endTime).toISOString()) : null;

          return (
            <div className="space-y-0">
              {/* ── Live preview banner ── */}
              <div className={cn("mx-5 mt-1 mb-4 rounded-xl p-4 flex items-center gap-3 border", s.bg, s.border)}>
                <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0 bg-white/60", s.text)}>
                  {s.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-semibold text-sm truncate", s.text)}>
                    {form.title || <span className="opacity-50 italic">Event title…</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", s.bg, s.text, s.border)}>{s.label}</span>
                    {form.startTime && (
                      <span className="text-[10px] text-[var(--muted)] flex items-center gap-1">
                        <Icon.Clock size={10} />
                        {new Date(form.startTime).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        {" "}·{" "}
                        {new Date(form.startTime).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        {dur && <> · <strong>{dur}</strong></>}
                      </span>
                    )}
                    {form.location && (
                      <span className="text-[10px] text-[var(--muted)] flex items-center gap-1">
                        <Icon.Pin size={10} /> {form.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-5 space-y-5">
                {/* ── Details section ── */}
                <SchedSectionLabel icon={<Icon.FilePen size={12} />} label="EVENT DETAILS" />

                <div>
                  <Label>Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Study session, Final exam…"
                  />
                </div>

                {/* Type card picker */}
                <div>
                  <Label>Type</Label>
                  <div className="grid grid-cols-5 gap-2 mt-1">
                    {(["event", "class", "exam", "assignment", "meeting"] as EventType[]).map((t) => {
                      const ts = TYPE_STYLES[t];
                      const active = form.type === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setForm({ ...form, type: t })}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all text-center",
                            active
                              ? `${ts.bg} ${ts.text} border-current shadow-sm scale-[1.03]`
                              : "bg-[var(--surface-2)] text-[var(--muted)] border-transparent hover:border-[var(--border)] hover:text-[var(--foreground)]",
                          )}
                        >
                          <span className={cn("h-7 w-7 rounded-lg flex items-center justify-center", active ? "bg-white/50" : "bg-[var(--surface)]")}>
                            {ts.icon}
                          </span>
                          <span className="text-[10px] font-semibold leading-none">{ts.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Timing section ── */}
                <SchedSectionLabel icon={<Icon.Clock size={12} />} label="TIMING" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Start</Label>
                    <Input
                      type="datetime-local"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End</Label>
                    <Input
                      type="datetime-local"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    />
                  </div>
                </div>

                {dur && (
                  <div className="flex items-center gap-2 -mt-2 px-3 py-2 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Icon.Clock size={13} />
                    <span className="text-xs font-medium">Duration: <strong>{dur}</strong></span>
                  </div>
                )}

                {/* ── Location & Notes section ── */}
                <SchedSectionLabel icon={<Icon.Pin size={12} />} label="LOCATION & NOTES" />

                <div>
                  <Label>Location <span className="text-[var(--muted)] font-normal">(optional)</span></Label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g., Room B-204, Zoom, Library…"
                  />
                </div>

                <div>
                  <Label>Notes <span className="text-[var(--muted)] font-normal">(optional)</span></Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Any extra details, links, or reminders…"
                    rows={3}
                  />
                </div>

                {/* ── Footer ── */}
                <div className="flex justify-end gap-2 pt-1 pb-2">
                  <Button variant="outline" onClick={() => { setOpen(false); setEditTarget(null); }}>Cancel</Button>
                  <Button onClick={save} loading={saving}>
                    {editTarget ? <><Icon.Check size={14} /> Save changes</> : <><Icon.Plus size={14} /> Add event</>}
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

function SchedSectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 -mb-1">
      <span className="h-5 w-5 rounded-md bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">{icon}</span>
      <span className="text-[10px] font-bold tracking-widest text-[var(--primary)]">{label}</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

function EventRow({
  e, now, onEdit, onDelete, deleting,
}: {
  e: Event;
  now: number;
  onEdit: (e: Event) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const s = TYPE_STYLES[e.type];
  const countdown = relativeLabel(e.startTime, now);
  const dur = durationLabel(e.startTime, e.endTime);
  return (
    <div className="flex items-start gap-3 p-4 group hover:bg-[var(--surface-2)] transition">
      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", s.bg, s.text)}>
        {s.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold">{e.title}</p>
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", s.bg, s.text, s.border)}>
            {e.type}
          </span>
          {countdown && (
            <span className="text-[10px] font-medium text-[var(--primary)] bg-[var(--primary-soft)] px-2 py-0.5 rounded-full">
              {countdown}
            </span>
          )}
        </div>
        {e.description && (
          <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-1">{e.description}</p>
        )}
        <p className="text-xs text-[var(--muted-2)] mt-1 flex items-center gap-1 flex-wrap">
          {formatTime(e.startTime)} – {formatTime(e.endTime)}
          <span className="text-[var(--border)]">·</span>
          <span>{dur}</span>
          {e.location && <><span className="text-[var(--border)]">·</span><Icon.Globe size={10} /> {e.location}</>}
          {e.courseTitle && <><span className="text-[var(--border)]">·</span>{e.courseTitle}</>}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
        {e.meetingUrl && (
          <a href={e.meetingUrl} target="_blank" rel="noreferrer">
            <button className="p-1.5 rounded-lg text-[var(--muted)] hover:text-sky-500 hover:bg-sky-500/10 transition" title="Join meeting">
              <Icon.Video size={14} />
            </button>
          </a>
        )}
        {!e.courseId && (
          <>
            <button
              onClick={() => onEdit(e)}
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition"
              title="Edit"
            >
              <Icon.Edit size={14} />
            </button>
            <button
              onClick={() => onDelete(e.id)}
              disabled={deleting}
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 transition"
              title="Delete"
            >
              {deleting ? <Icon.Loader size={14} /> : <Icon.Trash size={14} />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
