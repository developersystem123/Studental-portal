// Teacher-facing: the in-person class batches this instructor runs.

import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher } from "@/lib/auth-server";
import { toClientPhysicalClass } from "@/lib/physical";

const classInclude = {
  course: { select: { title: true, thumbnail: true, category: true, level: true } },
  instructor: { select: { name: true } },
  _count: { select: { enrollments: true } },
} as const;

export async function GET() {
  try {
    const me = await requireTeacher();
    const rows = await prisma.physicalClass.findMany({
      where: { instructorId: me.id },
      orderBy: { startDate: "desc" },
      include: classInclude,
    });
    return Response.json({ classes: rows.map((r) => toClientPhysicalClass(r)) });
  } catch (err) {
    return errorResponse(err);
  }
}
