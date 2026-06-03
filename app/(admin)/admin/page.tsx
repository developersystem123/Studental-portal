"use client";

import * as React from "react";
import Link from "next/link";
import Icon from "@/components/icons";
import { Card, CardBody, Badge } from "@/components/ui";
import { BarChart, Donut, LineChart, ProgressBar, Sparkline } from "@/components/charts";
import { useAdmin, useAuth, useData } from "@/lib/store";
import { relativeTime } from "@/lib/utils";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// How often the dashboard re-pulls data from the database.
const REFRESH_MS = 20_000;

const MRR_MOCK = [
  { day: "Jun '25", hours: 12400 },
  { day: "Jul '25", hours: 14800 },
  { day: "Aug '25", hours: 16200 },
  { day: "Sep '25", hours: 18900 },
  { day: "Oct '25", hours: 21400 },
  { day: "Nov '25", hours: 24100 },
  { day: "Dec '25", hours: 27800 },
  { day: "Jan '26", hours: 31200 },
  { day: "Feb '26", hours: 34600 },
  { day: "Mar '26", hours: 38100 },
  { day: "Apr '26", hours: 42800 },
  { day: "May '26", hours: 47500 },
];

const PLATFORM_HEALTH = [
  { label: "Uptime (30 days)", value: "99.97%", icon: "CheckCircle" as const, tone: "text-emerald-500" },
  { label: "Avg API response", value: "142ms", icon: "Clock" as const, tone: "text-blue-500" },
  { label: "Error rate", value: "0.03%", icon: "AlertCircle" as const, tone: "text-amber-500" },
  { label: "AI queries today", value: "4,812", icon: "Sparkles" as const, tone: "text-violet-500" },
  { label: "Active sessions", value: "3,842", icon: "Users" as const, tone: "text-pink-500" },
  { label: "Storage used", value: "1.4 / 5 TB", icon: "Inbox" as const, tone: "text-sky-500" },
];

// Index of a date within a rolling window that ends in the current month.
// Returns < 0 for dates before the window, >= months for future dates.
function monthIndex(t: number, months: number) {
  const now = new Date();
  const d = new Date(t);
  return months - 1 - ((now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()));
}

// New items per calendar month over the last `months` months.
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

// Running cumulative total per month — the real grand total each month,
// counting everything created before the window as the starting baseline.
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
  for (let i = 0; i < months; i++) {
    running += perMonth[i];
    series.push(running);
  }
  return series;
}

export default function AdminOverviewPage() {
  const admin = useAdmin();
  const { user } = useAuth();
  const { courses } = useData();

  const stats = admin.stats();
  const students = admin.listStudents();
  const teachers = admin.listTeachers();
  const enrollments = admin.listEnrollments();

  // ---------- Live auto-refresh ----------
  const [lastUpdated, setLastUpdated] = React.useState<Date>(() => new Date());
  const [refreshing, setRefreshing] = React.useState(false);

  const doRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await admin.refresh();
      setLastUpdated(new Date());
    } finally {
      setRefreshing(false);
    }
  }, [admin]);

  // Re-pull from the database on a fixed interval so the dashboard stays live.
  React.useEffect(() => {
    const id = setInterval(doRefresh, REFRESH_MS);
    return () => clearInterval(id);
  }, [doRefresh]);

  // ---------- Derived data (all real, straight from the database) ----------
  const hasEnrollments = enrollments.length > 0;

  const recentStudents = [...students]
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, 5);
  const recentEnrollments = enrollments.slice(0, 6);

  // Enrollment trend over the last 6 months.
  const trend = countByMonth(enrollments.map((e) => e.enrolledAt), 6);
  const trendTotal = trend.reduce((sum, b) => sum + b.hours, 0);

  // Enrollments by course category.
  const categoryCount = new Map<string, number>();
  for (const e of enrollments) {
    const course = courses.find((c) => c.id === e.courseId);
    if (!course) continue;
    categoryCount.set(course.category, (categoryCount.get(course.category) ?? 0) + 1);
  }
  const topCategories = Array.from(categoryCount.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Completion rate.
  const completedCount = enrollments.filter((e) => e.completed).length;
  const activeCount = enrollments.length - completedCount;
  const completionRate = hasEnrollments
    ? Math.round((completedCount / enrollments.length) * 100)
    : 0;

  // Top courses by enrollment.
  const courseCount = new Map<string, number>();
  for (const e of enrollments) {
    courseCount.set(e.courseId, (courseCount.get(e.courseId) ?? 0) + 1);
  }
  const topCourses = Array.from(courseCount.entries())
    .map(([id, count]) => ({ course: courses.find((c) => c.id === id), count }))
    .filter((x): x is { course: NonNullable<typeof x.course>; count: number } => !!x.course)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const topCourseMax = topCourses[0]?.count ?? 1;

  // Cumulative growth series for the stat-card sparklines.
  const sparkStudents = cumulativeByMonth(
    students.map((s) => s.createdAt ?? "").filter(Boolean),
    6,
  );
  const sparkTeachers = cumulativeByMonth(
    teachers.map((t) => t.createdAt ?? "").filter(Boolean),
    6,
  );
  const sparkEnroll = cumulativeByMonth(enrollments.map((e) => e.enrolledAt), 6);
  const sparkCerts = cumulativeByMonth(
    enrollments.filter((e) => e.completed).map((e) => e.enrolledAt),
    6,
  );

  const cards: {
    label: string;
    value: number;
    icon: React.ReactNode;
    href: string;
    hint: string;
    series: number[];
    alert?: boolean;
  }[] = [
    {
      label: "Students",
      value: stats.students,
      icon: <Icon.User size={18} />,
      href: "/admin/students",
      hint: "Registered learners",
      series: sparkStudents,
    },
    {
      label: "Teachers",
      value: stats.teachers,
      icon: <Icon.Sparkles size={18} />,
      href: "/admin/teachers",
      hint: "Active instructors",
      series: sparkTeachers,
    },
    {
      label: "Courses",
      value: stats.courses,
      icon: <Icon.Book size={18} />,
      href: "/admin/courses",
      hint: "Published in the catalog",
      series: [] as number[],
    },
    {
      label: "Enrollments",
      value: stats.enrollments,
      icon: <Icon.ListChecks size={18} />,
      href: "/admin/enrollments",
      hint: "Across all students",
      series: sparkEnroll,
    },
    {
      label: "Certificates",
      value: stats.certificates,
      icon: <Icon.Award size={18} />,
      href: "/admin/certificates",
      hint: "Awarded so far",
      series: sparkCerts,
    },
    {
      label: "Pending",
      value: stats.pendingApplications,
      icon: <Icon.Inbox size={18} />,
      href: "/admin/applications",
      hint: "Applications to review",
      series: [] as number[],
      alert: stats.pendingApplications > 0,
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white p-6 sm:p-8 card-shadow">
        <AdminHeroDecor />
        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20 uppercase tracking-wider font-semibold">
              <Icon.Settings size={11} /> Admin console
            </span>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
              Welcome back, {user?.name?.split(" ")[0] ?? "Admin"}
            </h1>
            <p className="mt-2 text-white/85 max-w-xl">
              A live snapshot of your students, teachers, courses, and recent activity. Use the quick links below to manage everything.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Link
              href="/admin/students"
              className="inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-sm font-semibold transition"
            >
              <Icon.Plus size={16} /> Add student
            </Link>
            <Link
              href="/admin/courses"
              className="inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-white text-[var(--primary)] hover:brightness-95 text-sm font-semibold transition"
            >
              <Icon.Book size={16} /> New course
            </Link>
          </div>
        </div>
      </div>

      {/* Live status bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <LivePulse />
          <span>
            Auto-refreshes every {REFRESH_MS / 1000}s · Updated{" "}
            <span className="font-medium text-[var(--foreground)]">{relativeTime(lastUpdated)}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={doRefresh}
          disabled={refreshing}
          className="inline-flex h-8 items-center gap-1.5 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-xs font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {refreshing ? <Icon.Loader size={14} /> : <RefreshIcon size={14} />}
          {refreshing ? "Updating…" : "Refresh"}
        </button>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { href: "/admin/students", label: "Add student", icon: <Icon.User size={18} />, tint: "from-violet-600 to-indigo-500" },
          { href: "/admin/teachers", label: "Add teacher", icon: <Icon.Sparkles size={18} />, tint: "from-emerald-600 to-teal-500" },
          { href: "/admin/courses", label: "New course", icon: <Icon.Book size={18} />, tint: "from-sky-500 to-blue-500" },
          { href: "/admin/live-classes", label: "Live class", icon: <Icon.Video size={18} />, tint: "from-rose-500 to-pink-500" },
          { href: "/admin/applications", label: "Applications", icon: <Icon.Inbox size={18} />, tint: "from-amber-500 to-orange-500", alert: stats.pendingApplications > 0, badge: stats.pendingApplications || undefined },
          { href: "/admin/reports", label: "Reports", icon: <Icon.BarChart3 size={18} />, tint: "from-fuchsia-500 to-purple-500" },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="relative block group">
            <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${a.tint} text-white p-4 flex flex-col gap-2 hover:shadow-lg transition-all hover:-translate-y-0.5`}>
              {a.icon}
              <p className="text-xs font-semibold leading-tight">{a.label}</p>
              {a.badge !== undefined && a.badge > 0 && (
                <span className="absolute top-2 right-2 h-5 min-w-[20px] px-1 rounded-full bg-white text-[var(--primary)] text-[10px] font-bold flex items-center justify-center">
                  {a.badge}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Stat cards with live sparklines */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="block group">
            <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-0.5 hover:border-[var(--primary)]/30">
              <CardBody className="space-y-2">
                <div className="flex items-center justify-between">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ring-1 ${
                      c.alert
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/25"
                        : "bg-[var(--primary-soft)] text-[var(--primary)] ring-[var(--primary)]/15"
                    }`}
                  >
                    {c.icon}
                  </div>
                  <Icon.ChevronRight
                    size={16}
                    className="text-[var(--muted-2)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition"
                  />
                </div>
                <p className="text-3xl font-bold tracking-tight">{c.value}</p>
                <p className="text-xs font-medium text-[var(--foreground)]">{c.label}</p>
                <div className="flex items-end justify-between gap-2 pt-1">
                  <p className="text-[11px] text-[var(--muted-2)]">{c.hint}</p>
                  {c.series.length >= 2 && (
                    <Sparkline data={c.series} width={64} height={26} />
                  )}
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts row 1: enrollment trend + completion rate */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  Enrollment trend
                  <LivePulse />
                </h2>
                <p className="text-xs text-[var(--muted)]">New enrollments over the last 6 months</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-semibold">
                <Icon.TrendingUp size={12} /> {trendTotal} in 6 mo
              </span>
            </div>
            {hasEnrollments ? (
              <div className="h-[220px] mt-3">
                <LineChart data={trend} yFormatter={(v) => Math.round(v).toString()} />
              </div>
            ) : (
              <ChartEmpty label="No enrollments yet — the trend appears here as students join courses." />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold">Completion rate</h2>
              <Badge variant="info">{completionRate}%</Badge>
            </div>
            <p className="text-xs text-[var(--muted)]">Across all enrollments</p>
            {hasEnrollments ? (
              <>
                <div className="flex items-center justify-center py-4">
                  <Donut value={completionRate} size={160} label="completed" />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="rounded-xl bg-[var(--surface-2)] p-2.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold">Active</p>
                    <p className="text-sm font-bold mt-0.5">{activeCount}</p>
                  </div>
                  <div className="rounded-xl bg-[var(--surface-2)] p-2.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] font-semibold">Done</p>
                    <p className="text-sm font-bold mt-0.5">{completedCount}</p>
                  </div>
                </div>
              </>
            ) : (
              <ChartEmpty label="No enrollments to measure yet." />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Charts row 2: category bars + top courses */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="font-semibold">Top categories</h2>
                <p className="text-xs text-[var(--muted)]">Enrollments by course category</p>
              </div>
              <Icon.PieChart size={16} className="text-[var(--muted-2)]" />
            </div>
            {topCategories.length === 0 ? (
              <ChartEmpty label="No enrollments yet." />
            ) : (
              <div className="h-[240px] mt-3">
                <BarChart data={topCategories} height={240} />
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
              <Link href="/admin/courses" className="text-xs text-[var(--primary)] hover:underline font-medium">
                Manage
              </Link>
            </div>
            {topCourses.length === 0 ? (
              <ChartEmpty label="No enrollments yet." />
            ) : (
              <ul className="space-y-3">
                {topCourses.map(({ course, count }) => (
                  <li key={course.id}>
                    <ProgressBar
                      label={course.title}
                      value={(count / topCourseMax) * 100}
                      hint={`${count} ${count === 1 ? "learner" : "learners"}`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Revenue & Platform health */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  Monthly Recurring Revenue
                  <LivePulse />
                </h2>
                <p className="text-xs text-[var(--muted)]">Platform MRR growth — last 12 months</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">Sample data</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Icon.TrendingUp size={12} /> $47,500 / mo
                </span>
              </div>
            </div>
            <div className="h-[220px] mt-3">
              <LineChart data={MRR_MOCK} yFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-3">
            <h2 className="font-semibold">Platform health</h2>
            {PLATFORM_HEALTH.map((item) => {
              const Icn = Icon[item.icon];
              return (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-[var(--muted)]">
                    <Icn size={14} className={item.tone} />
                    {item.label}
                  </span>
                  <span className="font-semibold tabular-nums">{item.value}</span>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Recent students</h2>
              <Link href="/admin/students" className="text-xs text-[var(--primary)] hover:underline font-medium">
                View all
              </Link>
            </div>
            {recentStudents.length === 0 ? (
              <p className="text-sm text-[var(--muted)] py-6 text-center">No students yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentStudents.map((s) => (
                  <li key={s.id} className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white font-semibold inline-flex items-center justify-center text-sm">
                      {s.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-xs text-[var(--muted)] truncate">{s.email}</p>
                    </div>
                    <Badge variant="default">
                      {s.enrolledCount} {s.enrolledCount === 1 ? "course" : "courses"}
                    </Badge>
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
              <Link href="/admin/enrollments" className="text-xs text-[var(--primary)] hover:underline font-medium">
                View all
              </Link>
            </div>
            {recentEnrollments.length === 0 ? (
              <p className="text-sm text-[var(--muted)] py-6 text-center">No enrollments yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentEnrollments.map((e) => (
                  <li key={`${e.userId}-${e.courseId}`} className="flex items-start gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                      <Icon.Book size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.courseTitle}</p>
                      <p className="text-xs text-[var(--muted)] truncate">
                        {e.userName} · {relativeTime(e.enrolledAt)}
                      </p>
                    </div>
                    {e.completed ? (
                      <Badge variant="success">Completed</Badge>
                    ) : (
                      <Badge variant="info">{e.progress}%</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Course catalog</h2>
            <Link href="/admin/courses" className="text-xs text-[var(--primary)] hover:underline font-medium">
              Manage
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {courses.slice(0, 6).map((c) => (
              <Link key={c.id} href="/admin/courses" className="group">
                <div className="aspect-video rounded-xl overflow-hidden border border-[var(--border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                </div>
                <p className="mt-2 text-xs font-medium truncate">{c.title}</p>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

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
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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
      <svg viewBox="0 0 800 220" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="admin-dots" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" fill="white" />
          </pattern>
          <linearGradient id="admin-wave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="0.15" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#admin-dots)" opacity="0.25" />
        <path d="M0 160 Q 200 110 400 150 T 800 130 L 800 220 L 0 220 Z" fill="url(#admin-wave)" />
        <circle cx="700" cy="50" r="60" fill="white" opacity="0.07" />
        <circle cx="640" cy="40" r="28" fill="white" opacity="0.10" />
        <g opacity="0.18">
          <rect x="540" y="120" width="40" height="40" rx="8" fill="white" transform="rotate(12 560 140)" />
          <circle cx="610" cy="170" r="10" fill="white" />
          <path d="M460 70 l8 -14 l8 14 z" fill="white" />
        </g>
      </svg>
    </div>
  );
}
