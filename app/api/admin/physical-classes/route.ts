// Admin-facing: list every in-person batch, and create new ones.

import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth-server";
import {
  toClientPhysicalClass,
  validatePhysicalClassInput,
  type PhysicalClassInput,
} from "@/lib/physical";

const classInclude = {
  course: { select: { title: true, thumbnail: true, category: true, level: true } },
  instructor: { select: { name: true } },
  _count: { select: { enrollments: true } },
} as const;

export async function GET() {
  try {
    await requireAdmin();
    const rows = await prisma.physicalClass.findMany({
      orderBy: { createdAt: "desc" },
      include: classInclude,
    });
    return Response.json({ classes: rows.map((r) => toClientPhysicalClass(r)) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as PhysicalClassInput;
    const data = await validatePhysicalClassInput(body, false);
    const created = await prisma.physicalClass.create({
      data: data as Parameters<typeof prisma.physicalClass.create>[0]["data"],
      include: classInclude,
    });
    return Response.json({ class: toClientPhysicalClass(created) });
  } catch (err) {
    return errorResponse(err);
  }
}
