// Teacher-facing: payout history and requesting a new withdrawal.
// Amounts are stored in cents; the API speaks dollars.

import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher, HttpError } from "@/lib/auth-server";

const METHODS = ["Bank", "PayPal", "Stripe"];

export async function GET() {
  try {
    const me = await requireTeacher();
    const rows = await prisma.payout.findMany({
      where: { teacherId: me.id },
      orderBy: { requestedAt: "desc" },
    });
    return Response.json({
      payouts: rows.map((p) => ({
        id: p.id,
        amount: p.amount / 100,
        method: p.method,
        status: p.status,
        requestedAt: p.requestedAt.toISOString(),
        paidAt: p.paidAt?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const me = await requireTeacher();
    const { amount, method } = (await request.json()) as {
      amount?: number;
      method?: string;
    };
    const dollars = Number(amount);
    if (!Number.isFinite(dollars) || dollars < 1)
      throw new HttpError(400, "Enter a payout amount of at least $1.");
    if (!method || !METHODS.includes(method))
      throw new HttpError(400, "Choose a valid payout method.");

    const created = await prisma.payout.create({
      data: {
        teacherId: me.id,
        amount: Math.round(dollars * 100),
        method,
        status: "pending",
      },
    });
    return Response.json({ id: created.id });
  } catch (err) {
    return errorResponse(err);
  }
}
