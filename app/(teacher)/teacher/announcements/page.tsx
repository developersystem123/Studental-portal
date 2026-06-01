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
  Textarea,
  useToast,
} from "@/components/ui";
import { useTeacher } from "@/lib/store";
import { relativeTime } from "@/lib/utils";

type Priority = "normal" | "important" | "urgent";

type Announcement = {
  id: string;
  courseId: string; // "all" or a course id
  courseTitle: string;
  title: string;
  body: string;
  priority: Priority;
  pinned: boolean;
  createdAt: string;
};

const PRIORITY_STYLES: Record<
  Priority,
  { label: string; tint: string; badge: "info" | "warning" | "danger" }
> = {
  normal: { label: "Normal", tint: "from-sky-500/15 to-sky-500/5 border-sky-500/30", badge: "info" },
  important: {
    label: "Important",
    tint: "from-amber-500/15 to-amber-500/5 border-amber-500/30",
    badge: "warning",
  },
  urgent: {
    label: "Urgent",
    tint: "from-rose-500/15 to-rose-500/5 border-rose-500/30",
    badge: "danger",
  },
};

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
    toast.push({ title: editing ? "Announcement updated" : "Announcement sent", tone: "success" });
    setFormOpen(false);
    load();
  }

  async function togglePin(a: Announcement) {
    try {
      const r = await fetch(`/api/teacher/announcements/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !a.pinned }),
      });
      if (r.ok) load();
      else toast.push({ title: "Couldn't update announcement", tone: "danger" });
    } catch {
      toast.push({ title: "Network error", tone: "danger" });
    }
  }

  async function remove(a: Announcement) {
    try {
      const r = await fetch(`/api/teacher/announcements/${a.id}`, { method: "DELETE" });
      if (r.ok) {
        toast.push({ title: "Announcement removed", tone: "info" });
        setFormOpen(false);
        load();
      } else {
        toast.push({ title: "Couldn't remove announcement", tone: "danger" });
      }
    } catch {
      toast.push({ title: "Network error", tone: "danger" });
    }
  }

  return (
    <div className="space-y-6 fade-in">
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

      <Card>
        <CardBody>
          {loading ? (
            <p className="text-sm text-[var(--muted)]">Loading…</p>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<Icon.Megaphone size={20} />}
              title="Nothing announced yet"
              description="Share an update, deadline change, or pep talk."
              action={
                courses.length > 0 ? (
                  <Button onClick={openCreate}>
                    <Icon.Plus size={14} /> Post one
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="space-y-3">
              {items.map((a) => {
                const style = PRIORITY_STYLES[a.priority];
                return (
                  <li key={a.id}>
                    <div className={`rounded-2xl border bg-gradient-to-br p-4 ${style.tint}`}>
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0">
                          <Icon.Megaphone size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {a.pinned && (
                              <Badge variant="primary">
                                <Icon.Pin size={11} /> Pinned
                              </Badge>
                            )}
                            <Badge variant={style.badge}>{style.label}</Badge>
                            <Badge variant="default">{a.courseTitle}</Badge>
                            <span className="text-xs text-[var(--muted-2)] ml-auto">
                              {relativeTime(a.createdAt)}
                            </span>
                          </div>
                          <p className="mt-2 font-semibold">{a.title}</p>
                          <p className="text-sm text-[var(--foreground)]/80 whitespace-pre-wrap mt-1">
                            {a.body}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-3">
                        <Button size="sm" variant="ghost" onClick={() => togglePin(a)}>
                          <Icon.Pin size={14} /> {a.pinned ? "Unpin" : "Pin"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
                          <Icon.Edit size={14} /> Edit
                        </Button>
                      </div>
                    </div>
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
        title={editing ? "Edit announcement" : "Send announcement"}
      >
        <div className="p-5 space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={120}
            />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea
              rows={5}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </div>
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
          <Checkbox
            checked={form.pinned}
            onChange={(v) => setForm({ ...form, pinned: v })}
            label="Pin to the top"
          />
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
                <Icon.Send size={14} /> {editing ? "Save" : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
