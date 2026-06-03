"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
  StatCard,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { LineChart, Sparkline } from "@/components/charts";
import { cn, formatDate } from "@/lib/utils";
import Link from "next/link";

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  method: "card" | "bank" | "manual" | "scholarship";
  txnId: string | null;
  description: string;
  createdAt: string;
  courseTitle: string | null;
};

type Subscription = {
  id: string;
  planKey: string;
  planName: string;
  interval: "monthly" | "annual";
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: {
    monthlyPrice: number;
    annualPrice: number;
    features: string[];
  };
};

const STATUS_TONE: Record<Payment["status"], "success" | "warning" | "danger" | "default"> = {
  completed: "success",
  pending: "warning",
  failed: "danger",
  refunded: "default",
};

const METHOD_LABEL: Record<Payment["method"], string> = {
  card: "Card",
  bank: "Bank",
  manual: "Manual",
  scholarship: "Scholarship",
};

function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

export default function BillingPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  const load = useCallback(async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        fetch("/api/payments").then((r) => r.json()).catch(() => ({})),
        fetch("/api/subscription").then((r) => r.json()).catch(() => ({})),
      ]);
      setPayments(pRes.payments ?? []);
      setSubscription(sRes.subscription ?? null);
    } catch {
      push({ title: "Couldn't load billing data", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    load();
  }, [load]);

  // Handle Stripe redirect back. Uses a ref to prevent double-execution in strict mode.
  const stripeHandledRef = React.useRef(false);
  useEffect(() => {
    if (stripeHandledRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const canceled = params.get("canceled");
    if (sessionId || canceled) {
      stripeHandledRef.current = true;
    }
    if (sessionId) {
      (async () => {
        const r = await fetch(`/api/payments/verify?session_id=${encodeURIComponent(sessionId)}`);
        const data = await r.json().catch(() => ({}));
        if (r.ok && data.status === "completed") {
          push({ title: "Payment successful", description: "Thanks — your payment is confirmed.", tone: "success" });
        } else if (r.ok) {
          push({ title: "Payment pending", description: "We'll update billing once it clears.", tone: "info" });
        } else {
          push({ title: "Couldn't verify payment", description: data.error, tone: "danger" });
        }
        load();
        window.history.replaceState({}, "", "/billing");
      })();
    } else if (canceled) {
      push({ title: "Checkout canceled", tone: "info" });
      window.history.replaceState({}, "", "/billing");
    }
  }, [push, load]);

  // Derived stats.
  const completed = payments.filter((p) => p.status === "completed");
  const pending = payments.filter((p) => p.status === "pending");
  const totalSpent = completed.reduce((s, p) => s + p.amount, 0);

  const isActiveSub = subscription?.status === "active";
  const isCanceling = isActiveSub && subscription?.cancelAtPeriodEnd;

  // Last 6 months spend chart.
  const monthlySpend = (() => {
    const now = new Date();
    const months: { day: string; spend: number; iso: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        day: d.toLocaleString("en-US", { month: "short" }),
        spend: 0,
        iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      });
    }
    for (const p of completed) {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = months.find((m) => m.iso === key);
      if (bucket) bucket.spend += p.amount / 100;
    }
    return months;
  })();
  const sparklineData = monthlySpend.map((m) => m.spend);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Billing</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Manage payments, invoices, and your plan.
        </p>
      </div>

      {/* Stats row */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total spent"
            value={formatMoney(totalSpent)}
            icon={<Icon.CreditCard size={20} />}
            tone="primary"
          />
          <StatCard
            label="Transactions"
            value={payments.length}
            icon={<Icon.Inbox size={20} />}
            tone="accent"
          />
          <StatCard
            label="Pending"
            value={pending.length}
            icon={<Icon.Clock size={20} />}
            tone="warning"
          />
        </div>
      )}

      {/* Subscription / plan card */}
      {loading ? (
        <Skeleton className="h-36" />
      ) : isActiveSub ? (
        <Card className="overflow-hidden">
          <CardBody className="p-0">
            <div className="p-5 sm:p-6 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white">
              <div className="flex items-start gap-3 flex-wrap">
                <Icon.Crown size={28} />
                <div className="flex-1 min-w-[14rem]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-lg font-bold">{subscription.planName} Plan Active</p>
                    <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {subscription.planKey.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-white/85 mt-1">
                    {isCanceling
                      ? `Cancels on ${formatDate(subscription.currentPeriodEnd)} — you'll keep access until then.`
                      : `Renews ${subscription.interval === "annual" ? "annually" : "monthly"} on ${formatDate(subscription.currentPeriodEnd)}.`}
                  </p>
                  <p className="text-xs text-white/70 mt-0.5">
                    {formatMoney(
                      subscription.interval === "annual"
                        ? subscription.plan.annualPrice
                        : subscription.plan.monthlyPrice,
                    )}{" "}
                    / {subscription.interval === "annual" ? "year" : "month"}
                  </p>
                </div>
                <Link href="/subscription">
                  <Button variant="secondary" size="sm">
                    Manage plan
                  </Button>
                </Link>
              </div>
            </div>
            {isCanceling && (
              <div className="px-5 py-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200/50 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                <Icon.AlertCircle size={15} />
                Your subscription is set to cancel. After {formatDate(subscription.currentPeriodEnd)} you'll
                move to the Free plan.
              </div>
            )}
          </CardBody>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardBody className="p-0">
            <div className="p-5 sm:p-6 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white">
              <div className="flex items-start gap-3 flex-wrap">
                <Icon.Sparkles size={28} />
                <div className="flex-1 min-w-[14rem]">
                  <p className="text-lg font-bold">EduPortal Pro</p>
                  <p className="text-sm text-white/85 mt-1">
                    Unlimited AI queries, exclusive courses, priority support — $9.99/month.
                  </p>
                </div>
                <Link href="/subscription">
                  <Button variant="secondary">Upgrade</Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Spend over time */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Spend over time</CardTitle>
            <p className="text-xs text-[var(--muted)] mt-1">Last 6 months · completed transactions only</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--muted)]">
            <Sparkline data={sparklineData} width={120} height={28} />
            <span>{formatMoney(totalSpent)} total</span>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Skeleton className="h-56" />
          ) : (
            <div className="h-56">
              <LineChart data={monthlySpend.map((m) => ({ day: m.day, hours: m.spend }))} yFormatter={(v) => `$${v.toFixed(0)}`} />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Payment history */}
      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-5 space-y-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : payments.length === 0 ? (
            <EmptyState
              icon={<Icon.CreditCard size={28} />}
              title="No transactions yet"
              description="Your payments will appear here once you make a purchase."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-[var(--muted)] bg-[var(--surface-2)]">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Description</th>
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                    <th className="text-left px-4 py-3 font-medium">Method</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium leading-snug">{p.description}</p>
                        {p.courseTitle && (
                          <p className="text-xs text-[var(--muted)] mt-0.5">{p.courseTitle}</p>
                        )}
                        {p.txnId && (
                          <p className="text-[10px] text-[var(--muted-2)] font-mono mt-0.5 truncate max-w-[180px]">
                            {p.txnId}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)] whitespace-nowrap">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[var(--muted)]">{METHOD_LABEL[p.method]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_TONE[p.status]} className="capitalize">
                          {p.status}
                        </Badge>
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right font-semibold tabular-nums",
                          p.status === "refunded" && "line-through opacity-50",
                          p.status === "failed" && "text-[var(--danger)] opacity-70",
                        )}
                      >
                        {formatMoney(p.amount, p.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-[var(--border)] bg-[var(--surface-2)]">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-xs text-[var(--muted)]">
                      {completed.length} completed · {pending.length} pending
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-sm">
                      {formatMoney(totalSpent)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
