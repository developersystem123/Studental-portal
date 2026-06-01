// Admin-facing: toggle/edit or delete one coupon.

import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin, HttpError } from "@/lib/auth-server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Coupon not found.");

    const body = (await request.json()) as {
      active?: boolean;
      maxUses?: number | null;
      expiresAt?: string | null;
    };
    const data: Record<string, unknown> = {};
    if (body.active !== undefined) data.active = Boolean(body.active);
    if (body.maxUses !== undefined)
      data.maxUses = body.maxUses === null ? null : Math.round(Number(body.maxUses));
    if (body.expiresAt !== undefined)
      data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    await prisma.coupon.update({ where: { id }, data });
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
    await requireAdmin();
    const { id } = await params;
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Coupon not found.");
    await prisma.coupon.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
