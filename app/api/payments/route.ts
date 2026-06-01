import { prisma } from "@/lib/db";
import { errorResponse, requireUser, HttpError } from "@/lib/auth-server";
import { uid } from "@/lib/utils";
import { hasStripeKey, createCheckoutSession } from "@/lib/stripe";
import { sendEmailAsync, paymentReceiptEmail } from "@/lib/email";
import type { Payment, PaymentMethod } from "@/lib/generated/prisma/client";

const VALID_METHODS: PaymentMethod[] = ["card", "bank", "manual", "scholarship"];

function serializePayment(p: Payment & { course?: { id: string; title: string } | null }) {
  return {
    id: p.id,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    method: p.method,
    txnId: p.txnId,
    description: p.description,
    createdAt: p.createdAt.toISOString(),
    courseId: p.courseId,
    courseTitle: p.course?.title ?? null,
  };
}

export async function GET() {
  try {
    const me = await requireUser();
    const payments = await prisma.payment.findMany({
      where: { userId: me.id },
      include: { course: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ payments: payments.map(serializePayment) });
  } catch (err) {
    return errorResponse(err);
  }
}

// Creates a payment. When STRIPE_SECRET_KEY is configured a real Stripe
// Checkout Session is created and its hosted URL is returned; otherwise the
// charge is simulated so the billing flow works without API keys.
export async function POST(request: Request) {
  try {
    const me = await requireUser();
    const { amount, courseId, description, method } = (await request.json()) as {
      amount?: number;
      courseId?: string;
      description?: string;
      method?: PaymentMethod;
    };
    if (!amount || amount <= 0) throw new HttpError(400, "Valid amount is required.");
    if (!description) throw new HttpError(400, "Description is required.");
    if (method && !VALID_METHODS.includes(method)) throw new HttpError(400, "Invalid method.");

    const payMethod: PaymentMethod = method ?? "card";

    // ---- Real Stripe Checkout ----
    if (hasStripeKey() && payMethod === "card") {
      const origin = new URL(request.url).origin;
      // Create the pending row first so the Stripe session can link back to it.
      const pending = await prisma.payment.create({
        data: {
          userId: me.id,
          courseId: courseId ?? null,
          amount,
          currency: "USD",
          method: "card",
          status: "pending",
          description,
        },
      });
      try {
        const session = await createCheckoutSession({
          amount,
          currency: "usd",
          productName: description,
          successUrl: `${origin}/billing?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}/billing?canceled=1`,
          customerEmail: me.email,
          metadata: { paymentId: pending.id, userId: me.id },
        });
        const updated = await prisma.payment.update({
          where: { id: pending.id },
          data: { txnId: session.id },
        });
        return Response.json({ payment: serializePayment(updated), checkoutUrl: session.url });
      } catch (stripeErr) {
        // Roll the pending row back if Stripe rejected the request.
        await prisma.payment.delete({ where: { id: pending.id } }).catch(() => {});
        throw new HttpError(502, `Stripe checkout failed: ${(stripeErr as Error).message}`);
      }
    }

    // ---- Simulated charge (no Stripe key) ----
    const payment = await prisma.payment.create({
      data: {
        userId: me.id,
        courseId: courseId ?? null,
        amount,
        currency: "USD",
        method: payMethod,
        status: payMethod === "card" ? "completed" : "pending",
        txnId: `txn_demo_${uid()}`,
        description,
      },
    });
    if (payment.status === "completed") {
      sendEmailAsync({
        to: me.email,
        ...paymentReceiptEmail({
          name: me.name,
          description: payment.description,
          amount: payment.amount,
          currency: payment.currency,
        }),
      });
    }
    return Response.json({ payment: serializePayment(payment), checkoutUrl: null });
  } catch (err) {
    return errorResponse(err);
  }
}
