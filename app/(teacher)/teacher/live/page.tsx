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
import { formatDate, formatTime } from "@/lib/utils";

type Status = "upcoming" | "live" | "ended" | "cancelled";

type LiveClass = {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  meetingUrl: string;
  scheduledAt: string;
  durationMinutes: number;
  status: Status;
  attendees: number;
  maxAttendees?: number | null;
};

type FormState = {
  courseId: string;
  title: string;
  description: string;
  meetingUrl: string;
  date: string;
  time: string;
  durationMinutes: string;
  status: Status;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function countdown(scheduledAt: string): { text: string; urgent: boolean } | null {
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const totalMins = Math.floor(diff / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours >= 24) return { text: `In ${Math.floor(hours / 24)}d`, urgent: false };
  if (hours > 0) return { text: `In ${hours}h ${mins}m`, urgent: hours < 3 };
  return { text: `In ${mins}m`, urgent: true };
}

function CopyLinkButton({ url, label = "Copy link" }: { url: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);
  function copy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button size="sm" variant="outline" onClick={copy}>
      {copied ? (
        <><Icon.Check size={13} /> Copied!</>
      ) : (
        <><Icon.Copy size={13} /> {label}</>
      )}
    </Button>
  );
}

// ── Stat pill ──────────────────────────────────────────────────────────────────

function StatPill({
  label, value, sub, icon, tint,
}: {
  label: string; value: number; sub?: string; icon: React.ReactNode; tint: string;
}) {
  return (
    <Card className="hover-lift">
      <CardBody className="flex items-center gap-3 !py-3">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</p>
          <p className="text-xl font-bold leading-tight">{value}</p>
          {sub && <p className="text-[10px] text-[var(--muted-2)]">{sub}</p>}
        </div>
      </CardBody>
    </Card>
  );
}

// ── Single class card ──────────────────────────────────────────────────────────

function ClassCard({
  cls, onEdit, onStart, onEnd, onCancel,
}: {
  cls: LiveClass;
  onEdit: (c: LiveClass) => void;
  onStart: (c: LiveClass) => void;
  onEnd: (c: LiveClass) => void;
  onCancel: (c: LiveClass) => void;
}) {
  const isLive     = cls.status === "live";
  const isUpcoming = cls.status === "upcoming";
  const isPast     = cls.status === "ended" || cls.status === "cancelled";
  const cd         = isUpcoming ? countdown(cls.scheduledAt) : null;
  const fillPct    =
    cls.maxAttendees && cls.maxAttendees > 0
      ? Math.min(100, Math.round((cls.attendees / cls.maxAttendees) * 100))
      : null;

  return (
    <Card
      className={`overflow-hidden transition-shadow ${
        isLive
          ? "border-rose-500/50 shadow-rose-500/10 shadow-lg"
          : "hover:shadow-md"
      }`}
    >
      {/* Live indicator bar */}
      {isLive && (
        <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 animate-pulse" />
      )}

      <CardBody className="space-y-3">
        {/* Top row */}
        <div className="flex items-start gap-3">
          <div
            className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
              isLive
                ? "bg-rose-500/15 text-rose-500"
                : isPast
                  ? "bg-[var(--surface-2)] text-[var(--muted)]"
                  : "bg-[var(--primary-soft)] text-[var(--primary)]"
            }`}
          >
            <Icon.Video size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{cls.title}</p>
            <p className="text-xs text-[var(--muted)] truncate">{cls.courseTitle}</p>
          </div>

          {/* Status badge */}
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500 text-white text-[11px] font-bold uppercase tracking-wider shrink-0">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              Live
            </span>
          ) : isUpcoming ? (
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge variant="info">Upcoming</Badge>
              {cd && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    cd.urgent
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "bg-[var(--surface-2)] text-[var(--muted)]"
                  }`}
                >
                  {cd.text}
                </span>
              )}
            </div>
          ) : cls.status === "cancelled" ? (
            <Badge variant="danger">Cancelled</Badge>
          ) : (
            <Badge variant="default">Ended</Badge>
          )}
        </div>

        {/* Description */}
        {cls.description && (
          <p className="text-sm text-[var(--muted)] line-clamp-2">{cls.description}</p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--muted-2)]">
          <span className="inline-flex items-center gap-1">
            <Icon.Calendar size={11} /> {formatDate(cls.scheduledAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon.Clock size={11} /> {formatTime(new Date(cls.scheduledAt))} · {cls.durationMinutes}m
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon.Users size={11} />
            {cls.attendees}
            {cls.maxAttendees ? ` / ${cls.maxAttendees}` : ""} attendees
          </span>
        </div>

        {/* Attendee capacity bar */}
        {fillPct !== null && (
          <div>
            <div className="flex items-center justify-between text-[10px] text-[var(--muted-2)] mb-1">
              <span>Capacity</span>
              <span className={fillPct >= 90 ? "text-amber-500 font-semibold" : ""}>{fillPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  fillPct >= 90
                    ? "bg-amber-500"
                    : fillPct >= 60
                      ? "bg-[var(--primary)]"
                      : "bg-emerald-500"
                }`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Action row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--border)]">
          <CopyLinkButton url={cls.meetingUrl} />
          <div className="flex flex-wrap gap-2 items-center">
            {isUpcoming && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[var(--muted)]"
                  onClick={() => onCancel(cls)}
                >
                  <Icon.X size={13} /> Cancel
                </Button>
                <Button size="sm" variant="outline" onClick={() => onEdit(cls)}>
                  <Icon.Edit size={13} /> Edit
                </Button>
                <Button size="sm" onClick={() => onStart(cls)}>
                  <Icon.PlayCircle size={14} /> Start now
                </Button>
              </>
            )}
            {isLive && (
              <>
                <Button size="sm" variant="outline" onClick={() => onEnd(cls)}>
                  End session
                </Button>
                <a href={cls.meetingUrl} target="_blank" rel="noreferrer">
                  <Button size="sm">
                    <Icon.Video size={14} /> Open room
                  </Button>
                </a>
              </>
            )}
            {isPast && (
              <Button size="sm" variant="outline" onClick={() => onEdit(cls)}>
                <Icon.Edit size={14} /> Edit
              </Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function TeacherLivePage() {
  const teacher = useTeacher();
  const courses = teacher.myCourses();
  const toast   = useToast();

  const [classes, setClasses]           = React.useState<LiveClass[]>([]);
  const [loading, setLoading]           = React.useState(true);
  const [formOpen, setFormOpen]         = React.useState(false);
  const [editing, setEditing]           = React.useState<LiveClass | null>(null);
  const [saving, setSaving]             = React.useState(false);
  const [query, setQuery]               = React.useState("");
  const [courseFilter, setCourseFilter] = React.useState("all");
  const [formErr, setFormErr]           = React.useState<string | null>(null);

  const blankForm = React.useCallback(
    (): FormState => ({
      courseId: courses[0]?.id ?? "",
      title: "",
      description: "",
      meetingUrl: "https://",
      date: new Date().toISOString().slice(0, 10),
      time: "18:00",
      durationMinutes: "60",
      status: "upcoming",
    }),
    [courses],
  );

  const [form, setForm] = React.useState<FormState>(blankForm);

  const load = React.useCallback(async () => {
    try {
      const r    = await fetch("/api/teacher/live-classes");
      const data = r.ok ? await r.json() : { classes: [] };
      setClasses(data.classes ?? []);
    } catch {
      toast.push({ title: "Couldn't load live classes", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { load(); }, [load]);

  // ── Derived ──
  const courseOptions = React.useMemo(() => {
    const seen = new Map<string, string>();
    for (const c of classes) if (!seen.has(c.courseId)) seen.set(c.courseId, c.courseTitle);
    return Array.from(seen.entries()).map(([id, title]) => ({ id, title }));
  }, [classes]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return classes.filter((c) => {
      if (courseFilter !== "all" && c.courseId !== courseFilter) return false;
      if (q && !c.title.toLowerCase().includes(q) && !c.courseTitle.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [classes, query, courseFilter]);

  const sorted          = [...filtered].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  );
  const liveNow         = sorted.filter((c) => c.status === "live");
  const upcoming        = sorted.filter((c) => c.status === "upcoming");
  const past            = sorted.filter((c) => c.status === "ended" || c.status === "cancelled");
  const totalAttendees  = classes.reduce((s, c) => s + c.attendees, 0);
  const hasFilters      = query.trim().length > 0 || courseFilter !== "all";

  // ── Form helpers ──
  function openCreate() {
    setEditing(null);
    setForm(blankForm());
    setFormErr(null);
    setFormOpen(true);
  }

  function openEdit(c: LiveClass) {
    setEditing(c);
    const d = new Date(c.scheduledAt);
    setForm({
      courseId: c.courseId,
      title: c.title,
      description: c.description,
      meetingUrl: c.meetingUrl,
      date: d.toISOString().slice(0, 10),
      time: d.toTimeString().slice(0, 5),
      durationMinutes: String(c.durationMinutes),
      status: c.status,
    });
    setFormErr(null);
    setFormOpen(true);
  }

  function duplicate(c: LiveClass) {
    setEditing(null);
    const d = new Date(c.scheduledAt);
    setForm({
      courseId: c.courseId,
      title: `${c.title} (copy)`,
      description: c.description,
      meetingUrl: c.meetingUrl,
      date: d.toISOString().slice(0, 10),
      time: d.toTimeString().slice(0, 5),
      durationMinutes: String(c.durationMinutes),
      status: "upcoming",
    });
    setFormErr(null);
    setFormOpen(true);
  }

  async function submit() {
    setFormErr(null);
    if (!form.courseId) return setFormErr("Please select a course.");
    if (form.title.trim().length < 3) return setFormErr("Title must be at least 3 characters.");
    if (!/^https?:\/\/\S+$/.test(form.meetingUrl.trim()))
      return setFormErr("Enter a valid meeting URL (https://…).");
    if (!form.date || !form.time) return setFormErr("Date and time are required.");

    setSaving(true);
    const payload = {
      courseId: form.courseId,
      title: form.title.trim(),
      description: form.description.trim(),
      meetingUrl: form.meetingUrl.trim(),
      scheduledAt: new Date(`${form.date}T${form.time}:00`).toISOString(),
      durationMinutes: Number(form.durationMinutes),
      status: form.status,
    };
    const r = await fetch(
      editing
        ? `/api/teacher/live-classes/${editing.id}`
        : "/api/teacher/live-classes",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    setSaving(false);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      setFormErr(e.error ?? "Couldn't save — please try again.");
      return;
    }
    toast.push({
      title: editing ? "Live class updated" : "Live class scheduled!",
      tone: "success",
    });
    setFormOpen(false);
    load();
  }

  async function setStatus(c: LiveClass, status: Status) {
    const r = await fetch(`/api/teacher/live-classes/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (r.ok) {
      toast.push({
        title:
          status === "live"
            ? "You're live!"
            : status === "ended"
              ? "Session ended"
              : "Class cancelled",
        tone: status === "ended" || status === "cancelled" ? "info" : "success",
      });
      load();
    }
  }

  async function remove(c: LiveClass) {
    if (!confirm(`Delete "${c.title}"? This cannot be undone.`)) return;
    const r = await fetch(`/api/teacher/live-classes/${c.id}`, { method: "DELETE" });
    if (r.ok) {
      toast.push({ title: "Live class deleted", tone: "info" });
      setFormOpen(false);
      load();
    }
  }

  return (
    <div className="space-y-6 fade-in">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
            Teaching
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Live Classes</h1>
          <p className="mt-1 text-[var(--muted)]">
            Host live sessions and share the join link with students.
          </p>
        </div>
        <Button onClick={openCreate} disabled={courses.length === 0}>
          <Icon.Plus size={16} /> Schedule class
        </Button>
      </div>

      {/* ── Live now alert ── */}
      {liveNow.length > 0 && (
        <div className="rounded-xl border-2 border-rose-500/40 bg-rose-500/5 px-4 py-3 flex items-center gap-4 flex-wrap">
          <div className="h-10 w-10 rounded-full bg-rose-500 flex items-center justify-center shrink-0 animate-pulse">
            <Icon.Video size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-rose-600 dark:text-rose-400">
              You are live right now!
            </p>
            <p className="text-sm text-[var(--muted)] truncate">
              {liveNow[0].title} · {liveNow[0].courseTitle}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <CopyLinkButton url={liveNow[0].meetingUrl} label="Share link" />
            <a href={liveNow[0].meetingUrl} target="_blank" rel="noreferrer">
              <Button>
                <Icon.Video size={14} /> Open room
              </Button>
            </a>
          </div>
        </div>
      )}

      {/* ── Stats bar ── */}
      {classes.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatPill
            label="Total"
            value={classes.length}
            sub={`${totalAttendees} total attendees`}
            icon={<Icon.Video size={16} />}
            tint="bg-[var(--primary-soft)] text-[var(--primary)]"
          />
          <StatPill
            label="Live Now"
            value={liveNow.length}
            sub={liveNow.length > 0 ? "session running" : "none active"}
            icon={<Icon.PlayCircle size={16} />}
            tint={
              liveNow.length > 0
                ? "bg-rose-500/15 text-rose-500"
                : "bg-[var(--surface-2)] text-[var(--muted)]"
            }
          />
          <StatPill
            label="Upcoming"
            value={upcoming.length}
            sub="scheduled"
            icon={<Icon.Clock size={16} />}
            tint="bg-sky-500/10 text-sky-600 dark:text-sky-400"
          />
          <StatPill
            label="Ended"
            value={past.length}
            sub="past sessions"
            icon={<Icon.CheckCircle size={16} />}
            tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
        </div>
      )}

      {/* ── Toolbar ── */}
      {classes.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            icon={<Icon.Search size={15} />}
            placeholder="Search classes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          {courseOptions.length > 1 && (
            <Select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="!h-10 sm:!w-52"
            >
              <option value="all">All courses</option>
              {courseOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </Select>
          )}
          {hasFilters && (
            <Button
              variant="outline"
              onClick={() => { setQuery(""); setCourseFilter("all"); }}
              className="!h-10"
            >
              <Icon.X size={14} /> Clear
            </Button>
          )}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-[var(--surface-2)] animate-pulse" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.Video size={24} />}
              title="No live classes yet"
              description="Schedule your first live session and share the join link with students."
              action={
                <Button onClick={openCreate} disabled={courses.length === 0}>
                  <Icon.Plus size={14} /> Schedule class
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Live + Upcoming */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base">Live &amp; Upcoming</h2>
              {liveNow.length + upcoming.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                  {liveNow.length + upcoming.length}
                </span>
              )}
            </div>
            {liveNow.length + upcoming.length === 0 ? (
              <Card>
                <CardBody>
                  <EmptyState
                    icon={<Icon.Video size={20} />}
                    title={hasFilters ? "No matching upcoming classes." : "No upcoming classes."}
                    description={
                      hasFilters
                        ? "Try clearing the search or filter."
                        : "Schedule a session to get started."
                    }
                    action={
                      !hasFilters ? (
                        <Button onClick={openCreate}>
                          <Icon.Plus size={14} /> Schedule class
                        </Button>
                      ) : undefined
                    }
                  />
                </CardBody>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[...liveNow, ...upcoming].map((c) => (
                  <ClassCard
                    key={c.id}
                    cls={c}
                    onEdit={openEdit}
                    onStart={(x) => setStatus(x, "live")}
                    onEnd={(x) => setStatus(x, "ended")}
                    onCancel={(x) => setStatus(x, "cancelled")}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-base">Past Classes</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)]">
                  {past.length}
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {past.map((c) => (
                  <ClassCard
                    key={c.id}
                    cls={c}
                    onEdit={openEdit}
                    onStart={(x) => setStatus(x, "live")}
                    onEnd={(x) => setStatus(x, "ended")}
                    onCancel={(x) => setStatus(x, "cancelled")}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Schedule / Edit modal ── */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        size="lg"
        title={editing ? "Edit live class" : "Schedule live class"}
      >
        {/* Accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary to-emerald-400" />

        <div className="overflow-y-auto max-h-[80vh] scrollbar-thin">
          <div className="p-6 space-y-6">

            {/* ── Live preview card ── */}
            <div className="flex items-center gap-4 rounded-2xl px-4 py-3.5 bg-gradient-to-r from-primary to-emerald-400 text-white shadow-md">
              <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                <Icon.Video size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">
                  {form.title.trim() || "Session title…"}
                </p>
                <p className="text-xs text-white/80 truncate mt-0.5">
                  {courses.find((c) => c.id === form.courseId)?.title ?? "No course selected"}
                </p>
              </div>
              {form.date && form.time && (
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">
                    {new Date(`${form.date}T${form.time}`).toLocaleDateString(undefined, {
                      weekday: "short", month: "short", day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-white/80">
                    {new Date(`${form.date}T${form.time}`).toLocaleTimeString(undefined, {
                      hour: "2-digit", minute: "2-digit",
                    })}
                    {form.durationMinutes ? ` · ${form.durationMinutes} min` : ""}
                  </p>
                </div>
              )}
            </div>

            {/* ── Section 1: Class details ── */}
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-widest font-bold text-muted flex items-center gap-1.5">
                <Icon.Edit size={12} /> Class details
              </p>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Icon.Edit size={14} className="text-muted" />
                    Title <span className="text-[var(--danger)]">*</span>
                  </label>
                  <span className={`text-[11px] tabular-nums ${form.title.length > 100 ? "text-amber-500" : "text-muted"}`}>
                    {form.title.length}/120
                  </span>
                </div>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Live Q&A — Hooks vs Classes"
                  maxLength={120}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Icon.FilePen size={14} className="text-muted" />
                  Description
                </label>
                <Textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What will you cover in this session?"
                />
              </div>
            </div>

            <div className="h-px bg-[var(--border)]" />

            {/* ── Section 2: Session info ── */}
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-widest font-bold text-muted flex items-center gap-1.5">
                <Icon.Video size={12} /> Session info
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Icon.Book size={14} className="text-muted" />
                    Course <span className="text-[var(--danger)]">*</span>
                  </label>
                  <Select
                    value={form.courseId}
                    onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  >
                    <option value="">Select a course…</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Icon.CheckCircle size={14} className="text-muted" />
                    Status
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        { value: "upcoming",  label: "Upcoming",  active: "text-sky-600 border-sky-400 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400" },
                        { value: "live",      label: "Live",      active: "text-rose-600 border-rose-400 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400" },
                        { value: "ended",     label: "Ended",     active: "text-emerald-600 border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" },
                        { value: "cancelled", label: "Cancelled", active: "text-muted border-[var(--border-strong)] bg-surface-2" },
                      ] as { value: Status; label: string; active: string }[]
                    ).map(({ value, label, active }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm({ ...form, status: value })}
                        className={`h-9 rounded-lg border-2 text-xs font-semibold transition-all ${
                          form.status === value
                            ? active
                            : "border-[var(--border)] text-muted bg-surface-2 hover:border-[var(--border-strong)]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Icon.Globe size={14} className="text-muted" />
                  Meeting URL <span className="text-[var(--danger)]">*</span>
                </label>
                <Input
                  value={form.meetingUrl}
                  onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
                  placeholder="https://meet.google.com/…"
                />
                {/^https?:\/\/\S{4,}$/.test(form.meetingUrl) && (
                  <div className="flex items-center gap-2 rounded-xl bg-surface-2 border border-[var(--border)] px-3 py-2">
                    <Icon.Globe size={13} className="text-muted shrink-0" />
                    <span className="truncate flex-1 text-xs text-muted">{form.meetingUrl}</span>
                    <CopyLinkButton url={form.meetingUrl} label="Copy" />
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-[var(--border)]" />

            {/* ── Section 3: Schedule ── */}
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-widest font-bold text-muted flex items-center gap-1.5">
                <Icon.Clock size={12} /> Schedule
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Icon.Calendar size={14} className="text-muted" /> Date
                  </label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Icon.Clock size={14} className="text-muted" /> Start time
                  </label>
                  <Input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Icon.Clock size={14} className="text-muted" /> Duration
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {[30, 45, 60, 90, 120].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm({ ...form, durationMinutes: String(d) })}
                      className={`px-3 h-8 rounded-lg text-xs font-semibold border transition-all ${
                        form.durationMinutes === String(d)
                          ? "border-primary bg-[var(--primary-soft)] text-primary"
                          : "border-[var(--border)] bg-surface-2 text-muted hover:border-[var(--border-strong)]"
                      }`}
                    >
                      {d < 60 ? `${d} min` : `${d / 60}h`}
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted">or</span>
                    <div className="relative w-24">
                      <Input
                        type="number"
                        min={5}
                        step={5}
                        value={form.durationMinutes}
                        onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                        className="!h-8 !text-xs pr-8"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted pointer-events-none">min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inline error */}
            {formErr && (
              <p className="text-sm text-[var(--danger)] bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-xl flex items-center gap-2">
                <Icon.AlertCircle size={14} className="shrink-0" /> {formErr}
              </p>
            )}

            {/* ── Footer ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border)]">
              <div className="flex gap-2">
                {editing && (
                  <>
                    <Button type="button" variant="danger" size="sm" onClick={() => remove(editing)}>
                      <Icon.Trash size={14} /> Delete
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => duplicate(editing)}
                      disabled={saving}
                    >
                      <Icon.Copy size={14} /> Duplicate
                    </Button>
                  </>
                )}
              </div>
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={submit} loading={saving} disabled={!form.title.trim()}>
                  <Icon.Save size={14} /> {editing ? "Save changes" : "Schedule"}
                </Button>
              </div>
            </div>

          </div>
        </div>
      </Modal>
    </div>
  );
}
