// Admin-facing: one batch's detail (with roster), updates, and deletion.

import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin, HttpError } from "@/lib/auth-server";
import {
  buildRoster,
  toClientPhysicalClass,
  validatePhysicalClassInput,
  type PhysicalClassInput,
} from "@/lib/physical";

const classInclude = {
  course: { select: { title: true, thumbnail: true, category: true, level: true } },
  instructor: { select: { name: true } },
  _count: { select: { enrollments: true } },
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const pc = await prisma.physicalClass.findUnique({
      where: { id },
      include: classInclude,
    });
    if (!pc) throw new HttpError(404, "Physical class not found.");

    const enrollments = await prisma.physicalClassEnrollment.findMany({
      where: { physicalClassId: id },
      orderBy: { enrolledAt: "asc" },
      include: { student: { select: { name: true, email: true } } },
    });
    const attendance = await prisma.physicalAttendance.findMany({
      where: { physicalClassId: id },
    });

    return Response.json({
      class: toClientPhysicalClass(pc),
      roster: buildRoster(enrollments, attendance),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const existing = await prisma.physicalClass.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Physical class not found.");

    const body = (await request.json()) as PhysicalClassInput;
    const data = await validatePhysicalClassInput(body, true);

    // Don't allow shrinking capacity below the number already enrolled.
    if (data.capacity !== undefined) {
      const count = await prisma.physicalClassEnrollment.count({
        where: { physicalClassId: id },
      });
      if ((data.capacity as number) < count)
        throw new HttpError(400, `Capacity can't be below the ${count} students already enrolled.`);
    }

    const updated = await prisma.physicalClass.update({
      where: { id },
      data,
      include: classInclude,
    });
    return Response.json({ class: toClientPhysicalClass(updated) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const existing = await prisma.physicalClass.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Physical class not found.");
    // Enrollments + attendance cascade-delete with the batch.
    await prisma.physicalClass.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
