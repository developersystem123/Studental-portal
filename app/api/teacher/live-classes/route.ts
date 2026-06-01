// Teacher-facing: live classes for the teacher's own courses.

import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher, HttpError } from "@/lib/auth-server";
import {
  toClientLiveClass,
  validateLiveClassInput,
  type LiveClassInput,
} from "@/lib/liveClasses";

async function assertOwnsCourse(courseId: string | undefined, teacherName: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new HttpError(400, "Select a valid course.");
  if (course.instructor !== teacherName)
    throw new HttpError(403, "You can only manage live classes for your own courses.");
}

export async function GET() {
  try {
    const me = await requireTeacher();
    const courses = await prisma.course.findMany({
      where: { instructor: me.name },
      select: { id: true },
    });
    const rows = await prisma.liveClass.findMany({
      where: { courseId: { in: courses.map((c) => c.id) } },
      include: { course: { select: { title: true } } },
      orderBy: { scheduledAt: "desc" },
    });
    return Response.json({ classes: rows.map(toClientLiveClass) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const me = await requireTeacher();
    const body = (await request.json()) as LiveClassInput;
    await assertOwnsCourse(body.courseId, me.name);
    const data = await validateLiveClassInput(body, false);
    const created = await prisma.liveClass.create({
      data: data as Parameters<typeof prisma.liveClass.create>[0]["data"],
      include: { course: { select: { title: true } } },
    });
    return Response.json({ class: toClientLiveClass(created) });
  } catch (err) {
    return errorResponse(err);
  }
}
