"use client";

import * as React from "react";
import { Badge, Button, Card, CardBody, Input, Select, StatCard, Tabs, useToast } from "@/components/ui";
import { Donut, BarChart } from "@/components/charts";
import Icon from "@/components/icons";
import { cn, formatDate } from "@/lib/utils";

type Sub = {
  id: string;
  user: string;
  email: string;
  plan: "Pro" | "Team" | "Free";
  interval: "monthly" | "annual";
  status: "active" | "cancelled" | "past_due";
  amount: number;
  renewsAt: string;
};

const MOCK_SUBS: Sub[] = [
  { id: "s1", user: "Ali Khan", email: "ali@example.com", plan: "Pro", interval: "monthly", status: "active", amount: 1999, renewsAt: "2026-06-26" },
  { id: "s2", user: "Sara Ahmed", email: "sara@example.com", plan: "Team", interval: "annual", status: "active", amount: 9999, renewsAt: "2027-01-15" },
  { id: "s3", user: "Usman Tariq", email: "usman@example.com", plan: "Pro", interval: "annual", status: "active", amount: 19199, renewsAt: "2027-03-10" },
  { id: "s4", user: "Zara Malik", email: "zara@example.com", plan: "Pro", interval: "monthly", status: "past_due", amount: 1999, renewsAt: "2026-05-20" },
  { id: "s5", user: "Ahmed Raza", email: "ahmed@example.com", plan: "Team", interval: "monthly", status: "active", amount: 4999, renewsAt: "2026-06-18" },
  { id: "s6", user: "Fatima Noor", email: "fatima@example.com", plan: "Pro", interval: "monthly", status: "cancelled", amount: 1999, renewsAt: "2026-06-01" },
  { id: "s7", user: "Hassan Ali", email: "hassan@example.com", plan: "Pro", interval: "annual", status: "active", amount: 19199, renewsAt: "2027-02-05" },
  { id: "s8", user: "Maryam Shah", email: "maryam@example.com", plan: "Team", interval: "annual", status: "active", amount: 9999, renewsAt: "2027-04-20" },
];

const PLAN_DIST = [
  { label: "Pro Monthly", value: 34 },
  { label: "Pro Annual", value: 28 },
  { label: "Team Monthly", value: 18 },
  { label: "Team Annual", value: 20 },
];

const STATUS_META: Record<Sub["status"], { label: string; variant: "success" | "warning" | "danger" }> = {
  active: { label: "Active", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
  past_due: { label: "Past due", variant: "warning" },
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminSubscriptionsPage() {
  const toast = useToast();
  const [tab, setTab] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [planFilter, setPlanFilter] = React.useState("all");

  const filtered = MOCK_SUBS.filter((s) => {
    const matchTab = tab === "all" || s.status === tab;
    const matchPlan = planFilter === "all" || s.plan.toLowerCase() === planFilter;
    const matchSearch = !search || s.user.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchPlan && matchSearch;
  });

  const totalMRR = MOCK_SUBS.filter((s) => s.status === "active").reduce((acc, s) => {
    const monthly = s.interval === "annual" ? Math.round(s.amount / 12) : s.amount;
    return acc + monthly;
  }, 0);

  const activeCount = MOCK_SUBS.filter((s) => s.status === "active").length;
  const pastDueCount = MOCK_SUBS.filter((s) => s.status === "past_due").length;

  function cancelSub(id: string) {
    toast.push({ title: "Subscription cancelled", tone: "info" });
    void id;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Subscriptions</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Manage all active plans, track MRR, and handle billing issues.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Monthly recurring" value={money(totalMRR)} icon={<Icon.DollarSign size={18} />} tone="success" delta="Active subscribers" />
        <StatCard label="Active subs" value={activeCount} icon={<Icon.Crown size={18} />} tone="primary" delta={`${MOCK_SUBS.length} total`} />
        <StatCard label="Past due" value={pastDueCount} icon={<Icon.AlertCircle size={18} />} tone="warning" delta="Need attention" />
        <StatCard label="Churn rate" value="4.2%" icon={<Icon.TrendingUp size={18} />} tone="accent" delta="Last 30 days" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardBody>
            <h2 className="font-semibold">Plan distribution</h2>
            <p className="text-xs text-[var(--muted)]">Active subscriptions by plan type</p>
            <div className="h-[200px] mt-3">
              <BarChart data={PLAN_DIST} height={200} />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h2 className="font-semibold">Active vs churned</h2>
            <p className="text-xs text-[var(--muted)]">All-time subscription health</p>
            <div className="flex items-center justify-center py-4">
              <Donut value={Math.round((activeCount / MOCK_SUBS.length) * 100)} size={150} label="active" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Active", value: activeCount },
                { label: "Cancelled", value: MOCK_SUBS.filter((s) => s.status === "cancelled").length },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-[var(--surface-2)] p-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold">{s.label}</p>
                  <p className="text-sm font-bold mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Icon.Search size={15} />}
              className="sm:w-72"
            />
            <Select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="sm:w-40">
              <option value="all">All plans</option>
              <option value="pro">Pro</option>
              <option value="team">Team</option>
            </Select>
            <div className="sm:ml-auto">
              <Tabs
                value={tab}
                onChange={setTab}
                options={[
                  { value: "all", label: "All" },
                  { value: "active", label: "Active" },
                  { value: "past_due", label: "Past due" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2.5 font-medium text-[var(--muted)]">User</th>
                  <th className="text-left py-2.5 font-medium text-[var(--muted)]">Plan</th>
                  <th className="text-left py-2.5 font-medium text-[var(--muted)]">Amount</th>
                  <th className="text-left py-2.5 font-medium text-[var(--muted)]">Renews</th>
                  <th className="text-left py-2.5 font-medium text-[var(--muted)]">Status</th>
                  <th className="py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[var(--muted)] text-sm">
                      No subscriptions match the current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const sm = STATUS_META[s.status];
                    return (
                      <tr key={s.id} className="hover:bg-[var(--surface-2)] transition-colors">
                        <td className="py-3">
                          <p className="font-medium">{s.user}</p>
                          <p className="text-xs text-[var(--muted)]">{s.email}</p>
                        </td>
                        <td className="py-3">
                          <p className="font-medium">{s.plan}</p>
                          <p className="text-xs text-[var(--muted)] capitalize">{s.interval}</p>
                        </td>
                        <td className="py-3 tabular-nums font-medium">{money(s.amount)}</td>
                        <td className="py-3 text-[var(--muted)]">{formatDate(s.renewsAt)}</td>
                        <td className="py-3">
                          <Badge variant={sm.variant}>{sm.label}</Badge>
                        </td>
                        <td className="py-3 text-right">
                          {s.status === "active" && (
                            <Button variant="ghost" size="sm" onClick={() => cancelSub(s.id)}
                              className="text-[var(--danger)] hover:bg-red-500/10">
                              Cancel
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <p className="text-xs text-[var(--muted)] mt-3">{filtered.length} subscription{filtered.length !== 1 ? "s" : ""} shown</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
