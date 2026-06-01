// Teacher-facing: update or delete one assignment.

import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher, HttpError } from "@/lib/auth-server";
import type { AssignmentStatus } from "@/lib/generated/prisma/client";

const STATUSES: AssignmentStatus[] = ["draft", "open", "closed"];

async function ownedAssignment(id: string, teacherName: string) {
  const a = await prisma.assignment.findUnique({
    where: { id },
    include: { course: { select: { instructor: true } } },
  });
  if (!a) throw new HttpError(404, "Assignment not found.");
  if (a.course.instructor !== teacherName)
    throw new HttpError(403, "You can only manage assignments in your own courses.");
  return a;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireTeacher();
    const { id } = await params;
    await ownedAssignment(id, me.name);

    const body = (await request.json()) as {
      title?: string;
      description?: string;
      points?: number;
      dueDate?: string;
      status?: AssignmentStatus;
    };
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) {
      if (body.title.trim().length < 3)
        throw new HttpError(400, "Title must be at least 3 characters.");
      data.title = body.title.trim();
    }
    if (body.description !== undefined) data.description = body.description.trim();
    if (body.points !== undefined) {
      const p = Number(body.points);
      if (!Number.isFinite(p) || p < 1) throw new HttpError(400, "Points must be positive.");
      data.points = Math.round(p);
    }
    if (body.dueDate !== undefined) {
      const d = new Date(body.dueDate);
      if (Number.isNaN(d.getTime())) throw new HttpError(400, "Enter a valid due date.");
      data.dueDate = d;
    }
    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) throw new HttpError(400, "Invalid status.");
      data.status = body.status;
    }

    await prisma.assignment.update({ where: { id }, data });
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
    await ownedAssignment(id, me.name);
    await prisma.assignment.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
