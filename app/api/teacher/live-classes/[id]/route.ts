// Teacher-facing: update or delete one of the teacher's live classes.

import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher, HttpError } from "@/lib/auth-server";
import {
  toClientLiveClass,
  validateLiveClassInput,
  type LiveClassInput,
} from "@/lib/liveClasses";

async function ownedLiveClass(id: string, teacherName: string) {
  const lc = await prisma.liveClass.findUnique({
    where: { id },
    include: { course: { select: { instructor: true } } },
  });
  if (!lc) throw new HttpError(404, "Live class not found.");
  if (lc.course.instructor !== teacherName)
    throw new HttpError(403, "You can only manage your own live classes.");
  return lc;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireTeacher();
    const { id } = await params;
    await ownedLiveClass(id, me.name);

    const body = (await request.json()) as LiveClassInput;
    // A teacher can't move a class to a course they don't own.
    if (body.courseId !== undefined) {
      const course = await prisma.course.findUnique({ where: { id: body.courseId } });
      if (!course || course.instructor !== me.name)
        throw new HttpError(403, "You can only use your own courses.");
    }
    const data = await validateLiveClassInput(body, true);
    const updated = await prisma.liveClass.update({
      where: { id },
      data,
      include: { course: { select: { title: true } } },
    });
    return Response.json({ class: toClientLiveClass(updated) });
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
    await ownedLiveClass(id, me.name);
    await prisma.liveClass.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
