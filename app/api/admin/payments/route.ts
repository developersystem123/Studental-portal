import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth-server";

// GET /api/admin/payments — every payment on the platform, newest first,
// plus headline revenue figures computed from completed charges.
export async function GET() {
  try {
    await requireAdmin();
    const rows = await prisma.payment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const payments = rows.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      method: p.method,
      txnId: p.txnId,
      description: p.description,
      createdAt: p.createdAt.toISOString(),
      userId: p.user.id,
      userName: p.user.name,
      userEmail: p.user.email,
      courseId: p.courseId,
      courseTitle: p.course?.title ?? null,
    }));

    const completed = payments.filter((p) => p.status === "completed");
    const summary = {
      grossRevenue: completed.reduce((sum, p) => sum + p.amount, 0),
      refunded: payments
        .filter((p) => p.status === "refunded")
        .reduce((sum, p) => sum + p.amount, 0),
      pending: payments.filter((p) => p.status === "pending").length,
      failed: payments.filter((p) => p.status === "failed").length,
      transactions: completed.length,
      currency: payments[0]?.currency ?? "PKR",
    };

    return Response.json({ payments, summary });
  } catch (err) {
    return errorResponse(err);
  }
}
