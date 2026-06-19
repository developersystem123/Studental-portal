"use client";

import * as React from "react";
import { Badge, Button, Card, CardBody, StatCard, Tabs, useToast } from "@/components/ui";
import { BarChart, Donut, LineChart, ProgressBar } from "@/components/charts";
import Icon from "@/components/icons";
import { cn } from "@/lib/utils";

type Monthly = {
  label: string;
  enrollments: number;
  signups: number;
  revenue: number;
  completions: number;
};

type Totals = {
  revenue: number;
  refunded: number;
  students: number;
  teachers: number;
  courses: number;
  enrollments: number;
  completions: number;
  certificates: number;
  transactions: number;
  reviews: number;
  avgRating: number;
  completionRate: number;
  currency: string;
};

type TopCourse = { id: string; title: string; enrollments: number; revenue: number };
type Mix = { label: string; value: number };

type ReportData = {
  months: number;
  monthly: Monthly[];
  totals: Totals;
  topCourses: TopCourse[];
  categoryMix: Mix[];
  paymentMethods: Mix[];
};

function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}
function shortMoney(cents: number) {
  const v = cents / 100;
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${Math.round(v)}`;
}

function exportFullCSV(data: ReportData, range: string, toast: ReturnType<typeof useToast>) {
  const lines: string[] = [
    "=== MONTHLY BREAKDOWN ===",
    "Month,Enrollments,Signups,Completions,Revenue",
    ...data.monthly.map((m) => `${m.label},${m.enrollments},${m.signups},${m.completions},${(m.revenue / 100).toFixed(2)}`),
    "",
    "=== TOTALS ===",
    `Gross Revenue,$${(data.totals.revenue / 100).toFixed(2)}`,
    `Refunded,$${(data.totals.refunded / 100).toFixed(2)}`,
    `Net Revenue,$${((data.totals.revenue - data.totals.refunded) / 100).toFixed(2)}`,
    `Students,${data.totals.students}`,
    `Enrollments,${data.totals.enrollments}`,
    `Completions,${data.totals.completions}`,
    `Completion Rate,${data.totals.completionRate}%`,
    `Certificates,${data.totals.certificates}`,
    `Avg Rating,${data.totals.avgRating}`,
    "",
    "=== TOP COURSES ===",
    "Title,Enrollments,Revenue",
    ...data.topCourses.map((c) => `"${c.title}",${c.enrollments},$${(c.revenue / 100).toFixed(2)}`),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `eduportal-report-${range}mo-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast.push({ title: "Full report exported", tone: "success" });
}

export default function AdminReportsPage() {
  const toast = useToast();
  const [range,   setRange]   = React.useState("6");
  const [data,    setData]    = React.useState<ReportData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [section, setSection] = React.useState("overview");

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res  = await fetch(`/api/admin/reports?months=${range}`, { credentials: "same-origin" });
        const json = await res.json();
        if (cancelled) return;
        if (res.ok) setData(json);
        else toast.push({ title: json.error ?? "Failed to load reports.", tone: "danger" });
      } catch {
        if (!cancelled) toast.push({ title: "Failed to load reports.", tone: "danger" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [range, toast]);

  const totals  = data?.totals;
  const currency = totals?.currency ?? "USD";
  const monthly  = data?.monthly ?? [];
  const topMax   = Math.max(...(data?.topCourses ?? []).map((c) => c.enrollments), 1);

  // MoM growth for last two months
  const mLen = monthly.length;
  const revGrowth = mLen >= 2 && monthly[mLen - 2].revenue > 0
    ? Math.round(((monthly[mLen - 1].revenue - monthly[mLen - 2].revenue) / monthly[mLen - 2].revenue) * 100)
    : null;
  const enrGrowth = mLen >= 2 && monthly[mLen - 2].enrollments > 0
    ? Math.round(((monthly[mLen - 1].enrollments - monthly[mLen - 2].enrollments) / monthly[mLen - 2].enrollments) * 100)
    : null;

  const netRevenue = (totals?.revenue ?? 0) - (totals?.refunded ?? 0);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--primary)] font-semibold">Manage</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Reports &amp; analytics</h1>
          <p className="mt-1 text-[var(--muted)]">Platform-wide trends for growth, revenue, and learning outcomes.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Tabs value={range} onChange={(v) => setRange(v)} options={[
            { value: "3",  label: "3 mo" },
            { value: "6",  label: "6 mo" },
            { value: "12", label: "12 mo" },
          ]} />
          <Button variant="outline" onClick={() => data && exportFullCSV(data, range, toast)} disabled={!data}>
            <Icon.Download size={15} /> Export CSV
          </Button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 flex-wrap">
        {[
          { value: "overview", label: "Overview", icon: Icon.BarChart3 },
          { value: "revenue",  label: "Revenue",  icon: Icon.DollarSign },
          { value: "learning", label: "Learning", icon: Icon.Book },
          { value: "courses",  label: "Top courses", icon: Icon.Award },
        ].map(({ value, label, icon: Ic }) => (
          <button
            key={value}
            onClick={() => setSection(value)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition",
              section === value
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
            )}
          >
            <Ic size={14} /> {label}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <Card>
          <CardBody>
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-[var(--muted)]">
              <Icon.Loader size={24} className="animate-spin text-[var(--primary)]" />
              <p className="text-sm">Crunching the numbers…</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className={cn("space-y-6", loading && "opacity-60 transition-opacity")}>

          {/* ── OVERVIEW ── */}
          {section === "overview" && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                  label="Gross revenue" value={money(totals?.revenue ?? 0, currency)}
                  icon={<Icon.DollarSign size={18} />} tone="success"
                  delta={revGrowth !== null ? `${revGrowth >= 0 ? "↑" : "↓"} ${Math.abs(revGrowth)}% vs last month` : `${totals?.transactions ?? 0} paid charges`}
                />
                <StatCard
                  label="Enrollments" value={totals?.enrollments ?? 0}
                  icon={<Icon.ListChecks size={18} />} tone="primary"
                  delta={enrGrowth !== null ? `${enrGrowth >= 0 ? "↑" : "↓"} ${Math.abs(enrGrowth)}% vs last month` : `${totals?.completions ?? 0} completed`}
                />
                <StatCard
                  label="Completion rate" value={`${totals?.completionRate ?? 0}%`}
                  icon={<Icon.Award size={18} />} tone="accent"
                  delta={`${totals?.certificates ?? 0} certificates issued`}
                />
                <StatCard
                  label="Avg rating" value={totals?.avgRating || "—"}
                  icon={<Icon.Star size={18} />} tone="warning"
                  delta={`${totals?.reviews ?? 0} reviews`}
                />
              </div>

              {/* Secondary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Net revenue",  value: money(netRevenue, currency),      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: Icon.TrendingUp },
                  { label: "Students",     value: (totals?.students ?? 0).toLocaleString(), tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400", icon: Icon.User },
                  { label: "Teachers",     value: totals?.teachers ?? 0,             tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400", icon: Icon.Users },
                  { label: "Total courses",value: totals?.courses ?? 0,              tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: Icon.Book },
                ].map((s) => (
                  <Card key={s.label}>
                    <CardBody className="flex items-center gap-3 !py-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${s.tone}`}>
                        <s.icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-[var(--muted)]">{s.label}</p>
                        <p className="text-lg font-bold tracking-tight">{s.value}</p>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>

              {/* Enrollment + completion */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                  <CardBody>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h2 className="font-semibold">Enrollment trend</h2>
                        <p className="text-xs text-[var(--muted)]">New enrollments per month</p>
                      </div>
                      {enrGrowth !== null && (
                        <Badge variant={enrGrowth >= 0 ? "success" : "danger"}>
                          {enrGrowth >= 0 ? "↑" : "↓"} {Math.abs(enrGrowth)}% MoM
                        </Badge>
                      )}
                    </div>
                    <div className="h-[220px]">
                      <LineChart data={monthly.map((m) => ({ day: m.label, hours: m.enrollments }))} height={220} yFormatter={(v) => Math.round(v).toString()} />
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="font-semibold">Completion</h2>
                      <Badge variant="info">{totals?.completionRate ?? 0}%</Badge>
                    </div>
                    <p className="text-xs text-[var(--muted)]">All-time enrollment outcomes</p>
                    <div className="flex items-center justify-center py-4">
                      <Donut value={totals?.completionRate ?? 0} size={140} label="completed" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Enrolled",    value: totals?.enrollments ?? 0 },
                        { label: "Completed",   value: totals?.completions ?? 0 },
                        { label: "Certificates",value: totals?.certificates ?? 0 },
                      ].map((s) => (
                        <div key={s.label} className="rounded-xl bg-[var(--surface-2)] p-2 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold">{s.label}</p>
                          <p className="text-sm font-bold mt-0.5">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Category mix */}
              <Card>
                <CardBody>
                  <h2 className="font-semibold">Enrollments by category</h2>
                  <p className="text-xs text-[var(--muted)] mb-3">Where learners are spending time</p>
                  {(data?.categoryMix ?? []).length === 0 ? <Empty /> : (
                    <div className="h-[200px]">
                      <BarChart data={data!.categoryMix} height={200} />
                    </div>
                  )}
                </CardBody>
              </Card>
            </>
          )}

          {/* ── REVENUE ── */}
          {section === "revenue" && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Gross revenue" value={money(totals?.revenue ?? 0, currency)}    icon={<Icon.DollarSign size={18} />} tone="success" delta={`${totals?.transactions ?? 0} transactions`} />
                <StatCard label="Refunded"       value={money(totals?.refunded ?? 0, currency)}  icon={<Icon.AlertCircle size={18} />} tone="warning" delta="Total refunded" />
                <StatCard label="Net revenue"    value={money(netRevenue, currency)}              icon={<Icon.TrendingUp size={18} />} tone="primary" delta="After refunds" />
                <StatCard label="Avg order"
                  value={totals?.transactions ? money(Math.round((totals.revenue) / totals.transactions), currency) : "—"}
                  icon={<Icon.CreditCard size={18} />} tone="accent" delta="Per transaction" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardBody>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h2 className="font-semibold">Revenue per month</h2>
                        <p className="text-xs text-[var(--muted)]">Completed charges · {money(totals?.revenue ?? 0, currency)} total</p>
                      </div>
                      {revGrowth !== null && (
                        <Badge variant={revGrowth >= 0 ? "success" : "danger"}>
                          {revGrowth >= 0 ? "↑" : "↓"} {Math.abs(revGrowth)}% MoM
                        </Badge>
                      )}
                    </div>
                    <div className="h-[220px]">
                      <BarChart data={monthly.map((m) => ({ label: m.label, value: m.revenue / 100 }))} height={220} valueLabel={(v) => shortMoney(v * 100)} />
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <h2 className="font-semibold">Payments by method</h2>
                    <p className="text-xs text-[var(--muted)] mb-3">Completed charges by payment type</p>
                    {(data?.paymentMethods ?? []).length === 0 ? <Empty /> : (
                      <div className="h-[220px]">
                        <BarChart data={data!.paymentMethods.map((m) => ({ label: m.label.charAt(0).toUpperCase() + m.label.slice(1), value: m.value }))} height={220} />
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>

              {/* Revenue breakdown table */}
              <Card>
                <CardBody>
                  <h2 className="font-semibold mb-3">Monthly revenue breakdown</h2>
                  <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] text-xs uppercase tracking-wider">
                          <th className="px-4 py-3 text-left font-semibold">Month</th>
                          <th className="px-4 py-3 text-right font-semibold">Revenue</th>
                          <th className="px-4 py-3 text-right font-semibold">Enrollments</th>
                          <th className="px-4 py-3 text-right font-semibold">Signups</th>
                          <th className="px-4 py-3 text-right font-semibold">Completions</th>
                          <th className="px-4 py-3 text-right font-semibold">MoM</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {[...monthly].reverse().map((m, i, arr) => {
                          const prev = arr[i + 1];
                          const mom  = prev && prev.revenue > 0 ? Math.round(((m.revenue - prev.revenue) / prev.revenue) * 100) : null;
                          return (
                            <tr key={m.label} className="hover:bg-[var(--surface-2)]/60 transition-colors">
                              <td className="px-4 py-3 font-medium">{m.label}</td>
                              <td className="px-4 py-3 text-right tabular-nums font-semibold">{money(m.revenue, currency)}</td>
                              <td className="px-4 py-3 text-right tabular-nums text-[var(--muted)]">{m.enrollments}</td>
                              <td className="px-4 py-3 text-right tabular-nums text-[var(--muted)]">{m.signups}</td>
                              <td className="px-4 py-3 text-right tabular-nums text-[var(--muted)]">{m.completions}</td>
                              <td className="px-4 py-3 text-right">
                                {mom !== null ? (
                                  <span className={cn("text-xs font-semibold", mom >= 0 ? "text-emerald-500" : "text-red-500")}>
                                    {mom >= 0 ? "+" : ""}{mom}%
                                  </span>
                                ) : <span className="text-[var(--muted-2)] text-xs">—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            </>
          )}

          {/* ── LEARNING ── */}
          {section === "learning" && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Enrollments"    value={totals?.enrollments ?? 0}        icon={<Icon.ListChecks size={18} />} tone="primary" delta="All-time" />
                <StatCard label="Completions"    value={totals?.completions ?? 0}        icon={<Icon.CheckCircle size={18} />} tone="success" delta={`${totals?.completionRate ?? 0}% rate`} />
                <StatCard label="Certificates"   value={totals?.certificates ?? 0}       icon={<Icon.Award size={18} />} tone="warning" delta="Issued" />
                <StatCard label="New signups"    value={monthly.reduce((s, m) => s + m.signups, 0)} icon={<Icon.User size={18} />} tone="accent" delta={`In ${range} months`} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardBody>
                    <h2 className="font-semibold">Completions per month</h2>
                    <p className="text-xs text-[var(--muted)] mb-3">Courses fully completed by students</p>
                    <div className="h-[220px]">
                      <BarChart data={monthly.map((m) => ({ label: m.label, value: m.completions }))} height={220} />
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <h2 className="font-semibold">New signups per month</h2>
                    <p className="text-xs text-[var(--muted)] mb-3">Student &amp; instructor registrations</p>
                    <div className="h-[220px]">
                      <BarChart data={monthly.map((m) => ({ label: m.label, value: m.signups }))} height={220} />
                    </div>
                  </CardBody>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                  <CardBody>
                    <h2 className="font-semibold">Enrollment vs completion trend</h2>
                    <p className="text-xs text-[var(--muted)] mb-3">Monthly enrollments (line) and completions (bars)</p>
                    <div className="h-[220px]">
                      <LineChart data={monthly.map((m) => ({ day: m.label, hours: m.enrollments }))} height={220} yFormatter={(v) => Math.round(v).toString()} />
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <h2 className="font-semibold mb-1">Platform health</h2>
                    <p className="text-xs text-[var(--muted)] mb-4">Key quality metrics</p>
                    <div className="space-y-4">
                      {[
                        { label: "Completion rate", value: totals?.completionRate ?? 0, color: "from-emerald-500 to-green-400" },
                        { label: "Certification rate", value: totals?.enrollments ? Math.round(((totals.certificates) / totals.enrollments) * 100) : 0, color: "from-[var(--primary)] to-[var(--accent)]" },
                        { label: "Avg rating / 5.0", value: totals?.avgRating ? Math.round(totals.avgRating * 20) : 0, color: "from-amber-500 to-yellow-400" },
                      ].map((m) => (
                        <div key={m.label}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-[var(--muted)]">{m.label}</span>
                            <span className="font-semibold">{m.value}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                            <div className={cn("h-full rounded-full bg-gradient-to-r transition-all", m.color)} style={{ width: `${m.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </div>
            </>
          )}

          {/* ── TOP COURSES ── */}
          {section === "courses" && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Total courses"  value={totals?.courses ?? 0}   icon={<Icon.Book size={18} />}       tone="primary" delta="In catalog" />
                <StatCard label="Top revenue"    value={data?.topCourses?.[0] ? money(data.topCourses[0].revenue, currency) : "—"} icon={<Icon.DollarSign size={18} />} tone="success" delta={data?.topCourses?.[0]?.title?.slice(0, 20) ?? ""} />
                <StatCard label="Top enrolled"   value={data?.topCourses?.[0]?.enrollments ?? 0} icon={<Icon.Users size={18} />} tone="accent" delta="Most popular course" />
                <StatCard label="Avg per course" value={totals?.courses && totals.enrollments ? Math.round(totals.enrollments / totals.courses) : 0} icon={<Icon.TrendingUp size={18} />} tone="warning" delta="Enrollments per course" />
              </div>

              {(data?.topCourses ?? []).length === 0 ? (
                <Card><CardBody><Empty /></CardBody></Card>
              ) : (
                <Card>
                  <CardBody>
                    <h2 className="font-semibold mb-4">Top courses by enrollment &amp; revenue</h2>
                    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] text-xs uppercase tracking-wider">
                            <th className="px-4 py-3 text-left font-semibold w-8">#</th>
                            <th className="px-4 py-3 text-left font-semibold">Course</th>
                            <th className="px-4 py-3 text-left font-semibold">Enrollments</th>
                            <th className="px-4 py-3 text-right font-semibold">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {data!.topCourses.map((c, i) => (
                            <tr key={c.id} className="hover:bg-[var(--surface-2)]/60 transition-colors">
                              <td className="px-4 py-4">
                                <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                                  i === 0 ? "bg-amber-500 text-white" :
                                  i === 1 ? "bg-slate-400 text-white" :
                                  i === 2 ? "bg-amber-700/60 text-white" :
                                  "bg-[var(--surface-2)] text-[var(--muted)]"
                                )}>
                                  {i + 1}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <p className="font-semibold truncate max-w-[280px]">{c.title}</p>
                                <div className="mt-1.5 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden w-full max-w-[280px]">
                                  <div className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" style={{ width: `${(c.enrollments / topMax) * 100}%` }} />
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className="font-semibold">{c.enrollments}</span>
                                <span className="text-xs text-[var(--muted)] ml-1">{c.enrollments === 1 ? "learner" : "learners"}</span>
                              </td>
                              <td className="px-4 py-4 text-right font-semibold tabular-nums">
                                {money(c.revenue, currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Category bar */}
              <Card>
                <CardBody>
                  <h2 className="font-semibold">Enrollments by category</h2>
                  <p className="text-xs text-[var(--muted)] mb-3">Distribution across course categories</p>
                  {(data?.categoryMix ?? []).length === 0 ? <Empty /> : (
                    <div className="space-y-3">
                      {data!.categoryMix.map((c) => {
                        const catMax = Math.max(...data!.categoryMix.map((x) => x.value), 1);
                        return (
                          <div key={c.label}>
                            <ProgressBar label={c.label} value={(c.value / catMax) * 100} hint={`${c.value} enrollments`} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardBody>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="h-10 w-10 rounded-full bg-[var(--surface-2)] text-[var(--muted-2)] flex items-center justify-center">
        <Icon.BarChart3 size={18} />
      </div>
      <p className="text-sm text-[var(--muted)]">No data for this period yet.</p>
    </div>
  );
}
