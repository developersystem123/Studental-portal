// Shared: validate a coupon code at checkout. Any signed-in user can call it.

import { prisma } from "@/lib/db";
import { errorResponse, requireUser } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    await requireUser();
    const { code } = (await request.json()) as { code?: string };
    const clean = (code ?? "").trim().toUpperCase();
    if (!clean) return Response.json({ valid: false, error: "Enter a coupon code." });

    const coupon = await prisma.coupon.findUnique({ where: { code: clean } });
    if (!coupon || !coupon.active)
      return Response.json({ valid: false, error: "That coupon code isn't valid." });
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now())
      return Response.json({ valid: false, error: "This coupon has expired." });
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
      return Response.json({ valid: false, error: "This coupon has reached its usage limit." });

    return Response.json({
      valid: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        label:
          coupon.type === "percent"
            ? `${coupon.value}% off`
            : `$${(coupon.value / 100).toFixed(2)} off`,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
