// Helpers for the course-review feature. The Course model keeps a denormalized
// `rating` (average) and `reviews` (count) so course cards stay fast to render;
// this recomputes both from the Review table after any review mutation.

import { prisma } from "./db";

/**
 * Recompute and persist a course's cached `rating` + `reviews` count from the
 * Review table. Only non-hidden reviews count toward the public score.
 */
export async function recomputeCourseRating(courseId: string): Promise<void> {
  const agg = await prisma.review.aggregate({
    where: { courseId, hidden: false },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const count = agg._count._all;
  const avg = agg._avg.rating ?? 0;
  await prisma.course.update({
    where: { id: courseId },
    data: {
      rating: Math.round(avg * 10) / 10, // one decimal place
      reviews: count,
    },
  });
}

type ReviewWithRelations = {
  id: string;
  courseId: string;
  rating: number;
  body: string;
  reply: string | null;
  repliedAt: Date | null;
  hidden: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string; avatar: string | null };
  course?: { id: string; title: string } | null;
};

/** Shape a Review row (with its user/course relations) for the client. */
export function serializeReview(r: ReviewWithRelations) {
  return {
    id: r.id,
    courseId: r.courseId,
    rating: r.rating,
    body: r.body,
    reply: r.reply,
    repliedAt: r.repliedAt ? r.repliedAt.toISOString() : null,
    hidden: r.hidden,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    author: { id: r.user.id, name: r.user.name, avatar: r.user.avatar },
    course: r.course ? { id: r.course.id, title: r.course.title } : null,
  };
}

export type ClientReview = ReturnType<typeof serializeReview>;
