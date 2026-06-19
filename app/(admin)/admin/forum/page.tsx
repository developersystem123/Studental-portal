"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  Modal,
  Select,
  StatCard,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { cn, relativeTime } from "@/lib/utils";

type Category = "general" | "question" | "announcement" | "discussion";

type Post = {
  id: string;
  title: string;
  body: string;
  category: Category;
  pinned: boolean;
  views: number;
  createdAt: string;
  authorName: string;
  authorEmail: string;
  courseTitle?: string;
  replyCount: number;
};

const CATEGORY_BADGE: Record<Category, "default" | "info" | "primary" | "warning"> = {
  general: "default", question: "info", announcement: "warning", discussion: "primary",
};

const CATEGORY_COLOR: Record<Category, string> = {
  general:      "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  question:     "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  announcement: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  discussion:   "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

type Filter  = "all" | Category | "pinned";
type SortKey = "date" | "views" | "replies";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 10;

function exportCSV(posts: Post[]) {
  const header = ["Title", "Category", "Author", "Email", "Course", "Replies", "Views", "Pinned", "Date"];
  const data   = posts.map((p) => [
    `"${p.title.replace(/"/g, '""')}"`, p.category,
    `"${p.authorName}"`, `"${p.authorEmail}"`,
    `"${p.courseTitle ?? ""}"`, p.replyCount, p.views,
    p.pinned ? "Yes" : "No",
    new Date(p.createdAt).toLocaleDateString(),
  ]);
  const csv  = [header, ...data].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "forum-posts.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminForumPage() {
  const toast = useToast();

  const [posts,    setPosts]    = React.useState<Post[]>([]);
  const [loading,  setLoading]  = React.useState(true);
  const [filter,   setFilter]   = React.useState<Filter>("all");
  const [query,    setQuery]    = React.useState("");
  const [course,   setCourse]   = React.useState("all");
  const [sortKey,  setSortKey]  = React.useState<SortKey>("date");
  const [sortDir,  setSortDir]  = React.useState<SortDir>("desc");
  const [page,     setPage]     = React.useState(1);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [detail,   setDetail]   = React.useState<Post | null>(null);
  const [deleting, setDeleting] = React.useState<Post | null>(null);
  const [bulkDel,  setBulkDel]  = React.useState(false);
  const [busy,     setBusy]     = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/admin/forum");
      const data = await r.json();
      if (r.ok) setPosts(data.posts ?? []);
      else toast.push({ title: "Failed to load posts", tone: "danger" });
    } catch {
      toast.push({ title: "Network error", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { load(); }, [load]);

  const courseOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    posts.forEach((p) => { if (p.courseTitle) map.set(p.courseTitle, p.courseTitle); });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [posts]);

  const stats = React.useMemo(() => ({
    total:      posts.length,
    pinned:     posts.filter((p) => p.pinned).length,
    replies:    posts.reduce((s, p) => s + p.replyCount, 0),
    views:      posts.reduce((s, p) => s + p.views, 0),
    questions:  posts.filter((p) => p.category === "question").length,
  }), [posts]);

  const counts = React.useMemo(() => ({
    all: posts.length,
    question: posts.filter((p) => p.category === "question").length,
    discussion: posts.filter((p) => p.category === "discussion").length,
    announcement: posts.filter((p) => p.category === "announcement").length,
    general: posts.filter((p) => p.category === "general").length,
    pinned: posts.filter((p) => p.pinned).length,
  }), [posts]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts
      .filter((p) => {
        if (filter === "pinned"   && !p.pinned)              return false;
        if (filter !== "all" && filter !== "pinned" && p.category !== filter) return false;
        if (course !== "all"      && p.courseTitle !== course) return false;
        if (!q) return true;
        return (
          p.title.toLowerCase().includes(q)      ||
          p.authorName.toLowerCase().includes(q) ||
          p.body.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === "date")    cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortKey === "views")   cmp = a.views - b.views;
        if (sortKey === "replies") cmp = a.replyCount - b.replyCount;
        // Pinned posts always float to top
        if (b.pinned && !a.pinned) return 1;
        if (a.pinned && !b.pinned) return -1;
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [posts, filter, query, course, sortKey, sortDir]);

  React.useEffect(() => { setPage(1); setSelected(new Set()); }, [query, filter, course, sortKey, sortDir]);

  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allSelected  = paginated.length > 0 && paginated.every((p) => selected.has(p.id));

  function toggleSelect(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleSelectAll() {
    if (allSelected) setSelected((prev) => { const n = new Set(prev); paginated.forEach((p) => n.delete(p.id)); return n; });
    else             setSelected((prev) => { const n = new Set(prev); paginated.forEach((p) => n.add(p.id)); return n; });
  }

  async function togglePin(p: Post) {
    setBusy(p.id);
    const r = await fetch(`/api/admin/forum/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !p.pinned }),
    });
    setBusy(null);
    if (!r.ok) { toast.push({ title: "Couldn't update post", tone: "danger" }); return; }
    toast.push({ title: p.pinned ? "Post unpinned" : "Post pinned", tone: "success" });
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const r = await fetch(`/api/admin/forum/${deleting.id}`, { method: "DELETE" });
    if (!r.ok) { toast.push({ title: "Couldn't delete post", tone: "danger" }); return; }
    toast.push({ title: "Post deleted", tone: "info" });
    setDeleting(null); load();
  }

  async function confirmBulkDelete() {
    for (const id of Array.from(selected)) {
      await fetch(`/api/admin/forum/${id}`, { method: "DELETE" });
    }
    toast.push({ title: `${selected.size} post${selected.size > 1 ? "s" : ""} deleted`, tone: "info" });
    setBulkDel(false); setSelected(new Set()); load();
  }

  const hotThreshold = React.useMemo(() => {
    if (posts.length === 0) return Infinity;
    const avg = posts.reduce((s, p) => s + p.views, 0) / posts.length;
    return avg * 1.5;
  }, [posts]);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">Forum moderation</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Review community posts — pin, moderate, and export.</p>
        </div>
        <Button variant="outline" onClick={() => { exportCSV(filtered); toast.push({ title: "CSV exported", tone: "success" }); }}>
          <Icon.Download size={15} /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total posts"    value={stats.total}     icon={<Icon.MessageSquare size={16} />} tone="primary" delta="All posts" />
        <StatCard label="Pinned"         value={stats.pinned}    icon={<Icon.Pin size={16} />}           tone="warning" delta="Highlighted" />
        <StatCard label="Total replies"  value={stats.replies}   icon={<Icon.MessageSquare size={16} />} tone="accent"  delta="Community responses" />
        <StatCard label="Total views"    value={stats.views.toLocaleString()} icon={<Icon.Eye size={16} />} tone="success" delta="All-time reads" />
        <StatCard label="Questions"      value={stats.questions} icon={<Icon.Help size={16} />}          tone="primary" delta="Unanswered posts" />
      </div>

      <Card>
        <CardBody className="space-y-4">
          {/* Filters */}
          <div className="space-y-3">
            {/* Scrollable tab bar */}
            <div className="overflow-x-auto pb-1">
              <div className="flex p-1 rounded-xl bg-[var(--surface-2)] gap-1 w-max min-w-full">
                {([
                  { value: "all",          label: "All",           count: counts.all },
                  { value: "question",     label: "Questions",     count: counts.question },
                  { value: "discussion",   label: "Discussion",    count: counts.discussion },
                  { value: "announcement", label: "Announcements", count: counts.announcement },
                  { value: "pinned",       label: "Pinned",        count: counts.pinned },
                ] as { value: Filter; label: string; count: number }[]).map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setFilter(o.value)}
                    className={`px-3 h-9 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                      filter === o.value
                        ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {o.label}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      filter === o.value
                        ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                        : "bg-[var(--surface-2)]"
                    }`}>
                      {o.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search + filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search posts or authors…"
                icon={<Icon.Search size={15} />}
                className="!h-9 flex-1"
              />
              <div className="flex gap-2">
                <Select value={course} onChange={(e) => setCourse(e.target.value)} className="!h-9 flex-1 sm:!w-40">
                  <option value="all">All courses</option>
                  {courseOptions.map(([id, title]) => (
                    <option key={id} value={id}>{title.length > 28 ? title.slice(0, 26) + "…" : title}</option>
                  ))}
                </Select>
                <Select
                  value={`${sortKey}-${sortDir}`}
                  onChange={(e) => {
                    const [k, d] = e.target.value.split("-");
                    setSortKey(k as SortKey); setSortDir(d as SortDir);
                  }}
                  className="!h-9 flex-1 sm:!w-36"
                >
                  <option value="date-desc">Latest first</option>
                  <option value="date-asc">Oldest first</option>
                  <option value="views-desc">Most viewed</option>
                  <option value="replies-desc">Most replies</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-red-500/8 border border-red-500/20">
              <span className="text-sm font-semibold text-[var(--danger)]">{selected.size} post{selected.size > 1 ? "s" : ""} selected</span>
              <div className="flex gap-2 ml-auto">
                <Button size="sm" variant="danger" onClick={() => setBulkDel(true)}>
                  <Icon.Trash size={13} /> Delete selected
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Icon.Loader size={22} className="animate-spin text-[var(--primary)]" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Icon.MessageSquare size={28} />}
              title={posts.length === 0 ? "No forum posts yet" : "No matching posts"}
              description={posts.length === 0 ? "Community posts will appear here for moderation." : "Try a different filter or search."}
            />
          ) : (
            <>
              {/* Table header */}
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="rounded accent-[var(--primary)] cursor-pointer" />
                <span className="flex-1">Post</span>
                <span className="hidden md:block w-24 text-center">Replies</span>
                <span className="hidden md:block w-20 text-center">Views</span>
                <span className="hidden lg:block w-28 text-right">Date</span>
                <span className="w-32 text-right">Actions</span>
              </div>

              {/* Posts */}
              <div className="space-y-2">
                {paginated.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      "group rounded-xl border transition-all duration-150",
                      selected.has(p.id)
                        ? "border-[var(--primary)]/40 bg-[var(--primary-soft)]/30"
                        : p.pinned
                        ? "border-amber-400/30 bg-amber-500/5"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:shadow-sm",
                    )}
                  >
                    <div className="flex items-start gap-3 p-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="mt-1 rounded accent-[var(--primary)] cursor-pointer shrink-0"
                      />

                      {/* Avatar */}
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                        {p.authorName.charAt(0).toUpperCase()}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {p.pinned && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                              <Icon.Pin size={9} /> Pinned
                            </span>
                          )}
                          <span className={cn("inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", CATEGORY_COLOR[p.category])}>
                            {p.category}
                          </span>
                          {p.views >= hotThreshold && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
                              🔥 Hot
                            </span>
                          )}
                          <span className="text-xs text-[var(--muted-2)]">{relativeTime(p.createdAt)}</span>
                        </div>

                        <button
                          className="text-left font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition line-clamp-1 w-full"
                          onClick={() => setDetail(p)}
                        >
                          {p.title}
                        </button>

                        <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-1">{p.body}</p>

                        <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted-2)]">
                          <span className="font-medium text-[var(--muted)]">{p.authorName}</span>
                          <span className="flex items-center gap-1"><Icon.MessageSquare size={11} /> {p.replyCount}</span>
                          <span className="flex items-center gap-1"><Icon.Eye size={11} /> {p.views.toLocaleString()}</span>
                          {p.courseTitle && (
                            <span className="hidden sm:block truncate max-w-[200px] text-[var(--muted-2)]">
                              {p.courseTitle}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setDetail(p)}
                          className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)] transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          title="View post"
                        >
                          <Icon.Eye size={14} />
                        </button>
                        <button
                          onClick={() => togglePin(p)}
                          disabled={busy === p.id}
                          className={cn(
                            "p-1.5 rounded-lg transition",
                            p.pinned
                              ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
                              : "text-[var(--muted)] hover:text-amber-500 hover:bg-amber-500/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
                          )}
                          title={p.pinned ? "Unpin" : "Pin"}
                        >
                          <Icon.Pin size={14} />
                        </button>
                        <button
                          onClick={() => setDeleting(p)}
                          className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--danger)] hover:bg-red-500/10 transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          title="Delete"
                        >
                          <Icon.Trash size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
                <p className="text-xs text-[var(--muted)]">
                  Showing <span className="font-semibold text-[var(--foreground)]">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
                  <span className="font-semibold text-[var(--foreground)]">{filtered.length}</span> posts
                </p>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(1)} title="First">
                    <Icon.ChevronLeft size={13} /><Icon.ChevronLeft size={13} className="-ml-2" />
                  </Button>
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    <Icon.ChevronLeft size={13} /> Prev
                  </Button>
                  <div className="flex items-center gap-1 mx-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | "…")[]>((acc, p, i, arr) => {
                        if (i > 0 && typeof arr[i - 1] === "number" && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                        acc.push(p); return acc;
                      }, [])
                      .map((p, i) =>
                        p === "…" ? (
                          <span key={`e-${i}`} className="px-1 text-[var(--muted)] text-sm">…</span>
                        ) : (
                          <button key={p} onClick={() => setPage(p as number)}
                            className={cn("h-8 w-8 rounded-lg text-xs font-semibold transition", page === p ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]")}
                          >{p}</button>
                        )
                      )}
                  </div>
                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next <Icon.ChevronRight size={13} />
                  </Button>
                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(totalPages)} title="Last">
                    <Icon.ChevronRight size={13} /><Icon.ChevronRight size={13} className="-ml-2" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Post detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} size="lg" title="Post details">
        {detail && (
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center gap-2 flex-wrap">
              {detail.pinned && <Badge variant="warning"><Icon.Pin size={11} /> Pinned</Badge>}
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full capitalize", CATEGORY_COLOR[detail.category])}>
                {detail.category}
              </span>
              <span className="text-xs text-[var(--muted)]">{relativeTime(detail.createdAt)}</span>
              {detail.views >= hotThreshold && (
                <span className="text-xs font-bold text-red-600 dark:text-red-400">🔥 Trending</span>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold">{detail.title}</h2>
              <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted)]">
                <span className="font-medium">{detail.authorName}</span>
                <span className="text-[var(--muted-2)]">·</span>
                <span>{detail.authorEmail}</span>
                {detail.courseTitle && (
                  <><span className="text-[var(--muted-2)]">·</span><span className="truncate max-w-[160px]">{detail.courseTitle}</span></>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
              {detail.body}
            </div>

            <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
              <span className="flex items-center gap-1.5"><Icon.MessageSquare size={14} /> {detail.replyCount} replies</span>
              <span className="flex items-center gap-1.5"><Icon.Eye size={14} /> {detail.views.toLocaleString()} views</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button variant="outline" loading={busy === detail.id} onClick={() => togglePin(detail)}>
                <Icon.Pin size={14} /> {detail.pinned ? "Unpin" : "Pin"}
              </Button>
              <Button variant="danger" onClick={() => { setDeleting(detail); setDetail(null); }}>
                <Icon.Trash size={14} /> Delete post
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} size="sm" title="Delete post?">
        {deleting && (
          <div className="p-5 space-y-4">
            <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-sm">
              <p className="font-semibold truncate">{deleting.title}</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">By {deleting.authorName} · {deleting.replyCount} replies</p>
            </div>
            <p className="text-sm text-[var(--muted)]">This deletes the post and all its replies. Cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete}><Icon.Trash size={14} /> Delete post</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk delete confirm */}
      <Modal open={bulkDel} onClose={() => setBulkDel(false)} size="sm" title={`Delete ${selected.size} posts?`}>
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            This permanently deletes <strong className="text-[var(--foreground)]">{selected.size}</strong> post{selected.size > 1 ? "s" : ""} and all their replies. Cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBulkDel(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmBulkDelete}><Icon.Trash size={14} /> Delete all</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
