"use client";

import * as React from "react";
import Icon from "@/components/icons";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Checkbox,
  EmptyState,
  Input,
  Label,
  Modal,
  Select,
  Skeleton,
  Textarea,
  useToast,
} from "@/components/ui";
import { useTeacher } from "@/lib/store";
import { relativeTime } from "@/lib/utils";

type Priority = "normal" | "important" | "urgent";

type Announcement = {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  body: string;
  priority: Priority;
  pinned: boolean;
  createdAt: string;
};

const PRIORITY_META: Record<
  Priority,
  { label: string; card: string; bar: string; badge: "info" | "warning" | "danger" }
> = {
  normal: {
    label: "Normal",
    card: "bg-sky-500/5 border-sky-500/20",
    bar: "bg-sky-500",
    badge: "info",
  },
  important: {
    label: "Important",
    card: "bg-amber-500/5 border-amber-500/20",
    bar: "bg-amber-500",
    badge: "warning",
  },
  urgent: {
    label: "Urgent",
    card: "bg-red-500/5 border-red-500/20",
    bar: "bg-red-500",
    badge: "danger",
  },
};

const SORT_OPTIONS = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
  { label: "Pinned first", value: "pinned" },
  { label: "Urgent first", value: "priority" },
];

type FormState = {
  title: string;
  body: string;
  courseId: string;
  priority: Priority;
  pinned: boolean;
};

const emptyForm: FormState = {
  title: "",
  body: "",
  courseId: "all",
  priority: "normal",
  pinned: false,
};

const BODY_LIMIT = 240;

function AnnouncementSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-[var(--border)] overflow-hidden flex">
          <div className="w-1 bg-[var(--surface-2)] shrink-0" />
          <div className="flex-1 p-4 flex gap-3">
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-48 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
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
  tone?: "default" | "primary" | "warning" | "danger";
}) {
  const tints = {
    default: "bg-[var(--surface-2)] text-[var(--muted)]",
    primary: "bg-[oklch(0.93_0.05_270)] text-[var(--primary)]",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    danger: "bg-red-500/10 text-red-500",
  };
  return (
    <Card>
      <CardBody className="flex items-center gap-3 !py-3">
        <div
          className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${tints[tone]}`}
        >
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

export default function TeacherAnnouncementsPage() {
  const teacher = useTeacher();
  const toast = useToast();
  const courses = teacher.myCourses();

  const [items, setItems] = React.useState<Announcement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Announcement | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Announcement | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

  // Filters + sort
  const [search, setSearch] = React.useState("");
  const [courseFilter, setCourseFilter] = React.useState("all");
  const [priorityFilter, setPriorityFilter] = React.useState<"all" | Priority>("all");
  const [sortKey, setSortKey] = React.useState("newest");

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/teacher/announcements");
      const data = r.ok ? await r.json() : { announcements: [] };
      setItems(data.announcements ?? []);
    } catch {
      toast.push({ title: "Couldn't load announcements", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(a: Announcement) {
    setEditing(a);
    setForm({
      title: a.title,
      body: a.body,
      courseId: a.courseId,
      priority: a.priority,
      pinned: a.pinned,
    });
    setFormOpen(true);
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    if (!form.title.trim() || !form.body.trim()) {
      toast.push({ title: "Title and message are required", tone: "danger" });
      return;
    }
    setSaving(true);
    const r = await fetch(
      editing ? `/api/teacher/announcements/${editing.id}` : "/api/teacher/announcements",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
    );
    setSaving(false);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      toast.push({ title: "Couldn't save", description: e.error, tone: "danger" });
      return;
    }
    toast.push({
      title: editing ? "Announcement updated" : "Announcement posted!",
      tone: "success",
    });
    setFormOpen(false);
    load();
  }

  async function togglePin(a: Announcement) {
    const r = await fetch(`/api/teacher/announcements/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !a.pinned }),
    });
    if (r.ok) load();
    else toast.push({ title: "Couldn't update", tone: "danger" });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const r = await fetch(`/api/teacher/announcements/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    if (r.ok) {
      toast.push({ title: "Announcement deleted", tone: "info" });
      setDeleteTarget(null);
      setFormOpen(false);
      load();
    } else {
      toast.push({ title: "Couldn't delete", tone: "danger" });
    }
  }

  // Stats
  const stats = React.useMemo(() => {
    const pinned = items.filter((a) => a.pinned).length;
    const urgent = items.filter((a) => a.priority === "urgent").length;
    const important = items.filter((a) => a.priority === "important").length;
    return { total: items.length, pinned, urgent, important };
  }, [items]);

  // Unique courses present in announcements (for filter)
  const coursesInItems = React.useMemo(() => {
    const seen = new Map<string, string>();
    for (const a of items) {
      if (!seen.has(a.courseId)) seen.set(a.courseId, a.courseTitle);
    }
    return [...seen.entries()];
  }, [items]);

  // Filtered + sorted list
  const visible = React.useMemo(() => {
    let list = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q),
      );
    }
    if (courseFilter !== "all") list = list.filter((a) => a.courseId === courseFilter);
    if (priorityFilter !== "all") list = list.filter((a) => a.priority === priorityFilter);
    switch (sortKey) {
      case "oldest":
        return [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      case "pinned":
        return [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned));
      case "priority": {
        const order: Record<Priority, number> = { urgent: 0, important: 1, normal: 2 };
        return [...list].sort((a, b) => order[a.priority] - order[b.priority]);
      }
      default:
        return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  }, [items, search, courseFilter, priorityFilter, sortKey]);

  const broadcastTargetCount = React.useMemo(() => {
    if (form.courseId === "all") return teacher.myStudents().length;
    return teacher.myStudents().filter((s) => s.courseId === form.courseId).length;
  }, [form.courseId, teacher]);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
            Engagement
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="mt-1 text-[var(--muted)]">
            Broadcast updates to a class or all of your students at once.
          </p>
        </div>
        <Button onClick={openCreate} disabled={courses.length === 0}>
          <Icon.Megaphone size={16} /> New announcement
        </Button>
      </div>

      {/* Stats bar */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard
            label="Total posts"
            value={stats.total}
            icon={<Icon.Megaphone size={16} />}
            tone="primary"
          />
          <SummaryCard
            label="Pinned"
            value={stats.pinned}
            icon={<Icon.Pin size={16} />}
            tone={stats.pinned > 0 ? "primary" : "default"}
          />
          <SummaryCard
            label="Important"
            value={stats.important}
            icon={<Icon.AlertCircle size={16} />}
            tone={stats.important > 0 ? "warning" : "default"}
          />
          <SummaryCard
            label="Urgent"
            value={stats.urgent}
            icon={<Icon.AlertCircle size={16} />}
            tone={stats.urgent > 0 ? "danger" : "default"}
          />
        </div>
      )}

      {/* Search + filters */}
      {!loading && items.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <div className="relative max-w-xs flex-1">
            <Icon.Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
            />
            <Input
              placeholder="Search announcements…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="!pl-8 !h-9 !text-sm"
            />
          </div>
          {coursesInItems.length > 1 && (
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="text-sm border border-[var(--border)] rounded-lg px-2.5 py-1.5 bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/40"
            >
              <option value="all">All courses</option>
              {coursesInItems.map(([id, title]) => (
                <option key={id} value={id}>
                  {title.length > 32 ? title.slice(0, 32) + "…" : title}
                </option>
              ))}
            </select>
          )}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as "all" | Priority)}
            className="text-sm border border-[var(--border)] rounded-lg px-2.5 py-1.5 bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/40"
          >
            <option value="all">All priorities</option>
            <option value="normal">Normal</option>
            <option value="important">Important</option>
            <option value="urgent">Urgent</option>
          </select>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="text-sm border border-[var(--border)] rounded-lg px-2.5 py-1.5 bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/40 sm:ml-auto"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Announcements list */}
      <Card>
        <CardBody>
          {loading ? (
            <AnnouncementSkeleton />
          ) : items.length === 0 ? (
            <EmptyState
              icon={<Icon.Megaphone size={20} />}
              title="Nothing announced yet"
              description="Share an update, deadline change, or pep talk with your students."
              action={
                courses.length > 0 ? (
                  <Button onClick={openCreate}>
                    <Icon.Plus size={14} /> Post one
                  </Button>
                ) : undefined
              }
            />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<Icon.Search size={20} />}
              title="No announcements match"
              description="Try adjusting your search or clearing the filters."
            />
          ) : (
            <ul className="space-y-3">
              {visible.map((a) => {
                const meta = PRIORITY_META[a.priority];
                const expanded = expandedIds.has(a.id);
                const isLong = a.body.length > BODY_LIMIT;
                return (
                  <li key={a.id}>
                    <div className={`rounded-2xl border overflow-hidden ${meta.card}`}>
                      <div className="flex">
                        {/* Priority accent bar */}
                        <div className={`w-1 shrink-0 ${meta.bar}`} />

                        <div className="flex-1 p-4">
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className="h-10 w-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5">
                              <Icon.Megaphone size={17} />
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Meta row */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {a.pinned && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                                    <Icon.Pin size={10} /> Pinned
                                  </span>
                                )}
                                <Badge variant={meta.badge} className="text-[10px]">
                                  {meta.label}
                                </Badge>
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] font-medium truncate max-w-[160px]">
                                  {a.courseTitle}
                                </span>
                                <span className="text-[11px] text-[var(--muted)] ml-auto shrink-0">
                                  {relativeTime(a.createdAt)}
                                </span>
                              </div>

                              {/* Title + body */}
                              <p className="mt-2 font-semibold text-[15px] leading-snug">
                                {a.title}
                              </p>
                              <p className="text-sm text-[var(--foreground)]/80 whitespace-pre-wrap mt-1 leading-relaxed">
                                {isLong && !expanded
                                  ? a.body.slice(0, BODY_LIMIT) + "…"
                                  : a.body}
                              </p>
                              {isLong && (
                                <button
                                  onClick={() => toggleExpanded(a.id)}
                                  className="mt-1 text-xs text-[var(--primary)] font-semibold hover:underline"
                                >
                                  {expanded ? "Show less" : "Read more"}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-end gap-1.5 pt-3">
                            <Button size="sm" variant="ghost" onClick={() => togglePin(a)}>
                              <Icon.Pin size={13} /> {a.pinned ? "Unpin" : "Pin"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
                              <Icon.Edit size={13} /> Edit
                            </Button>
                            <button
                              onClick={() => setDeleteTarget(a)}
                              className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Delete"
                            >
                              <Icon.Trash size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* Create / Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        size="lg"
        title={editing ? "Edit announcement" : "New announcement"}
        description={
          editing
            ? "Update the details below."
            : "Post an update to a class or all your students."
        }
      >
        <div className="space-y-4">
          {/* Title */}
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <Label>Title</Label>
              <span
                className={`text-[11px] ${form.title.length > 100 ? "text-amber-500" : "text-[var(--muted)]"}`}
              >
                {form.title.length}/120
              </span>
            </div>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={120}
              placeholder="Short, descriptive title…"
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <Label>Message</Label>
              <span
                className={`text-[11px] ${form.body.length > 900 ? "text-amber-500" : "text-[var(--muted)]"}`}
              >
                {form.body.length} chars
              </span>
            </div>
            <Textarea
              rows={5}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Write your announcement here…"
            />
          </div>

          {/* Audience + priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Audience</Label>
              <Select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              >
                <option value="all">All my students</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </Select>
              <p className="text-[11px] text-[var(--muted)] mt-1">
                Reaches{" "}
                <span className="font-semibold text-[var(--foreground)]">
                  {broadcastTargetCount}
                </span>{" "}
                student{broadcastTargetCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
          </div>

          {/* Priority notice */}
          {form.priority !== "normal" && (
            <div
              className={`text-xs px-3 py-2 rounded-lg border flex items-center gap-2 ${
                form.priority === "urgent"
                  ? "bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400"
                  : "bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400"
              }`}
            >
              <Icon.AlertCircle size={13} />
              {form.priority === "urgent"
                ? "Students will see an urgent red badge — use for time-sensitive issues."
                : "Students will see an important amber badge on this post."}
            </div>
          )}

          <Checkbox
            checked={form.pinned}
            onChange={(v) => setForm({ ...form, pinned: v })}
            label="Pin to the top of announcements"
          />

          {/* Footer */}
          <div className="flex justify-between gap-2 pt-2 border-t border-[var(--border)]">
            {editing ? (
              <button
                onClick={() => {
                  setFormOpen(false);
                  setDeleteTarget(editing);
                }}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Icon.Trash size={14} /> Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={submit}
                loading={saving}
                disabled={!form.title.trim() || !form.body.trim()}
              >
                <Icon.Send size={14} /> {editing ? "Save changes" : "Post announcement"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete announcement?"
        size="sm"
      >
        <div className="space-y-4">
          {deleteTarget && (
            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <p className="font-semibold text-sm">{deleteTarget.title}</p>
              <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">{deleteTarget.body}</p>
            </div>
          )}
          <p className="text-sm text-[var(--muted)]">
            This will permanently remove the announcement. Students will no longer see it. This
            can&apos;t be undone.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting}>
              <Icon.Trash size={14} /> Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
