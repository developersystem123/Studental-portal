"use client";

import * as React from "react";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  Modal,
  Select,
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
type SortKey = "newest" | "oldest" | "high" | "low-rating";

const PAGE_SIZE = 10;

function exportCSV(reviews: Review[]) {
  const header = ["Reviewer", "Course", "Rating", "Body", "Hidden", "Date"];
  const rows = reviews.map((r) => [
    `"${r.author.name.replace(/"/g, '""')}"`,
    `"${(r.course?.title ?? "Unknown").replace(/"/g, '""')}"`,
    r.rating,
    `"${r.body.replace(/"/g, '""')}"`,
    r.hidden ? "Yes" : "No",
    new Date(r.createdAt).toLocaleDateString(),
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "reviews.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReviewsPage() {
  const toast = useToast();
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("newest");
  const [starFilter, setStarFilter] = React.useState<number | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<Review | null>(null);
  const [page, setPage] = React.useState(1);

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

  React.useEffect(() => { load(); }, [load]);

  // Reset to page 1 whenever filters/search change
  React.useEffect(() => { setPage(1); }, [filter, query, sortKey, starFilter]);

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

  const ratingDist = React.useMemo(() => {
    const visible = reviews.filter((r) => !r.hidden);
    const total = visible.length;
    return [5, 4, 3, 2, 1].map((star) => {
      const count = visible.filter((r) => r.rating === star).length;
      return { star, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
    });
  }, [reviews]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews
      .filter((r) => {
        if (filter === "visible" && r.hidden) return false;
        if (filter === "hidden" && !r.hidden) return false;
        if (filter === "low" && r.rating > 2) return false;
        if (starFilter !== null && r.rating !== starFilter) return false;
        if (!q) return true;
        return (
          r.author.name.toLowerCase().includes(q) ||
          (r.course?.title ?? "").toLowerCase().includes(q) ||
          r.body.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortKey === "oldest")
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortKey === "high") return b.rating - a.rating;
        if (sortKey === "low-rating") return a.rating - b.rating;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [reviews, filter, query, sortKey, starFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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
    <div className="space-y-6 fade-in">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">
            Manage
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Reviews moderation</h1>
          <p className="mt-1 text-[var(--muted)]">
            Browse every course review and hide anything inappropriate. Hidden reviews stop counting
            toward a course&apos;s public rating.
          </p>
        </div>
        <Button variant="outline" onClick={() => exportCSV(filtered)}>
          <Icon.Download size={15} /> Export CSV
        </Button>
      </div>

      {/* ── StatCards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total reviews"
          value={counts.all}
          icon={<Icon.MessageSquare size={18} />}
          tone="primary"
        />
        <StatCard
          label="Avg rating"
          value={avgRating || "—"}
          icon={<Icon.Star size={18} />}
          tone="warning"
        />
        <StatCard
          label="Hidden"
          value={counts.hidden}
          icon={<Icon.EyeOff size={18} />}
          tone="accent"
        />
        <StatCard
          label="Low-rated (≤2★)"
          value={counts.low}
          icon={<Icon.AlertCircle size={18} />}
          tone="warning"
        />
      </div>

      {/* ── Rating distribution ── */}
      {reviews.length > 0 && (
        <Card>
          <CardBody className="py-4">
            <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
              Rating breakdown
            </p>
            <div className="space-y-2">
              {ratingDist.map((d) => (
                <button
                  key={d.star}
                  onClick={() =>
                    setStarFilter(starFilter === d.star ? null : d.star)
                  }
                  className={`w-full flex items-center gap-3 group rounded-lg px-1 py-0.5 transition ${
                    starFilter === d.star ? "bg-amber-500/10" : "hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <span className="text-xs text-[var(--muted)] w-6 shrink-0 text-right">
                    {d.star}★
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--muted)] w-8 text-right">{d.count}</span>
                  <span className="text-[10px] text-[var(--muted)] w-8 text-right">{d.pct}%</span>
                </button>
              ))}
            </div>
            {starFilter !== null && (
              <button
                onClick={() => setStarFilter(null)}
                className="mt-3 text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
              >
                <Icon.X size={11} /> Clear star filter
              </button>
            )}
          </CardBody>
        </Card>
      )}

      {/* ── Toolbar: tabs + search + sort ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
          <div className="flex items-center gap-2 shrink-0">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reviews…"
              icon={<Icon.Search size={16} />}
              className="w-52"
            />
            <Select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-9 text-xs !py-0 w-[145px]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="high">Highest rated</option>
              <option value="low-rating">Lowest rated</option>
            </Select>
          </div>
        </div>

        {/* Star filter chips */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[var(--muted)] shrink-0">Stars:</span>
          <button
            onClick={() => setStarFilter(null)}
            className={`h-7 px-3 rounded-full text-xs font-medium transition ${
              starFilter === null
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setStarFilter(starFilter === s ? null : s)}
              className={`h-7 px-3 rounded-full text-xs font-medium transition flex items-center gap-1 ${
                starFilter === s
                  ? "bg-amber-500 text-white"
                  : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {s} <Icon.StarFill size={10} className={starFilter === s ? "text-white" : "text-amber-400"} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <Card>
          <CardBody>
            <div className="flex items-center justify-center gap-2 py-12 text-[var(--muted)]">
              <Icon.Loader size={18} className="animate-spin" /> Loading reviews…
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
        <>
          {/* Review cards */}
          <div className="space-y-3">
            {paginated.map((r) => {
              const isLow = r.rating <= 2;
              const borderColor = r.hidden
                ? "border-l-[var(--border)]"
                : isLow
                ? "border-l-rose-400"
                : r.rating === 3
                ? "border-l-amber-400"
                : "border-l-emerald-400";

              return (
                <Card
                  key={r.id}
                  className={`border-l-2 ${borderColor} transition-opacity ${
                    r.hidden ? "opacity-60" : ""
                  }`}
                >
                  <CardBody>
                    <div className="flex items-start gap-3">
                      <Avatar src={r.author.avatar} name={r.author.name} size={40} />

                      <div className="flex-1 min-w-0">
                        {/* Top row: name, stars, badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{r.author.name}</span>
                          <Stars rating={r.rating} />
                          <span className="text-xs font-bold text-amber-500">{r.rating}.0</span>
                          {r.hidden && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)] flex items-center gap-1">
                              <Icon.EyeOff size={9} /> Hidden
                            </span>
                          )}
                          {isLow && !r.hidden && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <Icon.AlertCircle size={9} /> Low rating
                            </span>
                          )}
                        </div>

                        {/* Course + date */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {r.course && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] truncate max-w-[200px]">
                              {r.course.title}
                            </span>
                          )}
                          <span className="text-xs text-[var(--muted)] flex items-center gap-1">
                            <Icon.Clock size={11} />
                            {relativeTime(r.createdAt)}
                          </span>
                        </div>

                        {/* Body */}
                        <p className="text-sm mt-2.5 leading-relaxed text-[var(--foreground)] whitespace-pre-wrap break-words">
                          {r.body}
                        </p>

                        {/* Staff reply */}
                        {r.reply && (
                          <div className="mt-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-3 text-sm">
                            <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold mb-1 flex items-center gap-1">
                              <Icon.MessageSquare size={10} /> Staff reply
                            </p>
                            <p className="whitespace-pre-wrap break-words text-[var(--muted)]">
                              {r.reply}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => toggleHidden(r)}
                          disabled={busyId === r.id}
                          title={r.hidden ? "Make visible" : "Hide review"}
                          className={`h-8 w-8 inline-flex items-center justify-center rounded-lg transition ${
                            r.hidden
                              ? "bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20"
                              : "hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          {r.hidden ? <Icon.Eye size={14} /> : <Icon.EyeOff size={14} />}
                        </button>
                        <button
                          onClick={() => setDeleting(r)}
                          disabled={busyId === r.id}
                          title="Delete review"
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-red-500/10 text-[var(--muted)] hover:text-[var(--danger)] transition"
                        >
                          <Icon.Trash size={14} />
                        </button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>

          {/* ── Pagination ── */}
          <Pagination
            page={safePage}
            totalPages={totalPages}
            total={filtered.length}
            onChange={setPage}
          />
        </>
      )}

      {/* ── Delete confirm ── */}
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
              <Button
                variant="danger"
                onClick={confirmDelete}
                loading={busyId === deleting.id}
              >
                <Icon.Trash size={16} /> Delete review
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Stars renderer                                                           */
/* ──────────────────────────────────────────────────────────────────────── */

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) =>
        n <= rating ? (
          <Icon.StarFill key={n} size={13} className="text-amber-400" />
        ) : (
          <Icon.Star key={n} size={13} className="text-[var(--muted-2)]" />
        ),
      )}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Pagination                                                               */
/* ──────────────────────────────────────────────────────────────────────── */

function Pagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  function getPages(): (number | "...")[] {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }

  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex items-center justify-between py-1">
      <p className="text-xs text-[var(--muted)]">
        Showing {start}–{end} of {total} review{total !== 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:pointer-events-none transition"
        >
          <Icon.ChevronLeft size={16} />
        </button>
        {getPages().map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="h-8 w-8 flex items-center justify-center text-xs text-[var(--muted)]"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs font-medium transition ${
                page === p
                  ? "bg-[var(--primary)] text-white shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:pointer-events-none transition"
        >
          <Icon.ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
