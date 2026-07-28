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
      code?: string;
      type?: "percent" | "fixed";
      value?: number;
    };
    const data: Record<string, unknown> = {};
    if (body.active !== undefined) data.active = Boolean(body.active);
    if (body.maxUses !== undefined)
      data.maxUses = body.maxUses === null ? null : Math.round(Number(body.maxUses));
    if (body.expiresAt !== undefined)
      data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (body.code !== undefined) {
      const code = body.code.trim().toUpperCase();
      if (code.length < 3) throw new HttpError(400, "Code must be at least 3 characters.");
      data.code = code;
    }
    if (body.type !== undefined) data.type = body.type;
    if (body.value !== undefined) {
      const value = Math.round(Number(body.value));
      if (!Number.isFinite(value) || value <= 0) throw new HttpError(400, "Enter a valid discount value.");
      data.value = value;
    }

    try {
      await prisma.coupon.update({ where: { id }, data });
    } catch (e) {
      if (e instanceof Error && "code" in e && (e as { code?: string }).code === "P2002") {
        throw new HttpError(409, "That code is already in use.");
      }
      throw e;
    }
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
