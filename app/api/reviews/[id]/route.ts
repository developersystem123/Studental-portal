import { prisma } from "@/lib/db";
import { errorResponse, requireUser, HttpError } from "@/lib/auth-server";
import { recomputeCourseRating, serializeReview } from "@/lib/reviews";

const REVIEW_USER_SELECT = { id: true, name: true, avatar: true } as const;

// PATCH /api/reviews/[id]
//   { reply }          → instructor of the course / admin posts a response
//   { hidden }         → instructor of the course / admin moderates visibility
//   { rating, body }   → the review's own author edits it
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    const { id } = await params;
    const body = (await request.json()) as {
      reply?: string;
      hidden?: boolean;
      rating?: number;
      body?: string;
    };

    const review = await prisma.review.findUnique({
      where: { id },
      include: { course: { select: { id: true, instructor: true } } },
    });
    if (!review) throw new HttpError(404, "Review not found.");

    const isAuthor = review.userId === me.id;
    const isStaff = me.role === "Admin" || review.course.instructor === me.name;

    const data: Record<string, unknown> = {};
    let ratingChanged = false;

    if (body.reply !== undefined || body.hidden !== undefined) {
      if (!isStaff) throw new HttpError(403, "Only the course instructor can moderate reviews.");
      if (body.reply !== undefined) {
        const text = body.reply.trim();
        data.reply = text || null;
        data.repliedAt = text ? new Date() : null;
      }
      if (body.hidden !== undefined) {
        data.hidden = Boolean(body.hidden);
        ratingChanged = true; // hiding changes which reviews count
      }
    }

    if (body.rating !== undefined || body.body !== undefined) {
      if (!isAuthor) throw new HttpError(403, "You can only edit your own review.");
      if (body.rating !== undefined) {
        if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
          throw new HttpError(400, "Rating must be a whole number from 1 to 5.");
        }
        data.rating = body.rating;
        ratingChanged = true;
      }
      if (body.body !== undefined) {
        if (!body.body.trim()) throw new HttpError(400, "Review text can't be empty.");
        data.body = body.body.trim();
      }
    }

    if (Object.keys(data).length === 0) throw new HttpError(400, "Nothing to update.");

    const updated = await prisma.review.update({
      where: { id },
      data,
      include: { user: { select: REVIEW_USER_SELECT }, course: { select: { id: true, title: true } } },
    });
    if (ratingChanged) await recomputeCourseRating(review.courseId);

    return Response.json({ review: serializeReview(updated) });
  } catch (err) {
    return errorResponse(err);
  }
}

// DELETE /api/reviews/[id] — the author, the course instructor, or an admin
// may remove a review.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    const { id } = await params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: { course: { select: { instructor: true } } },
    });
    if (!review) throw new HttpError(404, "Review not found.");

    const allowed =
      review.userId === me.id ||
      me.role === "Admin" ||
      review.course.instructor === me.name;
    if (!allowed) throw new HttpError(403, "You can't delete this review.");

    await prisma.review.delete({ where: { id } });
    await recomputeCourseRating(review.courseId);

    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
