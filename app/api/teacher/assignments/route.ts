// Teacher-facing: assignments across the teacher's courses, with submissions.

import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher, HttpError } from "@/lib/auth-server";
import type { AssignmentStatus } from "@/lib/generated/prisma/client";

const STATUSES: AssignmentStatus[] = ["draft", "open", "closed"];

export async function GET() {
  try {
    const me = await requireTeacher();
    const courses = await prisma.course.findMany({
      where: { instructor: me.name },
      select: { id: true, title: true },
    });
    const titleById = new Map(courses.map((c) => [c.id, c.title]));

    const rows = await prisma.assignment.findMany({
      where: { courseId: { in: courses.map((c) => c.id) } },
      orderBy: { createdAt: "desc" },
      include: {
        submissions: {
          include: { user: { select: { name: true } } },
          orderBy: { submittedAt: "asc" },
        },
      },
    });

    return Response.json({
      assignments: rows.map((a) => ({
        id: a.id,
        courseId: a.courseId,
        courseTitle: titleById.get(a.courseId) ?? "—",
        title: a.title,
        description: a.description,
        points: a.points,
        dueDate: a.dueDate.toISOString(),
        status: a.status,
        createdAt: a.createdAt.toISOString(),
        submissions: a.submissions.map((s) => ({
          studentId: s.userId,
          studentName: s.user.name,
          submittedAt: s.submittedAt.toISOString(),
          content: s.content,
          grade: s.grade,
          feedback: s.feedback ?? "",
        })),
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const me = await requireTeacher();
    const body = (await request.json()) as {
      courseId?: string;
      title?: string;
      description?: string;
      points?: number;
      dueDate?: string;
      status?: AssignmentStatus;
    };

    const course = await prisma.course.findUnique({ where: { id: body.courseId } });
    if (!course || course.instructor !== me.name)
      throw new HttpError(400, "Select one of your own courses.");

    const title = (body.title ?? "").trim();
    if (title.length < 3) throw new HttpError(400, "Title must be at least 3 characters.");
    const description = (body.description ?? "").trim();
    if (description.length < 5) throw new HttpError(400, "Add a short description.");
    const points = Number(body.points);
    if (!Number.isFinite(points) || points < 1)
      throw new HttpError(400, "Points must be a positive number.");
    const dueDate = new Date(body.dueDate ?? "");
    if (Number.isNaN(dueDate.getTime())) throw new HttpError(400, "Enter a valid due date.");
    const status: AssignmentStatus = STATUSES.includes(body.status as AssignmentStatus)
      ? (body.status as AssignmentStatus)
      : "draft";

    const created = await prisma.assignment.create({
      data: { courseId: course.id, title, description, points: Math.round(points), dueDate, status },
    });
    return Response.json({ id: created.id });
  } catch (err) {
    return errorResponse(err);
  }
}
