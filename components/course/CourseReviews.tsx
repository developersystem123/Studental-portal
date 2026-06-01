"use client";

// Reviews tab for a course — lists student reviews and lets an enrolled
// student write / edit / delete their own. Backed by /api/reviews.

import * as React from "react";
import Icon from "@/components/icons";
import { Avatar, Button, EmptyState, Textarea, useToast } from "@/components/ui";
import { useAuth } from "@/lib/store";
import { relativeTime } from "@/lib/utils";

type Review = {
  id: string;
  courseId: string;
  rating: number;
  body: string;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
  author: { id: string; name: string; avatar: string | null };
};

export function CourseReviews({ courseId, enrolled }: { courseId: string; enrolled: boolean }) {
  const { user } = useAuth();
  const toast = useToast();

  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [myReview, setMyReview] = React.useState<Review | null>(null);
  const [canReview, setCanReview] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const [editing, setEditing] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [hover, setHover] = React.useState(0);
  const [body, setBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/reviews?courseId=${encodeURIComponent(courseId)}`);
        const data = await r.json();
        if (cancelled) return;
        setReviews(data.reviews ?? []);
        setMyReview(data.myReview ?? null);
        setCanReview(Boolean(data.canReview));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const average = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  function startEdit() {
    setRating(myReview?.rating ?? 5);
    setBody(myReview?.body ?? "");
    setEditing(true);
  }

  async function submit() {
    if (!body.trim()) {
      toast.push({ title: "Add a few words", description: "Tell others what you thought.", tone: "warning" });
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, rating, body: body.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Couldn't save review.");
      const saved: Review = data.review;
      setMyReview(saved);
      setReviews((prev) => {
        const without = prev.filter((x) => x.id !== saved.id);
        return [saved, ...without];
      });
      setEditing(false);
      toast.push({ title: "Review saved", description: "Thanks for your feedback!", tone: "success" });
    } catch (err) {
      toast.push({ title: "Couldn't save", description: (err as Error).message, tone: "danger" });
    } finally {
      setSubmitting(false);
    }
  }

  async function remove() {
    if (!myReview) return;
    try {
      const r = await fetch(`/api/reviews/${myReview.id}`, { method: "DELETE" });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error ?? "Delete failed.");
      setReviews((prev) => prev.filter((x) => x.id !== myReview.id));
      setMyReview(null);
      setEditing(false);
      toast.push({ title: "Review removed", tone: "success" });
    } catch (err) {
      toast.push({ title: "Couldn't remove", description: (err as Error).message, tone: "danger" });
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--muted)] py-6 text-center">Loading reviews…</p>;
  }

  const showForm = canReview && enrolled && (editing || !myReview);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-[var(--foreground)]">
            {average ? average.toFixed(1) : "—"}
          </p>
          <Stars value={Math.round(average)} />
        </div>
        <div className="text-sm text-[var(--muted)]">
          <p className="font-medium text-[var(--foreground)]">
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </p>
          <p>Honest feedback from students who took this course.</p>
        </div>
      </div>

      {/* Write / edit form */}
      {showForm && (
        <div className="rounded-xl border border-[var(--border)] p-4 space-y-3 bg-[var(--surface-2)]/40">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {myReview ? "Edit your review" : "Write a review"}
          </p>
          <StarInput value={rating} hover={hover} onHover={setHover} onChange={setRating} />
          <Textarea
            rows={4}
            placeholder="What did you like? What could be better?"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            {editing && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
            <Button size="sm" onClick={submit} loading={submitting}>
              <Icon.Send size={14} /> {myReview ? "Update review" : "Post review"}
            </Button>
          </div>
        </div>
      )}

      {canReview && !enrolled && !myReview && (
        <p className="text-xs text-[var(--muted)] rounded-lg bg-[var(--surface-2)] px-3 py-2">
          Enroll in this course to leave a review.
        </p>
      )}

      {/* Your review (collapsed view) */}
      {myReview && !editing && (
        <ReviewItem review={myReview} mine onEdit={startEdit} onDelete={remove} />
      )}

      {/* Everyone else */}
      {reviews.filter((r) => r.id !== myReview?.id).length === 0 && !myReview ? (
        <EmptyState
          icon={<Icon.Star size={20} />}
          title="No reviews yet"
          description="Be the first to share what you thought of this course."
        />
      ) : (
        <ul className="space-y-3">
          {reviews
            .filter((r) => r.id !== myReview?.id)
            .map((r) => (
              <li key={r.id}>
                <ReviewItem review={r} mine={r.author.id === user?.id} />
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

function ReviewItem({
  review,
  mine,
  onEdit,
  onDelete,
}: {
  review: Review;
  mine?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="rounded-xl p-4 bg-[var(--surface-2)]">
      <div className="flex gap-3">
        <Avatar name={review.author.name} src={review.author.avatar} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[var(--foreground)]">{review.author.name}</p>
            {mine && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-medium">
                You
              </span>
            )}
            <Stars value={review.rating} />
            <span className="text-xs text-[var(--muted-2)] ml-auto">{relativeTime(review.createdAt)}</span>
          </div>
          <p className="text-sm mt-1.5 text-[var(--foreground)] whitespace-pre-wrap">{review.body}</p>

          {review.reply && (
            <div className="mt-3 ml-1 pl-3 border-l-2 border-[var(--primary)]/30">
              <p className="text-xs font-semibold text-[var(--primary)] flex items-center gap-1.5">
                <Icon.MessageSquare size={12} /> Instructor response
                {review.repliedAt && (
                  <span className="text-[var(--muted-2)] font-normal">· {relativeTime(review.repliedAt)}</span>
                )}
              </p>
              <p className="text-sm mt-1 text-[var(--foreground)] whitespace-pre-wrap">{review.reply}</p>
            </div>
          )}

          {mine && onEdit && (
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="ghost" onClick={onEdit}>
                <Icon.FilePen size={13} /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={onDelete}>
                <Icon.Trash size={13} /> Delete
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stars({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className={`inline-flex items-center gap-0.5 ${className ?? ""}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Icon.StarFill key={i} size={13} className={i < v ? "text-amber-500" : "text-[var(--surface-2)]"} />
      ))}
    </span>
  );
}

function StarInput({
  value,
  hover,
  onHover,
  onChange,
}: {
  value: number;
  hover: number;
  onHover: (v: number) => void;
  onChange: (v: number) => void;
}) {
  const active = hover || value;
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => onHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => onHover(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Icon.StarFill
            size={24}
            className={n <= active ? "text-amber-500" : "text-[var(--surface-2)]"}
          />
        </button>
      ))}
    </div>
  );
}
