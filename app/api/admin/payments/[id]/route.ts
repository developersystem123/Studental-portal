import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth-server";
import type { PaymentStatus } from "@/lib/generated/prisma/client";

const VALID_STATUSES: PaymentStatus[] = ["pending", "completed", "failed", "refunded"];

// PATCH /api/admin/payments/[id] — change a payment's status
// (e.g. issue a refund, settle a pending charge, or flag a failure).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { status } = (await request.json()) as { status?: PaymentStatus };

    if (!status || !VALID_STATUSES.includes(status)) {
      return Response.json({ error: "Invalid payment status." }, { status: 400 });
    }

    const target = await prisma.payment.findUnique({ where: { id } });
    if (!target) {
      return Response.json({ error: "Payment not found." }, { status: 404 });
    }

    const updated = await prisma.payment.update({ where: { id }, data: { status } });
    return Response.json({
      ok: true,
      payment: {
        id: updated.id,
        amount: updated.amount,
        currency: updated.currency,
        status: updated.status,
        method: updated.method,
        txnId: updated.txnId,
        description: updated.description,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
