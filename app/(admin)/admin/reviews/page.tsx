"use client";

import * as React from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  Modal,
  StatCard,
  Tabs,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
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
  updatedAt: string;
  author: { id: string; name: string; avatar: string | null };
  course: { id: string; title: string } | null;
};

type Filter = "all" | "visible" | "hidden" | "low";

export default function AdminReviewsPage() {
  const toast = useToast();
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<Review | null>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/reviews", { credentials: "same-origin" });
      const data = await res.json();
      if (res.ok) setReviews(data.reviews ?? []);
      else toast.push({ title: data.error ?? "Failed to load reviews.", tone: "danger" });
    } catch {
      toast.push({ title: "Failed to load reviews.", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const counts = React.useMemo(
    () => ({
      all: reviews.length,
      visible: reviews.filter((r) => !r.hidden).length,
      hidden: reviews.filter((r) => r.hidden).length,
      low: reviews.filter((r) => r.rating <= 2).length,
    }),
    [reviews],
  );

  const avgRating = React.useMemo(() => {
    const visible = reviews.filter((r) => !r.hidden);
    if (visible.length === 0) return 0;
    return Math.round((visible.reduce((s, r) => s + r.rating, 0) / visible.length) * 10) / 10;
  }, [reviews]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews.filter((r) => {
      if (filter === "visible" && r.hidden) return false;
      if (filter === "hidden" && !r.hidden) return false;
      if (filter === "low" && r.rating > 2) return false;
      if (!q) return true;
      return (
        r.author.name.toLowerCase().includes(q) ||
        (r.course?.title ?? "").toLowerCase().includes(q) ||
        r.body.toLowerCase().includes(q)
      );
    });
  }, [reviews, filter, query]);

  async function toggleHidden(review: Review) {
    setBusyId(review.id);
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ hidden: !review.hidden }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.push({ title: data.error ?? "Update failed.", tone: "danger" });
        return;
      }
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, hidden: !review.hidden } : r)),
      );
      toast.push({
        title: review.hidden ? "Review is now visible" : "Review hidden",
        tone: "success",
      });
    } catch {
      toast.push({ title: "Update failed.", tone: "danger" });
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      const res = await fetch(`/api/reviews/${deleting.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.push({ title: data.error ?? "Delete failed.", tone: "danger" });
        return;
      }
      setReviews((prev) => prev.filter((r) => r.id !== deleting.id));
      toast.push({ title: "Review deleted", tone: "success" });
      setDeleting(null);
    } catch {
      toast.push({ title: "Delete failed.", tone: "danger" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Reviews moderation</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Browse every course review and hide anything inappropriate. Hidden reviews stop counting
          toward a course&apos;s public rating.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total reviews" value={counts.all} icon={<Icon.MessageSquare size={18} />} />
        <StatCard
          label="Avg rating"
          value={avgRating || "—"}
          icon={<Icon.Star size={18} />}
          tone="warning"
        />
        <StatCard label="Hidden" value={counts.hidden} icon={<Icon.EyeOff size={18} />} tone="accent" />
        <StatCard
          label="Low-rated (≤2★)"
          value={counts.low}
          icon={<Icon.AlertCircle size={18} />}
          tone="warning"
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Tabs
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          options={[
            { value: "all", label: "All", count: counts.all },
            { value: "visible", label: "Visible", count: counts.visible },
            { value: "hidden", label: "Hidden", count: counts.hidden },
            { value: "low", label: "Low-rated", count: counts.low },
          ]}
        />
        <div className="md:w-80">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by reviewer, course, or text…"
            icon={<Icon.Search size={16} />}
          />
        </div>
      </div>

      {loading ? (
        <Card>
          <CardBody>
            <div className="flex items-center justify-center gap-2 py-12 text-[var(--muted)]">
              <Icon.Loader size={18} /> Loading reviews…
            </div>
          </CardBody>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.MessageSquare size={28} />}
              title="No reviews"
              description={
                reviews.length === 0
                  ? "No course reviews have been submitted yet."
                  : "No reviews match the current filter."
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className={r.hidden ? "opacity-70" : ""}>
              <CardBody>
                <div className="flex items-start gap-3">
                  <Avatar src={r.author.avatar} name={r.author.name} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{r.author.name}</span>
                      <Stars rating={r.rating} />
                      {r.hidden && <Badge variant="danger">Hidden</Badge>}
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {r.course?.title ?? "Unknown course"} · {relativeTime(r.createdAt)}
                    </p>
                    <p className="text-sm mt-2 whitespace-pre-wrap break-words">{r.body}</p>
                    {r.reply && (
                      <div className="mt-2 rounded-xl bg-[var(--surface-2)] p-3 text-sm">
                        <p className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold mb-1">
                          Staff reply
                        </p>
                        <p className="whitespace-pre-wrap break-words">{r.reply}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant={r.hidden ? "soft" : "outline"}
                      onClick={() => toggleHidden(r)}
                      loading={busyId === r.id}
                    >
                      {r.hidden ? (
                        <>
                          <Icon.Eye size={14} /> Unhide
                        </>
                      ) : (
                        <>
                          <Icon.EyeOff size={14} /> Hide
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleting(r)}
                      disabled={busyId === r.id}
                    >
                      <Icon.Trash size={14} /> Delete
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!deleting} onClose={() => setDeleting(null)} size="sm" title="Delete review">
        {deleting && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-[var(--muted)]">
              Permanently delete this review from{" "}
              <strong className="text-[var(--foreground)]">{deleting.author.name}</strong>? This
              can&apos;t be undone — consider hiding it instead.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button variant="outline" onClick={() => setDeleting(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete} loading={busyId === deleting.id}>
                <Icon.Trash size={16} /> Delete review
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) =>
        n <= rating ? (
          <Icon.StarFill key={n} size={14} className="text-amber-500" />
        ) : (
          <Icon.Star key={n} size={14} className="text-[var(--muted-2)]" />
        ),
      )}
    </span>
  );
}
