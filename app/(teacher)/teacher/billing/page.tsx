"use client";

import * as React from "react";
import { Badge, Button, Card, CardBody, StatCard, useToast } from "@/components/ui";
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

const MOCK_INVOICES: Invoice[] = [
  { id: "inv-001", description: "Pro Plan — Monthly", amount: 1999, status: "paid", date: "2026-05-01" },
  { id: "inv-002", description: "Pro Plan — Monthly", amount: 1999, status: "paid", date: "2026-04-01" },
  { id: "inv-003", description: "Pro Plan — Monthly", amount: 1999, status: "paid", date: "2026-03-01" },
  { id: "inv-004", description: "Pro Plan — Monthly", amount: 1999, status: "paid", date: "2026-02-01" },
  { id: "inv-005", description: "Pro Plan — Monthly", amount: 1999, status: "paid", date: "2026-01-01" },
];

const EARNINGS_DATA = [
  { day: "Dec", hours: 4200 },
  { day: "Jan", hours: 5800 },
  { day: "Feb", hours: 5100 },
  { day: "Mar", hours: 7300 },
  { day: "Apr", hours: 6900 },
  { day: "May", hours: 8450 },
];

const STATUS_META: Record<Invoice["status"], { label: string; variant: "success" | "warning" | "danger" }> = {
  paid: { label: "Paid", variant: "success" },
  pending: { label: "Pending", variant: "warning" },
  failed: { label: "Failed", variant: "danger" },
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function TeacherBillingPage() {
  const toast = useToast();
  const [canceling, setCanceling] = React.useState(false);

  async function handleCancel() {
    setCanceling(true);
    await new Promise((r) => setTimeout(r, 800));
    setCanceling(false);
    toast.push({ title: "Cancellation requested", description: "Your plan will remain active until the end of the billing period.", tone: "info" });
  }

  const totalEarned = 38750;
  const pendingPayout = 8450;
  const thisMonthEarnings = 8450;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Billing</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Manage your subscription plan and view earnings payouts.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total earned" value={money(totalEarned * 100)} icon={<Icon.Wallet size={18} />} tone="success" delta="All time" />
        <StatCard label="This month" value={money(thisMonthEarnings * 100)} icon={<Icon.TrendingUp size={18} />} tone="primary" delta="↑ 22% vs last month" />
        <StatCard label="Pending payout" value={money(pendingPayout * 100)} icon={<Icon.Clock size={18} />} tone="warning" delta="Processing Jun 1" />
        <StatCard label="Students enrolled" value="1,240" icon={<Icon.User size={18} />} tone="accent" delta="Across all courses" />
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
            <Button variant="outline" size="sm" onClick={() => toast.push({ title: "Payout requested", tone: "success" })}>
              <Icon.Wallet size={14} /> Request payout
            </Button>
          </div>
          <div className="h-[200px]">
            <LineChart data={EARNINGS_DATA} yFormatter={(v) => `$${(v / 100).toFixed(0)}`} />
          </div>
        </CardBody>
      </Card>

      {/* Payment method */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="font-semibold">Payment method</h2>
            <Button variant="outline" size="sm" onClick={() => toast.push({ title: "Update coming soon", tone: "info" })}>
              Update
            </Button>
          </div>
          <div className="flex items-center gap-4 p-3 rounded-xl bg-[var(--surface-2)]">
            <div className="h-10 w-16 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
              <Icon.CreditCard size={18} className="text-white" />
            </div>
            <div>
              <p className="font-medium text-sm">Visa ending in 4242</p>
              <p className="text-xs text-[var(--muted)]">Expires 08/2028</p>
            </div>
            <Badge variant="success" className="ml-auto">Default</Badge>
          </div>
        </CardBody>
      </Card>

      {/* Invoice history */}
      <Card>
        <CardBody>
          <h2 className="font-semibold mb-4">Invoice history</h2>
          <div className="overflow-x-auto">
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
                {MOCK_INVOICES.map((inv) => {
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
                          onClick={() => toast.push({ title: "Downloading invoice…", tone: "info" })}
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
    </div>
  );
}
