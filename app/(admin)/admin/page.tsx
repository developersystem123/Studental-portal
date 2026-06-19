"use client";

import * as React from "react";
import Link from "next/link";
import Icon from "@/components/icons";
import { Card, CardBody, Badge } from "@/components/ui";
import { BarChart, Donut, LineChart, ProgressBar, Sparkline } from "@/components/charts";
import { useAdmin, useAuth, useData } from "@/lib/store";
import { relativeTime } from "@/lib/utils";

/* ─── Constants ─────────────────────────────────────────────────────────── */

const REFRESH_MS = 20_000;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* ─── Report API types ───────────────────────────────────────────────────── */

type ReportsData = {
  months: number;
  monthly: { label: string; enrollments: number; signups: number; revenue: number; completions: number }[];
  totals: {
    revenue: number; refunded: number; students: number; teachers: number; courses: number;
    enrollments: number; completions: number; certificates: number; transactions: number;
    reviews: number; avgRating: number; completionRate: number; currency: string;
  };
  topCourses: { id: string; title: string; enrollments: number; revenue: number }[];
  categoryMix: { label: string; value: number }[];
  paymentMethods: { label: string; value: number }[];
};

type SubStats = { active: number; total: number; mrr: number };
type TicketStats = { open: number; in_progress: number; urgent: number; total: number };

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function monthIndex(t: number, months: number) {
  const now = new Date();
  const d = new Date(t);
  return months - 1 - ((now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()));
}

function countByMonth(dates: string[], months = 6) {
  const now = new Date();
  const buckets: { day: string; hours: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ day: MONTH_LABELS[d.getMonth()], hours: 0 });
  }
  for (const iso of dates) {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) continue;
    const idx = monthIndex(t, months);
    if (idx >= 0 && idx < months) buckets[idx].hours += 1;
  }
  return buckets;
}

function cumulativeByMonth(dates: string[], months = 6): number[] {
  const perMonth = new Array(months).fill(0);
  let baseline = 0;
  for (const iso of dates) {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) continue;
    const idx = monthIndex(t, months);
    if (idx < 0) baseline += 1;
    else if (idx < months) perMonth[idx] += 1;
  }
  const series: number[] = [];
  let running = baseline;
  for (let i = 0; i < months; i++) { running += perMonth[i]; series.push(running); }
  return series;
}

function money(cents: number, currency = "USD") {
  const v = cents / 100;
  return v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`;
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function AdminOverviewPage() {
  const admin = useAdmin();
  const { user } = useAuth();
  const { courses } = useData();

  const stats = admin.stats();
  const students = admin.listStudents();
  const teachers = admin.listTeachers();
  const enrollments = admin.listEnrollments();

  /* Live refresh */
  const [lastUpdated, setLastUpdated] = React.useState<Date>(() => new Date());
  const [refreshing, setRefreshing] = React.useState(false);

  /* Extra API data */
  const [reports,     setReports]     = React.useState<ReportsData | null>(null);
  const [subStats,    setSubStats]    = React.useState<SubStats>({ active: 0, total: 0, mrr: 0 });
  const [ticketStats, setTicketStats] = React.useState<TicketStats>({ open: 0, in_progress: 0, urgent: 0, total: 0 });
  const [reportsLoading, setReportsLoading] = React.useState(true);

  /* Chart view toggle */
  const [trendView, setTrendView] = React.useState<"enrollments" | "signups" | "revenue">("enrollments");
  const [chartPeriod, setChartPeriod] = React.useState<6 | 12>(6);

  const doRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await admin.refresh();
      setLastUpdated(new Date());
    } finally {
      setRefreshing(false);
    }
  }, [admin]);

  /* Fetch reports + subscriptions + tickets */
  const fetchExtra = React.useCallback(async () => {
    try {
      const [repRes, subRes, tickRes] = await Promise.all([
        fetch(`/api/admin/reports?months=${chartPeriod}`, { credentials: "same-origin" }),
        fetch("/api/admin/subscriptions",                 { credentials: "same-origin" }),
        fetch("/api/admin/support",                       { credentials: "same-origin" }),
      ]);
      if (repRes.ok) {
        const d: ReportsData = await repRes.json();
        setReports(d);
      }
      if (subRes.ok) {
        const d = await subRes.json() as { subscriptions: { status: string; amount: number; interval: string }[] };
        const subs = d.subscriptions ?? [];
        const active = subs.filter((s) => s.status === "active");
        const mrr = active.reduce((acc, s) => acc + (s.interval === "annual" ? Math.round(s.amount / 12) : s.amount), 0);
        setSubStats({ active: active.length, total: subs.length, mrr });
      }
      if (tickRes.ok) {
        const d = await tickRes.json() as { tickets: { status: string; priority: string }[] };
        const t = d.tickets ?? [];
        setTicketStats({
          total: t.length,
          open: t.filter((x) => x.status === "open").length,
          in_progress: t.filter((x) => x.status === "in_progress").length,
          urgent: t.filter((x) => x.priority === "urgent").length,
        });
      }
    } catch { /* keep previous data */ }
    finally { setReportsLoading(false); }
  }, [chartPeriod]);

  React.useEffect(() => { fetchExtra(); }, [fetchExtra]);
  React.useEffect(() => { const id = setInterval(doRefresh, REFRESH_MS); return () => clearInterval(id); }, [doRefresh]);

  /* ── Derived from store data ─────────────────────────────────────────── */
  const hasEnrollments = enrollments.length > 0;
  const recentStudents = [...students].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).slice(0, 5);

  const completedCount = enrollments.filter((e) => e.completed).length;
  const activeEnrollCount = enrollments.length - completedCount;
  const completionRate = hasEnrollments ? Math.round((completedCount / enrollments.length) * 100) : 0;

  const courseCount = new Map<string, number>();
  for (const e of enrollments) courseCount.set(e.courseId, (courseCount.get(e.courseId) ?? 0) + 1);
  const topCourses = Array.from(courseCount.entries())
    .map(([id, count]) => ({ course: courses.find((c) => c.id === id), count }))
    .filter((x): x is { course: NonNullable<typeof x.course>; count: number } => !!x.course)
    .sort((a, b) => b.count - a.count).slice(0, 5);
  const topCourseMax = topCourses[0]?.count ?? 1;

  const sparkStudents = cumulativeByMonth(students.map((s) => s.createdAt ?? "").filter(Boolean), 6);
  const sparkTeachers = cumulativeByMonth(teachers.map((t) => t.createdAt ?? "").filter(Boolean), 6);
  const sparkEnroll   = cumulativeByMonth(enrollments.map((e) => e.enrolledAt), 6);
  const sparkCerts    = cumulativeByMonth(enrollments.filter((e) => e.completed).map((e) => e.enrolledAt), 6);

  const enrollmentTrend = countByMonth(enrollments.map((e) => e.enrolledAt), 6);
  const enrollmentTrendTotal = enrollmentTrend.reduce((s, b) => s + b.hours, 0);

  /* ── Chart data from reports API ─────────────────────────────────────── */
  const revenueTrend = reports?.monthly.map((m) => ({ day: m.label, hours: m.revenue })) ?? [];
  const signupsTrend = reports?.monthly.map((m) => ({ day: m.label, hours: m.signups })) ?? [];
  const enrollTrend  = reports?.monthly.map((m) => ({ day: m.label, hours: m.enrollments })) ?? enrollmentTrend;

  const activeTrendData  = trendView === "revenue" ? revenueTrend : trendView === "signups" ? signupsTrend : enrollTrend;
  const trendTotal = trendView === "revenue"
    ? money(reports?.totals.revenue ?? 0)
    : trendView === "signups"
    ? `${reports?.totals.students ?? 0} users`
    : `${reports?.totals.enrollments ?? 0} enrollments`;

  const totalRevenue = reports?.totals.revenue ?? 0;
  const avgRating    = reports?.totals.avgRating ?? 0;
  const payMethods   = reports?.paymentMethods ?? [];
  const recentPayments = reports?.topCourses.slice(0, 5) ?? [];

  /* ── Stat cards ─────────────────────────────────────────────────────── */
  const statCards: {
    label: string; value: string | number; icon: React.ReactNode;
    href: string; hint: string; series?: number[]; tone?: string; alert?: boolean;
  }[] = [
    { label: "Students",     value: stats.students,     icon: <Icon.User size={16} />,       href: "/admin/students",    hint: "Registered learners",   series: sparkStudents, tone: "primary" },
    { label: "Teachers",     value: stats.teachers,     icon: <Icon.Sparkles size={16} />,   href: "/admin/teachers",    hint: "Active instructors",    series: sparkTeachers, tone: "accent" },
    { label: "Courses",      value: stats.courses,      icon: <Icon.Book size={16} />,       href: "/admin/courses",     hint: "Published catalog",     tone: "sky" },
    { label: "Enrollments",  value: stats.enrollments,  icon: <Icon.ListChecks size={16} />, href: "/admin/enrollments", hint: "Across all students",   series: sparkEnroll,  tone: "emerald" },
    { label: "Certificates", value: stats.certificates, icon: <Icon.Award size={16} />,      href: "/admin/certificates",hint: "Awarded so far",        series: sparkCerts,   tone: "amber" },
    { label: "Revenue",      value: money(totalRevenue),icon: <Icon.DollarSign size={16} />, href: "/admin/payments",    hint: "Total platform revenue",tone: "violet" },
    { label: "Active subs",  value: subStats.active,    icon: <Icon.Crown size={16} />,      href: "/admin/subscriptions",hint:`${subStats.total} total`,tone: "rose" },
    { label: "Open tickets", value: ticketStats.open,   icon: <Icon.MessageSquare size={16} />,href: "/admin/support", hint: ticketStats.urgent > 0 ? `${ticketStats.urgent} urgent` : "Support queue", alert: ticketStats.urgent > 0, tone: "orange" },
  ];

  const TONE_MAP: Record<string, string> = {
    primary: "bg-[var(--primary-soft)] text-[var(--primary)] ring-[var(--primary)]/15",
    accent:  "bg-[var(--accent-soft,var(--primary-soft))] text-[var(--accent)] ring-[var(--accent)]/15",
    sky:     "bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-sky-500/15",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/15",
    amber:   "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/15",
    violet:  "bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-violet-500/15",
    rose:    "bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/15",
    orange:  "bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-orange-500/15",
    warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/25",
  };

  return (
    <div className="space-y-6 fade-in">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white p-5 sm:p-6 card-shadow">
        <AdminHeroDecor />
        <div className="relative flex items-start justify-between gap-4 sm:gap-6">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20 uppercase tracking-wider font-semibold">
              <Icon.Settings size={11} /> Admin console
            </span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user?.name?.split(" ")[0] ?? "Admin"}
            </h1>
            <p className="mt-1.5 text-sm text-white/85 max-w-xl">
              Live snapshot of your platform — students, revenue, subscriptions, and support queues in one view.
            </p>
            {/* Hero mini-stats */}
            <div className="mt-3 flex flex-wrap gap-3">
              {[
                { label: "Students",    value: stats.students },
                { label: "Enrollments", value: stats.enrollments },
                { label: "Revenue",     value: money(totalRevenue) },
                { label: "Active subs", value: subStats.active },
              ].map((s) => (
                <div key={s.label} className="px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur border border-white/20">
                  <p className="text-[10px] uppercase tracking-wider text-white/70">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Link href="/admin/students" className="inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-sm font-semibold transition">
              <Icon.Plus size={16} /> Add student
            </Link>
            <Link href="/admin/courses" className="inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-white text-[var(--primary)] hover:brightness-95 text-sm font-semibold transition">
              <Icon.Book size={16} /> New course
            </Link>
          </div>
        </div>
      </div>

      {/* ── Live status bar ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <LivePulse />
          <span>
            Auto-refreshes every {REFRESH_MS / 1000}s · Updated{" "}
            <span className="font-medium text-[var(--foreground)]">{relativeTime(lastUpdated)}</span>
          </span>
        </div>
        <button
          onClick={doRefresh}
          disabled={refreshing}
          className="inline-flex h-8 items-center gap-1.5 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-xs font-semibold transition disabled:opacity-60"
        >
          {refreshing ? <Icon.Loader size={14} className="animate-spin" /> : <RefreshIcon size={14} />}
          {refreshing ? "Updating…" : "Refresh"}
        </button>
      </div>

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { href: "/admin/students",     label: "Add student",    icon: <Icon.User size={16} />,        tint: "from-violet-600 to-indigo-500" },
          { href: "/admin/teachers",     label: "Add teacher",    icon: <Icon.Sparkles size={16} />,    tint: "from-emerald-600 to-teal-500" },
          { href: "/admin/courses",      label: "New course",     icon: <Icon.Book size={16} />,        tint: "from-sky-500 to-blue-500" },
          { href: "/admin/live-classes", label: "Live class",     icon: <Icon.Video size={16} />,       tint: "from-rose-500 to-pink-500" },
          { href: "/admin/announcements",label: "Announce",       icon: <Icon.Megaphone size={16} />,   tint: "from-amber-500 to-orange-500" },
          { href: "/admin/coupons",      label: "Coupons",        icon: <Icon.Tag size={16} />,         tint: "from-teal-500 to-cyan-500" },
          { href: "/admin/support",      label: "Support",        icon: <Icon.MessageSquare size={16} />, tint: "from-fuchsia-500 to-purple-500", badge: ticketStats.open || undefined },
          { href: "/admin/reports",      label: "Reports",        icon: <Icon.BarChart3 size={16} />,   tint: "from-slate-600 to-slate-700" },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="relative block group">
            <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${a.tint} text-white p-3 flex flex-col gap-1.5 hover:shadow-lg transition-all hover:-translate-y-0.5`}>
              {a.icon}
              <p className="text-[11px] font-semibold leading-tight">{a.label}</p>
              {"badge" in a && a.badge !== undefined && a.badge > 0 && (
                <span className="absolute top-1.5 right-1.5 h-4 min-w-[16px] px-1 rounded-full bg-white text-[var(--primary)] text-[9px] font-bold flex items-center justify-center">
                  {a.badge}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* ── 8 Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {statCards.map((c) => {
          const toneClass = c.alert
            ? TONE_MAP.warning
            : TONE_MAP[c.tone ?? "primary"];
          return (
            <Link key={c.label} href={c.href} className="block group">
              <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-0.5 hover:border-[var(--primary)]/30">
                <CardBody className="!p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ring-1 ${toneClass}`}>
                      {c.icon}
                    </div>
                    <Icon.ChevronRight size={13} className="text-[var(--muted-2)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition" />
                  </div>
                  <p className="text-2xl font-bold tracking-tight">{c.value}</p>
                  <p className="text-[11px] font-medium text-[var(--foreground)] leading-tight">{c.label}</p>
                  <div className="flex items-end justify-between gap-1 pt-0.5">
                    <p className="min-w-0 truncate text-[10px] text-[var(--muted-2)] leading-tight">{c.hint}</p>
                    {c.series && c.series.length >= 2 && (
                      <span className="shrink-0"><Sparkline data={c.series} width={52} height={22} /></span>
                    )}
                  </div>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* ── Main chart + Completion donut ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  Platform trends
                  <LivePulse />
                </h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">Real data from the database</p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* View selector */}
                <div className="flex items-center rounded-lg border border-[var(--border)] overflow-hidden text-xs font-medium">
                  {(["enrollments", "signups", "revenue"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setTrendView(v)}
                      className={`px-2.5 py-1.5 capitalize transition ${
                        trendView === v
                          ? "bg-[var(--primary)] text-white"
                          : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                {/* Period selector */}
                <div className="flex items-center rounded-lg border border-[var(--border)] overflow-hidden text-xs font-medium">
                  {([6, 12] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setChartPeriod(m)}
                      className={`px-2.5 py-1.5 transition ${
                        chartPeriod === m
                          ? "bg-[var(--primary)] text-white"
                          : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                      }`}
                    >
                      {m}mo
                    </button>
                  ))}
                </div>
                <span className="text-[11px] px-2 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-semibold">
                  {trendTotal}
                </span>
              </div>
            </div>

            {reportsLoading ? (
              <div className="h-[240px] flex items-center justify-center gap-2 text-[var(--muted)]">
                <Icon.Loader size={18} className="animate-spin" /> Loading…
              </div>
            ) : activeTrendData.length > 0 ? (
              <div className="h-[240px] overflow-hidden">
                <LineChart
                  data={activeTrendData}
                  yFormatter={trendView === "revenue" ? (v) => `$${(v / 100).toFixed(0)}` : (v) => Math.round(v).toString()}
                />
              </div>
            ) : (
              <ChartEmpty label="No data yet for this period." />
            )}

            {/* Trend legend row */}
            {!reportsLoading && reports && (
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                {[
                  { label: "Enrollments", value: reports.totals.enrollments, color: "bg-[var(--primary)]" },
                  { label: "New users",   value: reports.totals.students + reports.totals.teachers, color: "bg-emerald-500" },
                  { label: "Revenue",     value: money(reports.totals.revenue), color: "bg-violet-500" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <span className={`h-2 w-2 rounded-full ${s.color}`} />
                      <span className="text-[10px] text-[var(--muted)]">{s.label}</span>
                    </div>
                    <p className="text-sm font-bold">{s.value}</p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Completion rate donut */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold">Completion rate</h2>
              <Badge variant="info">{completionRate}%</Badge>
            </div>
            <p className="text-xs text-[var(--muted)]">Across all enrollments</p>
            {hasEnrollments ? (
              <>
                <div className="flex items-center justify-center py-5">
                  <Donut value={completionRate} size={150} label="completed" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-[var(--surface-2)] p-2.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold">In progress</p>
                    <p className="text-lg font-bold mt-0.5 text-amber-600 dark:text-amber-400">{activeEnrollCount}</p>
                  </div>
                  <div className="rounded-xl bg-[var(--surface-2)] p-2.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold">Completed</p>
                    <p className="text-lg font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">{completedCount}</p>
                  </div>
                </div>
                {avgRating > 0 && (
                  <div className="mt-2 flex items-center justify-center gap-1.5 text-sm text-amber-500 font-semibold">
                    <Icon.Star size={14} />
                    {avgRating.toFixed(1)} avg rating · {reports?.totals.reviews ?? 0} reviews
                  </div>
                )}
              </>
            ) : (
              <ChartEmpty label="No enrollments to measure yet." />
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── Revenue breakdown + Subscriptions ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Payment methods */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold">Revenue by method</h2>
                <p className="text-xs text-[var(--muted)]">Payments received</p>
              </div>
              <Icon.CreditCard size={16} className="text-[var(--muted-2)]" />
            </div>
            {reportsLoading ? (
              <div className="flex justify-center py-8 text-[var(--muted)]"><Icon.Loader size={18} className="animate-spin" /></div>
            ) : payMethods.length > 0 ? (
              <>
                <div className="h-[130px] overflow-hidden">
                  <BarChart data={payMethods} height={130} />
                </div>
                <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2">
                  {payMethods.slice(0, 4).map((m) => {
                    const total = payMethods.reduce((s, x) => s + x.value, 0);
                    const pct = total > 0 ? Math.round((m.value / total) * 100) : 0;
                    return (
                      <div key={m.label} className="flex items-center justify-between text-xs">
                        <span className="capitalize text-[var(--muted)]">{m.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                            <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-semibold w-8 text-right">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <ChartEmpty label="No payments yet." />
            )}
          </CardBody>
        </Card>

        {/* Subscription overview */}
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Subscriptions</h2>
                <p className="text-xs text-[var(--muted)]">Active plans on the platform</p>
              </div>
              <Link href="/admin/subscriptions" className="text-xs text-[var(--primary)] hover:underline font-medium">Manage</Link>
            </div>

            <div className="flex items-center gap-3">
              <Donut
                value={subStats.total > 0 ? Math.round((subStats.active / subStats.total) * 100) : 0}
                size={90}
                label="active"
              />
              <div className="flex-1 space-y-2">
                {[
                  { label: "Active",    value: subStats.active,               cls: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Total",     value: subStats.total,                cls: "text-[var(--foreground)]" },
                  { label: "MRR",       value: `$${(subStats.mrr / 100).toFixed(0)}`, cls: "text-violet-600 dark:text-violet-400" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-xs">
                    <span className="text-[var(--muted)]">{s.label}</span>
                    <span className={`font-bold ${s.cls}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold">Monthly Recurring Revenue</p>
              <p className="text-2xl font-bold text-[var(--primary)]">${(subStats.mrr / 100).toFixed(0)}</p>
              <p className="text-xs text-[var(--muted)]">From {subStats.active} active subscriber{subStats.active !== 1 ? "s" : ""}</p>
            </div>
          </CardBody>
        </Card>

        {/* Support ticket overview */}
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Support queue</h2>
                <p className="text-xs text-[var(--muted)]">Open tickets needing attention</p>
              </div>
              <Link href="/admin/support" className="text-xs text-[var(--primary)] hover:underline font-medium">View all</Link>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Total",       value: ticketStats.total,       cls: "bg-[var(--surface-2)]", valueClass: "" },
                { label: "Open",        value: ticketStats.open,        cls: "bg-sky-500/10",           valueClass: "text-sky-600 dark:text-sky-400" },
                { label: "In progress", value: ticketStats.in_progress, cls: "bg-amber-500/10",         valueClass: "text-amber-600 dark:text-amber-400" },
                { label: "Urgent",      value: ticketStats.urgent,      cls: "bg-red-500/10",           valueClass: "text-red-600 dark:text-red-400" },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl p-3 text-center ${s.cls}`}>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold">{s.label}</p>
                  <p className={`text-2xl font-bold mt-0.5 ${s.valueClass}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {ticketStats.urgent > 0 && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                <span><strong>{ticketStats.urgent} urgent</strong> ticket{ticketStats.urgent !== 1 ? "s" : ""} need immediate attention</span>
              </div>
            )}

            <Link
              href="/admin/support"
              className="flex items-center justify-center gap-2 w-full h-9 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition"
            >
              <Icon.MessageSquare size={13} /> Open support panel
            </Link>
          </CardBody>
        </Card>
      </div>

      {/* ── Category distribution + Top courses ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="flex flex-col">
          <CardBody className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold">Top categories</h2>
                <p className="text-xs text-[var(--muted)]">Enrollments by course category</p>
              </div>
              <Icon.PieChart size={16} className="text-[var(--muted-2)]" />
            </div>
            {reportsLoading ? (
              <div className="flex-1 min-h-[220px] flex items-center justify-center text-[var(--muted)]"><Icon.Loader size={18} className="animate-spin" /></div>
            ) : (reports?.categoryMix?.length ?? 0) > 0 ? (
              <div className="flex-1 min-h-[220px] overflow-hidden">
                <BarChart data={reports!.categoryMix} height={420} />
              </div>
            ) : (
              <div className="flex-1 min-h-[220px] flex items-center justify-center">
                <ChartEmpty label="No enrollments yet." />
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold">Top courses</h2>
                <p className="text-xs text-[var(--muted)]">Most-enrolled courses on the platform</p>
              </div>
              <Link href="/admin/courses" className="text-xs text-[var(--primary)] hover:underline font-medium">Manage</Link>
            </div>
            {topCourses.length === 0 ? (
              <ChartEmpty label="No enrollments yet." />
            ) : (
              <ul className="space-y-3">
                {topCourses.map(({ course, count }, i) => (
                  <li key={course.id} className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-[var(--muted-2)] w-4 shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <ProgressBar
                        label={course.title}
                        value={(count / topCourseMax) * 100}
                        hint={`${count} learner${count !== 1 ? "s" : ""}`}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {/* API top courses with revenue */}
            {recentPayments.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[var(--border)] space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold">Top by revenue</p>
                {recentPayments.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <span className="truncate text-[var(--muted)] max-w-[16ch]">{c.title}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">{money(c.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── Recent activity ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Recent students</h2>
              <Link href="/admin/students" className="text-xs text-[var(--primary)] hover:underline font-medium">View all</Link>
            </div>
            {recentStudents.length === 0 ? (
              <p className="text-sm text-[var(--muted)] py-6 text-center">No students yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentStudents.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 group">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white font-semibold inline-flex items-center justify-center text-sm shrink-0">
                      {s.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-xs text-[var(--muted)] truncate">{s.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="default">{s.enrolledCount} course{s.enrolledCount !== 1 ? "s" : ""}</Badge>
                      <p className="text-[10px] text-[var(--muted-2)] mt-0.5">{relativeTime(s.createdAt ?? "")}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Recent enrollments</h2>
              <Link href="/admin/enrollments" className="text-xs text-[var(--primary)] hover:underline font-medium">View all</Link>
            </div>
            {enrollments.length === 0 ? (
              <p className="text-sm text-[var(--muted)] py-6 text-center">No enrollments yet.</p>
            ) : (
              <ul className="space-y-3">
                {enrollments.slice(0, 5).map((e) => (
                  <li key={`${e.userId}-${e.courseId}`} className="flex items-start gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                      <Icon.Book size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.courseTitle}</p>
                      <p className="text-xs text-[var(--muted)] truncate">{e.userName} · {relativeTime(e.enrolledAt)}</p>
                    </div>
                    <div className="shrink-0">
                      {e.completed ? (
                        <Badge variant="success">Done</Badge>
                      ) : (
                        <Badge variant="info">{e.progress}%</Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── Platform health + Course catalog ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Platform health */}
        <Card>
          <CardBody className="space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              Platform health
              <LivePulse />
            </h2>
            {[
              { label: "Uptime (30d)",   value: "99.97%",             icon: "CheckCircle" as const, tone: "text-emerald-500",   bar: 99.97 },
              { label: "Avg API resp",   value: "142ms",              icon: "Clock" as const,       tone: "text-blue-500",     bar: 90 },
              { label: "Error rate",     value: "0.03%",              icon: "AlertCircle" as const, tone: "text-amber-500",    bar: 2 },
              { label: "Storage used",  value: "1.4 / 5 TB",         icon: "Inbox" as const,       tone: "text-sky-500",      bar: 28 },
              { label: "Active sessions",value: "3,842",              icon: "Users" as const,       tone: "text-pink-500",     bar: 70 },
              { label: "AI queries/day", value: "4,812",              icon: "Sparkles" as const,    tone: "text-violet-500",   bar: 60 },
            ].map((item) => {
              const Icn = Icon[item.icon];
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-[var(--muted)]">
                      <Icn size={13} className={item.tone} />
                      {item.label}
                    </span>
                    <span className="font-semibold tabular-nums text-[var(--foreground)]">{item.value}</span>
                  </div>
                  <div className="h-1 rounded-full bg-[var(--border)]">
                    <div
                      className={`h-full rounded-full transition-all ${item.tone.replace("text-", "bg-").split(" ")[0]}`}
                      style={{ width: `${item.bar}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>

        {/* Course catalog */}
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">Course catalog</h2>
                <p className="text-xs text-[var(--muted)]">{courses.length} courses published</p>
              </div>
              <Link href="/admin/courses" className="text-xs text-[var(--primary)] hover:underline font-medium">Manage all</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {courses.slice(0, 6).map((c) => (
                <Link key={c.id} href="/admin/courses" className="group">
                  <div className="aspect-video rounded-lg overflow-hidden border border-[var(--border)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  </div>
                  <p className="mt-1.5 text-[11px] font-medium truncate">{c.title}</p>
                  <p className="text-[10px] text-[var(--muted)] capitalize">{String(c.category).replace(/_/g, " ")}</p>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-2 py-12">
      <div className="h-10 w-10 rounded-full bg-[var(--surface-2)] text-[var(--muted-2)] flex items-center justify-center">
        <Icon.BarChart3 size={18} />
      </div>
      <p className="text-sm text-[var(--muted)] max-w-[14rem]">{label}</p>
    </div>
  );
}

function RefreshIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function LivePulse() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      Live
    </span>
  );
}

function AdminHeroDecor() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg viewBox="0 0 800 240" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="admin-dots" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" fill="white" />
          </pattern>
          <linearGradient id="admin-wave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="0.18" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#admin-dots)" opacity="0.22" />
        <path d="M0 180 Q 200 130 400 165 T 800 145 L 800 240 L 0 240 Z" fill="url(#admin-wave)" />
        <circle cx="710" cy="55" r="70" fill="white" opacity="0.06" />
        <circle cx="650" cy="40" r="30" fill="white" opacity="0.09" />
        <g opacity="0.16">
          <rect x="550" y="130" width="44" height="44" rx="9" fill="white" transform="rotate(12 572 152)" />
          <circle cx="620" cy="180" r="12" fill="white" />
          <path d="M470 80 l9 -16 l9 16 z" fill="white" />
        </g>
      </svg>
    </div>
  );
}
