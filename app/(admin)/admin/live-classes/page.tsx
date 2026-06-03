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
  StatCard,
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

const STATUS_BORDER: Record<LiveStatus, string> = {
  upcoming: "border-l-sky-400",
  live: "border-l-rose-500",
  ended: "border-l-[var(--border)]",
  cancelled: "border-l-orange-300",
};

const STATUSES: LiveStatus[] = ["upcoming", "live", "ended", "cancelled"];
type Filter = "all" | LiveStatus;
type SortKey = "date-desc" | "date-asc" | "attendees";

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

function daysUntil(iso: string): string | null {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return null;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days}d`;
}

function exportCSV(classes: LiveClass[]) {
  const header = [
    "Title", "Course", "Instructor", "Scheduled At",
    "Duration (min)", "Status", "Attendees", "Max Attendees", "Meeting URL",
  ];
  const rows = classes.map((c) => [
    `"${c.title.replace(/"/g, '""')}"`,
    `"${c.courseTitle.replace(/"/g, '""')}"`,
    `"${c.instructor}"`,
    new Date(c.scheduledAt).toLocaleString(),
    c.durationMinutes,
    c.status,
    c.attendees,
    c.maxAttendees ?? "",
    `"${c.meetingUrl}"`,
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "live-classes.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminLiveClassesPage() {
  const { courses } = useData();
  const toast = useToast();

  const [classes, setClasses] = React.useState<LiveClass[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("date-desc");

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<LiveClass | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<LiveClass | null>(null);
  const [viewing, setViewing] = React.useState<LiveClass | null>(null);
  const [quickStatusId, setQuickStatusId] = React.useState<string | null>(null);

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

  React.useEffect(() => { load(); }, [load]);

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

  const liveStats = React.useMemo(() => ({
    total: classes.length,
    liveNow: classes.filter((c) => c.status === "live").length,
    upcoming: classes.filter((c) => c.status === "upcoming").length,
    totalAttendees: classes.reduce((s, c) => s + c.attendees, 0),
  }), [classes]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return classes
      .filter((c) => filter === "all" || c.status === filter)
      .filter(
        (c) =>
          !q ||
          c.title.toLowerCase().includes(q) ||
          c.courseTitle.toLowerCase().includes(q) ||
          c.instructor.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        if (sortKey === "date-asc")
          return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        if (sortKey === "attendees") return b.attendees - a.attendees;
        return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
      });
  }, [classes, filter, query, sortKey]);

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

  async function quickStatus(c: LiveClass, status: LiveStatus) {
    setQuickStatusId(c.id);
    const r = await fetch(`/api/admin/live-classes/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setQuickStatusId(null);
    if (r.ok) {
      setClasses((prev) => prev.map((x) => (x.id === c.id ? { ...x, status } : x)));
      setViewing((v) => (v?.id === c.id ? { ...v, status } : v));
      toast.push({ title: `Marked as ${status}`, tone: "success" });
    } else {
      toast.push({ title: "Couldn't update status", tone: "danger" });
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      toast.push({ title: "Meeting URL copied", tone: "success" });
    }).catch(() => {
      toast.push({ title: "Copy failed", tone: "danger" });
    });
  }

  const formValid =
    form.courseId &&
    form.title.trim().length >= 3 &&
    /^https?:\/\/\S+$/.test(form.meetingUrl.trim()) &&
    form.scheduledAt &&
    Number(form.durationMinutes) >= 5;

  return (
    <div className="space-y-6 fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
            Manage
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Live Classes</h1>
          <p className="mt-1 text-[var(--muted)]">
            Schedule and manage live online sessions across all courses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportCSV(filtered)}>
            <Icon.Download size={15} /> Export CSV
          </Button>
          <Button onClick={openCreate}>
            <Icon.Plus size={16} /> Schedule class
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total classes"
          value={liveStats.total}
          icon={<Icon.Video size={18} />}
          tone="primary"
        />
        <StatCard
          label="Live now"
          value={liveStats.liveNow}
          icon={<Icon.PlayCircle size={18} />}
          tone={liveStats.liveNow > 0 ? "warning" : "primary"}
        />
        <StatCard
          label="Upcoming"
          value={liveStats.upcoming}
          icon={<Icon.Calendar size={18} />}
          tone="accent"
        />
        <StatCard
          label="Total attendees"
          value={liveStats.totalAttendees}
          icon={<Icon.Users size={18} />}
          tone="success"
        />
      </div>

      {/* ── Tabs + search/sort toolbar ── */}
      <div className="space-y-3">
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

        {/* Search + sort in one row */}
        <div className="flex items-center gap-2">
          <Input
            icon={<Icon.Search size={16} />}
            placeholder="Search by title, course, instructor…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 min-w-0 max-w-sm"
          />
          <Select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="h-9 text-xs !py-0 w-[155px] shrink-0"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="attendees">Most attendees</option>
          </Select>
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <Card>
          <CardBody>
            <p className="text-sm text-[var(--muted)] py-6 flex items-center justify-center gap-2">
              <Icon.Loader size={15} className="animate-spin" /> Loading…
            </p>
          </CardBody>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.Video size={28} />}
              title={classes.length === 0 ? "No live classes yet" : "No matching sessions"}
              description={
                classes.length === 0
                  ? "Schedule your first live session to get started."
                  : "Try a different filter or search query."
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
                  <Th className="hidden md:table-cell">Course</Th>
                  <Th>When</Th>
                  <Th className="hidden sm:table-cell">Attendees</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const capacityPct =
                    c.maxAttendees && c.maxAttendees > 0
                      ? Math.min(100, Math.round((c.attendees / c.maxAttendees) * 100))
                      : null;
                  const countdown = c.status === "upcoming" ? daysUntil(c.scheduledAt) : null;

                  return (
                    <tr
                      key={c.id}
                      className={`border-t border-[var(--border)] hover:bg-[var(--surface-2)]/50 transition border-l-2 ${STATUS_BORDER[c.status]} group cursor-pointer`}
                      onClick={() => setViewing(c)}
                    >
                      {/* Session */}
                      <Td>
                        <div className="flex items-start gap-2">
                          {c.status === "live" && (
                            <span className="mt-1 shrink-0 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold leading-snug truncate max-w-[22ch]">
                              {c.title}
                            </div>
                            <div className="text-xs text-[var(--muted)]">{c.instructor}</div>
                          </div>
                        </div>
                      </Td>

                      {/* Course */}
                      <Td className="hidden md:table-cell">
                        <div className="truncate max-w-[18ch] text-[var(--muted)]">
                          {c.courseTitle}
                        </div>
                      </Td>

                      {/* When */}
                      <Td>
                        <div className="font-medium">{formatDate(c.scheduledAt)}</div>
                        <div className="text-xs text-[var(--muted)]">
                          {formatTime(c.scheduledAt)} · {c.durationMinutes} min
                        </div>
                        {countdown && (
                          <span className="mt-0.5 inline-block text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-full">
                            {countdown}
                          </span>
                        )}
                      </Td>

                      {/* Attendees */}
                      <Td className="hidden sm:table-cell">
                        <div className="text-sm font-medium">
                          {c.attendees}
                          {c.maxAttendees ? (
                            <span className="text-[var(--muted)]"> / {c.maxAttendees}</span>
                          ) : null}
                        </div>
                        {capacityPct !== null && (
                          <div className="mt-1 h-1 w-20 rounded-full bg-[var(--surface-2)] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                capacityPct >= 90
                                  ? "bg-rose-500"
                                  : capacityPct >= 60
                                  ? "bg-amber-500"
                                  : "bg-[var(--primary)]"
                              }`}
                              style={{ width: `${capacityPct}%` }}
                            />
                          </div>
                        )}
                      </Td>

                      {/* Status */}
                      <Td>
                        <Badge variant={STATUS_BADGE[c.status]} className="capitalize">
                          {c.status === "live" && (
                            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse inline-block mr-1" />
                          )}
                          {c.status}
                        </Badge>
                      </Td>

                      {/* Actions */}
                      <Td
                        className="text-right"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          {/* Quick status shortcuts */}
                          {c.status === "upcoming" && (
                            <button
                              onClick={() => quickStatus(c, "live")}
                              disabled={quickStatusId === c.id}
                              title="Mark as live"
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-rose-500/10 text-[var(--muted)] hover:text-rose-500 transition"
                            >
                              <Icon.PlayCircle size={14} />
                            </button>
                          )}
                          {c.status === "live" && (
                            <button
                              onClick={() => quickStatus(c, "ended")}
                              disabled={quickStatusId === c.id}
                              title="Mark as ended"
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition"
                            >
                              <Icon.Circle size={14} />
                            </button>
                          )}
                          {/* Copy URL */}
                          <button
                            onClick={() => copyUrl(c.meetingUrl)}
                            title="Copy meeting URL"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition"
                          >
                            <Icon.Copy size={14} />
                          </button>
                          {/* Join link */}
                          <a
                            href={c.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Open meeting"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition"
                          >
                            <Icon.Video size={14} />
                          </a>
                          <button
                            onClick={() => openEdit(c)}
                            title="Edit"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition"
                          >
                            <Icon.Edit size={14} />
                          </button>
                          <button
                            onClick={() => setDeleting(c)}
                            title="Delete"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-red-500/10 text-[var(--muted)] hover:text-[var(--danger)] transition"
                          >
                            <Icon.Trash size={14} />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--muted)]">
              Showing {filtered.length} of {classes.length} session{classes.length !== 1 ? "s" : ""}
            </p>
          </div>
        </Card>
      )}

      {/* ── Session detail modal ── */}
      {viewing && (
        <SessionDetailModal
          cls={viewing}
          quickStatusId={quickStatusId}
          onClose={() => setViewing(null)}
          onEdit={(c) => { setViewing(null); setTimeout(() => openEdit(c), 60); }}
          onDelete={(c) => { setViewing(null); setTimeout(() => setDeleting(c), 60); }}
          onQuickStatus={quickStatus}
          onCopyUrl={copyUrl}
        />
      )}

      {/* ── Create / Edit modal ── */}
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
                rows={3}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Meeting URL</Label>
              <Input
                value={form.meetingUrl}
                onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
                placeholder="https://meet.example.com/abc"
                icon={<Icon.Video size={15} />}
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

      {/* ── Delete confirm ── */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        size="sm"
        title="Delete live class?"
      >
        {deleting && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-[var(--muted)]">
              Delete{" "}
              <strong className="text-[var(--foreground)]">{deleting.title}</strong>? This
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

/* ──────────────────────────────────────────────────────────────────────── */
/*  Session detail modal                                                     */
/* ──────────────────────────────────────────────────────────────────────── */

function SessionDetailModal({
  cls,
  quickStatusId,
  onClose,
  onEdit,
  onDelete,
  onQuickStatus,
  onCopyUrl,
}: {
  cls: LiveClass;
  quickStatusId: string | null;
  onClose: () => void;
  onEdit: (c: LiveClass) => void;
  onDelete: (c: LiveClass) => void;
  onQuickStatus: (c: LiveClass, s: LiveStatus) => void;
  onCopyUrl: (url: string) => void;
}) {
  const capacityPct =
    cls.maxAttendees && cls.maxAttendees > 0
      ? Math.min(100, Math.round((cls.attendees / cls.maxAttendees) * 100))
      : null;

  const STATUS_BADGE_MAP: Record<LiveStatus, "info" | "success" | "default" | "danger"> = {
    upcoming: "info",
    live: "success",
    ended: "default",
    cancelled: "danger",
  };

  return (
    <Modal open onClose={onClose} title="Session details" size="md">
      <div className="p-5 space-y-5">
        {/* Title + status */}
        <div className="flex items-start gap-3 justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {cls.status === "live" && (
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              )}
              <h2 className="text-xl font-bold leading-snug">{cls.title}</h2>
            </div>
            <p className="text-sm text-[var(--muted)] mt-0.5">{cls.instructor}</p>
          </div>
          <Badge variant={STATUS_BADGE_MAP[cls.status]} className="capitalize shrink-0">
            {cls.status}
          </Badge>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              icon: <Icon.Book size={13} />,
              label: "Course",
              value: cls.courseTitle,
              cls: "text-violet-500 bg-violet-500/10",
            },
            {
              icon: <Icon.Calendar size={13} />,
              label: "Scheduled",
              value: `${formatDate(cls.scheduledAt)} · ${formatTime(cls.scheduledAt)}`,
              cls: "text-sky-500 bg-sky-500/10",
            },
            {
              icon: <Icon.Clock size={13} />,
              label: "Duration",
              value: `${cls.durationMinutes} minutes`,
              cls: "text-emerald-500 bg-emerald-500/10",
            },
            {
              icon: <Icon.Users size={13} />,
              label: "Attendees",
              value: cls.maxAttendees ? `${cls.attendees} / ${cls.maxAttendees}` : String(cls.attendees),
              cls: "text-amber-500 bg-amber-500/10",
            },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
            >
              <div className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 mb-1 ${m.cls}`}>
                {m.icon} {m.label}
              </div>
              <p className="text-sm font-semibold truncate">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Capacity bar */}
        {capacityPct !== null && (
          <div>
            <div className="flex justify-between text-xs text-[var(--muted)] mb-1">
              <span>Capacity</span>
              <span>{capacityPct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--surface-2)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  capacityPct >= 90
                    ? "bg-rose-500"
                    : capacityPct >= 60
                    ? "bg-amber-500"
                    : "bg-[var(--primary)]"
                }`}
                style={{ width: `${capacityPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Description */}
        {cls.description && (
          <div>
            <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-1.5">
              Description
            </p>
            <p className="text-sm text-[var(--foreground)] leading-relaxed">{cls.description}</p>
          </div>
        )}

        {/* Meeting URL */}
        <div>
          <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-1.5">
            Meeting link
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
            <Icon.Video size={14} className="text-[var(--muted)] shrink-0" />
            <span className="text-xs text-[var(--muted)] truncate flex-1">{cls.meetingUrl}</span>
            <button
              onClick={() => onCopyUrl(cls.meetingUrl)}
              title="Copy"
              className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition"
            >
              <Icon.Copy size={13} />
            </button>
            <a
              href={cls.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 h-7 px-2.5 rounded-lg flex items-center gap-1 text-xs font-medium bg-[var(--primary)] text-white hover:opacity-90 transition"
            >
              Join <Icon.ArrowLeft size={11} className="rotate-180" />
            </a>
          </div>
        </div>

        {/* Quick status change */}
        {(cls.status === "upcoming" || cls.status === "live") && (
          <div className="flex gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <Icon.Sparkles size={14} className="text-[var(--muted)] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--muted)] mb-2">Quick status update</p>
              <div className="flex gap-2">
                {cls.status === "upcoming" && (
                  <Button
                    size="sm"
                    onClick={() => onQuickStatus(cls, "live")}
                    loading={quickStatusId === cls.id}
                    className="!bg-rose-500 !border-rose-500 text-white"
                  >
                    <Icon.PlayCircle size={13} /> Start now
                  </Button>
                )}
                {cls.status === "live" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onQuickStatus(cls, "ended")}
                    loading={quickStatusId === cls.id}
                  >
                    <Icon.Circle size={13} /> End session
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onQuickStatus(cls, "cancelled")}
                  loading={quickStatusId === cls.id}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex gap-2 pt-1 border-t border-[var(--border)]">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button
            variant="outline"
            onClick={() => onDelete(cls)}
            className="!text-[var(--danger)] !border-[var(--danger)]/30 hover:!bg-red-500/5"
          >
            <Icon.Trash size={14} />
          </Button>
          <Button onClick={() => onEdit(cls)}>
            <Icon.Edit size={14} /> Edit
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Table helpers                                                            */
/* ──────────────────────────────────────────────────────────────────────── */

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`text-left font-semibold px-4 py-3 ${className ?? ""}`}>{children}</th>
  );
}

function Td({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <td className={`px-4 py-3 align-top ${className ?? ""}`} onClick={onClick}>
      {children}
    </td>
  );
}
