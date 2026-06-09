"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Select,
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
  method: "card" | "bank" | "manual" | "scholarship" | "jazzcash" | "easypaisa" | "bank_transfer";
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
  jazzcash: "JazzCash",
  easypaisa: "EasyPaisa",
  bank_transfer: "Bank Transfer",
};

const METHOD_ICON: Record<Payment["method"], React.ReactNode> = {
  card: <Icon.CreditCard size={13} />,
  bank: <Icon.Wallet size={13} />,
  manual: <Icon.FilePen size={13} />,
  scholarship: <Icon.Award size={13} />,
  jazzcash: <Icon.Wallet size={13} />,
  easypaisa: <Icon.Wallet size={13} />,
  bank_transfer: <Icon.DollarSign size={13} />,
};

function formatMoney(amount: number, currency = "PKR") {
  if (currency === "PKR" || currency === "pkr") {
    return `Rs ${Math.round(amount).toLocaleString("en-PK")}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function daysUntil(dateStr: string): number {
  const end = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
}

function downloadCSV(payments: Payment[]) {
  const headers = ["Date", "Description", "Course", "Method", "Status", "Amount", "Txn ID"];
  const rows = payments.map((p) => [
    formatDate(p.createdAt),
    `"${p.description.replace(/"/g, '""')}"`,
    p.courseTitle ? `"${p.courseTitle.replace(/"/g, '""')}"` : "",
    METHOD_LABEL[p.method],
    p.status,
    formatMoney(p.amount, p.currency),
    p.txnId ?? "",
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `billing-history-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadReceipt(p: Payment) {
  const lines = [
    "========================================",
    "           EDUPORTAL RECEIPT",
    "========================================",
    `Date:        ${formatDate(p.createdAt)}`,
    `Receipt #:   ${p.txnId ?? p.id}`,
    "----------------------------------------",
    `Description: ${p.description}`,
    p.courseTitle ? `Course:      ${p.courseTitle}` : null,
    `Method:      ${METHOD_LABEL[p.method]}`,
    `Status:      ${p.status.toUpperCase()}`,
    "----------------------------------------",
    `Amount:      ${formatMoney(p.amount, p.currency)}`,
    "========================================",
    "Thank you for using EduPortal!",
  ].filter(Boolean).join("\n");
  const blob = new Blob([lines], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt-${p.id.slice(0, 8)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BillingPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

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

  // Handle Stripe redirect back.
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

  // Derived stats
  const completed = payments.filter((p) => p.status === "completed");
  const pending = payments.filter((p) => p.status === "pending");
  const totalSpent = completed.reduce((s, p) => s + p.amount, 0);

  const isActiveSub = subscription?.status === "active";
  const isCanceling = isActiveSub && subscription?.cancelAtPeriodEnd;
  const daysLeft = subscription?.currentPeriodEnd ? daysUntil(subscription.currentPeriodEnd) : null;

  // Last 6 months spend chart
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
      if (bucket) bucket.spend += p.amount;
    }
    return months;
  })();
  const sparklineData = monthlySpend.map((m) => m.spend);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (methodFilter !== "all" && p.method !== methodFilter) return false;
      if (q && !p.description.toLowerCase().includes(q) && !(p.courseTitle?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [payments, search, statusFilter, methodFilter]);

  const hasFilters = search !== "" || statusFilter !== "all" || methodFilter !== "all";

  // Spending breakdown by category
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of completed) {
      const cat = p.courseTitle ? "Courses" : p.description.toLowerCase().includes("subscription") || p.description.toLowerCase().includes("plan") ? "Subscription" : "Other";
      map[cat] = (map[cat] ?? 0) + p.amount;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [completed]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Billing</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Manage payments, invoices, and your plan.
          </p>
        </div>
        {!loading && payments.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCSV(filteredPayments)}
            className="flex items-center gap-2"
          >
            <Icon.Download size={15} />
            Export CSV
          </Button>
        )}
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
                  {/* Renewal countdown */}
                  {daysLeft !== null && !isCanceling && (
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5 text-xs font-medium">
                      <Icon.Calendar size={12} />
                      {daysLeft === 0
                        ? "Renews today"
                        : daysLeft === 1
                        ? "Renews tomorrow"
                        : `${daysLeft} days until renewal`}
                    </div>
                  )}
                </div>
                <Link href="/subscription">
                  <Button variant="secondary" size="sm">
                    Manage plan
                  </Button>
                </Link>
              </div>
            </div>

            {/* Plan features */}
            {subscription.plan.features.length > 0 && (
              <div className="px-5 py-4 border-t border-[var(--border)]">
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
                  Included in your plan
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
                  {subscription.plan.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2 text-sm">
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                        <Icon.Check size={11} />
                      </span>
                      <span className="text-[var(--foreground)]">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

      {/* Spend over time + Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
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

        {/* Spending by category */}
        <Card>
          <CardHeader>
            <CardTitle>Spending breakdown</CardTitle>
            <p className="text-xs text-[var(--muted)] mt-1">By category · completed only</p>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : categoryBreakdown.length === 0 ? (
              <p className="text-sm text-[var(--muted)] text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-3 mt-1">
                {categoryBreakdown.map(([cat, amt]) => {
                  const pct = totalSpent > 0 ? Math.round((amt / totalSpent) * 100) : 0;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="font-medium">{cat}</span>
                        <span className="text-[var(--muted)] tabular-nums">{formatMoney(amt)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-[var(--muted)] mt-0.5 text-right">{pct}%</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Payment history */}
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle>Payment history</CardTitle>
            {hasFilters && (
              <button
                onClick={() => { setSearch(""); setStatusFilter("all"); setMethodFilter("all"); }}
                className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
              >
                <Icon.X size={12} />
                Clear filters
              </button>
            )}
          </div>

          {/* Filter bar */}
          {!loading && payments.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Icon.Search size={15} />}
                  className="h-9 text-sm"
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="sm:w-36"
              >
                <option value="all">All statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </Select>
              <Select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="sm:w-36"
              >
                <option value="all">All methods</option>
                <option value="card">Card</option>
                <option value="bank">Bank</option>
                <option value="manual">Manual</option>
                <option value="scholarship">Scholarship</option>
              </Select>
            </div>
          )}
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
          ) : filteredPayments.length === 0 ? (
            <EmptyState
              icon={<Icon.Search size={28} />}
              title="No matching transactions"
              description="Try adjusting your search or filters."
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
                    <th className="text-right px-4 py-3 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--surface-2)] transition-colors group">
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
                        <span className="flex items-center gap-1.5 text-[var(--muted)]">
                          {METHOD_ICON[p.method]}
                          {METHOD_LABEL[p.method]}
                        </span>
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
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => downloadReceipt(p)}
                          title="Download receipt"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-[var(--surface-3)] text-[var(--muted)] hover:text-[var(--foreground)]"
                        >
                          <Icon.Download size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-[var(--border)] bg-[var(--surface-2)]">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-xs text-[var(--muted)]">
                      {hasFilters
                        ? `${filteredPayments.length} of ${payments.length} transactions`
                        : `${completed.length} completed · ${pending.length} pending`}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-sm">
                      {formatMoney(
                        filteredPayments
                          .filter((p) => p.status === "completed")
                          .reduce((s, p) => s + p.amount, 0)
                      )}
                    </td>
                    <td />
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
