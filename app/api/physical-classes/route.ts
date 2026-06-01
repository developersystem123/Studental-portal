// Student-facing: the in-person class batches the signed-in student is
// enrolled in, each with their own attendance summary.

import { prisma } from "@/lib/db";
import { errorResponse, requireUser } from "@/lib/auth-server";
import {
  attendanceSummary,
  toAttendanceRecord,
  toClientPhysicalClass,
} from "@/lib/physical";
import type { MyPhysicalClass } from "@/lib/mockData";

const classInclude = {
  course: { select: { title: true, thumbnail: true, category: true, level: true } },
  instructor: { select: { name: true } },
  _count: { select: { enrollments: true } },
} as const;

export async function GET() {
  try {
    const me = await requireUser();
    const enrollments = await prisma.physicalClassEnrollment.findMany({
      where: { studentId: me.id },
      orderBy: { enrolledAt: "desc" },
      include: { physicalClass: { include: classInclude } },
    });

    const classes: MyPhysicalClass[] = [];
    for (const e of enrollments) {
      const att = await prisma.physicalAttendance.findMany({
        where: { physicalClassId: e.physicalClassId, studentId: me.id },
        orderBy: { date: "asc" },
      });
      classes.push({
        enrollmentId: e.id,
        enrollmentStatus: e.status,
        enrolledAt: e.enrolledAt.toISOString(),
        classmateCount: e.physicalClass._count.enrollments,
        attendance: att.map(toAttendanceRecord),
        ...attendanceSummary(att),
        class: toClientPhysicalClass(e.physicalClass),
      });
    }
    return Response.json({ classes });
  } catch (err) {
    return errorResponse(err);
  }
}
