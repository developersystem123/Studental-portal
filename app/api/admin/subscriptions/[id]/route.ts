import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin, HttpError } from "@/lib/auth-server";
import type { SubscriptionStatus } from "@/lib/generated/prisma/client";

const VALID_STATUSES: SubscriptionStatus[] = ["active", "canceled", "expired"];

// PATCH /api/admin/subscriptions/[id] — cancel or reactivate a subscription
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = (await request.json()) as { status?: SubscriptionStatus; cancelAtPeriodEnd?: boolean };

    const existing = await prisma.subscription.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Subscription not found.");

    const data: Partial<{ status: SubscriptionStatus; cancelAtPeriodEnd: boolean }> = {};

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) throw new HttpError(400, "Invalid status.");
      data.status = body.status;
    }
    if (typeof body.cancelAtPeriodEnd === "boolean") {
      data.cancelAtPeriodEnd = body.cancelAtPeriodEnd;
    }
    if (Object.keys(data).length === 0) throw new HttpError(400, "Nothing to update.");

    const updated = await prisma.subscription.update({ where: { id }, data });
    return Response.json({ ok: true, status: updated.status, cancelAtPeriodEnd: updated.cancelAtPeriodEnd });
  } catch (err) {
    return errorResponse(err);
  }
}
