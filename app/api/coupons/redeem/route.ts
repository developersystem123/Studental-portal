// Shared: redeem a coupon — re-checks validity and bumps its usage count.
// Called when a checkout that used a coupon is confirmed.

import { prisma } from "@/lib/db";
import { errorResponse, requireUser, HttpError } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    await requireUser();
    const { code } = (await request.json()) as { code?: string };
    const clean = (code ?? "").trim().toUpperCase();
    if (!clean) throw new HttpError(400, "A coupon code is required.");

    const coupon = await prisma.coupon.findUnique({ where: { code: clean } });
    if (!coupon || !coupon.active) throw new HttpError(400, "That coupon isn't valid.");
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now())
      throw new HttpError(400, "This coupon has expired.");
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
      throw new HttpError(409, "This coupon has reached its usage limit.");

    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
