"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, Badge, Button, Card, CardBody, useToast } from "@/components/ui";
import Icon from "@/components/icons";
import { VideoPlayer } from "@/components/course/VideoPlayer";
import { useAuth, useData } from "@/lib/store";
import { COURSES } from "@/lib/mockData";
import { cn, formatDuration, formatHours } from "@/lib/utils";

export default function CoursePreviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { enrollments, enroll, addNotification } = useData();

  const course = COURSES.find((c) => c.id === params.id);
  const enrollment = useMemo(
    () => enrollments.find((e) => e.courseId === params.id),
    [enrollments, params.id],
  );
  const enrolled = !!enrollment;
  const [enrolling, setEnrolling] = useState(false);

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold">Course not found</p>
        <Link href="/explore" className="text-[var(--primary)] hover:underline text-sm mt-2 inline-block">
          ← Back to explore
        </Link>
      </div>
    );
  }

  const firstChapter = course.chapters[0];

  async function handleEnroll() {
    if (!course || !user) {
      if (!user) router.push("/login");
      return;
    }
    setEnrolling(true);
    try {
      await enroll(course.id);
      addNotification({
        type: "achievement",
        title: "Enrolled!",
        message: `You're now enrolled in ${course.title}.`,
      });
      toast.push({ title: "Enrolled!", description: course.title, tone: "success" });
      router.push(`/my-courses/${course.id}`);
    } catch {
      toast.push({ title: "Couldn't enroll", description: "Please try again.", tone: "danger" });
    } finally {
      setEnrolling(false);
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => { if (window.history.length > 1) router.back(); else router.push("/explore"); }}
        className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] flex items-center gap-1 transition"
      >
        <Icon.ChevronLeft size={14} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* ── Main ── */}
        <div className="space-y-5">
          {/* Video preview */}
          <VideoPlayer
            title={firstChapter ? firstChapter.title : course.title}
            durationSeconds={firstChapter?.duration ?? 600}
          />

          {/* Title + badges */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="primary">{course.category}</Badge>
              <Badge>{course.level}</Badge>
              {course.price === 0 && <Badge variant="success">Free</Badge>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{course.title}</h1>
            <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed">{course.description}</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Duration" value={formatHours(course.durationMinutes)} />
            <StatCard label="Chapters" value={String(course.chapters.length)} />
            <StatCard label="Rating" value={`${course.rating} ★`} />
            <StatCard label="Reviews" value={course.reviews.toLocaleString()} />
          </div>

          {/* Instructor */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <Avatar name={course.instructor} size={48} />
            <div>
              <p className="font-semibold">{course.instructor}</p>
              <p className="text-xs text-[var(--muted)]">Instructor · {course.category}</p>
            </div>
          </div>

          {/* Topics */}
          {course.tags.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
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
        </div>

        {/* ── Sidebar ── */}
        <aside className="lg:sticky lg:top-20 h-fit space-y-4">
          {/* CTA */}
          <Card>
            <CardBody className="space-y-4">
              <div>
                <p className="text-3xl font-bold">
                  {course.price === 0 ? "Free" : `$${course.price}`}
                </p>
                {course.price > 0 && (
                  <p className="text-xs text-[var(--muted)] mt-0.5">One-time payment</p>
                )}
              </div>

              {enrolled ? (
                <Link href={`/my-courses/${course.id}`} className="block">
                  <Button className="w-full" size="lg">
                    <Icon.Play size={16} /> Continue Learning
                  </Button>
                </Link>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  loading={enrolling}
                  onClick={handleEnroll}
                >
                  <Icon.Book size={16} /> Enroll Now
                </Button>
              )}

              <ul className="space-y-2 text-sm text-[var(--muted)]">
                <li className="flex items-center gap-2">
                  <Icon.Clock size={14} className="text-[var(--primary)] shrink-0" />
                  {formatHours(course.durationMinutes)} of content
                </li>
                <li className="flex items-center gap-2">
                  <Icon.Book size={14} className="text-[var(--primary)] shrink-0" />
                  {course.chapters.length} chapters
                </li>
                <li className="flex items-center gap-2">
                  <Icon.Award size={14} className="text-[var(--primary)] shrink-0" />
                  Certificate on completion
                </li>
              </ul>
            </CardBody>
          </Card>

          {/* Chapter list */}
          <Card>
            <div className="p-4 border-b border-[var(--border)]">
              <p className="text-sm font-semibold">Course content</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                {course.chapters.length} chapters · {formatHours(course.durationMinutes)}
              </p>
            </div>
            <ul className="max-h-[380px] overflow-y-auto">
              {course.chapters.map((ch, i) => {
                const isFirst = i === 0;
                return (
                  <li key={ch.id} className="border-b border-[var(--border)] last:border-0">
                    <div
                      className={cn(
                        "flex items-center gap-3 px-4 py-3",
                        isFirst ? "text-[var(--foreground)]" : "text-[var(--muted)]",
                      )}
                    >
                      <span
                        className={cn(
                          "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                          isFirst
                            ? "bg-[var(--primary)] text-white"
                            : enrolled
                              ? "bg-[var(--surface-2)] text-[var(--foreground)]"
                              : "bg-[var(--surface-2)] text-[var(--muted)]",
                        )}
                      >
                        {!enrolled && !isFirst ? <Icon.Lock size={11} /> : i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{ch.title}</p>
                        <p className="text-[11px] text-[var(--muted)]">{formatDuration(ch.duration)}</p>
                      </div>
                      {(enrolled || isFirst) && (
                        <Icon.Play size={13} className="text-[var(--muted)] shrink-0" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] p-3">
      <p className="text-[11px] text-[var(--muted)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">{value}</p>
    </div>
  );
}
