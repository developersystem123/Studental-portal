// Teacher-facing: one batch's detail — roster with attendance summaries plus
// the list of session dates already recorded.

import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher, HttpError } from "@/lib/auth-server";
import { buildRoster, toClientPhysicalClass } from "@/lib/physical";

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
    const me = await requireTeacher();
    const { id } = await params;

    const pc = await prisma.physicalClass.findUnique({
      where: { id },
      include: classInclude,
    });
    if (!pc) throw new HttpError(404, "Physical class not found.");
    if (pc.instructorId !== me.id)
      throw new HttpError(403, "You can only view batches you teach.");

    const enrollments = await prisma.physicalClassEnrollment.findMany({
      where: { physicalClassId: id },
      orderBy: { enrolledAt: "asc" },
      include: { student: { select: { name: true, email: true } } },
    });
    const attendance = await prisma.physicalAttendance.findMany({
      where: { physicalClassId: id },
    });

    const sessions = [...new Set(attendance.map((a) => a.date.toISOString()))].sort();

    return Response.json({
      class: toClientPhysicalClass(pc),
      roster: buildRoster(enrollments, attendance),
      sessions,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
