import { prisma } from "@/lib/db";
import { errorResponse, getCurrentUser, requireUser, HttpError } from "@/lib/auth-server";
import { uid } from "@/lib/utils";
import { sendEmailAsync, paymentReceiptEmail } from "@/lib/email";
import type {
  BillingInterval,
  Subscription,
  SubscriptionPlan,
} from "@/lib/generated/prisma/client";

const INTERVALS: BillingInterval[] = ["monthly", "annual"];

function serializePlan(p: SubscriptionPlan) {
  return {
    id: p.id,
    key: p.key,
    name: p.name,
    tagline: p.tagline,
    monthlyPrice: p.monthlyPrice,
    annualPrice: p.annualPrice,
    features: p.features,
    highlight: p.highlight,
    order: p.order,
  };
}

function serializeSubscription(sub: Subscription & { plan: SubscriptionPlan }) {
  return {
    id: sub.id,
    planKey: sub.plan.key,
    planName: sub.plan.name,
    interval: sub.interval,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    createdAt: sub.createdAt.toISOString(),
    plan: serializePlan(sub.plan),
  };
}

function periodEnd(interval: BillingInterval): Date {
  const d = new Date();
  if (interval === "annual") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

// Public: every plan, plus the signed-in user's current subscription (if any).
export async function GET() {
  try {
    const me = await getCurrentUser();
    const plans = await prisma.subscriptionPlan.findMany({ orderBy: { order: "asc" } });

    let subscription = null;
    if (me) {
      const sub = await prisma.subscription.findUnique({
        where: { userId: me.id },
        include: { plan: true },
      });
      if (sub) subscription = serializeSubscription(sub);
    }

    return Response.json({ plans: plans.map(serializePlan), subscription });
  } catch (err) {
    return errorResponse(err);
  }
}

// Subscribe to — or switch to — a plan. Paid plans record a Payment and
// (re)activate the subscription immediately; the Free plan clears it.
export async function POST(request: Request) {
  try {
    const me = await requireUser();
    const { planKey, interval } = (await request.json()) as {
      planKey?: string;
      interval?: BillingInterval;
    };
    if (!planKey) throw new HttpError(400, "planKey is required.");
    const billingInterval: BillingInterval =
      interval && INTERVALS.includes(interval) ? interval : "monthly";

    const plan = await prisma.subscriptionPlan.findUnique({ where: { key: planKey } });
    if (!plan) throw new HttpError(404, "Plan not found.");

    // Free plan: drop any paid subscription and revert to the implicit free tier.
    if (plan.monthlyPrice === 0 && plan.annualPrice === 0) {
      await prisma.subscription.deleteMany({ where: { userId: me.id } });
      return Response.json({ subscription: null });
    }

    const amount = billingInterval === "annual" ? plan.annualPrice : plan.monthlyPrice;
    const description = `${plan.name} plan — ${billingInterval}`;

    // Record the charge. Mirrors the simulated path in /api/payments so the
    // billing history stays consistent without requiring a Stripe key.
    await prisma.payment.create({
      data: {
        userId: me.id,
        amount,
        currency: "USD",
        method: "card",
        status: "completed",
        txnId: `txn_sub_${uid()}`,
        description,
      },
    });

    const sub = await prisma.subscription.upsert({
      where: { userId: me.id },
      update: {
        planId: plan.id,
        interval: billingInterval,
        status: "active",
        currentPeriodEnd: periodEnd(billingInterval),
        cancelAtPeriodEnd: false,
      },
      create: {
        userId: me.id,
        planId: plan.id,
        interval: billingInterval,
        status: "active",
        currentPeriodEnd: periodEnd(billingInterval),
      },
      include: { plan: true },
    });

    sendEmailAsync({
      to: me.email,
      ...paymentReceiptEmail({ name: me.name, description, amount, currency: "USD" }),
    });

    return Response.json({ subscription: serializeSubscription(sub) });
  } catch (err) {
    return errorResponse(err);
  }
}

// Cancel (keep access until period end) or resume an existing subscription.
export async function PATCH(request: Request) {
  try {
    const me = await requireUser();
    const { cancelAtPeriodEnd } = (await request.json()) as { cancelAtPeriodEnd?: boolean };
    if (typeof cancelAtPeriodEnd !== "boolean")
      throw new HttpError(400, "cancelAtPeriodEnd must be a boolean.");

    const existing = await prisma.subscription.findUnique({ where: { userId: me.id } });
    if (!existing) throw new HttpError(400, "You don't have an active subscription.");

    const sub = await prisma.subscription.update({
      where: { userId: me.id },
      data: { cancelAtPeriodEnd },
      include: { plan: true },
    });

    return Response.json({ subscription: serializeSubscription(sub) });
  } catch (err) {
    return errorResponse(err);
  }
}
