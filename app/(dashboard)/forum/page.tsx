"use client";

import React from "react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  Tabs,
  Textarea,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { relativeTime } from "@/lib/utils";

type ForumCategory = "general" | "question" | "announcement" | "discussion";
type SortKey = "newest" | "popular" | "replies";

type Post = {
  id: string;
  title: string;
  body: string;
  category: ForumCategory;
  pinned: boolean;
  views: number;
  createdAt: string;
  replyCount: number;
  author: { id: string; name: string; avatar: string | null; role: string };
  course: { id: string; title: string } | null;
};

const CATEGORY_TONE: Record<ForumCategory, "primary" | "info" | "warning" | "success"> = {
  general: "info",
  question: "primary",
  announcement: "warning",
  discussion: "success",
};

const CATEGORY_ICON: Record<ForumCategory, React.ReactNode> = {
  general: <Icon.MessageSquare size={12} />,
  question: <Icon.Help size={12} />,
  announcement: <Icon.Bell size={12} />,
  discussion: <Icon.Users size={12} />,
};

const CATEGORY_CARD: Record<ForumCategory, { bg: string; text: string; border: string; iconLg: React.ReactNode; label: string; hint: string }> = {
  general:      { bg: "bg-sky-50 dark:bg-sky-900/20",      text: "text-sky-600 dark:text-sky-400",      border: "border-sky-200 dark:border-sky-700",      iconLg: <Icon.MessageSquare size={18} />, label: "General",      hint: "Anything on your mind" },
  question:     { bg: "bg-[var(--primary-soft)]",           text: "text-[var(--primary)]",               border: "border-[var(--primary)]/20",             iconLg: <Icon.Help size={18} />,          label: "Question",     hint: "Ask the community" },
  discussion:   { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-700", iconLg: <Icon.Users size={18} />,   label: "Discussion",   hint: "Start a conversation" },
  announcement: { bg: "bg-amber-50 dark:bg-amber-900/20",   text: "text-amber-600 dark:text-amber-400",  border: "border-amber-200 dark:border-amber-700", iconLg: <Icon.Bell size={18} />,          label: "Announce",     hint: "Share news or updates" },
};

function ForumSectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 -mb-1">
      <span className="h-5 w-5 rounded-md bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">{icon}</span>
      <span className="text-[10px] font-bold tracking-widest text-[var(--primary)]">{label}</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="p-4 border-b border-[var(--border)] last:border-b-0 animate-pulse">
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-full bg-[var(--surface-2)] shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-[var(--surface-2)]" />
          <div className="h-3 w-full rounded bg-[var(--surface-2)]" />
          <div className="h-3 w-4/5 rounded bg-[var(--surface-2)]" />
          <div className="flex gap-3 pt-1">
            <div className="h-3 w-16 rounded bg-[var(--surface-2)]" />
            <div className="h-3 w-12 rounded bg-[var(--surface-2)]" />
            <div className="h-3 w-10 rounded bg-[var(--surface-2)]" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="h-8 w-12 rounded bg-[var(--surface-2)]" />
          <div className="h-8 w-12 rounded bg-[var(--surface-2)]" />
        </div>
      </div>
    </div>
  );
}

export default function ForumPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | ForumCategory>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", category: "general" as ForumCategory });
  const [saving, setSaving] = useState(false);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [showBookmarked, setShowBookmarked] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { push } = useToast();

  // Load bookmarks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("forum-bookmarks");
      if (saved) setBookmarks(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(searchInput), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  async function load() {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filter !== "all") p.set("category", filter);
      if (search.trim()) p.set("q", search.trim());
      const r = await fetch(`/api/forum?${p.toString()}`);
      const data = await r.json();
      if (!r.ok) { push({ title: "Couldn't load posts", tone: "danger" }); return; }
      const fetched: Post[] = data.posts ?? [];
      setPosts(fetched);
      // Initialise like counts from view counts as a proxy engagement metric.
      // Using random numbers caused flickering on every refetch; using views is
      // stable across fetches. Actual likes would require a backend field.
      setLikes((prev) => {
        const next = { ...prev };
        fetched.forEach((post) => {
          if (!(post.id in next)) next[post.id] = Math.round(post.views * 0.3);
        });
        return next;
      });
    } catch {
      push({ title: "Network error", description: "Couldn't reach the server.", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  function toggleBookmark(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try { localStorage.setItem("forum-bookmarks", JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  function toggleLike(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLiked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      setLikes((lk) => ({ ...lk, [id]: (lk[id] ?? 0) + (next[id] ? 1 : -1) }));
      return next;
    });
  }

  const sorted = useMemo(() => {
    const source = showBookmarked ? posts.filter((p) => bookmarks.has(p.id)) : posts;
    const pinned = source.filter((p) => p.pinned);
    const rest = source.filter((p) => !p.pinned);
    const sortFn = (a: Post, b: Post) => {
      if (sort === "popular") return b.views - a.views;
      if (sort === "replies") return b.replyCount - a.replyCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    };
    return [...pinned, ...rest.sort(sortFn)];
  }, [posts, sort, showBookmarked, bookmarks]);

  const stats = useMemo(() => ({
    total: posts.length,
    questions: posts.filter((p) => p.category === "question").length,
    discussions: posts.filter((p) => p.category === "discussion").length,
    announcements: posts.filter((p) => p.category === "announcement").length,
  }), [posts]);

  async function create() {
    if (!form.title.trim()) {
      push({ title: "Title is required", tone: "warning" });
      return;
    }
    if (!form.body.trim()) {
      push({ title: "Body is required", tone: "warning" });
      return;
    }
    if (form.body.length > 1000) {
      push({ title: "Body is too long (max 1000 characters)", tone: "warning" });
      return;
    }
    setSaving(true);
    const r = await fetch("/api/forum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!r.ok) {
      push({ title: "Couldn't post", tone: "danger" });
      return;
    }
    setOpen(false);
    setForm({ title: "", body: "", category: "general" });
    push({ title: "Posted!", tone: "success" });
    load();
  }

  const bodyLen = form.body.length;
  const bodyOver = bodyLen > 1000;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Community Forum</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Ask questions, share discoveries, help others.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Icon.Plus size={14} /> New post
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total posts", value: stats.total, icon: <Icon.MessageSquare size={16} />, color: "text-[var(--primary)]" },
          { label: "Questions", value: stats.questions, icon: <Icon.Help size={16} />, color: "text-blue-500" },
          { label: "Discussions", value: stats.discussions, icon: <Icon.Users size={16} />, color: "text-green-500" },
          { label: "Announcements", value: stats.announcements, icon: <Icon.Bell size={16} />, color: "text-amber-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardBody className="py-3 px-4">
              <div className="flex items-center gap-2">
                <span className={s.color}>{s.icon}</span>
                <div>
                  <p className="text-lg font-bold leading-none">{loading ? "—" : s.value}</p>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5">{s.label}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Filters + search + sort */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="overflow-x-auto">
            <Tabs
              value={filter}
              onChange={(v) => setFilter(v as typeof filter)}
              options={[
                { value: "all", label: "All" },
                { value: "question", label: "Questions" },
                { value: "discussion", label: "Discussions" },
                { value: "announcement", label: "Announcements" },
                { value: "general", label: "General" },
              ]}
            />
          </div>
          <div className="sm:ml-auto sm:w-72">
            <Input
              icon={<Icon.Search size={16} />}
              placeholder="Search posts…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
        {/* Sort buttons */}
        <div className="overflow-x-auto"><div className="flex items-center gap-2 min-w-max">
          <span className="text-xs text-[var(--muted)]">Sort:</span>
          {(["newest", "popular", "replies"] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                sort === k
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {k === "newest" ? "Newest" : k === "popular" ? "Most Viewed" : "Most Replied"}
            </button>
          ))}
          {bookmarks.size > 0 && (
            <button
              onClick={() => setShowBookmarked((v) => !v)}
              className={`ml-auto text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 whitespace-nowrap transition-colors ${
                showBookmarked
                  ? "bg-amber-500 text-white"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
              }`}
            >
              <Icon.Bookmark size={11} />
              {showBookmarked ? "All posts" : `${bookmarks.size} saved`}
            </button>
          )}
        </div></div>
      </div>

      {/* Post list */}
      {loading ? (
        <Card>
          <CardBody className="p-0">
            {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </CardBody>
        </Card>
      ) : sorted.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.MessageSquare size={28} />}
              title="No posts yet"
              description={search ? `No posts match "${search}".` : "Be the first to start a discussion."}
              action={
                search ? (
                  <Button variant="ghost" onClick={() => setSearchInput("")}>Clear search</Button>
                ) : (
                  <Button onClick={() => setOpen(true)}><Icon.Plus size={14} /> Create post</Button>
                )
              }
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <ul className="divide-y divide-[var(--border)]">
              {sorted.map((p) => (
                <li
                  key={p.id}
                  className={`relative transition hover:bg-[var(--surface-2)] ${
                    p.pinned ? "bg-amber-50/60 dark:bg-amber-900/10 border-l-2 border-amber-400" : ""
                  }`}
                >
                  <Link href={`/forum/${p.id}`} className="flex gap-3 p-4 pr-2">
                    <Avatar name={p.author.name} src={p.author.avatar} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {p.pinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                            <Icon.Pin size={10} /> Pinned
                          </span>
                        )}
                        <p className="text-sm font-semibold line-clamp-1 flex-1">{p.title}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <Badge variant={CATEGORY_TONE[p.category]}>
                          <span className="flex items-center gap-1">
                            {CATEGORY_ICON[p.category]}
                            {p.category}
                          </span>
                        </Badge>
                        {p.course && (
                          <Badge variant="default" className="text-[10px] max-w-[9rem] overflow-hidden">
                            <span className="truncate">{p.course.title}</span>
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-1.5 line-clamp-2">{p.body}</p>
                      <div className="flex items-center gap-2 text-xs text-[var(--muted-2)] mt-2 min-w-0">
                        <span className="font-medium text-[var(--muted)] whitespace-nowrap truncate max-w-[8rem]">{p.author.name}</span>
                        {p.author.role === "instructor" && (
                          <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-[var(--primary-soft)] text-[var(--primary)] font-medium shrink-0">
                            Instructor
                          </span>
                        )}
                        <span className="shrink-0">·</span>
                        <span className="whitespace-nowrap shrink-0">{relativeTime(p.createdAt)}</span>
                      </div>
                    </div>

                    {/* Right stats column */}
                    <div className="flex flex-col items-end justify-between gap-2 shrink-0 pl-2">
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-2 text-xs text-[var(--muted-2)]">
                          <span className="flex items-center gap-1">
                            <Icon.Eye size={12} />
                            {p.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon.MessageSquare size={12} />
                            {p.replyCount}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                        <button
                          onClick={(e) => toggleLike(p.id, e)}
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition ${
                            liked[p.id]
                              ? "bg-red-50 text-red-500 dark:bg-red-900/20"
                              : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-red-500"
                          }`}
                          title="Like"
                        >
                          <Icon.Heart size={12} className={liked[p.id] ? "fill-current" : ""} />
                          <span>{(likes[p.id] ?? 0)}</span>
                        </button>
                        <button
                          onClick={(e) => toggleBookmark(p.id, e)}
                          className={`p-1.5 rounded-lg transition ${
                            bookmarks.has(p.id)
                              ? "bg-amber-50 text-amber-500 dark:bg-amber-900/20"
                              : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-amber-500"
                          }`}
                          title={bookmarks.has(p.id) ? "Remove bookmark" : "Bookmark"}
                        >
                          <Icon.Bookmark size={12} className={bookmarks.has(p.id) ? "fill-current" : ""} />
                        </button>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* New post modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="New post" size="lg">
        {(() => {
          const cc = CATEGORY_CARD[form.category];
          return (
            <div className="space-y-0">
              {/* ── Live preview banner ── */}
              <div className={`mx-5 mt-1 mb-4 rounded-xl p-4 border ${cc.bg} ${cc.border}`}>
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-white/70 dark:bg-black/20 ${cc.text}`}>
                    {cc.iconLg}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm leading-snug ${cc.text}`}>
                      {form.title || <span className="opacity-40 italic font-normal">Your post title…</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cc.bg} ${cc.text} ${cc.border}`}>
                        {cc.label}
                      </span>
                      {form.body && (
                        <span className="text-[10px] text-[var(--muted)] line-clamp-1 max-w-[260px]">
                          {form.body.slice(0, 80)}{form.body.length > 80 ? "…" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 space-y-5 pb-2">
                {/* ── Post details ── */}
                <ForumSectionLabel icon={<Icon.FilePen size={12} />} label="POST DETAILS" />

                <div>
                  <Label>Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="What's on your mind?"
                    maxLength={200}
                  />
                  <p className="text-[10px] text-[var(--muted)] mt-1 text-right">{form.title.length}/200</p>
                </div>

                {/* Category card picker */}
                <div>
                  <Label>Category</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                    {(["general", "question", "discussion", "announcement"] as ForumCategory[]).map((cat) => {
                      const cs = CATEGORY_CARD[cat];
                      const active = form.category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setForm({ ...form, category: cat })}
                          className={`flex flex-col items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-center ${
                            active
                              ? `${cs.bg} ${cs.text} border-current shadow-sm scale-[1.03]`
                              : "bg-[var(--surface-2)] text-[var(--muted)] border-transparent hover:border-[var(--border)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          <span className={`h-8 w-8 rounded-lg flex items-center justify-center ${active ? "bg-white/60 dark:bg-black/20" : "bg-[var(--surface)]"}`}>
                            {cs.iconLg}
                          </span>
                          <div>
                            <p className="text-[11px] font-semibold leading-none">{cs.label}</p>
                            <p className="text-[9px] mt-0.5 opacity-70 leading-tight">{cs.hint}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Content ── */}
                <ForumSectionLabel icon={<Icon.Edit size={12} />} label="CONTENT" />

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="mb-0">Body</Label>
                    <span className={`text-xs tabular-nums ${bodyOver ? "text-red-500 font-semibold" : "text-[var(--muted)]"}`}>
                      {bodyLen}/1000
                    </span>
                  </div>
                  <Textarea
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    rows={5}
                    placeholder={
                      form.category === "question"
                        ? "Describe your question in detail. What have you already tried?"
                        : form.category === "discussion"
                        ? "Share your thoughts, arguments, or ideas…"
                        : "Add details, code snippets, links…"
                    }
                    className={bodyOver ? "border-red-400 focus:ring-red-400" : ""}
                  />
                  {bodyOver && (
                    <p className="text-xs text-red-500 mt-1">Exceeds 1000 character limit.</p>
                  )}
                  {/* Progress bar */}
                  <div className="mt-2 h-1 rounded-full bg-[var(--border)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${bodyOver ? "bg-red-500" : bodyLen > 800 ? "bg-amber-500" : "bg-[var(--primary)]"}`}
                      style={{ width: `${Math.min(100, (bodyLen / 1000) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* ── Footer ── */}
                <div className="flex justify-end gap-2 pt-1 pb-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={create} loading={saving} disabled={bodyOver}>
                    <Icon.Send size={14} /> Publish post
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
