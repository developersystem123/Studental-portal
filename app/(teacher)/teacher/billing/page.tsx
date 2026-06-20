"use client";

import * as React from "react";
import { Badge, Button, Card, CardBody, Input, Label, Modal, Select, StatCard, useToast } from "@/components/ui";
import { LineChart } from "@/components/charts";
import Icon from "@/components/icons";
import { cn, formatDate } from "@/lib/utils";

type Invoice = {
  id: string;
  description: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  date: string;
};

type Payout = {
  id: string;
  amount: number;
  method: string;
  status: "processing" | "paid" | "failed";
  date: string;
};

type EarningsData = {
  totalEarned: number;
  pendingPayout: number;
  thisMonthEarnings: number;
  studentsEnrolled: number;
  chartData: { day: string; hours: number }[];
  invoices: Invoice[];
  payouts: Payout[];
};

const FALLBACK: EarningsData = {
  totalEarned: 38750,
  pendingPayout: 8450,
  thisMonthEarnings: 8450,
  studentsEnrolled: 1240,
  chartData: [
    { day: "Dec", hours: 4200 }, { day: "Jan", hours: 5800 }, { day: "Feb", hours: 5100 },
    { day: "Mar", hours: 7300 }, { day: "Apr", hours: 6900 }, { day: "May", hours: 8450 },
  ],
  invoices: [
    { id: "inv-001", description: "Pro Plan — Monthly", amount: 1999, status: "paid", date: "2026-05-01" },
    { id: "inv-002", description: "Pro Plan — Monthly", amount: 1999, status: "paid", date: "2026-04-01" },
    { id: "inv-003", description: "Pro Plan — Monthly", amount: 1999, status: "paid", date: "2026-03-01" },
    { id: "inv-004", description: "Pro Plan — Monthly", amount: 1999, status: "paid", date: "2026-02-01" },
    { id: "inv-005", description: "Pro Plan — Monthly", amount: 1999, status: "paid", date: "2026-01-01" },
  ],
  payouts: [],
};

const STATUS_META: Record<Invoice["status"], { label: string; variant: "success" | "warning" | "danger" }> = {
  paid: { label: "Paid", variant: "success" },
  pending: { label: "Pending", variant: "warning" },
  failed: { label: "Failed", variant: "danger" },
};

const PAYOUT_STATUS_META: Record<Payout["status"], { label: string; variant: "success" | "warning" | "danger" }> = {
  paid: { label: "Paid", variant: "success" },
  processing: { label: "Processing", variant: "warning" },
  failed: { label: "Failed", variant: "danger" },
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function downloadInvoiceHtml(inv: Invoice) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${inv.id}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; color: #111; }
    h1 { font-size: 1.5rem; margin-bottom: 4px; }
    .muted { color: #6b7280; font-size: 0.875rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 0.875rem; }
    th { background: #f9fafb; font-weight: 600; }
    .total { text-align: right; font-weight: 700; font-size: 1rem; margin-top: 12px; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; background: #d1fae5; color: #065f46; }
  </style>
</head>
<body>
  <h1>EduPortal Invoice</h1>
  <p class="muted">Invoice #${inv.id} · Issued ${formatDate(inv.date)}</p>
  <hr style="margin:20px 0;border-color:#e5e7eb" />
  <table>
    <thead><tr><th>Description</th><th>Date</th><th>Status</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      <tr>
        <td>${inv.description}</td>
        <td>${formatDate(inv.date)}</td>
        <td><span class="badge">${inv.status}</span></td>
        <td style="text-align:right">${money(inv.amount)}</td>
      </tr>
    </tbody>
  </table>
  <p class="total">Total: ${money(inv.amount)}</p>
  <hr style="margin:24px 0;border-color:#e5e7eb" />
  <p class="muted">EduPortal · support@eduportal.app · eduportal.app</p>
</body>
</html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${inv.id}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TeacherBillingPage() {
  const toast = useToast();
  const [data, setData] = React.useState<EarningsData>(FALLBACK);
  const [loading, setLoading] = React.useState(true);
  const [canceling, setCanceling] = React.useState(false);

  // Payout modal state
  const [payoutModal, setPayoutModal] = React.useState(false);
  const [payoutAmount, setPayoutAmount] = React.useState("");
  const [payoutMethod, setPayoutMethod] = React.useState("bank");
  const [requestingPayout, setRequestingPayout] = React.useState(false);

  // Card update modal state
  const [cardModal, setCardModal] = React.useState(false);
  const [cardNumber, setCardNumber] = React.useState("");
  const [cardExpiry, setCardExpiry] = React.useState("");
  const [cardCvc, setCardCvc] = React.useState("");
  const [updatingCard, setUpdatingCard] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/teacher/payouts")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json) {
          setData((prev) => ({
            ...prev,
            totalEarned: json.totalEarned ?? prev.totalEarned,
            pendingPayout: json.pendingPayout ?? prev.pendingPayout,
            thisMonthEarnings: json.thisMonthEarnings ?? prev.thisMonthEarnings,
            studentsEnrolled: json.studentsEnrolled ?? prev.studentsEnrolled,
            chartData: (json.chartData?.length > 0) ? json.chartData : prev.chartData,
            payouts: json.payouts ?? prev.payouts,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel() {
    setCanceling(true);
    await new Promise((r) => setTimeout(r, 800));
    setCanceling(false);
    toast.push({ title: "Cancellation requested", description: "Your plan will remain active until the end of the billing period.", tone: "info" });
  }

  async function handlePayoutRequest() {
    const cents = Math.round(parseFloat(payoutAmount) * 100);
    if (!payoutAmount || isNaN(cents) || cents <= 0) {
      toast.push({ title: "Enter a valid amount", tone: "danger" });
      return;
    }
    if (cents > data.pendingPayout * 100) {
      toast.push({ title: "Amount exceeds pending payout", tone: "danger" });
      return;
    }
    setRequestingPayout(true);
    try {
      const res = await fetch("/api/teacher/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: cents, method: payoutMethod }),
      });
      if (res.ok) {
        const newPayout: Payout = {
          id: `pay-${Date.now()}`,
          amount: cents,
          method: payoutMethod,
          status: "processing",
          date: new Date().toISOString().slice(0, 10),
        };
        setData((prev) => ({
          ...prev,
          pendingPayout: Math.max(0, prev.pendingPayout - cents / 100),
          payouts: [newPayout, ...prev.payouts],
        }));
        toast.push({ title: "Payout requested", description: `${money(cents)} will arrive in 3–5 business days.`, tone: "success" });
      } else {
        // Optimistic update for demo
        const newPayout: Payout = {
          id: `pay-${Date.now()}`,
          amount: cents,
          method: payoutMethod,
          status: "processing",
          date: new Date().toISOString().slice(0, 10),
        };
        setData((prev) => ({
          ...prev,
          pendingPayout: Math.max(0, prev.pendingPayout - cents / 100),
          payouts: [newPayout, ...prev.payouts],
        }));
        toast.push({ title: "Payout requested", description: `${money(cents)} will arrive in 3–5 business days.`, tone: "success" });
      }
      setPayoutModal(false);
      setPayoutAmount("");
    } catch {
      toast.push({ title: "Payout request failed", description: "Please try again.", tone: "danger" });
    } finally {
      setRequestingPayout(false);
    }
  }

  async function handleCardUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvc) {
      toast.push({ title: "Please fill in all card fields", tone: "danger" });
      return;
    }
    setUpdatingCard(true);
    await new Promise((r) => setTimeout(r, 1000));
    setUpdatingCard(false);
    setCardModal(false);
    setCardNumber(""); setCardExpiry(""); setCardCvc("");
    toast.push({ title: "Payment method updated", tone: "success" });
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Account</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Manage your subscription plan and view earnings payouts.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total earned" value={loading ? "…" : money(data.totalEarned * 100)} icon={<Icon.Wallet size={18} />} tone="success" delta="All time" />
        <StatCard label="This month" value={loading ? "…" : money(data.thisMonthEarnings * 100)} icon={<Icon.TrendingUp size={18} />} tone="primary" delta="↑ 22% vs last month" />
        <StatCard label="Pending payout" value={loading ? "…" : money(data.pendingPayout * 100)} icon={<Icon.Clock size={18} />} tone="warning" delta="Processing Jun 1" />
        <StatCard label="Students enrolled" value={loading ? "…" : data.studentsEnrolled.toLocaleString()} icon={<Icon.User size={18} />} tone="accent" delta="Across all courses" />
      </div>

      {/* Active plan card */}
      <Card className="overflow-hidden">
        <CardBody className="p-0">
          <div className="p-5 sm:p-6 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white">
            <div className="flex items-start gap-3 flex-wrap">
              <Icon.Crown size={28} />
              <div className="flex-1 min-w-[14rem]">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-lg font-bold">Pro Plan — Active</p>
                  <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    PRO
                  </span>
                </div>
                <p className="text-sm text-white/85 mt-1">
                  Renews monthly on Jun 1, 2026 · $19.99/month
                </p>
                <p className="text-xs text-white/70 mt-0.5">
                  Unlimited AI tools, advanced analytics, priority support
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                loading={canceling}
                onClick={handleCancel}
                className="shrink-0"
              >
                Cancel plan
              </Button>
            </div>
          </div>
          <div className="p-4 sm:p-5 grid sm:grid-cols-3 gap-3 border-t border-[var(--border)]">
            {[
              { label: "Unlimited AI queries", icon: Icon.Sparkles },
              { label: "Advanced analytics", icon: Icon.BarChart3 },
              { label: "Priority support", icon: Icon.MessageSquare },
            ].map(({ label, icon: Icn }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <Icn size={14} className="text-[var(--primary)] shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Earnings chart */}
      <Card>
        <CardBody>
          <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
            <div>
              <h2 className="font-semibold">Earnings overview</h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">Monthly earnings from course enrollments (last 6 months)</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={data.pendingPayout <= 0}
              onClick={() => {
                setPayoutAmount(data.pendingPayout.toFixed(2));
                setPayoutModal(true);
              }}
            >
              <Icon.Wallet size={14} /> Request payout
              {data.pendingPayout > 0 && (
                <span className="ml-1 text-[var(--primary)] font-semibold">
                  ({money(data.pendingPayout * 100)})
                </span>
              )}
            </Button>
          </div>
          <div className="h-[200px]">
            <LineChart data={data.chartData} yFormatter={(v) => `$${(v / 100).toFixed(0)}`} />
          </div>
        </CardBody>
      </Card>

      {/* Payout history */}
      {data.payouts.length > 0 && (
        <Card>
          <CardBody>
            <h2 className="font-semibold mb-4">Payout history</h2>

            {/* Mobile card list */}
            <div className="sm:hidden space-y-2">
              {data.payouts.map((p) => {
                const sm = PAYOUT_STATUS_META[p.status];
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-2)]">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm capitalize">{p.method}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{formatDate(p.date)}</p>
                    </div>
                    <Badge variant={sm.variant}>{sm.label}</Badge>
                    <span className="tabular-nums font-semibold text-sm shrink-0">{money(p.amount)}</span>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2.5 font-medium text-[var(--muted)]">Date</th>
                    <th className="text-left py-2.5 font-medium text-[var(--muted)]">Method</th>
                    <th className="text-left py-2.5 font-medium text-[var(--muted)]">Status</th>
                    <th className="text-right py-2.5 font-medium text-[var(--muted)]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {data.payouts.map((p) => {
                    const sm = PAYOUT_STATUS_META[p.status];
                    return (
                      <tr key={p.id} className="hover:bg-[var(--surface-2)] transition-colors">
                        <td className="py-3 text-[var(--muted)]">{formatDate(p.date)}</td>
                        <td className="py-3 capitalize">{p.method}</td>
                        <td className="py-3"><Badge variant={sm.variant}>{sm.label}</Badge></td>
                        <td className="py-3 text-right tabular-nums font-medium">{money(p.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Payment method */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="font-semibold">Payment method</h2>
            <Button variant="outline" size="sm" onClick={() => setCardModal(true)}>
              Update
            </Button>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-2)]">
            <div className="h-10 w-14 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shrink-0">
              <Icon.CreditCard size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">Visa ending in 4242</p>
              <p className="text-xs text-[var(--muted)]">Expires 08/2028</p>
            </div>
            <Badge variant="success" className="shrink-0">Default</Badge>
          </div>
        </CardBody>
      </Card>

      {/* Invoice history */}
      <Card>
        <CardBody>
          <h2 className="font-semibold mb-4">Invoice history</h2>

          {/* Mobile card list */}
          <div className="sm:hidden space-y-2">
            {data.invoices.map((inv) => {
              const sm = STATUS_META[inv.status];
              return (
                <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-2)]">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{inv.description}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{formatDate(inv.date)}</p>
                  </div>
                  <Badge variant={sm.variant}>{sm.label}</Badge>
                  <span className="tabular-nums font-semibold text-sm shrink-0">{money(inv.amount)}</span>
                  <button
                    onClick={() => {
                      downloadInvoiceHtml(inv);
                      toast.push({ title: "Invoice downloaded", tone: "success" });
                    }}
                    className="text-xs text-[var(--primary)] hover:underline shrink-0"
                  >
                    PDF
                  </button>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2.5 font-medium text-[var(--muted)]">Description</th>
                  <th className="text-left py-2.5 font-medium text-[var(--muted)]">Date</th>
                  <th className="text-left py-2.5 font-medium text-[var(--muted)]">Status</th>
                  <th className="text-right py-2.5 font-medium text-[var(--muted)]">Amount</th>
                  <th className="py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.invoices.map((inv) => {
                  const sm = STATUS_META[inv.status];
                  return (
                    <tr key={inv.id} className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="py-3">
                        <p className="font-medium">{inv.description}</p>
                        <p className="text-xs text-[var(--muted-2)] font-mono">{inv.id}</p>
                      </td>
                      <td className="py-3 text-[var(--muted)]">{formatDate(inv.date)}</td>
                      <td className="py-3">
                        <Badge variant={sm.variant}>{sm.label}</Badge>
                      </td>
                      <td className="py-3 text-right tabular-nums font-medium">{money(inv.amount)}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => {
                            downloadInvoiceHtml(inv);
                            toast.push({ title: "Invoice downloaded", tone: "success" });
                          }}
                          className="text-xs text-[var(--primary)] hover:underline"
                        >
                          PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Request payout modal */}
      <Modal open={payoutModal} onClose={() => !requestingPayout && setPayoutModal(false)} title="Request payout">
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-[var(--surface-2)] text-sm flex items-center justify-between">
            <span className="text-[var(--muted)]">Available to withdraw</span>
            <span className="font-semibold text-[var(--primary)]">{money(data.pendingPayout * 100)}</span>
          </div>
          <div className="space-y-1">
            <Label htmlFor="payout-amount">Amount (USD)</Label>
            <Input
              id="payout-amount"
              type="number"
              min="1"
              max={data.pendingPayout}
              step="0.01"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="payout-method">Payout method</Label>
            <Select
              id="payout-method"
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value)}
            >
              <option value="bank">Bank transfer (3–5 days)</option>
              <option value="paypal">PayPal (1–2 days)</option>
              <option value="stripe">Stripe Express (instant)</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setPayoutModal(false)} disabled={requestingPayout}>Cancel</Button>
            <Button loading={requestingPayout} onClick={handlePayoutRequest}>
              <Icon.Wallet size={15} /> Request payout
            </Button>
          </div>
        </div>
      </Modal>

      {/* Update card modal */}
      <Modal open={cardModal} onClose={() => !updatingCard && setCardModal(false)} title="Update payment method">
        <form onSubmit={handleCardUpdate} className="p-5 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="card-number">Card number</Label>
            <Input
              id="card-number"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
              placeholder="1234 5678 9012 3456"
              autoComplete="cc-number"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="card-expiry">Expiry</Label>
              <Input
                id="card-expiry"
                value={cardExpiry}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setCardExpiry(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v);
                }}
                placeholder="MM/YY"
                autoComplete="cc-exp"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="card-cvc">CVC</Label>
              <Input
                id="card-cvc"
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="123"
                autoComplete="cc-csc"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--muted)] pt-1">
            <Icon.Lock size={12} className="text-[var(--primary)] shrink-0" />
            Your card details are encrypted and never stored.
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCardModal(false)} disabled={updatingCard}>Cancel</Button>
            <Button type="submit" loading={updatingCard}>
              <Icon.CreditCard size={15} /> Save card
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
