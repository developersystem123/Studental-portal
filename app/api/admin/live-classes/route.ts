// Admin-facing: list every live class and schedule new ones.

import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth-server";
import {
  toClientLiveClass,
  validateLiveClassInput,
  type LiveClassInput,
} from "@/lib/liveClasses";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await prisma.liveClass.findMany({
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
    await requireAdmin();
    const body = (await request.json()) as LiveClassInput;
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
