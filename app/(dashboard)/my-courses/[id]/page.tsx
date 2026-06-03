"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  Progress,
  Tabs,
  Textarea,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { VideoPlayer } from "@/components/course/VideoPlayer";
import { CourseReviews } from "@/components/course/CourseReviews";
import { useAuth, useData } from "@/lib/store";
import { COURSES, type Chapter, type Course } from "@/lib/mockData";
import { isProfileComplete } from "@/lib/profileComplete";
import { cn, formatDuration, formatHours } from "@/lib/utils";

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const {
    enrollments,
    certificates,
    toggleChapter,
    enroll,
    awardCertificate,
    addNotification,
  } = useData();

  const course = COURSES.find((c) => c.id === params.id);
  const enrollment = useMemo(
    () => enrollments.find((e) => e.courseId === params.id),
    [enrollments, params.id],
  );
  const cert = useMemo(
    () => certificates.find((cer) => cer.courseId === params.id),
    [certificates, params.id],
  );

  const [activeChapter, setActiveChapter] = useState(course?.chapters[0]?.id ?? "");
  const [tab, setTab] = useState<"overview" | "resources" | "qa" | "notes" | "reviews">("overview");
  const hasAutoResumed = useRef(false);

  // Auto-resume: jump to first uncompleted chapter on load
  useEffect(() => {
    if (!enrollment || !course || hasAutoResumed.current) return;
    hasAutoResumed.current = true;
    const firstUncompleted = course.chapters.find(
      (ch) => !enrollment.completedChapters.includes(ch.id),
    );
    if (firstUncompleted) setActiveChapter(firstUncompleted.id);
  }, [enrollment, course]);

  // Derived values — computed before early returns so effects can reference them
  const chapter = course?.chapters.find((x) => x.id === activeChapter) ?? course?.chapters[0];
  const chapterIdx = course ? course.chapters.findIndex((x) => x.id === chapter?.id) : -1;
  const isCompleted = !!(enrollment?.completedChapters.includes(chapter?.id ?? ""));
  const enrolled = !!enrollment;
  const completedCount = enrollment?.completedChapters.length ?? 0;
  const totalChapters = course?.chapters.length ?? 0;
  const courseProgress = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

  // Keyboard navigation: ← → move between chapters
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      if (!course) return;
      if (e.key === "ArrowLeft" && chapterIdx > 0)
        setActiveChapter(course.chapters[chapterIdx - 1].id);
      if (e.key === "ArrowRight" && chapterIdx < course.chapters.length - 1)
        setActiveChapter(course.chapters[chapterIdx + 1].id);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [chapterIdx, course]);

  // ─── Early returns (after all hooks) ───────────────────────────────────────

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold">Course not found</p>
        <Link
          href="/my-courses"
          className="text-[var(--primary)] hover:underline text-sm mt-2 inline-block"
        >
          ← Back to courses
        </Link>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[var(--primary-soft)] flex items-center justify-center mx-auto">
          <Icon.Book size={30} className="text-[var(--primary)]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">{course.title}</h2>
          <p className="text-sm text-[var(--muted)]">
            You are not enrolled in this course. Please enroll from the Explore page to access the content.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link href="/explore">
            <Button>
              <Icon.Compass size={15} /> Browse courses
            </Button>
          </Link>
          <button
            onClick={() => router.back()}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition px-4 py-2"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  if (user && !isProfileComplete(user)) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
          <Icon.AlertCircle size={30} className="text-amber-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Profile incomplete</h2>
          <p className="text-sm text-[var(--muted)]">
            To access course content, please complete your profile — add your phone number
            {user.role === "Student" ? " and education level" : ""} first.
          </p>
        </div>
        <Link href="/profile">
          <Button className="mx-auto">
            <Icon.User size={15} /> Complete profile
          </Button>
        </Link>
        <button
          onClick={() => router.back()}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition block mx-auto"
        >
          ← Go back
        </button>
      </div>
    );
  }

  // After guard: course, chapter, chapterIdx are non-null
  const c = course;
  const ch = chapter!;

  function prevChapter() {
    if (chapterIdx > 0) setActiveChapter(c.chapters[chapterIdx - 1].id);
  }
  function nextChapter() {
    if (chapterIdx < c.chapters.length - 1)
      setActiveChapter(c.chapters[chapterIdx + 1].id);
  }

  async function handleMarkComplete() {
    try {
      if (!enrolled) {
        await enroll(c.id);
        toast.push({ title: "Enrolled!", tone: "success" });
      }
      await toggleChapter(c.id, ch.id);

      const wasLast = c.chapters.every((x) =>
        x.id === ch.id ? !isCompleted : enrollment?.completedChapters.includes(x.id),
      );

      if (wasLast && !isCompleted) {
        const score = 80 + Math.floor(Math.random() * 20);
        try {
          const newCert = await awardCertificate(c.id, score);
          addNotification({
            type: "achievement",
            title: "Course completed!",
            message: `You earned a certificate for ${c.title} (Score ${score}%).`,
          });
          toast.push({
            title: "🎉 Course completed!",
            description: `Certificate ${newCert.verifyCode} earned.`,
            tone: "success",
          });
        } catch {
          toast.push({ title: "Course completed!", description: "Certificate will be issued shortly.", tone: "success" });
        }
      } else if (!isCompleted && chapterIdx < c.chapters.length - 1) {
        // Auto-advance to next chapter after a short delay
        const nextId = c.chapters[chapterIdx + 1].id;
        toast.push({ title: "Lesson complete!", description: "Moving to next chapter…", tone: "success" });
        setTimeout(() => setActiveChapter(nextId), 700);
      }
    } catch {
      toast.push({ title: "Couldn't save progress", description: "Please try again.", tone: "danger" });
    }
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => router.back()}
        className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] flex items-center gap-1"
      >
        <Icon.ChevronLeft size={14} /> Back
      </button>

      {/* Course completion banner */}
      {enrollment?.completed && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 px-5 py-4 flex flex-wrap items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
            <Icon.Award size={22} className="text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              Course completed — well done! 🎉
            </p>
            <p className="text-xs text-[var(--muted)] mt-0.5 truncate">
              {c.title} · All {c.chapters.length} chapters finished
            </p>
          </div>
          {cert && (
            <Link href="/certificates" className="shrink-0">
              <Button size="sm" variant="soft">
                <Icon.Award size={14} /> View certificate
              </Button>
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* ── Main content ── */}
        <div className="space-y-4">
          <VideoPlayer title={ch.title} durationSeconds={ch.duration} />

          {/* Chapter header + controls */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="primary">{c.category}</Badge>
                <Badge>{c.level}</Badge>
                {enrollment && (
                  <Badge variant={enrollment.completed ? "success" : "warning"}>
                    {enrollment.completed ? "Completed" : `${enrollment.progress}% done`}
                  </Badge>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">{c.title}</h1>
              <p className="text-sm text-[var(--muted)] mt-1">
                Chapter {chapterIdx + 1} of {c.chapters.length}: {ch.title}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <Button variant="outline" onClick={prevChapter} disabled={chapterIdx === 0}>
                <Icon.ChevronLeft size={14} /> Prev
              </Button>
              <Button variant={isCompleted ? "soft" : "primary"} onClick={handleMarkComplete}>
                {isCompleted ? (
                  <>
                    <Icon.CheckCircle size={14} className="text-emerald-500" /> Completed
                  </>
                ) : (
                  <>
                    <Icon.Check size={14} /> Mark complete
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={nextChapter}
                disabled={chapterIdx === c.chapters.length - 1}
              >
                Next <Icon.ChevronRight size={14} />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Card>
            <CardBody>
              <Tabs
                value={tab}
                onChange={(v) => setTab(v as typeof tab)}
                options={[
                  { value: "overview", label: "Overview" },
                  { value: "resources", label: "Resources" },
                  { value: "qa", label: "Q&A" },
                  { value: "notes", label: "Notes" },
                  { value: "reviews", label: "Reviews" },
                ]}
              />
              <div className="mt-5 text-sm text-[var(--muted)]">
                {tab === "overview" && <OverviewTab course={c} />}
                {tab === "resources" && (
                  <ResourcesTab course={c} activeChapterId={ch.id} />
                )}
                {tab === "qa" && <QATab courseId={c.id} />}
                {tab === "notes" && (
                  <NotesPanel
                    courseId={c.id}
                    chapterId={ch.id}
                    chapterTitle={ch.title}
                  />
                )}
                {tab === "reviews" && (
                  <CourseReviews courseId={c.id} enrolled={enrolled} />
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* ── Sidebar ── */}
        <aside className="lg:sticky lg:top-20 h-fit">
          <Card>
            <div className="p-5 border-b border-[var(--border)]">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-sm font-semibold">Course content</p>
                <span className="text-xs text-[var(--muted)] tabular-nums">
                  {completedCount}/{totalChapters} done
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] mb-3">
                {c.chapters.length} chapters · {formatHours(c.durationMinutes)}
              </p>
              <Progress value={courseProgress} />
            </div>

            <ul className="max-h-[420px] overflow-y-auto">
              {c.chapters.map((x, i) => {
                const done = enrollment?.completedChapters.includes(x.id);
                const active = x.id === ch.id;
                return (
                  <li key={x.id}>
                    <button
                      onClick={() => setActiveChapter(x.id)}
                      className={cn(
                        "w-full text-left px-5 py-3 flex items-center gap-3 transition border-l-2",
                        active
                          ? "bg-[var(--primary-soft)] border-[var(--primary)]"
                          : "border-transparent hover:bg-[var(--surface-2)]",
                      )}
                    >
                      <span
                        className={cn(
                          "h-7 w-7 rounded-full flex items-center justify-center text-xs shrink-0",
                          done
                            ? "bg-emerald-500 text-white"
                            : active
                              ? "bg-[var(--primary)] text-white"
                              : "bg-[var(--surface-2)] text-[var(--muted)]",
                        )}
                      >
                        {done ? <Icon.Check size={14} strokeWidth={3} /> : i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm truncate",
                            active
                              ? "text-[var(--primary)] font-semibold"
                              : "text-[var(--foreground)]",
                          )}
                        >
                          {x.title}
                        </p>
                        <p className="text-[11px] text-[var(--muted)]">
                          {formatDuration(x.duration)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Certificate footer */}
            {enrollment?.completed && cert && (
              <div className="p-4 border-t border-[var(--border)] bg-emerald-500/5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                  <Icon.Award size={15} />
                  <p className="text-xs font-semibold">Certificate earned</p>
                </div>
                <p className="text-[11px] text-[var(--muted)] font-mono truncate mb-2">
                  {cert.verifyCode}
                </p>
                <Link href="/certificates">
                  <Button size="sm" variant="soft" className="w-full">
                    View certificate
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ course }: { course: Course }) {
  return (
    <div className="space-y-5">
      <p className="leading-relaxed">{course.description}</p>

      {course.tags.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-2">
            Topics covered
          </p>
          <div className="flex flex-wrap gap-2">
            {course.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--primary-soft)] text-[var(--primary)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Avatar name={course.instructor} size={44} />
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">{course.instructor}</p>
          <p className="text-xs text-[var(--muted)]">Instructor · {course.category}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Duration" value={formatHours(course.durationMinutes)} />
        <Stat label="Chapters" value={String(course.chapters.length)} />
        <Stat label="Rating" value={`${course.rating} ★`} />
        <Stat label="Reviews" value={course.reviews.toLocaleString()} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] p-3">
      <p className="text-[11px] text-[var(--muted)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">{value}</p>
    </div>
  );
}

// ─── Resources tab ────────────────────────────────────────────────────────────

type ResourceItem = {
  name: string;
  type: "pdf" | "video" | "code" | "link";
  size?: string;
};

function chapterResources(ch: Chapter, idx: number): ResourceItem[] {
  if (ch.resources?.length) {
    return ch.resources.map((r) => ({ name: r.name, type: "link" as const }));
  }
  return [
    { name: `Chapter ${idx + 1} – Lecture Notes.pdf`, type: "pdf", size: "1.2 MB" },
    { name: `Chapter ${idx + 1} – Practice Exercises.pdf`, type: "pdf", size: "0.8 MB" },
  ];
}

function FileIcon({ type }: { type: ResourceItem["type"] }) {
  if (type === "pdf")
    return <Icon.FilePen size={15} className="text-red-400 shrink-0" />;
  if (type === "video")
    return <Icon.Play size={15} className="text-blue-400 shrink-0" />;
  if (type === "code")
    return <Icon.Save size={15} className="text-green-400 shrink-0" />;
  return <Icon.Download size={15} className="text-purple-400 shrink-0" />;
}

function ResourcesTab({
  course,
  activeChapterId,
}: {
  course: Course;
  activeChapterId: string;
}) {
  const chapterIdx = course.chapters.findIndex((ch) => ch.id === activeChapterId);
  const chapter = course.chapters[chapterIdx];
  if (!chapter) return null;

  const resources = chapterResources(chapter, chapterIdx);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border)]">
        <span className="h-7 w-7 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold shrink-0">
          {chapterIdx + 1}
        </span>
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">{chapter.title}</p>
          <p className="text-xs text-[var(--muted)]">
            {resources.length} file{resources.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </div>

      {/* Files */}
      <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] overflow-hidden">
        {resources.map((r, ri) => (
          <li key={ri} className="flex items-center gap-3 px-4 py-3 bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors">
            <FileIcon type={r.type} />
            <span className="flex-1 text-sm text-[var(--foreground)] truncate">{r.name}</span>
            {r.size && (
              <span className="text-xs text-[var(--muted)] shrink-0">{r.size}</span>
            )}
            <Button size="sm" variant="ghost">
              <Icon.Download size={13} /> Download
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Q&A tab ──────────────────────────────────────────────────────────────────

type QAItem = {
  id: string;
  question: string;
  answer?: string;
  yours?: boolean;
};

function QATab({ courseId }: { courseId: string }) {
  const toast = useToast();
  const [items, setItems] = useState<QAItem[]>(() => {
    try {
      const saved = localStorage.getItem(`qa-${courseId}`);
      return saved ? (JSON.parse(saved) as QAItem[]) : [];
    } catch {
      return [];
    }
  });
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function persist(next: QAItem[]) {
    setItems(next);
    try {
      localStorage.setItem(`qa-${courseId}`, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    setSubmitting(true);
    // Simulate a short network delay for realism
    await new Promise((r) => setTimeout(r, 400));
    const newItem: QAItem = {
      id: `qa-${Date.now()}`,
      question: q,
      yours: true,
    };
    persist([newItem, ...items]);
    setQuestion("");
    setSubmitting(false);
    toast.push({ title: "Question posted", description: "The instructor will reply soon.", tone: "success" });
  }

  function remove(id: string) {
    persist(items.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* Ask form */}
      <form
        onSubmit={submit}
        className="rounded-xl border border-[var(--border)] p-3 space-y-2"
      >
        <p className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
          Ask a question
        </p>
        <Textarea
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What would you like to know about this course?"
        />
        <div className="flex justify-end">
          <Button size="sm" type="submit" loading={submitting} disabled={!question.trim()}>
            <Icon.Send size={13} /> Post question
          </Button>
        </div>
      </form>

      {/* Q&A list */}
      {items.length === 0 ? (
        <EmptyState
          icon={<Icon.MessageSquare size={20} />}
          title="No questions yet"
          description="Be the first to ask!"
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-[var(--border)] p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  Q: {item.question}
                </p>
                {item.yours && (
                  <button
                    onClick={() => remove(item.id)}
                    className="text-[var(--muted)] hover:text-[var(--danger)] transition shrink-0"
                    aria-label="Delete question"
                  >
                    <Icon.Trash size={13} />
                  </button>
                )}
              </div>
              {item.answer ? (
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  A: {item.answer}
                </p>
              ) : (
                <p className="text-xs text-amber-500 flex items-center gap-1">
                  <Icon.Clock size={12} /> Awaiting instructor reply
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Notes panel ──────────────────────────────────────────────────────────────

type Note = {
  id: string;
  chapterId: string;
  body: string;
  timestampSeconds?: number;
  createdAt: string;
};

function mmss(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function NotesPanel({
  courseId,
  chapterId,
  chapterTitle,
}: {
  courseId: string;
  chapterId: string;
  chapterTitle: string;
}) {
  const toast = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/notes?courseId=${courseId}`);
    const data = r.ok ? await r.json() : { notes: [] };
    setNotes(data.notes ?? []);
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const chapterNotes = notes.filter((n) => n.chapterId === chapterId);

  async function add() {
    if (!body.trim()) return;
    setSaving(true);
    let ts: number | null = null;
    const t = time.trim();
    if (t) {
      const parts = t.split(":").map((x) => Number(x));
      if (parts.every((n) => Number.isFinite(n))) {
        ts = parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0];
      }
    }
    const r = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, chapterId, body, timestampSeconds: ts }),
    });
    setSaving(false);
    if (!r.ok) {
      toast.push({ title: "Couldn't save note", tone: "danger" });
      return;
    }
    setBody("");
    setTime("");
    load();
  }

  async function del(id: string) {
    const r = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (r.ok) load();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--border)] p-3 space-y-2">
        <p className="text-xs text-[var(--muted-2)] font-semibold uppercase tracking-wider">
          New note · {chapterTitle}
        </p>
        <Textarea
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a note for this lesson…"
        />
        <div className="flex items-center gap-2">
          <Input
            value={time}
            onChange={(e) => setTime(e.target.value.replace(/[^\d:]/g, ""))}
            placeholder="Bookmark time (mm:ss) — optional"
            className="!h-9"
          />
          <Button size="sm" onClick={add} loading={saving} disabled={!body.trim()}>
            <Icon.Save size={14} /> Save
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      ) : chapterNotes.length === 0 ? (
        <EmptyState
          icon={<Icon.FilePen size={20} />}
          title="No notes for this lesson yet"
          description="Jot down key ideas or bookmark a moment to revisit later."
        />
      ) : (
        <ul className="space-y-2">
          {chapterNotes.map((n) => (
            <li
              key={n.id}
              className="rounded-xl border border-[var(--border)] p-3 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                {n.timestampSeconds !== undefined && (
                  <Badge variant="primary" className="mb-1">
                    <Icon.Play size={10} /> {mmss(n.timestampSeconds)}
                  </Badge>
                )}
                <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">
                  {n.body}
                </p>
              </div>
              <button
                onClick={() => del(n.id)}
                className="text-[var(--muted-2)] hover:text-[var(--danger)] transition shrink-0"
                aria-label="Delete note"
              >
                <Icon.Trash size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
