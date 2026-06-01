"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Modal,
  Tabs,
  Textarea,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { cn, formatDate, relativeTime } from "@/lib/utils";

type Assignment = {
  id: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail: string;
  title: string;
  description: string;
  points: number;
  dueDate: string;
  status: "draft" | "open" | "closed";
  submission: {
    id: string;
    status: "pending" | "submitted" | "graded" | "late";
    grade: number | null;
    feedback: string | null;
    submittedAt: string;
    content: string;
    fileUrl: string | null;
  } | null;
};

type SortKey = "due-soonest" | "due-latest" | "points-high" | "points-low";

function gradeLabel(score: number, total: number): { letter: string; color: string } {
  const pct = (score / total) * 100;
  if (pct >= 90) return { letter: "A", color: "text-emerald-600" };
  if (pct >= 80) return { letter: "B", color: "text-blue-600" };
  if (pct >= 70) return { letter: "C", color: "text-amber-600" };
  if (pct >= 60) return { letter: "D", color: "text-orange-600" };
  return { letter: "F", color: "text-red-600" };
}

function dueDateChip(dueDate: string, submitted: boolean) {
  if (submitted) return null;
  const diff = new Date(dueDate).getTime() - Date.now();
  if (diff < 0) return { label: "Overdue", cls: "bg-red-500/10 text-red-600" };
  const h = diff / 3_600_000;
  if (h < 24) return { label: `Due in ${Math.round(h)}h`, cls: "bg-red-500/10 text-red-600" };
  const d = Math.floor(h / 24);
  if (d <= 3) return { label: `Due in ${d}d`, cls: "bg-amber-500/10 text-amber-600" };
  return null;
}

function GradeBar({ score, total }: { score: number; total: number }) {
  const pct = Math.round((score / total) * 100);
  const { letter, color } = gradeLabel(score, total);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--muted)]">{score} / {total} pts</span>
        <span className={cn("font-bold text-sm", color)}>{letter} · {pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-400")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[var(--border)] p-5 space-y-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-[var(--surface-2)] shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-2/3 rounded bg-[var(--surface-2)]" />
          <div className="h-3 w-1/2 rounded bg-[var(--surface-2)]" />
        </div>
        <div className="h-6 w-14 rounded-full bg-[var(--surface-2)]" />
      </div>
      <div className="h-3 w-full rounded bg-[var(--surface-2)]" />
      <div className="h-3 w-3/4 rounded bg-[var(--surface-2)]" />
      <div className="h-9 w-28 rounded-lg bg-[var(--surface-2)] ml-auto" />
    </div>
  );
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "submitted" | "graded">("all");
  const [sort, setSort] = useState<SortKey>("due-soonest");
  const [open, setOpen] = useState<Assignment | null>(null);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { push } = useToast();

  async function load() {
    try {
      const r = await fetch("/api/assignments");
      const data = await r.json();
      if (r.ok) setAssignments(data.assignments ?? []);
      else push({ title: "Couldn't load assignments", tone: "danger" });
    } catch {
      push({ title: "Network error", description: "Couldn't reach the server.", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/assignments");
        const data = await r.json();
        if (!cancelled) {
          if (r.ok) setAssignments(data.assignments ?? []);
          else push({ title: "Couldn't load assignments", tone: "danger" });
        }
      } catch {
        if (!cancelled) push({ title: "Network error", tone: "danger" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => ({
    all: assignments.length,
    pending: assignments.filter((a) => !a.submission && a.status === "open").length,
    submitted: assignments.filter((a) => a.submission && a.submission.status !== "graded").length,
    graded: assignments.filter((a) => a.submission?.status === "graded").length,
  }), [assignments]);

  const stats = useMemo(() => {
    const graded = assignments.filter((a) => a.submission?.status === "graded" && a.submission.grade !== null);
    const avgPct = graded.length > 0
      ? Math.round(graded.reduce((s, a) => s + ((a.submission!.grade! / a.points) * 100), 0) / graded.length)
      : null;
    const overdue = assignments.filter((a) => !a.submission && new Date(a.dueDate) < new Date()).length;
    return { avgPct, overdue, totalPoints: graded.reduce((s, a) => s + a.submission!.grade!, 0), maxPoints: graded.reduce((s, a) => s + a.points, 0) };
  }, [assignments]);

  const list = useMemo(() => {
    let base = assignments.filter((a) => {
      if (filter === "pending") return !a.submission && a.status === "open";
      if (filter === "submitted") return a.submission && a.submission.status !== "graded";
      if (filter === "graded") return a.submission?.status === "graded";
      return true;
    });
    base = [...base].sort((a, b) => {
      if (sort === "due-soonest") return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (sort === "due-latest") return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      if (sort === "points-high") return b.points - a.points;
      return a.points - b.points;
    });
    return base;
  }, [assignments, filter, sort]);

  async function submit() {
    if (!open) return;
    if (!content.trim() && !file) {
      push({ title: "Empty submission", description: "Write an answer or attach a file.", tone: "warning" });
      return;
    }
    setSubmitting(true);
    let fileUrl: string | undefined;
    if (file) {
      const form = new FormData();
      form.append("file", file);
      const ur = await fetch("/api/upload", { method: "POST", body: form });
      const ud = await ur.json().catch(() => ({}));
      if (!ur.ok) {
        setSubmitting(false);
        push({ title: "Upload failed", description: ud.error ?? "Try again", tone: "danger" });
        return;
      }
      fileUrl = ud.url;
    }
    const r = await fetch(`/api/assignments/${open.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, fileUrl }),
    });
    setSubmitting(false);
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      push({ title: "Submission failed", description: e.error ?? "Try again", tone: "danger" });
      return;
    }
    push({ title: "Submitted!", description: "Your work has been received.", tone: "success" });
    setOpen(null);
    setContent("");
    setFile(null);
    load();
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Assignments</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Submit work, see grades and feedback.</p>
        </div>
        <Tabs
          value={filter}
          onChange={(v) => setFilter(v as typeof filter)}
          options={[
            { value: "all", label: "All", count: counts.all },
            { value: "pending", label: "Pending", count: counts.pending },
            { value: "submitted", label: "Submitted", count: counts.submitted },
            { value: "graded", label: "Graded", count: counts.graded },
          ]}
        />
      </div>

      {/* Stats */}
      {!loading && assignments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: counts.all, color: "text-[var(--primary)]", icon: <Icon.FilePen size={16} /> },
            { label: "Pending", value: counts.pending, color: "text-amber-500", icon: <Icon.Clock size={16} /> },
            { label: "Overdue", value: stats.overdue, color: "text-red-500", icon: <Icon.AlertCircle size={16} /> },
            {
              label: "Avg grade",
              value: stats.avgPct !== null ? `${stats.avgPct}%` : "—",
              color: stats.avgPct !== null && stats.avgPct >= 70 ? "text-emerald-500" : "text-[var(--muted)]",
              icon: <Icon.TrendingUp size={16} />,
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardBody className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className={s.color}>{s.icon}</span>
                  <div>
                    <p className="text-lg font-bold leading-none">{s.value}</p>
                    <p className="text-[10px] text-[var(--muted)] mt-0.5">{s.label}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Sort bar */}
      {!loading && assignments.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[var(--muted)]">Sort:</span>
          {([
            { key: "due-soonest", label: "Due soonest" },
            { key: "due-latest", label: "Due latest" },
            { key: "points-high", label: "Points ↓" },
            { key: "points-low", label: "Points ↑" },
          ] as { key: SortKey; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg font-medium transition",
                sort === key ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : list.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.FilePen size={28} />}
              title={filter === "all" ? "No assignments yet" : `No ${filter} assignments`}
              description={filter === "all" ? "When teachers post new work it shows here." : "Try a different filter."}
              action={filter !== "all" ? <Button variant="ghost" onClick={() => setFilter("all")}>Clear filter</Button> : undefined}
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {list.map((a) => {
            const overdue = new Date(a.dueDate) < new Date() && !a.submission;
            const chip = dueDateChip(a.dueDate, !!a.submission);
            const pctGrade = a.submission?.grade !== null && a.submission?.grade !== undefined
              ? Math.round((a.submission.grade / a.points) * 100)
              : null;
            return (
              <Card
                key={a.id}
                className={cn(overdue ? "ring-1 ring-red-400/40" : "")}
              >
                <CardHeader className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                    <Icon.FilePen size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="line-clamp-1">{a.title}</CardTitle>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{a.courseTitle}</p>
                  </div>
                  <Badge
                    variant={
                      a.submission?.status === "graded" ? "success"
                        : a.submission ? "info"
                        : overdue ? "danger"
                        : "warning"
                    }
                  >
                    {a.submission?.status === "graded" ? "Graded"
                      : a.submission ? "Submitted"
                      : overdue ? "Overdue"
                      : "Pending"}
                  </Badge>
                </CardHeader>
                <CardBody className="space-y-3">
                  <p className="text-sm text-[var(--muted)] line-clamp-2">{a.description}</p>

                  <div className="flex items-center gap-3 text-xs text-[var(--muted-2)] flex-wrap">
                    <span className={cn("flex items-center gap-1", overdue ? "text-red-500 font-medium" : "")}>
                      <Icon.Calendar size={12} />
                      Due {formatDate(a.dueDate)}
                    </span>
                    <span>·</span>
                    <span className="font-medium text-[var(--foreground)]">{a.points} pts</span>
                    {chip && (
                      <>
                        <span>·</span>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", chip.cls)}>{chip.label}</span>
                      </>
                    )}
                  </div>

                  {a.submission?.status === "graded" && a.submission.grade !== null && (
                    <div className="p-3 rounded-lg bg-[var(--surface-2)] space-y-2">
                      <GradeBar score={a.submission.grade} total={a.points} />
                      {a.submission.feedback && (
                        <p className="text-xs text-[var(--muted)] border-t border-[var(--border)] pt-2 mt-2 italic">
                          "{a.submission.feedback}"
                        </p>
                      )}
                    </div>
                  )}

                  {a.submission?.status === "submitted" && (
                    <div className="rounded-lg bg-blue-500/10 px-3 py-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <Icon.Check size={12} />
                      Submitted {relativeTime(a.submission.submittedAt)} — awaiting grade
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    {pctGrade !== null && (
                      <span className={cn("text-xs font-medium", gradeLabel(a.submission!.grade!, a.points).color)}>
                        {gradeLabel(a.submission!.grade!, a.points).letter} grade
                      </span>
                    )}
                    <div className="ml-auto">
                      {a.submission ? (
                        <Button variant="outline" size="sm" onClick={() => { setOpen(a); setContent(a.submission?.content ?? ""); setFile(null); }}>
                          View submission
                        </Button>
                      ) : a.status === "open" ? (
                        <Button size="sm" onClick={() => { setOpen(a); setContent(""); setFile(null); }}>
                          <Icon.Send size={14} /> Submit work
                        </Button>
                      ) : (
                        <Badge variant="default">Closed</Badge>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Submission modal */}
      <Modal
        open={!!open}
        onClose={() => { setOpen(null); setFile(null); }}
        title={open?.title}
        description={open ? `${open.courseTitle} · ${open.points} pts · Due ${formatDate(open.dueDate)}` : undefined}
        size="lg"
      >
        {open && (
          <div className="p-5 space-y-4">
            {/* Instructions */}
            <div className="rounded-lg bg-[var(--surface-2)] p-3">
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1">Instructions</p>
              <p className="text-sm text-[var(--muted)]">{open.description}</p>
            </div>

            {open.submission ? (
              <>
                <div>
                  <p className="text-sm font-semibold mb-1">Your submission</p>
                  {open.submission.content && (
                    <div className="p-3 rounded-lg bg-[var(--surface-2)] text-sm whitespace-pre-wrap max-h-56 overflow-y-auto">
                      {open.submission.content}
                    </div>
                  )}
                  {open.submission.fileUrl && (
                    <a
                      href={open.submission.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface-2)] transition"
                    >
                      <Icon.Download size={14} className="text-[var(--primary)]" />
                      <span className="truncate">View attached file</span>
                    </a>
                  )}
                  <p className="text-xs text-[var(--muted-2)] mt-2">
                    Submitted {relativeTime(open.submission.submittedAt)}
                  </p>
                </div>
                {open.submission.status === "graded" && open.submission.grade !== null && (
                  <div className="p-4 rounded-xl bg-[var(--surface-2)] space-y-2">
                    <GradeBar score={open.submission.grade} total={open.points} />
                    {open.submission.feedback && (
                      <div className="border-t border-[var(--border)] pt-3 mt-1">
                        <p className="text-xs text-[var(--muted)] font-medium mb-1">Instructor feedback</p>
                        <p className="text-sm text-[var(--foreground)] italic">"{open.submission.feedback}"</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold">Your answer</p>
                    <span className="text-xs text-[var(--muted)]">{wordCount} word{wordCount !== 1 ? "s" : ""}</span>
                  </div>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your submission, paste links, or share thoughts…"
                    rows={8}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">
                    Attachment{" "}
                    <span className="text-xs font-normal text-[var(--muted)]">(optional · PDF, Word, image, ZIP — up to 10 MB)</span>
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.zip,image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  {file ? (
                    <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                      <Icon.FilePen size={14} className="text-[var(--primary)]" />
                      <span className="flex-1 truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                        className="text-[var(--muted)] hover:text-[var(--danger)] transition"
                        aria-label="Remove file"
                      >
                        <Icon.X size={14} />
                      </button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                      <Icon.Plus size={14} /> Choose file
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" onClick={() => { setOpen(null); setFile(null); }}>Cancel</Button>
                  <Button onClick={submit} loading={submitting} disabled={!content.trim() && !file}>
                    <Icon.Send size={14} /> Submit
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
