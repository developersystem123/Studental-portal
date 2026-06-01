"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Progress,
  Skeleton,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { cn, formatHours } from "@/lib/utils";
import { useAuth } from "@/lib/store";
import { isProfileComplete } from "@/lib/profileComplete";
import { EnrollmentGateModal } from "@/components/EnrollmentGateModal";

type PathCourse = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  instructor: string;
  category: string;
  level: string;
  durationMinutes: number;
  chapterCount: number;
  order: number;
  enrolled: boolean;
  courseProgress: number;
  completed: boolean;
};

type PathDetail = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  category: string;
  level: string;
  featured: boolean;
  learners: number;
  totalMinutes: number;
  enrolled: boolean;
  progress: number;
  courses: PathCourse[];
};

export default function LearningPathDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { push } = useToast();
  const { user } = useAuth();
  const [path, setPath] = useState<PathDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const r = await fetch(`/api/learning-paths/${encodeURIComponent(id)}`);
      const data = r.ok ? await r.json().catch(() => ({})) : {};
      setPath(data.path ?? null);
    } catch {
      push({ title: "Couldn't load learning path", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [id, push]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleEnroll() {
    if (!path) return;
    setBusy(true);
    const method = path.enrolled ? "DELETE" : "POST";
    const r = await fetch(`/api/learning-paths/${encodeURIComponent(path.id)}/enroll`, { method });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) {
      push({ title: "Something went wrong", description: data.error, tone: "danger" });
      return;
    }
    if (path.enrolled) {
      push({ title: "Left the path", tone: "info" });
    } else {
      push({
        title: "You're on the path!",
        description: `${data.enrolledCourses ?? 0} courses added to My Courses.`,
        tone: "success",
      });
    }
    load();
  }

  function handleEnrollClick() {
    if (!path) return;
    if (path.enrolled) {
      toggleEnroll();
      return;
    }
    if (!user || !isProfileComplete(user)) {
      setGateOpen(true);
      return;
    }
    toggleEnroll();
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-52" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!path) {
    return (
      <EmptyState
        icon={<Icon.Route size={28} />}
        title="Learning path not found"
        description="It may have been removed."
        action={
          <Link href="/paths">
            <Button variant="outline">
              <Icon.ArrowLeft size={14} /> Back to paths
            </Button>
          </Link>
        }
      />
    );
  }

  const completedCount = path.courses.filter((c) => c.completed).length;

  return (
    <div className="space-y-6">
      <Link
        href="/paths"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition"
      >
        <Icon.ArrowLeft size={15} /> All learning paths
      </Link>

      {/* Hero */}
      <Card className="overflow-hidden">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={path.thumbnail} alt={path.title} className="w-full h-44 sm:h-56 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white">
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur">
                {path.category}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur">
                {path.level}
              </span>
              {path.featured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-amber-950">
                  <Icon.Star size={11} /> Featured
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">{path.title}</h1>
          </div>
        </div>
        <CardBody className="space-y-4">
          <p className="text-sm text-[var(--muted)]">{path.description}</p>
          <div className="flex items-center gap-5 text-sm text-[var(--muted)] flex-wrap">
            <span className="flex items-center gap-1.5"><Icon.Book size={15} /> {path.courses.length} courses</span>
            <span className="flex items-center gap-1.5"><Icon.Clock size={15} /> {formatHours(path.totalMinutes)}</span>
            <span className="flex items-center gap-1.5"><Icon.Users size={15} /> {path.learners.toLocaleString()} learners</span>
          </div>

          {path.enrolled && (
            <div className="rounded-xl bg-[var(--surface-2)] p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">Your progress</span>
                <span className="text-[var(--muted)]">
                  {completedCount}/{path.courses.length} courses · {path.progress}%
                </span>
              </div>
              <Progress value={path.progress} />
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleEnrollClick} loading={busy} variant={path.enrolled ? "outline" : "primary"}>
              {path.enrolled ? (
                <>
                  <Icon.Check size={15} /> Joined — leave path
                </>
              ) : (
                <>
                  <Icon.Route size={15} /> Join this path
                </>
              )}
            </Button>
            {path.courses[0] && (
              <Link href={`/my-courses/${path.courses[0].id}`}>
                <Button variant="soft">
                  <Icon.Play size={15} /> {path.enrolled ? "Continue" : "Start first course"}
                </Button>
              </Link>
            )}
          </div>
        </CardBody>
      </Card>

      <EnrollmentGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        onComplete={() => { setGateOpen(false); toggleEnroll(); }}
      />

      {/* Course steps */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Path curriculum</h2>
        {path.courses.length === 0 ? (
          <EmptyState
            icon={<Icon.Book size={24} />}
            title="No courses in this path yet"
            description="Courses will appear here once added."
          />
        ) : (
          <ol className="space-y-3">
            {path.courses.map((c, idx) => (
              <li key={c.id}>
                <Link href={`/my-courses/${c.id}`} className="group block">
                  <Card className="overflow-hidden transition-shadow hover:shadow-md">
                    <CardBody className="flex items-center gap-4">
                      <div
                        className={cn(
                          "shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold",
                          c.completed
                            ? "bg-emerald-500 text-white"
                            : "bg-[var(--primary-soft)] text-[var(--primary)]",
                        )}
                      >
                        {c.completed ? <Icon.Check size={18} /> : idx + 1}
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.thumbnail}
                        alt={c.title}
                        className="hidden sm:block h-16 w-28 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-snug line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
                          {c.title}
                        </p>
                        <p className="text-xs text-[var(--muted)] mt-0.5">
                          {c.instructor} · {c.chapterCount} chapters · {formatHours(c.durationMinutes)}
                        </p>
                        {c.enrolled && !c.completed && (
                          <div className="mt-2 max-w-xs">
                            <Progress value={c.courseProgress} />
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        {c.completed ? (
                          <Badge variant="success">Completed</Badge>
                        ) : c.enrolled ? (
                          <Badge variant="info">{c.courseProgress}%</Badge>
                        ) : (
                          <Badge variant="default">Not started</Badge>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
