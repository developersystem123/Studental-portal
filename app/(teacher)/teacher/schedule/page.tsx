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

const TYPE_META: Record<EventType, { label: string; icon: React.ReactNode; tint: string }> = {
  class: { label: "Class", icon: <Icon.Video size={14} />, tint: "from-green-600 to-emerald-500" },
  meeting: {
    label: "Office hours",
    icon: <Icon.User size={14} />,
    tint: "from-teal-500 to-green-500",
  },
  assignment: {
    label: "Deadline",
    icon: <Icon.AlertCircle size={14} />,
    tint: "from-rose-500 to-red-500",
  },
  exam: { label: "Exam", icon: <Icon.FilePen size={14} />, tint: "from-amber-500 to-orange-500" },
  event: { label: "Event", icon: <Icon.Calendar size={14} />, tint: "from-emerald-500 to-teal-500" },
};

type FormState = {
  title: string;
  type: EventType;
  courseId: string;
  date: string;
  time: string;
  durationMinutes: string;
  location: string;
  description: string;
};

export default function TeacherSchedulePage() {
  const teacher = useTeacher();
  const courses = teacher.myCourses();
  const toast = useToast();

  const [events, setEvents] = React.useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"upcoming" | "week" | "all">("upcoming");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ScheduleEvent | null>(null);
  const [saving, setSaving] = React.useState(false);

  const blank = (): FormState => ({
    title: "",
    type: "class",
    courseId: "",
    date: new Date().toISOString().slice(0, 10),
    time: "10:00",
    durationMinutes: "60",
    location: "",
    description: "",
  });
  const [form, setForm] = React.useState<FormState>(blank);

  const load = React.useCallback(async () => {
    const r = await fetch("/api/schedule");
    const data = r.ok ? await r.json() : { events: [] };
    setEvents(data.events ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const now = Date.now();
  const inOneWeek = now + 1000 * 60 * 60 * 24 * 7;
  const sorted = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
  const filtered = sorted.filter((e) => {
    const t = new Date(e.startTime).getTime();
    if (view === "upcoming") return t >= now;
    if (view === "week") return t >= now && t <= inOneWeek;
    return true;
  });

  function countdown(iso: string): { label: string; urgent: boolean } {
    const ms = new Date(iso).getTime() - now;
    if (ms < 0) return { label: "Past", urgent: false };
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return { label: `In ${mins}m`, urgent: true };
    const hrs = Math.floor(ms / 3600000);
    if (hrs < 24) return { label: `Today in ${hrs}h`, urgent: true };
    const days = Math.floor(ms / 86400000);
    if (days === 1) return { label: "Tomorrow", urgent: false };
    return { label: `In ${days} days`, urgent: false };
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  function openCreate() {
    setEditing(null);
    setForm(blank());
    setFormOpen(true);
  }

  function openEdit(e: ScheduleEvent) {
    setEditing(e);
    const start = new Date(e.startTime);
    const dur = Math.round(
      (new Date(e.endTime).getTime() - start.getTime()) / 60000,
    );
    setForm({
      title: e.title,
      type: e.type,
      courseId: e.courseId ?? "",
      date: start.toISOString().slice(0, 10),
      time: start.toTimeString().slice(0, 5),
      durationMinutes: String(dur || 60),
      location: e.location ?? "",
      description: e.description ?? "",
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
      title: form.title.trim(),
      type: form.type,
      courseId: form.courseId || null,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
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
    toast.push({ title: "Event saved", tone: "success" });
    setFormOpen(false);
    load();
  }

  async function remove(e: ScheduleEvent) {
    const r = await fetch(`/api/schedule/${e.id}`, { method: "DELETE" });
    if (r.ok) {
      toast.push({ title: "Event removed", tone: "info" });
      setFormOpen(false);
      load();
    }
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
            Teaching
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="mt-1 text-[var(--muted)]">
            Your classes, office hours, deadlines, and exams in one place.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Icon.Plus size={16} /> Add event
        </Button>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(["upcoming", "week", "all"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 h-9 rounded-lg text-sm font-medium transition ${
                  view === v
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {v === "upcoming" ? "Upcoming" : v === "week" ? "This week" : "All"}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-sm text-[var(--muted)]">Loading…</p>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Icon.Calendar size={20} />}
              title="Nothing scheduled"
              description="Add a class, office hour, or exam to get started."
              action={
                <Button onClick={openCreate}>
                  <Icon.Plus size={14} /> Add event
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2">
              {filtered.map((e) => {
                const meta = TYPE_META[e.type];
                const start = new Date(e.startTime);
                const dur = Math.round(
                  (new Date(e.endTime).getTime() - start.getTime()) / 60000,
                );
                const isToday = e.startTime.slice(0, 10) === todayStr;
                const cd = countdown(e.startTime);
                return (
                  <li
                    key={e.id}
                    className={`group flex items-center gap-4 p-4 rounded-xl border transition ${
                      isToday
                        ? "border-[var(--primary)]/40 bg-[var(--primary-soft)]/20"
                        : "border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--surface-2)]/50"
                    }`}
                  >
                    <div
                      className={`h-12 w-12 rounded-xl flex flex-col items-center justify-center text-white bg-gradient-to-br ${meta.tint} shrink-0`}
                    >
                      <span className="text-[10px] uppercase font-semibold opacity-90">
                        {start.toLocaleDateString(undefined, { month: "short" })}
                      </span>
                      <span className="text-lg font-bold leading-none">{start.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isToday && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--primary)] text-white font-semibold uppercase tracking-wider">Today</span>
                        )}
                        <p className="font-medium truncate">{e.title}</p>
                        <Badge variant="default">
                          {meta.icon}
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-0.5 truncate">
                        {e.courseTitle ?? "No course"} · {formatTime(start)} · {dur} min ·{" "}
                        {e.location || "TBD"}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold shrink-0 ${cd.urgent ? "text-amber-600 dark:text-amber-400" : "text-[var(--muted-2)]"}`}>
                      {cd.label}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(e)}>
                      <Icon.Edit size={14} /> Edit
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        size="lg"
        title={editing ? "Edit event" : "New event"}
      >
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
              <Select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as EventType })}
              >
                {(Object.keys(TYPE_META) as EventType[]).map((k) => (
                  <option key={k} value={k}>
                    {TYPE_META[k].label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Course (optional)</Label>
              <Select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              >
                <option value="">No course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Time</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
            <div>
              <Label>Duration (min)</Label>
              <Input
                type="number"
                min={5}
                step={5}
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Room 204 / Zoom link"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-between gap-2 pt-2 border-t border-[var(--border)]">
            {editing ? (
              <Button type="button" variant="danger" onClick={() => remove(editing)}>
                <Icon.Trash size={14} /> Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={submit} loading={saving}>
                <Icon.Save size={14} /> Save
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
