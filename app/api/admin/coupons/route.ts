// Admin-facing: list and create discount coupons.

import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin, HttpError } from "@/lib/auth-server";
import type { Coupon, CouponType } from "@/lib/generated/prisma/client";

const TYPES: CouponType[] = ["percent", "fixed"];

function toClientCoupon(c: Coupon) {
  return {
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value,
    maxUses: c.maxUses ?? undefined,
    usedCount: c.usedCount,
    active: c.active,
    expiresAt: c.expiresAt?.toISOString() ?? undefined,
    createdAt: c.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    await requireAdmin();
    const rows = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json({ coupons: rows.map(toClientCoupon) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as {
      code?: string;
      type?: CouponType;
      value?: number;
      maxUses?: number | null;
      expiresAt?: string | null;
    };

    const code = (body.code ?? "").trim().toUpperCase();
    if (!/^[A-Z0-9]{3,20}$/.test(code))
      throw new HttpError(400, "Code must be 3–20 letters/numbers.");
    const type: CouponType = TYPES.includes(body.type as CouponType)
      ? (body.type as CouponType)
      : "percent";
    const value = Math.round(Number(body.value));
    if (!Number.isFinite(value) || value < 1)
      throw new HttpError(400, "Discount value must be a positive number.");
    if (type === "percent" && value > 100)
      throw new HttpError(400, "A percentage discount can't exceed 100%.");

    const dup = await prisma.coupon.findUnique({ where: { code } });
    if (dup) throw new HttpError(409, "A coupon with that code already exists.");

    const created = await prisma.coupon.create({
      data: {
        code,
        type,
        value,
        maxUses:
          body.maxUses === null || body.maxUses === undefined ? null : Math.round(body.maxUses),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });
    return Response.json({ coupon: toClientCoupon(created) });
  } catch (err) {
    return errorResponse(err);
  }
}
