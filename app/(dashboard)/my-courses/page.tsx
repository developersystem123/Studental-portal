"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  Progress,
  Tabs,
} from "@/components/ui";
import { CourseCard } from "@/components/course/CourseCard";
import Icon from "@/components/icons";
import { useData } from "@/lib/store";
import { COURSES } from "@/lib/mockData";
import { cn } from "@/lib/utils";

type SortKey = "progress" | "name" | "category" | "duration";

export default function MyCoursesPage() {
  const { enrollments } = useData();
  const [tab, setTab] = useState<"all" | "progress" | "completed">("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("progress");
  const [catFilter, setCatFilter] = useState("all");

  const enrolledCourses = useMemo(() => {
    return enrollments
      .map((e) => ({ enrollment: e, course: COURSES.find((c) => c.id === e.courseId) }))
      .filter((x) => x.course)
      .map((x) => ({ enrollment: x.enrollment, course: x.course! }));
  }, [enrollments]);

  const counts = {
    all: enrolledCourses.length,
    progress: enrolledCourses.filter((x) => !x.enrollment.completed).length,
    completed: enrolledCourses.filter((x) => x.enrollment.completed).length,
  };

  const avgProgress =
    enrolledCourses.length === 0
      ? 0
      : Math.round(
          enrolledCourses.reduce((sum, x) => sum + x.enrollment.progress, 0) /
            enrolledCourses.length,
        );

  const categories = useMemo(
    () =>
      Array.from(new Set(enrolledCourses.map((x) => x.course.category))).sort(),
    [enrolledCourses],
  );

  // First in-progress course with actual progress > 0
  const continueCourse = useMemo(() => {
    return enrolledCourses.find(
      (x) => !x.enrollment.completed && x.enrollment.progress > 0,
    ) ?? null;
  }, [enrolledCourses]);

  const filtered = useMemo(() => {
    let list = enrolledCourses.filter(({ enrollment }) => {
      if (tab === "progress") return !enrollment.completed;
      if (tab === "completed") return enrollment.completed;
      return true;
    });

    if (catFilter !== "all") {
      list = list.filter((x) => x.course.category === catFilter);
    }

    if (q.trim() !== "") {
      const lower = q.toLowerCase();
      list = list.filter(({ course }) =>
        course.title.toLowerCase().includes(lower),
      );
    }

    return list;
  }, [enrolledCourses, tab, catFilter, q]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sort === "name")
      return list.sort((a, b) => a.course.title.localeCompare(b.course.title));
    if (sort === "category")
      return list.sort((a, b) =>
        a.course.category.localeCompare(b.course.category),
      );
    if (sort === "duration")
      return list.sort(
        (a, b) => b.course.durationMinutes - a.course.durationMinutes,
      );
    // "progress": in-progress (desc) first, then completed, then not-started
    return list.sort((a, b) => {
      if (a.enrollment.completed !== b.enrollment.completed)
        return a.enrollment.completed ? 1 : -1;
      return b.enrollment.progress - a.enrollment.progress;
    });
  }, [filtered, sort]);

  const stats = [
    {
      label: "Total enrolled",
      value: enrolledCourses.length,
      icon: <Icon.Book size={16} />,
      color: "text-[var(--primary)]",
    },
    {
      label: "In progress",
      value: counts.progress,
      icon: <Icon.TrendingUp size={16} />,
      color: "text-amber-500",
    },
    {
      label: "Completed",
      value: counts.completed,
      icon: <Icon.CheckCircle size={16} />,
      color: "text-emerald-500",
    },
    {
      label: "Avg progress",
      value: `${avgProgress}%`,
      icon: <Icon.TrendingUp size={16} />,
      color: "text-sky-500",
    },
  ];

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "progress", label: "Progress" },
    { key: "name", label: "Name A–Z" },
    { key: "category", label: "Category" },
    { key: "duration", label: "Duration" },
  ];

  function emptyIcon() {
    if (q.trim() !== "") return <Icon.Search size={28} />;
    if (tab === "progress") return <Icon.TrendingUp size={28} />;
    if (tab === "completed") return <Icon.Award size={28} />;
    return <Icon.Book size={28} />;
  }

  function emptyTitle() {
    if (q.trim() !== "") return "No courses match";
    if (tab === "progress") return "No courses in progress";
    if (tab === "completed") return "No completed courses yet";
    return "No courses to show";
  }

  function emptyDescription() {
    if (q.trim() !== "") return "Try a different search term.";
    if (tab === "progress") return "Start a course to see it here.";
    if (tab === "completed") return "Keep going — completion badges await!";
    return "Browse our catalog and enroll in something new.";
  }

  const showContinueBanner =
    continueCourse !== null && (tab === "all" || tab === "progress");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My courses</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Pick up where you left off.
          </p>
        </div>
        <Link href="/explore">
          <Button variant="outline">
            <Icon.Compass size={16} /> Explore catalog
          </Button>
        </Link>
      </div>

      {/* Stats bar */}
      {enrolledCourses.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardBody className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className={s.color}>{s.icon}</span>
                  <div>
                    <p className="text-lg font-bold leading-none">{s.value}</p>
                    <p className="text-[10px] text-[var(--muted)] mt-0.5">
                      {s.label}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Continue learning banner */}
      {showContinueBanner && continueCourse && (
        <Card className="bg-gradient-to-r from-[var(--primary-soft)] to-transparent border-[var(--primary)]/20">
          <div className="flex items-center gap-3 px-4 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={continueCourse.course.thumbnail}
              alt={continueCourse.course.title}
              className="h-12 w-20 rounded-lg object-cover shrink-0"
            />
            <span className="text-xs font-semibold text-[var(--primary)] shrink-0 hidden sm:inline">
              Continue learning
            </span>
            <span className="font-semibold text-sm truncate flex-1 min-w-0">
              {continueCourse.course.title}
            </span>
            <span className="text-xs text-[var(--muted)] shrink-0 hidden md:inline">
              {continueCourse.enrollment.progress}% · {continueCourse.course.instructor}
            </span>
            <div className="w-28 shrink-0 hidden lg:block">
              <Progress value={continueCourse.enrollment.progress} />
            </div>
            <Link href={`/my-courses/${continueCourse.course.id}`} className="shrink-0">
              <Button size="sm">
                Continue <Icon.ChevronRight size={14} />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Tabs + search + sort toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <Tabs
            value={tab}
            onChange={(v) => {
              setTab(v as typeof tab);
              setCatFilter("all");
            }}
            options={[
              { value: "all", label: "All", count: counts.all },
              { value: "progress", label: "In Progress", count: counts.progress },
              { value: "completed", label: "Completed", count: counts.completed },
            ]}
          />
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search your courses…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                icon={<Icon.Search size={16} />}
              />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  onClick={() => setSort(o.key)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-lg font-medium transition",
                    sort === o.key
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category filter pills */}
        {categories.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["all", ...categories] as string[]).map((c) => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-lg font-medium transition",
                  catFilter === c
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]",
                )}
              >
                {c === "all" ? "All categories" : c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Course grid or empty state */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={emptyIcon()}
          title={emptyTitle()}
          description={emptyDescription()}
          action={
            tab === "all" && q.trim() === "" ? (
              <Link href="/explore">
                <Button>
                  <Icon.Compass size={16} /> Explore courses
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(({ enrollment, course }) => (
            <CourseCard
              key={course.id}
              course={course}
              enrollment={enrollment}
              href={`/my-courses/${course.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
