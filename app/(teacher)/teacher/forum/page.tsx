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

type Category = "general" | "question" | "announcement" | "discussion";
type SortKey  = "newest" | "oldest" | "replies" | "views";
type Filter   = "all" | "unanswered" | "pinned";

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
  category: Category;
  pinned: boolean;
  views: number;
  createdAt: string;
  authorName: string;
  authorRole: string;
  replies: Reply[];
};

// ── Category meta ──────────────────────────────────────────────────────────────
const CAT: Record<Category, { label: string; chip: string; dot: string }> = {
  general:      { label: "General",      chip: "bg-sky-500/10 text-sky-600 dark:text-sky-400",           dot: "bg-sky-500" },
  question:     { label: "Question",     chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400",     dot: "bg-amber-500" },
  announcement: { label: "Announcement", chip: "bg-[var(--primary-soft)] text-[var(--primary)]",         dot: "bg-[var(--primary)]" },
  discussion:   { label: "Discussion",   chip: "bg-violet-500/10 text-violet-600 dark:text-violet-400",  dot: "bg-violet-500" },
};

function CategoryChip({ cat, size = "sm" }: { cat: Category; size?: "sm" | "xs" }) {
  const m = CAT[cat] ?? CAT.general;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${
      size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
    } ${m.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${m.dot}`} />
      {m.label}
    </span>
  );
}

// ── Stat pill ──────────────────────────────────────────────────────────────────
function StatPill({ label, value, sub, icon, tint, urgent }: {
  label: string; value: number; sub?: string; icon: React.ReactNode; tint: string; urgent?: boolean;
}) {
  return (
    <Card className="hover-lift">
      <CardBody className="flex items-center gap-3 !py-3">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</p>
          <p className={`text-xl font-bold leading-tight ${urgent && value > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>{value}</p>
          {sub && <p className="text-[10px] text-[var(--muted-2)]">{sub}</p>}
        </div>
      </CardBody>
    </Card>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function TeacherForumPage() {
  const teacher = useTeacher();
  const toast   = useToast();
  const courses = teacher.myCourses();

  const [threads, setThreads]         = React.useState<Thread[]>([]);
  const [loading, setLoading]         = React.useState(true);
  const [filter, setFilter]           = React.useState<Filter>("all");
  const [cat, setCat]                 = React.useState<Category | "all">("all");
  const [courseFilter, setCourseFilter] = React.useState("all");
  const [sort, setSort]               = React.useState<SortKey>("newest");
  const [query, setQuery]             = React.useState("");
  const [composer, setComposer]       = React.useState(false);
  const [openId, setOpenId]           = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const r    = await fetch("/api/teacher/forum");
      const data = r.ok ? await r.json() : { threads: [] };
      setThreads(data.threads ?? []);
    } catch {
      toast.push({ title: "Couldn't load forum", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { load(); }, [load]);

  // ── Derived ──
  const courseOptions = React.useMemo(() => {
    const seen = new Map<string, string>();
    for (const t of threads) if (!seen.has(t.courseId)) seen.set(t.courseId, t.courseTitle);
    return Array.from(seen.entries()).map(([id, title]) => ({ id, title }));
  }, [threads]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads
      .filter((t) => {
        if (filter === "pinned")     return t.pinned;
        if (filter === "unanswered") return t.replies.length === 0;
        return true;
      })
      .filter((t) => cat === "all" || t.category === cat)
      .filter((t) => courseFilter === "all" || t.courseId === courseFilter)
      .filter((t) => !q || t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q));
  }, [threads, filter, cat, courseFilter, query]);

  const sorted = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sort === "oldest")  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === "replies") return b.replies.length - a.replies.length;
      if (sort === "views")   return b.views - a.views;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filtered, sort]);

  const counts = {
    all:        threads.length,
    unanswered: threads.filter((t) => t.replies.length === 0).length,
    pinned:     threads.filter((t) => t.pinned).length,
  };
  const catCounts: Record<string, number> = { all: threads.length };
  for (const t of threads) catCounts[t.category] = (catCounts[t.category] ?? 0) + 1;

  const totalReplies   = threads.reduce((s, t) => s + t.replies.length, 0);
  const openThread     = threads.find((t) => t.id === openId) ?? null;
  const hasFilters     = query.trim() || cat !== "all" || courseFilter !== "all";

  return (
    <div className="space-y-6 fade-in">
      {/* ── Header ── */}
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

      {/* ── Unanswered alert ── */}
      {counts.unanswered > 0 && filter !== "unanswered" && (
        <button
          onClick={() => setFilter("unanswered")}
          className="w-full text-left rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-center gap-3 hover:bg-amber-500/10 transition"
        >
          <div className="h-8 w-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
            <Icon.AlertCircle size={16} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              {counts.unanswered} unanswered {counts.unanswered === 1 ? "thread" : "threads"} need your reply
            </p>
            <p className="text-xs text-[var(--muted)]">Click to view unanswered threads</p>
          </div>
          <Icon.ChevronRight size={16} className="text-amber-500 shrink-0" />
        </button>
      )}

      {/* ── Stats ── */}
      {threads.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatPill label="Threads"    value={threads.length}    icon={<Icon.MessageSquare size={16} />} tint="bg-[var(--primary-soft)] text-[var(--primary)]"                sub="total discussions" />
          <StatPill label="Unanswered" value={counts.unanswered} icon={<Icon.AlertCircle size={16} />}  tint={counts.unanswered > 0 ? "bg-amber-500/15 text-amber-600" : "bg-[var(--surface-2)] text-[var(--muted)]"} sub="need a reply" urgent />
          <StatPill label="Replies"    value={totalReplies}      icon={<Icon.Send size={16} />}          tint="bg-sky-500/10 text-sky-600 dark:text-sky-400"                   sub="total responses" />
          <StatPill label="Pinned"     value={counts.pinned}     icon={<Icon.Pin size={16} />}           tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"       sub="featured threads" />
        </div>
      )}

      {/* ── Thread list card ── */}
      <Card>
        <CardBody className="space-y-4">
          {/* Filter tabs + search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Tabs
              value={filter}
              onChange={(v) => setFilter(v as Filter)}
              options={[
                { value: "all",        label: "All",        count: counts.all },
                { value: "unanswered", label: "Unanswered", count: counts.unanswered },
                { value: "pinned",     label: "Pinned",     count: counts.pinned },
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

          {/* Category chips + course filter + sort */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category chips */}
            <div className="flex flex-wrap gap-1.5">
              {(["all", "general", "question", "announcement", "discussion"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition border ${
                    cat === c
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"
                  }`}
                >
                  {c === "all" ? "All categories" : CAT[c as Category].label}
                  {catCounts[c] !== undefined && (
                    <span className={`ml-1 ${cat === c ? "opacity-70" : "text-[var(--muted-2)]"}`}>
                      {catCounts[c]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Course filter */}
            {courseOptions.length > 1 && (
              <Select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="!h-8 !text-xs sm:!w-44"
              >
                <option value="all">All courses</option>
                {courseOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </Select>
            )}

            {/* Sort */}
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="!h-8 !text-xs !w-36"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="replies">Most replies</option>
              <option value="views">Most viewed</option>
            </Select>

            {/* Clear filters */}
            {hasFilters && (
              <button
                onClick={() => { setQuery(""); setCat("all"); setCourseFilter("all"); }}
                className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] flex items-center gap-1"
              >
                <Icon.X size={13} /> Clear
              </button>
            )}
          </div>

          {/* Thread list */}
          {loading ? (
            <div className="space-y-0 divide-y divide-[var(--border)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-4">
                  <div className="h-10 w-10 rounded-full bg-[var(--surface-2)] animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-[var(--surface-2)] animate-pulse" />
                    <div className="h-3 w-1/3 rounded bg-[var(--surface-2)] animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <EmptyState
              icon={<Icon.MessageSquare size={20} />}
              title={threads.length === 0 ? "No threads yet" : "Nothing matches"}
              description={
                threads.length === 0
                  ? "Start a discussion or wait for students to post."
                  : "Try a different filter or search."
              }
              action={
                threads.length === 0 ? (
                  <Button onClick={() => setComposer(true)} disabled={courses.length === 0}>
                    <Icon.Plus size={14} /> New thread
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {sorted.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => setOpenId(t.id)}
                    className="w-full text-left flex items-start gap-3 px-2 py-3.5 hover:bg-[var(--surface-2)]/50 transition rounded-lg"
                  >
                    {/* Avatar */}
                    <Avatar name={t.authorName} size={38} />

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        {t.pinned && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-[10px] font-bold uppercase tracking-wider">
                            <Icon.Pin size={9} /> Pinned
                          </span>
                        )}
                        <CategoryChip cat={t.category} size="xs" />
                        <span className="font-semibold text-sm truncate">{t.title}</span>
                      </div>
                      {/* Meta */}
                      <p className="text-xs text-[var(--muted)] truncate">
                        <span className={t.authorRole === "Instructor" ? "text-[var(--primary)] font-medium" : ""}>
                          {t.authorName}
                        </span>
                        {" · "}{t.courseTitle}{" · "}{relativeTime(t.createdAt)}
                      </p>
                      {/* Body preview */}
                      {t.body && (
                        <p className="text-xs text-[var(--muted-2)] truncate mt-0.5 max-w-xl">{t.body}</p>
                      )}
                    </div>

                    {/* Right column: reply count + views */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {t.replies.length === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold">
                          <Icon.AlertCircle size={10} /> No reply
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--muted)] font-medium">
                          <Icon.MessageSquare size={12} className="text-[var(--primary)]" /> {t.replies.length}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] text-[var(--muted-2)]">
                        <Icon.Eye size={11} /> {t.views}
                      </span>
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
        onCreated={() => { setComposer(false); load(); }}
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

// ── Composer modal ─────────────────────────────────────────────────────────────
function ComposerModal({
  open, onClose, courses, onCreated,
}: {
  open: boolean;
  onClose: () => void;
  courses: { id: string; title: string }[];
  onCreated: () => void;
}) {
  const toast = useToast();
  const [form, setForm]   = React.useState({ title: "", body: "", courseId: "", category: "discussion" as Category });
  const [saving, setSaving] = React.useState(false);
  const [err, setErr]     = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm({ title: "", body: "", courseId: courses[0]?.id ?? "", category: "discussion" });
      setErr(null);
    }
  }, [open, courses]);

  async function submit() {
    setErr(null);
    if (form.title.trim().length < 3) return setErr("Title must be at least 3 characters.");
    if (!form.body.trim()) return setErr("Body can't be empty.");
    if (!form.courseId) return setErr("Please select a course.");
    setSaving(true);
    const r = await fetch("/api/teacher/forum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      setErr(e.error ?? "Couldn't post thread.");
      return;
    }
    toast.push({ title: "Thread posted!", tone: "success" });
    onCreated();
  }

  return (
    <Modal open={open} onClose={onClose} title="New forum thread" size="lg">
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <Label>Title</Label>
              <span className="text-[10px] text-[var(--muted-2)]">{form.title.length}/140</span>
            </div>
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
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
            >
              <option value="discussion">Discussion</option>
              <option value="announcement">Announcement</option>
              <option value="question">Question</option>
              <option value="general">General</option>
            </Select>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label>Body</Label>
            <span className="text-[10px] text-[var(--muted-2)]">{form.body.length} chars</span>
          </div>
          <Textarea
            rows={5}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Write the thread content here…"
          />
        </div>

        {/* Category preview */}
        <div className="flex items-center gap-2 rounded-lg bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--muted)]">
          <CategoryChip cat={form.category} />
          <span className="text-[var(--muted-2)]">will appear in {form.category} category</span>
        </div>

        {err && (
          <p className="text-sm text-[var(--danger)] bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg flex items-center gap-2">
            <Icon.AlertCircle size={14} className="shrink-0" /> {err}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1 border-t border-[var(--border)]">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} loading={saving}>
            <Icon.Send size={14} /> Post thread
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Thread detail modal ────────────────────────────────────────────────────────
function ThreadModal({
  thread, onClose, onChanged, onClosed,
}: {
  thread: Thread | null;
  onClose: () => void;
  onChanged: () => void;
  onClosed: () => void;
}) {
  const toast  = useToast();
  const [text, setText]       = React.useState("");
  const [busy, setBusy]       = React.useState(false);
  const [catEdit, setCatEdit] = React.useState(false);
  const [newCat, setNewCat]   = React.useState<Category>("discussion");

  React.useEffect(() => {
    setText("");
    if (thread) setNewCat(thread.category);
  }, [thread?.id]);

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
    try {
      const r = await fetch(`/api/teacher/forum/${thread.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !thread.pinned }),
      });
      if (r.ok) { toast.push({ title: thread.pinned ? "Thread unpinned" : "Thread pinned", tone: "success" }); onChanged(); }
      else toast.push({ title: "Couldn't update thread", tone: "danger" });
    } catch {
      toast.push({ title: "Network error", tone: "danger" });
    }
  }

  async function changeCategory() {
    if (newCat === thread.category) { setCatEdit(false); return; }
    try {
      const r = await fetch(`/api/teacher/forum/${thread.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCat }),
      });
      if (r.ok) {
        toast.push({ title: "Category updated", tone: "success" });
        setCatEdit(false);
        onChanged();
      } else toast.push({ title: "Couldn't update category", tone: "danger" });
    } catch {
      toast.push({ title: "Network error", tone: "danger" });
    }
  }

  async function remove() {
    if (!confirm(`Delete "${thread.title}"? This cannot be undone.`)) return;
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

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") reply();
  }

  return (
    <Modal open={true} onClose={onClose} title={thread.title} size="xl">
      <div className="p-5 space-y-4">
        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category */}
          {catEdit ? (
            <div className="flex items-center gap-2">
              <Select
                value={newCat}
                onChange={(e) => setNewCat(e.target.value as Category)}
                className="!h-7 !text-xs !w-36"
              >
                <option value="general">General</option>
                <option value="question">Question</option>
                <option value="announcement">Announcement</option>
                <option value="discussion">Discussion</option>
              </Select>
              <Button size="sm" onClick={changeCategory}><Icon.Check size={13} /> Apply</Button>
              <Button size="sm" variant="outline" onClick={() => setCatEdit(false)}><Icon.X size={13} /></Button>
            </div>
          ) : (
            <button onClick={() => setCatEdit(true)} title="Change category" className="hover:opacity-80 transition">
              <CategoryChip cat={thread.category} />
            </button>
          )}

          {/* Course */}
          <span className="text-xs text-[var(--muted)] bg-[var(--surface-2)] px-2 py-1 rounded-full">
            {thread.courseTitle}
          </span>

          {/* Views */}
          <span className="text-xs text-[var(--muted-2)] inline-flex items-center gap-1">
            <Icon.Eye size={12} /> {thread.views} views
          </span>

          {/* Pin / delete on right */}
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant={thread.pinned ? "primary" : "outline"} onClick={togglePin}>
              <Icon.Pin size={13} /> {thread.pinned ? "Unpin" : "Pin"}
            </Button>
            <Button size="sm" variant="ghost" onClick={remove} className="text-[var(--muted)] hover:text-red-500">
              <Icon.Trash size={13} /> Delete
            </Button>
          </div>
        </div>

        {/* Original post */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--surface-2)]">
          <Avatar name={thread.authorName} size={36} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="font-medium text-sm">{thread.authorName}</p>
              {thread.authorRole === "Instructor" && (
                <Badge variant="primary">Instructor</Badge>
              )}
              <span className="text-xs text-[var(--muted)] font-normal">{relativeTime(thread.createdAt)}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap text-[var(--foreground)]">{thread.body}</p>
          </div>
        </div>

        {/* Replies */}
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--muted-2)] font-semibold mb-3">
            {thread.replies.length === 0
              ? "No replies yet — be the first to respond"
              : `${thread.replies.length} ${thread.replies.length === 1 ? "reply" : "replies"}`}
          </p>
          <ul className="space-y-3">
            {thread.replies.map((r) => (
              <li key={r.id} className="flex items-start gap-3">
                <Avatar name={r.authorName} size={32} />
                <div className={`flex-1 min-w-0 rounded-xl border p-3 ${
                  r.authorRole === "Instructor"
                    ? "border-[var(--primary)]/30 bg-[var(--primary-soft)]/20"
                    : "border-[var(--border)]"
                }`}>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <p className="text-xs font-semibold">{r.authorName}</p>
                    {r.authorRole === "Instructor" && (
                      <Badge variant="primary">Instructor</Badge>
                    )}
                    <span className="text-[11px] text-[var(--muted)]">{relativeTime(r.createdAt)}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{r.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Reply compose */}
        <div className="pt-2 border-t border-[var(--border)] space-y-2">
          <div className="flex items-end gap-2">
            <Textarea
              rows={2}
              placeholder="Reply as instructor… (Ctrl+Enter to send)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button onClick={reply} disabled={!text.trim()} loading={busy}>
              <Icon.Send size={14} />
            </Button>
          </div>
          {text.length > 0 && (
            <p className="text-[10px] text-[var(--muted-2)] text-right">{text.length} chars · Ctrl+Enter to send</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
