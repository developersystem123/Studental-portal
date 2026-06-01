"use client";

import { Badge, Progress } from "@/components/ui";
import { MediaCard } from "@/components/MediaCard";
import Icon from "@/components/icons";
import type { Course, Enrollment } from "@/lib/mockData";
import { formatHours } from "@/lib/utils";

export function CourseCard({
  course,
  enrollment,
  href,
}: {
  course: Course;
  enrollment?: Enrollment;
  href: string;
}) {
  return (
    <MediaCard
      href={href}
      image={course.thumbnail}
      imageAlt={course.title}
      fallbackIcon={<Icon.Book size={30} />}
      bodyClassName="space-y-3"
      overlay={
        <>
          <Badge
            variant="primary"
            className="absolute top-3 left-3 backdrop-blur bg-white/85 dark:bg-black/40"
          >
            {course.category}
          </Badge>
          {course.price === 0 && (
            <Badge variant="success" className="absolute top-3 right-3">
              Free
            </Badge>
          )}
        </>
      }
    >
      <div>
        <h3 className="font-semibold text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--primary)] transition">
          {course.title}
        </h3>
        <p className="text-xs text-[var(--muted)] mt-1">{course.instructor}</p>
      </div>
      <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
        <span className="flex items-center gap-1">
          <Icon.Star size={12} className="text-amber-500" />
          {course.rating}
        </span>
        <span className="flex items-center gap-1">
          <Icon.Clock size={12} /> {formatHours(course.durationMinutes)}
        </span>
        <span>{course.level}</span>
      </div>
      {enrollment ? (
        <div>
          <Progress value={enrollment.progress} />
          <p className="text-xs text-[var(--muted)] mt-1.5">{enrollment.progress}% complete</p>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-1">
          <span className="text-base font-bold">
            {course.price === 0 ? "Free" : `$${course.price}`}
          </span>
          <span className="text-xs text-[var(--muted)]">{course.reviews.toLocaleString()} reviews</span>
        </div>
      )}
    </MediaCard>
  );
}
