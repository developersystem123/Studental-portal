// Admin-facing: update or delete one live class.

import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin, HttpError } from "@/lib/auth-server";
import {
  toClientLiveClass,
  validateLiveClassInput,
  type LiveClassInput,
} from "@/lib/liveClasses";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const existing = await prisma.liveClass.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Live class not found.");

    const body = (await request.json()) as LiveClassInput;
    const data = await validateLiveClassInput(body, true);
    const updated = await prisma.liveClass.update({
      where: { id },
      data,
      include: { course: { select: { title: true } } },
    });
    return Response.json({ class: toClientLiveClass(updated) });
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
    const existing = await prisma.liveClass.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Live class not found.");
    await prisma.liveClass.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
