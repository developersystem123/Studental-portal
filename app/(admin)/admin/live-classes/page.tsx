"use client";

import * as React from "react";
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
  Tabs,
  Textarea,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { useData } from "@/lib/store";
import { formatDate, formatTime } from "@/lib/utils";

type LiveStatus = "upcoming" | "live" | "ended" | "cancelled";

type LiveClass = {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  instructor: string;
  meetingUrl: string;
  scheduledAt: string;
  durationMinutes: number;
  status: LiveStatus;
  attendees: number;
  maxAttendees?: number;
};

const STATUS_BADGE: Record<LiveStatus, "info" | "success" | "default" | "danger"> = {
  upcoming: "info",
  live: "success",
  ended: "default",
  cancelled: "danger",
};

const STATUSES: LiveStatus[] = ["upcoming", "live", "ended", "cancelled"];
type Filter = "all" | LiveStatus;

type FormState = {
  courseId: string;
  title: string;
  description: string;
  meetingUrl: string;
  scheduledAt: string;
  durationMinutes: string;
  status: LiveStatus;
  maxAttendees: string;
};

const emptyForm: FormState = {
  courseId: "",
  title: "",
  description: "",
  meetingUrl: "https://",
  scheduledAt: "",
  durationMinutes: "60",
  status: "upcoming",
  maxAttendees: "",
};

export default function AdminLiveClassesPage() {
  const { courses } = useData();
  const toast = useToast();

  const [classes, setClasses] = React.useState<LiveClass[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>("all");

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<LiveClass | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<LiveClass | null>(null);

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/admin/live-classes");
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

  const counts = React.useMemo(
    () => ({
      all: classes.length,
      upcoming: classes.filter((c) => c.status === "upcoming").length,
      live: classes.filter((c) => c.status === "live").length,
      ended: classes.filter((c) => c.status === "ended").length,
      cancelled: classes.filter((c) => c.status === "cancelled").length,
    }),
    [classes],
  );

  const filtered = filter === "all" ? classes : classes.filter((c) => c.status === filter);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(c: LiveClass) {
    setEditing(c);
    setForm({
      courseId: c.courseId,
      title: c.title,
      description: c.description,
      meetingUrl: c.meetingUrl,
      scheduledAt: c.scheduledAt.slice(0, 16),
      durationMinutes: String(c.durationMinutes),
      status: c.status,
      maxAttendees: c.maxAttendees ? String(c.maxAttendees) : "",
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
      scheduledAt: form.scheduledAt,
      durationMinutes: Number(form.durationMinutes),
      status: form.status,
      maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : null,
    };
    const r = await fetch(
      editing ? `/api/admin/live-classes/${editing.id}` : "/api/admin/live-classes",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    setSaving(false);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      toast.push({ title: "Couldn't save live class", description: e.error, tone: "danger" });
      return;
    }
    toast.push({ title: editing ? "Live class updated" : "Live class scheduled", tone: "success" });
    setFormOpen(false);
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const r = await fetch(`/api/admin/live-classes/${deleting.id}`, { method: "DELETE" });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      toast.push({ title: "Couldn't delete", description: e.error, tone: "danger" });
      return;
    }
    toast.push({ title: "Live class deleted", tone: "info" });
    setDeleting(null);
    load();
  }

  const formValid =
    form.courseId &&
    form.title.trim().length >= 3 &&
    /^https?:\/\/\S+$/.test(form.meetingUrl.trim()) &&
    form.scheduledAt &&
    Number(form.durationMinutes) >= 5;

  const liveStats = React.useMemo(() => {
    const liveNow = classes.filter((c) => c.status === "live").length;
    const upcoming = classes.filter((c) => c.status === "upcoming").length;
    const totalAttendees = classes.reduce((s, c) => s + c.attendees, 0);
    return { liveNow, upcoming, totalAttendees };
  }, [classes]);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Live Classes</h1>
          <p className="mt-1 text-[var(--muted)]">
            Schedule and manage live online sessions across all courses.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Icon.Plus size={16} /> Schedule class
        </Button>
      </div>

      {classes.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Live now", value: liveStats.liveNow, icon: <Icon.Video size={16} />, tint: liveStats.liveNow > 0 ? "bg-rose-500/15 text-rose-500" : "bg-[var(--surface-2)] text-[var(--muted)]" },
            { label: "Upcoming", value: liveStats.upcoming, icon: <Icon.Calendar size={16} />, tint: "bg-[var(--primary-soft)] text-[var(--primary)]" },
            { label: "Total attendees", value: liveStats.totalAttendees, icon: <Icon.Users size={16} />, tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
          ].map((s) => (
            <Card key={s.label}>
              <CardBody className="flex items-center gap-3 !py-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${s.tint}`}>{s.icon}</div>
                <div className="min-w-0">
                  <p className="text-[11px] text-[var(--muted)]">{s.label}</p>
                  <p className="text-xl font-bold tracking-tight">{s.value}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Tabs
        value={filter}
        onChange={(v) => setFilter(v as Filter)}
        options={[
          { value: "all", label: "All", count: counts.all },
          { value: "upcoming", label: "Upcoming", count: counts.upcoming },
          { value: "live", label: "Live", count: counts.live },
          { value: "ended", label: "Ended", count: counts.ended },
          { value: "cancelled", label: "Cancelled", count: counts.cancelled },
        ]}
      />

      {loading ? (
        <Card>
          <CardBody>
            <p className="text-sm text-[var(--muted)]">Loading…</p>
          </CardBody>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.Video size={28} />}
              title={classes.length === 0 ? "No live classes yet" : "No matching classes"}
              description={
                classes.length === 0
                  ? "Schedule your first live session."
                  : "Try a different filter."
              }
              action={
                classes.length === 0 ? (
                  <Button onClick={openCreate}>
                    <Icon.Plus size={16} /> Schedule class
                  </Button>
                ) : undefined
              }
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-2)] text-[var(--muted)] text-xs uppercase tracking-wider">
                <tr>
                  <Th>Session</Th>
                  <Th>Course</Th>
                  <Th>When</Th>
                  <Th>Attendees</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]/50"
                  >
                    <Td>
                      <div className="font-medium">{c.title}</div>
                      <div className="text-xs text-[var(--muted)]">{c.instructor}</div>
                    </Td>
                    <Td>
                      <div className="truncate max-w-[20ch]">{c.courseTitle}</div>
                    </Td>
                    <Td>
                      <div>{formatDate(c.scheduledAt)}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {formatTime(c.scheduledAt)} · {c.durationMinutes} min
                      </div>
                    </Td>
                    <Td className="text-xs">
                      {c.attendees}
                      {c.maxAttendees ? ` / ${c.maxAttendees}` : ""}
                    </Td>
                    <Td>
                      <Badge variant={STATUS_BADGE[c.status]} className="capitalize">
                        {c.status}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <a href={c.meetingUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" title="Open meeting link">
                            <Icon.Video size={14} />
                          </Button>
                        </a>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(c)} title="Edit">
                          <Icon.Edit size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleting(c)}
                          title="Delete"
                        >
                          <Icon.Trash size={14} />
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create / edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        size="lg"
        title={editing ? "Edit live class" : "Schedule live class"}
      >
        <div className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
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
            <div className="sm:col-span-2">
              <Label>Session title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Live Q&A — Week 3"
                maxLength={120}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What this session covers…"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Meeting URL</Label>
              <Input
                value={form.meetingUrl}
                onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
                placeholder="https://meet.example.com/abc"
              />
            </div>
            <div>
              <Label>Date &amp; time</Label>
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min={5}
                max={600}
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as LiveStatus })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Max attendees (optional)</Label>
              <Input
                type="number"
                min={1}
                value={form.maxAttendees}
                onChange={(e) => setForm({ ...form, maxAttendees: e.target.value })}
                placeholder="Unlimited"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving} disabled={!formValid}>
              <Icon.Save size={16} /> {editing ? "Save changes" : "Schedule"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} size="sm" title="Delete live class?">
        {deleting && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-[var(--muted)]">
              Delete <strong className="text-[var(--foreground)]">{deleting.title}</strong>? This
              can&apos;t be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleting(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                <Icon.Trash size={16} /> Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left font-semibold px-4 py-3 ${className ?? ""}`}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className ?? ""}`}>{children}</td>;
}
