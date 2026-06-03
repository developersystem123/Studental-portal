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

    // Atomically increment usedCount only if the limit has not been reached.
    // This prevents the TOCTOU race condition where two concurrent requests
    // both pass the check and both increment, exceeding maxUses.
    const updated = await prisma.coupon.updateMany({
      where: {
        id: coupon.id,
        ...(coupon.maxUses !== null ? { usedCount: { lt: coupon.maxUses } } : {}),
      },
      data: { usedCount: { increment: 1 } },
    });
    if (updated.count === 0) {
      throw new HttpError(409, "This coupon has reached its usage limit.");
    }
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
