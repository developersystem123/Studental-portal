"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Input,
  Modal,
  Skeleton,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { cn, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/store";

type Plan = {
  id: string;
  key: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  highlight: boolean;
  order: number;
};

type Subscription = {
  id: string;
  planKey: string;
  planName: string;
  interval: "monthly" | "annual";
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

type AppliedCoupon = { code: string; type: "percent" | "fixed"; value: number; label: string };

function applyDiscount(cents: number, c: AppliedCoupon): number {
  if (c.type === "percent") return Math.max(0, Math.round(cents * (1 - c.value / 100)));
  return Math.max(0, cents - c.value);
}

export default function SubscriptionPage() {
  const { push } = useToast();
  const { refreshUser } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [annual, setAnnual] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);

  // Reset the coupon whenever the subscribe modal opens for a new plan.
  useEffect(() => {
    setCouponInput("");
    setCoupon(null);
    setCouponMsg(null);
  }, [pendingPlan]);

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setCouponBusy(true);
    setCouponMsg(null);
    try {
      const r = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await r.json();
      if (data.valid) {
        setCoupon(data.coupon);
        setCouponMsg(`✓ ${data.coupon.label} applied`);
      } else {
        setCoupon(null);
        setCouponMsg(data.error ?? "That coupon isn't valid.");
      }
    } finally {
      setCouponBusy(false);
    }
  }

  const load = useCallback(async () => {
    const r = await fetch("/api/subscription");
    const data = await r.json().catch(() => ({}));
    setPlans(data.plans ?? []);
    setSubscription(data.subscription ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const currentKey = subscription?.planKey ?? "free";

  async function confirmSubscribe() {
    if (!pendingPlan) return;
    setBusy(true);
    const r = await fetch("/api/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planKey: pendingPlan.key,
        interval: annual ? "annual" : "monthly",
      }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    setPendingPlan(null);
    if (!r.ok) {
      push({ title: "Couldn't update plan", description: data.error, tone: "danger" });
      return;
    }
    // Mark the coupon as used now that checkout succeeded.
    if (coupon) {
      await fetch("/api/coupons/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon.code }),
      }).catch(() => {});
    }
    push({
      title: `You're on ${pendingPlan.name}`,
      description: coupon
        ? `Your plan is active — coupon ${coupon.code} applied.`
        : "Your plan is now active.",
      tone: "success",
    });
    await refreshUser();
    load();
  }

  async function setCancel(cancel: boolean) {
    setBusy(true);
    const r = await fetch("/api/subscription", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cancelAtPeriodEnd: cancel }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) {
      push({ title: "Something went wrong", description: data.error, tone: "danger" });
      return;
    }
    push({
      title: cancel ? "Subscription will cancel" : "Subscription resumed",
      description: cancel
        ? "You'll keep access until the end of your billing period."
        : "Your plan will renew as usual.",
      tone: cancel ? "info" : "success",
    });
    await refreshUser();
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Subscription</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Manage your membership plan and billing cycle.
        </p>
      </div>

      {loading ? (
        <>
          <Skeleton className="h-32" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Current plan banner */}
          <Card className="overflow-hidden">
            <CardBody className="p-0">
              <div className="p-5 sm:p-6 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white">
                <div className="flex items-start gap-3 flex-wrap">
                  <Icon.Crown size={28} />
                  <div className="flex-1 min-w-[14rem]">
                    <p className="text-sm text-white/80">Current plan</p>
                    <p className="text-xl font-bold">
                      {subscription ? subscription.planName : "Free"}
                      {subscription && (
                        <span className="text-sm font-normal text-white/80">
                          {" "}· {subscription.interval}
                        </span>
                      )}
                    </p>
                    {subscription ? (
                      <p className="text-sm text-white/85 mt-1">
                        {subscription.cancelAtPeriodEnd
                          ? `Cancels on ${formatDate(subscription.currentPeriodEnd)}`
                          : `Renews on ${formatDate(subscription.currentPeriodEnd)}`}
                      </p>
                    ) : (
                      <p className="text-sm text-white/85 mt-1">
                        Upgrade any time to unlock the full platform.
                      </p>
                    )}
                  </div>
                  {subscription &&
                    (subscription.cancelAtPeriodEnd ? (
                      <Button variant="secondary" onClick={() => setCancel(false)} disabled={busy}>
                        Resume plan
                      </Button>
                    ) : (
                      <Button variant="secondary" onClick={() => setCancel(true)} disabled={busy}>
                        Cancel plan
                      </Button>
                    ))}
                </div>
              </div>
            </CardBody>
          </Card>

          {subscription?.cancelAtPeriodEnd && (
            <div className="flex items-center gap-2 text-sm rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-4 py-3">
              <Icon.AlertCircle size={16} />
              Your subscription is set to cancel. You&rsquo;ll move to the Free plan on{" "}
              {formatDate(subscription.currentPeriodEnd)}.
            </div>
          )}

          {/* Billing cycle toggle */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-2)]">
              <button
                onClick={() => setAnnual(false)}
                className={cn(
                  "px-4 h-9 rounded-lg text-sm font-medium transition",
                  !annual ? "bg-[var(--surface)] shadow-sm" : "text-[var(--muted)]",
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={cn(
                  "px-4 h-9 rounded-lg text-sm font-medium transition flex items-center gap-2",
                  annual ? "bg-[var(--surface)] shadow-sm" : "text-[var(--muted)]",
                )}
              >
                Annual <Badge variant="success">Save 20%</Badge>
              </button>
            </div>
          </div>

          {/* Plan grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => {
              const isCurrent = p.key === currentKey;
              const price = annual ? p.annualPrice : p.monthlyPrice;
              const perMonth = annual ? p.annualPrice / 12 : p.monthlyPrice;
              const isFree = p.monthlyPrice === 0 && p.annualPrice === 0;
              return (
                <Card
                  key={p.id}
                  className={cn(
                    "overflow-hidden flex flex-col",
                    p.highlight && "ring-2 ring-[var(--primary)]",
                  )}
                >
                  {p.highlight && (
                    <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white text-center py-1.5 text-xs font-semibold">
                      ⭐ MOST POPULAR
                    </div>
                  )}
                  <CardBody className="flex-1 flex flex-col p-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[var(--muted)]">{p.name}</p>
                      {isCurrent && <Badge variant="primary">Current</Badge>}
                    </div>
                    <p className="text-xs text-[var(--muted-2)] mt-1 mb-4">{p.tagline}</p>
                    <p className="text-4xl font-bold">
                      {money(perMonth)}
                      <span className="text-base text-[var(--muted)] font-normal">/mo</span>
                    </p>
                    {annual && !isFree && (
                      <p className="text-xs text-[var(--muted-2)] mt-1">
                        {money(price)} billed annually
                      </p>
                    )}
                    <ul className="mt-6 space-y-2.5 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Icon.CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6">
                      {isCurrent ? (
                        <Button variant="outline" className="w-full" disabled>
                          Current plan
                        </Button>
                      ) : isFree ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled={busy || !subscription}
                          onClick={() => setCancel(true)}
                        >
                          Downgrade to Free
                        </Button>
                      ) : (
                        <Button
                          variant={p.highlight ? "primary" : "outline"}
                          className="w-full"
                          disabled={busy}
                          onClick={() => setPendingPlan(p)}
                        >
                          {currentKey === "free" ? "Upgrade" : "Switch"} to {p.name}
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Confirm subscribe modal */}
      <Modal
        open={pendingPlan !== null}
        onClose={() => setPendingPlan(null)}
        title={`Subscribe to ${pendingPlan?.name ?? ""}`}
        size="sm"
      >
        {pendingPlan && (
          <div className="p-5 space-y-4">
            {(() => {
              const base = annual ? pendingPlan.annualPrice : pendingPlan.monthlyPrice;
              const final = coupon ? applyDiscount(base, coupon) : base;
              return (
                <div className="p-4 rounded-xl bg-gradient-to-br from-[var(--primary-soft)] to-transparent">
                  <p className="text-3xl font-bold gradient-text">
                    {money(final)}
                    <span className="text-sm text-[var(--muted)] font-normal">
                      {" "}/ {annual ? "year" : "month"}
                    </span>
                  </p>
                  {coupon && base !== final && (
                    <p className="text-xs mt-1">
                      <span className="line-through text-[var(--muted-2)]">{money(base)}</span>{" "}
                      <span className="text-emerald-500 font-medium">{coupon.label}</span>
                    </p>
                  )}
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Billed {annual ? "annually" : "monthly"} · cancel anytime
                  </p>
                </div>
              );
            })()}

            {/* Coupon code */}
            <div>
              <div className="flex gap-2">
                <Input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Have a coupon code?"
                />
                <Button variant="outline" onClick={applyCoupon} loading={couponBusy}>
                  Apply
                </Button>
              </div>
              {couponMsg && (
                <p
                  className={cn(
                    "mt-1.5 text-xs",
                    coupon ? "text-emerald-500" : "text-[var(--danger)]",
                  )}
                >
                  {couponMsg}
                </p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface-2)] text-xs text-[var(--muted)]">
              <p className="font-semibold text-[var(--foreground)] mb-1">Secure checkout</p>
              Payments are processed by Stripe. Without a Stripe key configured a demo charge is
              recorded so the flow stays functional.
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setPendingPlan(null)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={confirmSubscribe} loading={busy}>
                <Icon.CreditCard size={14} /> Confirm
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
