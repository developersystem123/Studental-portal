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
  Tabs,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { relativeTime } from "@/lib/utils";

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
  general: "default",
  question: "info",
  announcement: "warning",
  discussion: "primary",
};

type Filter = "all" | Category;

export default function AdminForumPage() {
  const toast = useToast();
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");
  const [deleting, setDeleting] = React.useState<Post | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/admin/forum");
      const data = await r.json();
      if (r.ok) setPosts(data.posts ?? []);
      else toast.push({ title: "Failed to load posts", tone: "danger" });
    } catch {
      toast.push({ title: "Network error", description: "Couldn't reach the server.", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const counts = React.useMemo(
    () => ({
      all: posts.length,
      general: posts.filter((p) => p.category === "general").length,
      question: posts.filter((p) => p.category === "question").length,
      announcement: posts.filter((p) => p.category === "announcement").length,
      discussion: posts.filter((p) => p.category === "discussion").length,
    }),
    [posts],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (filter !== "all" && p.category !== filter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q)
      );
    });
  }, [posts, filter, query]);

  async function togglePin(p: Post) {
    setBusy(p.id);
    const r = await fetch(`/api/admin/forum/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !p.pinned }),
    });
    setBusy(null);
    if (!r.ok) {
      toast.push({ title: "Couldn't update post", tone: "danger" });
      return;
    }
    toast.push({ title: p.pinned ? "Post unpinned" : "Post pinned", tone: "success" });
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const r = await fetch(`/api/admin/forum/${deleting.id}`, { method: "DELETE" });
    if (!r.ok) {
      toast.push({ title: "Couldn't delete post", tone: "danger" });
      return;
    }
    toast.push({ title: "Post deleted", tone: "info" });
    setDeleting(null);
    load();
  }

  const forumStats = React.useMemo(() => ({
    total: posts.length,
    pinned: posts.filter((p) => p.pinned).length,
    totalReplies: posts.reduce((s, p) => s + p.replyCount, 0),
    totalViews: posts.reduce((s, p) => s + p.views, 0),
  }), [posts]);

  return (
    <div className="space-y-6 fade-in">
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Forum moderation</h1>
        <p className="mt-1 text-[var(--muted)]">
          Review community posts — pin important ones or remove anything inappropriate.
        </p>
      </div>

      {posts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total posts", value: forumStats.total, icon: <Icon.MessageSquare size={16} />, tint: "bg-[var(--primary-soft)] text-[var(--primary)]" },
            { label: "Pinned", value: forumStats.pinned, icon: <Icon.Pin size={16} />, tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
            { label: "Total replies", value: forumStats.totalReplies, icon: <Icon.MessageSquare size={16} />, tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
            { label: "Total views", value: forumStats.totalViews, icon: <Icon.Eye size={16} />, tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
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

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Tabs
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          options={[
            { value: "all", label: "All", count: counts.all },
            { value: "question", label: "Questions", count: counts.question },
            { value: "discussion", label: "Discussion", count: counts.discussion },
            { value: "announcement", label: "Announcements", count: counts.announcement },
            { value: "general", label: "General", count: counts.general },
          ]}
        />
        <div className="md:w-80">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts or authors…"
            icon={<Icon.Search size={16} />}
          />
        </div>
      </div>

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
              icon={<Icon.MessageSquare size={28} />}
              title={posts.length === 0 ? "No forum posts yet" : "No matching posts"}
              description={
                posts.length === 0
                  ? "Community posts will appear here for moderation."
                  : "Try a different filter or search."
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <Card key={p.id}>
              <CardBody className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.pinned && (
                      <Badge variant="primary">
                        <Icon.Pin size={11} /> Pinned
                      </Badge>
                    )}
                    <Badge variant={CATEGORY_BADGE[p.category]} className="capitalize">
                      {p.category}
                    </Badge>
                    <span className="text-xs text-[var(--muted-2)]">
                      {relativeTime(p.createdAt)}
                    </span>
                  </div>
                  <h3 className="font-semibold mt-1.5 truncate">{p.title}</h3>
                  <p className="text-sm text-[var(--muted)] mt-0.5 line-clamp-2">{p.body}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted-2)]">
                    <span>By {p.authorName}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Icon.MessageSquare size={12} /> {p.replyCount}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Icon.Eye size={12} /> {p.views}
                    </span>
                    {p.courseTitle && (
                      <>
                        <span>·</span>
                        <span className="truncate">{p.courseTitle}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant={p.pinned ? "soft" : "outline"}
                    onClick={() => togglePin(p)}
                    loading={busy === p.id}
                  >
                    <Icon.Pin size={14} /> {p.pinned ? "Unpin" : "Pin"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(p)}>
                    <Icon.Trash size={14} /> Delete
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!deleting} onClose={() => setDeleting(null)} size="sm" title="Delete post?">
        {deleting && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-[var(--muted)]">
              Delete <strong className="text-[var(--foreground)]">{deleting.title}</strong> and all
              its replies? This can&apos;t be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleting(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                <Icon.Trash size={16} /> Delete post
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
