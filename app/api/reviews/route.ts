import { prisma } from "@/lib/db";
import { errorResponse, requireUser, HttpError } from "@/lib/auth-server";
import { recomputeCourseRating, serializeReview } from "@/lib/reviews";

const REVIEW_USER_SELECT = { id: true, name: true, avatar: true } as const;

// GET /api/reviews
//   ?courseId=<id>  → reviews for one course (hidden ones only for the
//                     course's instructor / an admin)
//   (no params)     → instructor: reviews across the courses they teach
//                     admin:      every review
//                     student:    the student's own reviews
export async function GET(request: Request) {
  try {
    const me = await requireUser();
    const courseId = new URL(request.url).searchParams.get("courseId");

    if (courseId) {
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) throw new HttpError(404, "Course not found.");
      const canSeeHidden = me.role === "Admin" || course.instructor === me.name;

      const reviews = await prisma.review.findMany({
        where: { courseId, ...(canSeeHidden ? {} : { hidden: false }) },
        include: { user: { select: REVIEW_USER_SELECT } },
        orderBy: { createdAt: "desc" },
      });
      const mine = reviews.find((r) => r.user.id === me.id) ?? null;
      return Response.json({
        reviews: reviews.map((r) => serializeReview(r)),
        myReview: mine ? serializeReview(mine) : null,
        canReview: me.role === "Student",
      });
    }

    if (me.role === "Instructor") {
      const myCourses = await prisma.course.findMany({
        where: { instructor: me.name },
        select: { id: true },
      });
      const reviews = await prisma.review.findMany({
        where: { courseId: { in: myCourses.map((c) => c.id) } },
        include: {
          user: { select: REVIEW_USER_SELECT },
          course: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return Response.json({ reviews: reviews.map((r) => serializeReview(r)) });
    }

    const reviews = await prisma.review.findMany({
      where: me.role === "Admin" ? {} : { userId: me.id },
      include: {
        user: { select: REVIEW_USER_SELECT },
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ reviews: reviews.map((r) => serializeReview(r)) });
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/reviews — a student creates or updates their review for a course
// they are enrolled in (one review per student per course).
export async function POST(request: Request) {
  try {
    const me = await requireUser();
    const { courseId, rating, body } = (await request.json()) as {
      courseId?: string;
      rating?: number;
      body?: string;
    };

    if (!courseId) throw new HttpError(400, "Course id is required.");
    if (!Number.isInteger(rating) || (rating as number) < 1 || (rating as number) > 5) {
      throw new HttpError(400, "Rating must be a whole number from 1 to 5.");
    }
    if (!body?.trim()) throw new HttpError(400, "Please write a few words about the course.");

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new HttpError(404, "Course not found.");

    const enrolled = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: me.id, courseId } },
    });
    if (!enrolled) throw new HttpError(403, "Enroll in this course before reviewing it.");

    const review = await prisma.review.upsert({
      where: { userId_courseId: { userId: me.id, courseId } },
      create: { courseId, userId: me.id, rating: rating as number, body: body.trim() },
      // Editing a review clears the prior instructor reply so it isn't stale.
      update: { rating: rating as number, body: body.trim(), reply: null, repliedAt: null },
      include: { user: { select: REVIEW_USER_SELECT } },
    });
    await recomputeCourseRating(courseId);

    return Response.json({ review: serializeReview(review) });
  } catch (err) {
    return errorResponse(err);
  }
}
