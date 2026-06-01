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
  Modal,
  Select,
  Tabs,
  Textarea,
  useToast,
} from "@/components/ui";
import { useTeacher } from "@/lib/store";
import { relativeTime } from "@/lib/utils";

type Review = {
  id: string;
  courseId: string;
  rating: number;
  body: string;
  reply: string | null;
  repliedAt: string | null;
  hidden: boolean;
  createdAt: string;
  author: { id: string; name: string; avatar: string | null };
  course: { id: string; title: string } | null;
};

type Filter = "all" | "unanswered" | "5" | "4" | "3" | "low";

export default function TeacherReviewsPage() {
  const teacher = useTeacher();
  const toast = useToast();
  const courses = teacher.myCourses();

  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [courseFilter, setCourseFilter] = React.useState<string>("all");
  const [replying, setReplying] = React.useState<Review | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [savingReply, setSavingReply] = React.useState(false);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/reviews");
        const data = r.ok ? await r.json() : { reviews: [] };
        if (!cancelled) setReviews(data.reviews ?? []);
      } catch {
        if (!cancelled) toast.push({ title: "Couldn't load reviews", tone: "danger" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    setReplyText(replying?.reply ?? "");
  }, [replying]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews
      .filter((r) => (courseFilter === "all" ? true : r.courseId === courseFilter))
      .filter((r) => {
        if (filter === "unanswered") return !r.reply;
        if (filter === "low") return r.rating <= 2;
        if (filter === "all") return true;
        return r.rating === Number(filter);
      })
      .filter((r) => !q || r.body.toLowerCase().includes(q) || r.author.name.toLowerCase().includes(q));
  }, [reviews, filter, courseFilter, query]);

  const scoped = React.useMemo(
    () => reviews.filter((r) => (courseFilter === "all" ? true : r.courseId === courseFilter)),
    [reviews, courseFilter],
  );

  const counts = {
    all: scoped.length,
    unanswered: scoped.filter((r) => !r.reply).length,
  };
  const avgRating = scoped.length
    ? scoped.reduce((s, r) => s + r.rating, 0) / scoped.length
    : 0;
  const dist = React.useMemo(() => {
    const d = [0, 0, 0, 0, 0]; // index 0 = 1★ … index 4 = 5★
    for (const r of scoped) d[r.rating - 1] += 1;
    return d;
  }, [scoped]);

  // Per-course rating breakdown
  const perCourseRatings = React.useMemo(() => {
    const map = new Map<string, { title: string; ratings: number[] }>();
    for (const r of reviews) {
      if (!r.course) continue;
      if (!map.has(r.courseId)) map.set(r.courseId, { title: r.course.title, ratings: [] });
      map.get(r.courseId)!.ratings.push(r.rating);
    }
    return [...map.values()]
      .map((c) => ({
        title: c.title,
        avg: c.ratings.reduce((a, b) => a + b, 0) / c.ratings.length,
        count: c.ratings.length,
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 4);
  }, [reviews]);

  async function saveReply() {
    if (!replying) return;
    setSavingReply(true);
    try {
      const r = await fetch(`/api/reviews/${replying.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Couldn't post reply.");
      setReviews((prev) => prev.map((x) => (x.id === replying.id ? { ...x, ...data.review } : x)));
      setReplying(null);
      toast.push({ title: "Reply posted", tone: "success" });
    } catch (err) {
      toast.push({ title: "Reply failed", description: (err as Error).message, tone: "danger" });
    } finally {
      setSavingReply(false);
    }
  }

  async function toggleHidden(rev: Review) {
    try {
      const r = await fetch(`/api/reviews/${rev.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: !rev.hidden }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Update failed.");
      setReviews((prev) => prev.map((x) => (x.id === rev.id ? { ...x, hidden: data.review.hidden } : x)));
      toast.push({ title: data.review.hidden ? "Review hidden" : "Review visible", tone: "info" });
    } catch (err) {
      toast.push({ title: "Couldn't update", description: (err as Error).message, tone: "danger" });
    }
  }

  async function remove(id: string) {
    try {
      const r = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error ?? "Delete failed.");
      setReviews((prev) => prev.filter((x) => x.id !== id));
      toast.push({ title: "Review deleted", tone: "success" });
    } catch (err) {
      toast.push({ title: "Couldn't delete", description: (err as Error).message, tone: "danger" });
    }
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Insights</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Reviews</h1>
        <p className="mt-1 text-[var(--muted)]">Read what students think and reply to their feedback.</p>
      </div>

      {/* Overview */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardBody className="text-center">
            <p className="text-xs uppercase tracking-wider text-[var(--muted-2)] font-semibold">Average rating</p>
            <p className="text-5xl font-bold mt-2">{avgRating ? avgRating.toFixed(1) : "—"}</p>
            <Stars value={Math.round(avgRating)} className="justify-center mt-2" />
            <p className="text-xs text-[var(--muted)] mt-2">From {counts.all} reviews</p>
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardBody className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--muted-2)] font-semibold mb-2">Rating distribution</p>
              <ul className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = dist[star - 1];
                  const pct = counts.all === 0 ? 0 : Math.round((count / counts.all) * 100);
                  return (
                    <li key={star} className="flex items-center gap-3 text-sm">
                      <span className="w-10 text-[var(--muted)]">{star}★</span>
                      <div className="flex-1 h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-12 text-right text-xs text-[var(--muted)] tabular-nums">{count}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            {perCourseRatings.length > 1 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--muted-2)] font-semibold mb-2">By course</p>
                <ul className="space-y-2">
                  {perCourseRatings.map((c) => (
                    <li key={c.title} className="flex items-center gap-3 text-sm">
                      <span className="flex-1 truncate text-xs text-[var(--muted)]">{c.title}</span>
                      <Stars value={Math.round(c.avg)} />
                      <span className="text-xs text-[var(--muted-2)] tabular-nums w-10 text-right">{c.avg.toFixed(1)} ({c.count})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <Tabs
              value={filter}
              onChange={(v) => setFilter(v as Filter)}
              options={[
                { value: "all", label: "All", count: counts.all },
                { value: "unanswered", label: "Unanswered", count: counts.unanswered },
                { value: "5", label: "5★" },
                { value: "4", label: "4★" },
                { value: "3", label: "3★" },
                { value: "low", label: "1–2★" },
              ]}
            />
            <div className="flex gap-2 items-center">
              <Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="!h-9 !w-48">
                <option value="all">All courses</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </Select>
              <Input
                icon={<Icon.Search size={16} />}
                placeholder="Search reviews…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="!h-9 sm:max-w-[200px]"
              />
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-[var(--muted)] py-8 text-center">Loading reviews…</p>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Icon.Star size={20} />}
              title={reviews.length === 0 ? "No reviews yet" : "Nothing matches"}
              description={
                reviews.length === 0
                  ? "When students rate your courses, their reviews appear here."
                  : "Try a different filter or search."
              }
            />
          ) : (
            <ul className="space-y-3">
              {filtered.map((r) => (
                <li key={r.id} className={`rounded-xl border border-[var(--border)] p-4 ${r.hidden ? "opacity-60" : ""}`}>
                  <div className="flex items-start gap-3">
                    <Avatar name={r.author.name} src={r.author.avatar} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{r.author.name}</p>
                        <Stars value={r.rating} />
                        {r.hidden && <Badge variant="default">Hidden</Badge>}
                        <span className="text-xs text-[var(--muted-2)] ml-auto">{relativeTime(r.createdAt)}</span>
                      </div>
                      <p className="text-xs text-[var(--muted)] truncate mt-0.5">{r.course?.title ?? "—"}</p>
                      <p className="text-sm mt-2 whitespace-pre-wrap">{r.body}</p>
                      {r.reply && (
                        <div className="mt-3 ml-3 pl-3 border-l-2 border-[var(--primary)]/30">
                          <p className="text-xs font-semibold text-[var(--primary)] flex items-center gap-1.5">
                            <Icon.MessageSquare size={12} /> Your reply
                            {r.repliedAt && (
                              <span className="text-[var(--muted-2)] font-normal ml-1">· {relativeTime(r.repliedAt)}</span>
                            )}
                          </p>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{r.reply}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-3">
                    <Button size="sm" variant="ghost" onClick={() => toggleHidden(r)}>
                      <Icon.Eye size={14} /> {r.hidden ? "Show" : "Hide"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                      <Icon.Trash size={14} /> Delete
                    </Button>
                    <Button size="sm" variant={r.reply ? "outline" : "primary"} onClick={() => setReplying(r)}>
                      <Icon.MessageSquare size={14} /> {r.reply ? "Edit reply" : "Reply"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal open={replying !== null} onClose={() => setReplying(null)} title="Reply to review" size="lg">
        {replying && (
          <div className="p-5 space-y-4">
            <div className="rounded-xl bg-[var(--surface-2)] p-3">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium">{replying.author.name}</p>
                <Stars value={replying.rating} />
              </div>
              <p className="text-sm whitespace-pre-wrap">{replying.body}</p>
            </div>
            <Textarea
              rows={5}
              placeholder="Write a kind, helpful reply…"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReplying(null)}>Cancel</Button>
              <Button onClick={saveReply} disabled={!replyText.trim()} loading={savingReply}>
                <Icon.Send size={14} /> Post reply
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Stars({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className={`inline-flex items-center gap-0.5 ${className ?? ""}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Icon.StarFill key={i} size={14} className={i < v ? "text-amber-500" : "text-[var(--surface-2)]"} />
      ))}
    </span>
  );
}
