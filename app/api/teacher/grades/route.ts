// Teacher-facing: the weighted gradebook — columns + per-student entries.

import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher, HttpError } from "@/lib/auth-server";

async function teacherCourseIds(teacherName: string) {
  const courses = await prisma.course.findMany({
    where: { instructor: teacherName },
    select: { id: true },
  });
  return courses.map((c) => c.id);
}

export async function GET() {
  try {
    const me = await requireTeacher();
    const ids = await teacherCourseIds(me.name);

    const columns = await prisma.gradeColumn.findMany({
      where: { courseId: { in: ids } },
      orderBy: { order: "asc" },
    });
    const entries = await prisma.gradeEntry.findMany({
      where: { column: { courseId: { in: ids } } },
    });

    return Response.json({
      columns: columns.map((c) => ({
        id: c.id,
        courseId: c.courseId,
        label: c.label,
        weight: c.weight,
        order: c.order,
      })),
      entries: entries.map((e) => ({
        columnId: e.columnId,
        studentId: e.studentId,
        score: e.score,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

// Create a grade column.
export async function POST(request: Request) {
  try {
    const me = await requireTeacher();
    const body = (await request.json()) as {
      courseId?: string;
      label?: string;
      weight?: number;
    };
    const course = await prisma.course.findUnique({ where: { id: body.courseId } });
    if (!course || course.instructor !== me.name)
      throw new HttpError(400, "Select one of your own courses.");
    const label = (body.label ?? "").trim() || "New column";
    const weight = Math.max(0, Math.min(100, Math.round(Number(body.weight) || 0)));
    const count = await prisma.gradeColumn.count({ where: { courseId: course.id } });

    const created = await prisma.gradeColumn.create({
      data: { courseId: course.id, label, weight, order: count },
    });
    return Response.json({ id: created.id });
  } catch (err) {
    return errorResponse(err);
  }
}

// Set (or clear) one student's score in a column.
export async function PUT(request: Request) {
  try {
    const me = await requireTeacher();
    const { columnId, studentId, score } = (await request.json()) as {
      columnId?: string;
      studentId?: string;
      score?: number | null;
    };
    if (!columnId || !studentId)
      throw new HttpError(400, "columnId and studentId are required.");

    const column = await prisma.gradeColumn.findUnique({
      where: { id: columnId },
      include: { course: { select: { instructor: true } } },
    });
    if (!column) throw new HttpError(404, "Column not found.");
    if (column.course.instructor !== me.name)
      throw new HttpError(403, "You can only grade your own courses.");

    if (score === null || score === undefined || Number.isNaN(Number(score))) {
      await prisma.gradeEntry.deleteMany({ where: { columnId, studentId } });
      return Response.json({ ok: true });
    }
    const value = Math.max(0, Math.min(100, Math.round(Number(score))));
    await prisma.gradeEntry.upsert({
      where: { columnId_studentId: { columnId, studentId } },
      create: { columnId, studentId, score: value },
      update: { score: value },
    });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
