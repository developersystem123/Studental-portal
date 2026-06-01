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

export default function TeacherLivePage() {
  const teacher = useTeacher();
  const courses = teacher.myCourses();
  const toast = useToast();

  const [classes, setClasses] = React.useState<LiveClass[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<LiveClass | null>(null);
  const [saving, setSaving] = React.useState(false);

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
      const r = await fetch("/api/teacher/live-classes");
      const data = r.ok ? await r.json() : { classes: [] };
      setClasses(data.classes ?? []);
    } catch {
      toast.push({ title: "Couldn't load live classes", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(blankForm());
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
    setFormOpen(true);
  }

  async function submit() {
    setSaving(true);
    const payload = {
      courseId: form.courseId,
      title: form.title,
      description: form.description,
      meetingUrl: form.meetingUrl,
      scheduledAt: new Date(`${form.date}T${form.time}:00`).toISOString(),
      durationMinutes: Number(form.durationMinutes),
      status: form.status,
    };
    const r = await fetch(
      editing ? `/api/teacher/live-classes/${editing.id}` : "/api/teacher/live-classes",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    setSaving(false);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      toast.push({ title: "Couldn't save", description: e.error, tone: "danger" });
      return;
    }
    toast.push({ title: "Live class saved", tone: "success" });
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
        title: status === "live" ? "You're live!" : status === "ended" ? "Class ended" : "Updated",
        tone: status === "ended" ? "info" : "success",
      });
      load();
    }
  }

  async function remove(c: LiveClass) {
    const r = await fetch(`/api/teacher/live-classes/${c.id}`, { method: "DELETE" });
    if (r.ok) {
      toast.push({ title: "Live class removed", tone: "info" });
      setFormOpen(false);
      load();
    }
  }

  const sorted = [...classes].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  );
  const upcoming = sorted.filter((c) => c.status !== "ended" && c.status !== "cancelled");
  const past = sorted.filter((c) => c.status === "ended" || c.status === "cancelled");

  const formValid =
    form.courseId &&
    form.title.trim().length >= 3 &&
    /^https?:\/\/\S+$/.test(form.meetingUrl.trim()) &&
    form.date &&
    form.time;

  return (
    <div className="space-y-6 fade-in">
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

      {loading ? (
        <Card>
          <CardBody>
            <p className="text-sm text-[var(--muted)]">Loading…</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <Section
            title="Live &amp; upcoming"
            items={upcoming}
            empty="No upcoming classes."
            onEdit={openEdit}
            onStart={(c) => setStatus(c, "live")}
            onEnd={(c) => setStatus(c, "ended")}
          />
          {past.length > 0 && (
            <Section
              title="Past classes"
              items={past}
              onEdit={openEdit}
              onStart={(c) => setStatus(c, "live")}
              onEnd={(c) => setStatus(c, "ended")}
              past
            />
          )}
        </>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        size="lg"
        title={editing ? "Edit live class" : "Schedule live class"}
      >
        <div className="p-5 space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Live Q&A — Hooks vs Classes"
              maxLength={120}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Course</Label>
              <Select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              >
                <option value="">Select a course…</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Meeting URL</Label>
              <Input
                value={form.meetingUrl}
                onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
                placeholder="https://meet.google.com/…"
              />
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
              <Label>Status</Label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
              >
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="ended">Ended</option>
                <option value="cancelled">Cancelled</option>
              </Select>
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
              <Button onClick={submit} loading={saving} disabled={!formValid}>
                <Icon.Save size={14} /> Save
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Section({
  title,
  items,
  empty,
  onEdit,
  onStart,
  onEnd,
  past,
}: {
  title: string;
  items: LiveClass[];
  empty?: string;
  onEdit: (c: LiveClass) => void;
  onStart: (c: LiveClass) => void;
  onEnd: (c: LiveClass) => void;
  past?: boolean;
}) {
  return (
    <Card>
      <CardBody className="space-y-3">
        <h2 className="font-semibold">{title}</h2>
        {items.length === 0 ? (
          empty ? (
            <EmptyState
              icon={<Icon.Video size={20} />}
              title={empty}
              description="Schedule a session to get started."
            />
          ) : null
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {items.map((c) => (
              <Card key={c.id} className={`overflow-hidden ${c.status === "live" ? "border-rose-500/40 shadow-rose-500/10 shadow-lg" : ""}`}>
                {c.status === "live" && (
                  <div className="h-1 w-full bg-gradient-to-r from-rose-500 to-pink-500 animate-pulse" />
                )}
                <CardBody className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                        c.status === "live"
                          ? "bg-rose-500/15 text-rose-500"
                          : "bg-[var(--primary-soft)] text-[var(--primary)]"
                      }`}
                    >
                      <Icon.Video size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{c.title}</p>
                      <p className="text-xs text-[var(--muted)] truncate">{c.courseTitle}</p>
                    </div>
                    {c.status === "live" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500 text-white text-[11px] font-bold uppercase tracking-wider shrink-0">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                        </span>
                        Live
                      </span>
                    )}
                    {c.status === "upcoming" && <Badge variant="info">Upcoming</Badge>}
                    {c.status === "ended" && <Badge variant="default">Ended</Badge>}
                    {c.status === "cancelled" && <Badge variant="default">Cancelled</Badge>}
                  </div>
                  <p className="text-sm text-[var(--muted)] line-clamp-2">{c.description}</p>
                  <div className="flex items-center gap-3 text-xs text-[var(--muted-2)] flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Icon.Calendar size={12} /> {formatDate(c.scheduledAt)}
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Icon.Clock size={12} /> {formatTime(c.scheduledAt)} ({c.durationMinutes}m)
                    </span>
                    {c.attendees > 0 && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Icon.Users size={12} /> {c.attendees} {c.attendees === 1 ? "attendee" : "attendees"}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    {c.status === "upcoming" && (
                      <Button size="sm" onClick={() => onStart(c)}>
                        <Icon.PlayCircle size={14} /> Start now
                      </Button>
                    )}
                    {c.status === "live" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => onEnd(c)}>
                          End session
                        </Button>
                        <a href={c.meetingUrl} target="_blank" rel="noreferrer">
                          <Button size="sm">
                            <Icon.Video size={14} /> Open room
                          </Button>
                        </a>
                      </>
                    )}
                    {c.status !== "live" && (
                      <Button size="sm" variant="outline" onClick={() => onEdit(c)}>
                        <Icon.Edit size={14} /> Edit
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
