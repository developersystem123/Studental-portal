// Teacher-facing: rename/reweight or delete one gradebook column.

import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher, HttpError } from "@/lib/auth-server";

async function ownedColumn(id: string, teacherName: string) {
  const col = await prisma.gradeColumn.findUnique({
    where: { id },
    include: { course: { select: { instructor: true } } },
  });
  if (!col) throw new HttpError(404, "Column not found.");
  if (col.course.instructor !== teacherName)
    throw new HttpError(403, "You can only manage your own gradebook.");
  return col;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireTeacher();
    const { id } = await params;
    await ownedColumn(id, me.name);

    const body = (await request.json()) as { label?: string; weight?: number };
    const data: Record<string, unknown> = {};
    if (body.label !== undefined) data.label = body.label.trim() || "Column";
    if (body.weight !== undefined)
      data.weight = Math.max(0, Math.min(100, Math.round(Number(body.weight) || 0)));

    await prisma.gradeColumn.update({ where: { id }, data });
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
    await ownedColumn(id, me.name);
    // Entries cascade-delete with the column.
    await prisma.gradeColumn.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
