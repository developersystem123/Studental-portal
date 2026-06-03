"use client";

import * as React from "react";
import { Badge, Button, Card, CardBody, Input, Modal, Select, StatCard, Tabs, useToast } from "@/components/ui";
import { Donut, BarChart, LineChart } from "@/components/charts";
import Icon from "@/components/icons";
import { cn, formatDate } from "@/lib/utils";

type SubStatus = "active" | "canceled" | "expired";
type Sub = {
  id: string;
  userId: string;
  user: string;
  email: string;
  avatar: string | null;
  plan: string;
  planKey: string;
  interval: "monthly" | "annual";
  status: SubStatus;
  cancelAtPeriodEnd: boolean;
  amount: number;
  renewsAt: string;
  createdAt: string;
};

const MRR_TREND = [
  { day: "Jan", hours: 7200  },
  { day: "Feb", hours: 8800  },
  { day: "Mar", hours: 9600  },
  { day: "Apr", hours: 10400 },
  { day: "May", hours: 11200 },
  { day: "Jun", hours: 11864 },
];

const STATUS_META: Record<SubStatus, { label: string; variant: "success" | "warning" | "danger"; cls: string }> = {
  active:   { label: "Active",    variant: "success", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  expired:  { label: "Expired",   variant: "warning", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  canceled: { label: "Cancelled", variant: "danger",  cls: "bg-red-500/10 text-red-600 dark:text-red-400" },
};

const PLAN_COLORS: Record<string, string> = {
  pro:  "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  team: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  free: "bg-slate-500/10 text-slate-500",
};

type SortKey = "user" | "plan" | "amount" | "renews";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 10;

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function isExpiringSoon(renewsAt: string) {
  const diff = new Date(renewsAt).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

function exportCSV(subs: Sub[]) {
  const header = ["User", "Email", "Plan", "Interval", "Amount", "Status", "Renews At"];
  const data = subs.map((s) => [
    `"${s.user}"`, `"${s.email}"`, s.plan, s.interval,
    money(s.amount), s.status, formatDate(s.renewsAt),
  ]);
  const csv  = [header, ...data].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "subscriptions.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminSubscriptionsPage() {
  const toast = useToast();

  const [subs,           setSubs]           = React.useState<Sub[]>([]);
  const [loading,        setLoading]        = React.useState(true);
  const [tab,            setTab]            = React.useState("all");
  const [search,         setSearch]         = React.useState("");
  const [planFilter,     setPlanFilter]     = React.useState("all");
  const [intervalFilter, setIntervalFilter] = React.useState("all");
  const [sortKey,        setSortKey]        = React.useState<SortKey>("renews");
  const [sortDir,        setSortDir]        = React.useState<SortDir>("asc");
  const [page,           setPage]           = React.useState(1);
  const [cancelTarget,   setCancelTarget]   = React.useState<Sub | null>(null);
  const [canceling,      setCanceling]      = React.useState(false);
  const [detailSub,      setDetailSub]      = React.useState<Sub | null>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/subscriptions", { credentials: "same-origin" });
      const data = await res.json();
      if (res.ok) setSubs(data.subscriptions ?? []);
      else toast.push({ title: data.error ?? "Failed to load subscriptions.", tone: "danger" });
    } catch {
      toast.push({ title: "Failed to load subscriptions.", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { load(); }, [load]);

  const stats = React.useMemo(() => {
    const active   = subs.filter((s) => s.status === "active");
    const expired  = subs.filter((s) => s.status === "expired");
    const mrr      = active.reduce((acc, s) => acc + (s.interval === "annual" ? Math.round(s.amount / 12) : s.amount), 0);
    const arr      = active.reduce((acc, s) => acc + (s.interval === "annual" ? s.amount : s.amount * 12), 0);
    const avgValue = active.length ? Math.round(active.reduce((acc, s) => acc + s.amount, 0) / active.length) : 0;
    const expiring = active.filter((s) => isExpiringSoon(s.renewsAt)).length;
    return { mrr, arr, activeCount: active.length, expiredCount: expired.length, avgValue, expiring, total: subs.length };
  }, [subs]);

  const planDist = React.useMemo(() => {
    const counts: Record<string, number> = {};
    subs.filter((s) => s.status === "active").forEach((s) => {
      const key = `${s.plan} (${s.interval === "monthly" ? "Mo" : "Yr"})`;
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [subs]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return subs
      .filter((s) => {
        const matchTab      = tab === "all" || s.status === tab;
        const matchPlan     = planFilter === "all" || s.planKey === planFilter;
        const matchInterval = intervalFilter === "all" || s.interval === intervalFilter;
        const matchSearch   = !q || s.user.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
        return matchTab && matchPlan && matchInterval && matchSearch;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === "user")   cmp = a.user.localeCompare(b.user);
        if (sortKey === "plan")   cmp = a.plan.localeCompare(b.plan);
        if (sortKey === "amount") cmp = a.amount - b.amount;
        if (sortKey === "renews") cmp = new Date(a.renewsAt).getTime() - new Date(b.renewsAt).getTime();
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [subs, tab, search, planFilter, intervalFilter, sortKey, sortDir]);

  React.useEffect(() => { setPage(1); }, [search, tab, planFilter, intervalFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeCount    = subs.filter((s) => s.status === "active").length;
  const canceledCount  = subs.filter((s) => s.status === "canceled").length;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }
  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <Icon.ChevronDown size={11} className="opacity-30" />;
    return <Icon.ChevronDown size={11} className={cn("text-[var(--primary)]", sortDir === "asc" && "rotate-180")} />;
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCanceling(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/${cancelTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status: "canceled" }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.push({ title: d.error ?? "Failed to cancel.", tone: "danger" });
        return;
      }
      setSubs((prev) => prev.map((s) => s.id === cancelTarget.id ? { ...s, status: "canceled" as SubStatus } : s));
      toast.push({ title: "Subscription cancelled", description: `${cancelTarget.user}'s plan has been cancelled.`, tone: "success" });
      setCancelTarget(null);
    } catch {
      toast.push({ title: "Failed to cancel.", tone: "danger" });
    } finally {
      setCanceling(false);
    }
  }

  async function reactivate(s: Sub) {
    try {
      const res = await fetch(`/api/admin/subscriptions/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status: "active" }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.push({ title: d.error ?? "Failed to reactivate.", tone: "danger" });
        return;
      }
      setSubs((prev) => prev.map((sub) => sub.id === s.id ? { ...sub, status: "active" as SubStatus } : sub));
      toast.push({ title: "Subscription reactivated", description: `${s.user}'s plan is now active.`, tone: "success" });
    } catch {
      toast.push({ title: "Failed to reactivate.", tone: "danger" });
    }
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="mt-1 text-[var(--muted)]">Manage all active plans, track MRR, and handle billing issues.</p>
        </div>
        <Button variant="outline" onClick={() => { exportCSV(filtered); toast.push({ title: "CSV exported", tone: "success" }); }}>
          <Icon.Download size={15} /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <StatCard label="MRR"          value={money(stats.mrr)}        icon={<Icon.DollarSign size={16} />} tone="success" delta="Monthly recurring" />
        <StatCard label="ARR"          value={money(stats.arr)}        icon={<Icon.TrendingUp size={16} />} tone="primary" delta="Annual run rate" />
        <StatCard label="Active subs"  value={stats.activeCount}       icon={<Icon.Crown size={16} />}      tone="accent"  delta={`${stats.total} total`} />
        <StatCard label="Expired"      value={stats.expiredCount}      icon={<Icon.AlertCircle size={16} />} tone="warning" delta="Need attention" />
        <StatCard label="Expiring soon"value={stats.expiring}          icon={<Icon.Clock size={16} />}      tone="warning" delta="Within 7 days" />
        <StatCard label="Avg value"    value={money(stats.avgValue)}   icon={<Icon.Star size={16} />}       tone="primary" delta="Per active sub" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="font-semibold">MRR trend</h2>
                <p className="text-xs text-[var(--muted)]">Monthly recurring revenue over last 6 months</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-[var(--primary)]">{money(stats.mrr)}</p>
                <p className="text-xs text-emerald-500">↑ 6% vs last month</p>
              </div>
            </div>
            <div className="h-[180px]">
              <LineChart data={MRR_TREND} yFormatter={(v) => `$${(v / 100).toFixed(0)}`} />
            </div>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardBody>
              <h2 className="font-semibold text-sm">Active vs churned</h2>
              <div className="flex items-center gap-4 mt-2">
                <Donut
                  value={subs.length ? Math.round((activeCount / subs.length) * 100) : 0}
                  size={80}
                  label="active"
                />
                <div className="space-y-1.5 flex-1">
                  {[
                    { label: "Active",    value: activeCount,         cls: "bg-emerald-500" },
                    { label: "Expired",   value: stats.expiredCount,  cls: "bg-amber-500" },
                    { label: "Cancelled", value: canceledCount,       cls: "bg-red-500" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full ${s.cls}`} />
                        <span className="text-[var(--muted)]">{s.label}</span>
                      </div>
                      <span className="font-semibold">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h2 className="font-semibold text-sm mb-2">Plan distribution</h2>
              {planDist.length > 0 ? (
                <div className="h-[100px]">
                  <BarChart data={planDist} height={100} />
                </div>
              ) : (
                <p className="text-xs text-[var(--muted)] py-4 text-center">No active subscriptions</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Tabs
              value={tab}
              onChange={setTab}
              options={[
                { value: "all",      label: "All",      count: subs.length },
                { value: "active",   label: "Active",   count: stats.activeCount },
                { value: "expired",  label: "Expired",  count: stats.expiredCount },
                { value: "canceled", label: "Cancelled",count: canceledCount },
              ]}
            />
            <div className="flex gap-2 ml-auto shrink-0">
              <Input
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Icon.Search size={15} />}
                className="!h-9 !w-48"
              />
              <Select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="!h-9 !w-28 shrink-0">
                <option value="all">All plans</option>
                <option value="pro">Pro</option>
                <option value="team">Team</option>
              </Select>
              <Select value={intervalFilter} onChange={(e) => setIntervalFilter(e.target.value)} className="!h-9 !w-32 shrink-0">
                <option value="all">All intervals</option>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-[var(--muted)]">
              <Icon.Loader size={18} className="animate-spin" /> Loading subscriptions…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-[var(--muted)] text-sm">
              {subs.length === 0 ? "No subscriptions yet." : "No subscriptions match the current filters."}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-left font-semibold">
                        <button onClick={() => toggleSort("user")} className="flex items-center gap-1 hover:text-[var(--foreground)] transition">
                          User <SortIcon col="user" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        <button onClick={() => toggleSort("plan")} className="flex items-center gap-1 hover:text-[var(--foreground)] transition">
                          Plan <SortIcon col="plan" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        <button onClick={() => toggleSort("amount")} className="flex items-center gap-1 hover:text-[var(--foreground)] transition">
                          Amount <SortIcon col="amount" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">
                        <button onClick={() => toggleSort("renews")} className="flex items-center gap-1 hover:text-[var(--foreground)] transition">
                          Renews <SortIcon col="renews" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {paginated.map((s) => {
                      const sm       = STATUS_META[s.status];
                      const expiring = s.status === "active" && isExpiringSoon(s.renewsAt);
                      return (
                        <tr key={s.id} className="hover:bg-[var(--surface-2)]/60 transition-colors group">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {s.user.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <button className="font-semibold hover:text-[var(--primary)] transition truncate" onClick={() => setDetailSub(s)}>
                                  {s.user}
                                </button>
                                <p className="text-xs text-[var(--muted)] truncate">{s.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-block text-xs font-semibold px-2 py-0.5 rounded-full", PLAN_COLORS[s.planKey] ?? "bg-slate-500/10 text-slate-500")}>
                              {s.plan}
                            </span>
                            <p className="text-xs text-[var(--muted)] mt-0.5 capitalize">{s.interval}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold tabular-nums">{money(s.amount)}</p>
                            {s.interval === "annual" && (
                              <p className="text-[10px] text-[var(--muted-2)]">{money(Math.round(s.amount / 12))}/mo</p>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <p className={cn("text-xs", expiring ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-[var(--muted)]")}>
                              {formatDate(s.renewsAt)}
                            </p>
                            {expiring && (
                              <p className="text-[10px] text-amber-500 font-medium flex items-center gap-1 mt-0.5">
                                <Icon.Clock size={10} /> Expiring soon
                              </p>
                            )}
                            {s.cancelAtPeriodEnd && s.status === "active" && (
                              <p className="text-[10px] text-rose-500 font-medium mt-0.5">Cancels at period end</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full", sm.cls)}>
                              {sm.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setDetailSub(s)}
                                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)] transition opacity-0 group-hover:opacity-100"
                                title="View details"
                              >
                                <Icon.Eye size={14} />
                              </button>
                              {s.status === "active" && (
                                <button
                                  onClick={() => setCancelTarget(s)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 transition opacity-0 group-hover:opacity-100"
                                >
                                  <Icon.X size={11} /> Cancel
                                </button>
                              )}
                              {s.status === "canceled" && (
                                <button
                                  onClick={() => reactivate(s)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition opacity-0 group-hover:opacity-100"
                                >
                                  <Icon.CheckCircle size={11} /> Reactivate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
                <p className="text-xs text-[var(--muted)]">
                  Showing <span className="font-semibold text-[var(--foreground)]">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
                  <span className="font-semibold text-[var(--foreground)]">{filtered.length}</span> subscriptions
                </p>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(1)} title="First">
                    <Icon.ChevronLeft size={13} /><Icon.ChevronLeft size={13} className="-ml-2" />
                  </Button>
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    <Icon.ChevronLeft size={13} /> Prev
                  </Button>
                  <div className="flex items-center gap-1 mx-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | "…")[]>((acc, p, i, arr) => {
                        if (i > 0 && typeof arr[i - 1] === "number" && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                        acc.push(p); return acc;
                      }, [])
                      .map((p, i) =>
                        p === "…" ? (
                          <span key={`e-${i}`} className="px-1 text-[var(--muted)] text-sm">…</span>
                        ) : (
                          <button key={p} onClick={() => setPage(p as number)}
                            className={cn("h-8 w-8 rounded-lg text-xs font-semibold transition", page === p ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]")}
                          >{p}</button>
                        )
                      )}
                  </div>
                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next <Icon.ChevronRight size={13} />
                  </Button>
                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(totalPages)} title="Last">
                    <Icon.ChevronRight size={13} /><Icon.ChevronRight size={13} className="-ml-2" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Subscription detail modal */}
      <Modal open={!!detailSub} onClose={() => setDetailSub(null)} size="md" title="Subscription details">
        {detailSub && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white font-bold text-lg shrink-0">
                {detailSub.user.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-lg">{detailSub.user}</p>
                <p className="text-sm text-[var(--muted)]">{detailSub.email}</p>
              </div>
              <span className={cn("ml-auto inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full", STATUS_META[detailSub.status].cls)}>
                {STATUS_META[detailSub.status].label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Plan",     value: `${detailSub.plan} — ${detailSub.interval}` },
                { label: "Amount",   value: `${money(detailSub.amount)} / ${detailSub.interval === "monthly" ? "month" : "year"}` },
                { label: "Renews",   value: formatDate(detailSub.renewsAt) },
                { label: "Monthly",  value: detailSub.interval === "annual" ? money(Math.round(detailSub.amount / 12)) : money(detailSub.amount) },
              ].map((r) => (
                <div key={r.label} className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold">{r.label}</p>
                  <p className="font-semibold mt-0.5">{r.value}</p>
                </div>
              ))}
            </div>

            {detailSub.cancelAtPeriodEnd && detailSub.status === "active" && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-600 dark:text-rose-400">
                <Icon.AlertCircle size={14} className="shrink-0" />
                Scheduled to cancel at period end ({formatDate(detailSub.renewsAt)}).
              </div>
            )}

            {isExpiringSoon(detailSub.renewsAt) && detailSub.status === "active" && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-600 dark:text-amber-400">
                <Icon.Clock size={14} className="shrink-0" />
                This subscription is renewing within 7 days.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              {detailSub.status === "canceled" && (
                <Button onClick={() => { reactivate(detailSub); setDetailSub(null); }}>
                  <Icon.CheckCircle size={14} /> Reactivate
                </Button>
              )}
              {detailSub.status === "active" && (
                <Button variant="danger" onClick={() => { setCancelTarget(detailSub); setDetailSub(null); }}>
                  <Icon.X size={14} /> Cancel plan
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel confirm */}
      <Modal open={!!cancelTarget} onClose={() => !canceling && setCancelTarget(null)} title="Cancel subscription?">
        <div className="p-5 space-y-4">
          {cancelTarget && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm space-y-1">
                <p><span className="text-[var(--muted)]">User:</span> <span className="font-semibold">{cancelTarget.user}</span></p>
                <p><span className="text-[var(--muted)]">Plan:</span> <span className="font-semibold">{cancelTarget.plan} ({cancelTarget.interval})</span></p>
                <p><span className="text-[var(--muted)]">Amount:</span> <span className="font-semibold">{money(cancelTarget.amount)}</span></p>
              </div>
              <p className="text-sm text-[var(--muted)]">
                They will retain access until the end of the current billing period (<strong>{formatDate(cancelTarget.renewsAt)}</strong>). You can reactivate anytime.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCancelTarget(null)} disabled={canceling}>Keep active</Button>
            <Button variant="danger" loading={canceling} onClick={confirmCancel}><Icon.X size={14} /> Cancel plan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
