import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth-server";

// GET /api/admin/subscriptions — all subscriptions with user + plan info
export async function GET() {
  try {
    await requireAdmin();
    const rows = await prisma.subscription.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        plan: true,
      },
      orderBy: { currentPeriodEnd: "asc" },
    });

    const subscriptions = rows.map((s) => ({
      id: s.id,
      userId: s.user.id,
      user: s.user.name,
      email: s.user.email,
      avatar: s.user.avatar,
      plan: s.plan.name,
      planKey: s.plan.key,
      interval: s.interval,
      status: s.status,
      cancelAtPeriodEnd: s.cancelAtPeriodEnd,
      amount: s.interval === "annual" ? s.plan.annualPrice : s.plan.monthlyPrice,
      renewsAt: s.currentPeriodEnd.toISOString(),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return Response.json({ subscriptions });
  } catch (err) {
    return errorResponse(err);
  }
}
