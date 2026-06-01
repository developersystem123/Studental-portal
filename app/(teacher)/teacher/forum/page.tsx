"use client";

import * as React from "react";
import Icon from "@/components/icons";
import {
  Avatar,
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
import { useTeacher } from "@/lib/store";
import { relativeTime } from "@/lib/utils";

type Reply = {
  id: string;
  body: string;
  createdAt: string;
  authorName: string;
  authorRole: string;
};

type Thread = {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  views: number;
  createdAt: string;
  authorName: string;
  authorRole: string;
  replies: Reply[];
};

type Filter = "all" | "pinned";

export default function TeacherForumPage() {
  const teacher = useTeacher();
  const toast = useToast();
  const courses = teacher.myCourses();

  const [threads, setThreads] = React.useState<Thread[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");
  const [composer, setComposer] = React.useState(false);
  const [openId, setOpenId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/teacher/forum");
      const data = r.ok ? await r.json() : { threads: [] };
      setThreads(data.threads ?? []);
    } catch {
      toast.push({ title: "Couldn't load forum", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads
      .filter((t) => (filter === "pinned" ? t.pinned : true))
      .filter((t) => !q || t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q));
  }, [threads, filter, query]);

  const counts = {
    all: threads.length,
    pinned: threads.filter((t) => t.pinned).length,
  };

  const openThread = threads.find((t) => t.id === openId) ?? null;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
            Engagement
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Forum</h1>
          <p className="mt-1 text-[var(--muted)]">
            Discussions across your courses — reply to questions and pin important threads.
          </p>
        </div>
        <Button onClick={() => setComposer(true)} disabled={courses.length === 0}>
          <Icon.Plus size={16} /> New thread
        </Button>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Tabs
              value={filter}
              onChange={(v) => setFilter(v as Filter)}
              options={[
                { value: "all", label: "All", count: counts.all },
                { value: "pinned", label: "Pinned", count: counts.pinned },
              ]}
            />
            <Input
              icon={<Icon.Search size={16} />}
              placeholder="Search threads…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="sm:max-w-xs"
            />
          </div>

          {loading ? (
            <p className="text-sm text-[var(--muted)]">Loading…</p>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Icon.MessageSquare size={20} />}
              title={threads.length === 0 ? "No threads yet" : "Nothing matches"}
              description={
                threads.length === 0
                  ? "Start a discussion or wait for students to post."
                  : "Try a different filter."
              }
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {filtered.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => setOpenId(t.id)}
                    className="w-full text-left flex items-start gap-3 p-4 hover:bg-[var(--surface-2)]/40 transition first:rounded-t-xl last:rounded-b-xl"
                  >
                    <Avatar name={t.authorName} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        {t.pinned && (
                          <Badge variant="primary">
                            <Icon.Pin size={11} /> Pinned
                          </Badge>
                        )}
                        <p className="font-medium truncate">{t.title}</p>
                      </div>
                      <p className="text-xs text-[var(--muted)] truncate">
                        {t.authorName} · {t.courseTitle} · {relativeTime(t.createdAt)}
                      </p>
                      {t.body && (
                        <p className="text-xs text-[var(--muted-2)] truncate mt-1 max-w-lg">{t.body}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge variant="info">
                        <Icon.MessageSquare size={11} /> {t.replies.length}
                      </Badge>
                      {t.views > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--muted-2)]">
                          <Icon.Eye size={11} /> {t.views}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <ComposerModal
        open={composer}
        onClose={() => setComposer(false)}
        courses={courses.map((c) => ({ id: c.id, title: c.title }))}
        onCreated={() => {
          setComposer(false);
          load();
        }}
      />

      <ThreadModal
        thread={openThread}
        onClose={() => setOpenId(null)}
        onChanged={load}
        onClosed={() => setOpenId(null)}
      />
    </div>
  );
}

function ComposerModal({
  open,
  onClose,
  courses,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  courses: { id: string; title: string }[];
  onCreated: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = React.useState({ title: "", body: "", courseId: "" });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) setForm({ title: "", body: "", courseId: courses[0]?.id ?? "" });
  }, [open, courses]);

  async function submit() {
    if (!form.title.trim() || !form.courseId) return;
    setSaving(true);
    const r = await fetch("/api/teacher/forum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      toast.push({ title: "Couldn't post thread", description: e.error, tone: "danger" });
      return;
    }
    toast.push({ title: "Thread posted", tone: "success" });
    onCreated();
  }

  return (
    <Modal open={open} onClose={onClose} title="New forum thread" size="lg">
      <div className="p-5 space-y-4">
        <div>
          <Label>Title</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Week 4 — common questions"
            maxLength={140}
          />
        </div>
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
          <Label>Body</Label>
          <Textarea
            rows={5}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving} disabled={!form.title.trim() || !form.courseId}>
            <Icon.Send size={14} /> Post
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ThreadModal({
  thread,
  onClose,
  onChanged,
  onClosed,
}: {
  thread: Thread | null;
  onClose: () => void;
  onChanged: () => void;
  onClosed: () => void;
}) {
  const toast = useToast();
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => setText(""), [thread?.id]);
  if (!thread) return null;

  async function reply() {
    if (!text.trim() || !thread) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/forum/${thread.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text.trim() }),
      });
      if (r.ok) { setText(""); onChanged(); }
      else toast.push({ title: "Couldn't post reply", tone: "danger" });
    } catch {
      toast.push({ title: "Network error", tone: "danger" });
    } finally {
      setBusy(false);
    }
  }

  async function togglePin() {
    if (!thread) return;
    try {
      const r = await fetch(`/api/teacher/forum/${thread.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !thread.pinned }),
      });
      if (r.ok) onChanged();
      else toast.push({ title: "Couldn't update thread", tone: "danger" });
    } catch {
      toast.push({ title: "Network error", tone: "danger" });
    }
  }

  async function remove() {
    if (!thread) return;
    try {
      const r = await fetch(`/api/teacher/forum/${thread.id}`, { method: "DELETE" });
      if (r.ok) {
        toast.push({ title: "Thread deleted", tone: "info" });
        onClosed();
        onChanged();
      } else {
        toast.push({ title: "Couldn't delete thread", tone: "danger" });
      }
    } catch {
      toast.push({ title: "Network error", tone: "danger" });
    }
  }

  return (
    <Modal open={true} onClose={onClose} title={thread.title} size="xl">
      <div className="p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={thread.pinned ? "primary" : "outline"}
            onClick={togglePin}
          >
            <Icon.Pin size={14} /> {thread.pinned ? "Unpin" : "Pin"}
          </Button>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={remove}>
            <Icon.Trash size={14} /> Delete
          </Button>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--surface-2)]">
          <Avatar name={thread.authorName} size={36} />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">
              {thread.authorName}{" "}
              <span className="text-xs text-[var(--muted)] font-normal">
                · {relativeTime(thread.createdAt)}
              </span>
            </p>
            <p className="text-sm mt-1 whitespace-pre-wrap">{thread.body}</p>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--muted-2)] font-semibold mb-2">
            {thread.replies.length} {thread.replies.length === 1 ? "reply" : "replies"}
          </p>
          <ul className="space-y-3">
            {thread.replies.map((r) => (
              <li key={r.id} className="flex items-start gap-3">
                <Avatar name={r.authorName} size={32} />
                <div className="flex-1 min-w-0 rounded-xl border border-[var(--border)] p-3">
                  <p className="text-xs font-medium">
                    {r.authorName}{" "}
                    {r.authorRole === "Instructor" && (
                      <Badge variant="primary" className="ml-1">
                        Instructor
                      </Badge>
                    )}
                    <span className="text-[var(--muted)] font-normal ml-2">
                      {relativeTime(r.createdAt)}
                    </span>
                  </p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{r.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-end gap-2 pt-2 border-t border-[var(--border)]">
          <Textarea
            rows={2}
            placeholder="Reply as instructor…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button onClick={reply} disabled={!text.trim()} loading={busy}>
            <Icon.Send size={14} />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
