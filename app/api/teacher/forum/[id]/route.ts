// Teacher-facing: moderate one forum thread in the teacher's course.

import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher, HttpError } from "@/lib/auth-server";

async function ownedPost(id: string, teacherName: string) {
  const post = await prisma.forumPost.findUnique({
    where: { id },
    include: { course: { select: { instructor: true } } },
  });
  if (!post) throw new HttpError(404, "Thread not found.");
  if (post.course?.instructor !== teacherName)
    throw new HttpError(403, "You can only moderate threads in your own courses.");
  return post;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireTeacher();
    const { id } = await params;
    await ownedPost(id, me.name);
    const body = (await request.json()) as { pinned?: boolean; category?: string };

    const VALID_CATEGORIES = ["general", "question", "announcement", "discussion"];
    const data: Record<string, unknown> = {};
    if (typeof body.pinned === "boolean") data.pinned = body.pinned;
    if (body.category && VALID_CATEGORIES.includes(body.category)) data.category = body.category;
    if (Object.keys(data).length === 0) throw new HttpError(400, "No valid fields to update.");

    await prisma.forumPost.update({ where: { id }, data });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireTeacher();
    const { id } = await params;
    await ownedPost(id, me.name);
    await prisma.forumPost.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
