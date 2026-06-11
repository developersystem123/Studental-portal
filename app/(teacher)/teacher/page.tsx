"use client";

import * as React from "react";
import Link from "next/link";
import Icon from "@/components/icons";
import { Badge, Card, CardBody } from "@/components/ui";
import { BarChart, Donut, LineChart, ProgressBar, Sparkline } from "@/components/charts";
import { useAuth, useTeacher } from "@/lib/store";
import { relativeTime } from "@/lib/utils";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const EARNINGS_MOCK = [
  { day: "Dec", hours: 320 },
  { day: "Jan", hours: 480 },
  { day: "Feb", hours: 420 },
  { day: "Mar", hours: 680 },
  { day: "Apr", hours: 590 },
  { day: "May", hours: 810 },
];

const MOCK_REVIEWS = [
  { id: "r1", student: "Ali Khan", course: "Python Mastery", rating: 5, comment: "Excellent teaching style!", date: "2026-05-24" },
  { id: "r2", student: "Sara Ahmed", course: "Web Dev Pro", rating: 4, comment: "Very practical and well-paced.", date: "2026-05-22" },
  { id: "r3", student: "Usman Tariq", course: "Python Mastery", rating: 5, comment: "Best course I've taken this year!", date: "2026-05-20" },
];

const UPCOMING_CLASSES = [
  { id: "c1", title: "Python Live Q&A", time: "Today · 3:00 PM", students: 34, emoji: "🐍" },
  { id: "c2", title: "Web Dev Workshop #4", time: "Tomorrow · 10:00 AM", students: 28, emoji: "🌐" },
  { id: "c3", title: "UI/UX Design Review", time: "Jun 1 · 2:00 PM", students: 19, emoji: "🎨" },
];

function monthBuckets(dates: string[], months = 6) {
  const now = new Date();
  const buckets: { day: string; hours: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ day: MONTH_LABELS[d.getMonth()], hours: 0 });
  }
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1).getTime();
  for (const iso of dates) {
    const t = Date.parse(iso);
    if (Number.isNaN(t) || t < start) continue;
    const d = new Date(t);
    const idx = months - 1 - ((now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()));
    if (idx >= 0 && idx < months) buckets[idx].hours += 1;
  }
  return buckets;
}

export default function TeacherOverviewPage() {
  const { user } = useAuth();
  const teacher = useTeacher();
  const myCourses = teacher.myCourses();
  const myStudents = teacher.myStudents();
  const stats = teacher.stats();

  const recentStudents = myStudents.slice(0, 6);
  const loaded = teacher.loaded();
  const isDemo = loaded && myStudents.length === 0;

  const [lastUpdated, setLastUpdated] = React.useState<Date>(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setLastUpdated(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Enrollment trend across teacher's courses (last 6 months)
  const realTrend = monthBuckets(myStudents.map((s) => s.enrolledAt), 6);
  const demoTrend = realTrend.map((b, i) => ({ ...b, hours: [3, 5, 4, 7, 11, 14][i] ?? 0 }));
  const trendBuckets = isDemo ? demoTrend : realTrend;

  // Per-course enrollment counts
  const perCourseReal = myCourses
    .map((c) => {
      const list = myStudents.filter((s) => s.courseId === c.id);
      return {
        course: c,
        total: list.length,
        completed: list.filter((s) => s.completed).length,
        avgProgress: list.length
          ? Math.round(list.reduce((acc, s) => acc + s.progress, 0) / list.length)
          : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  const demoTotals = [18, 14, 10, 7, 5, 3];
  const demoAvg = [78, 64, 55, 47, 38, 30];
  const perCourse = isDemo
    ? myCourses.slice(0, 6).map((course, i) => ({
        course,
        total: demoTotals[i] ?? 2,
        completed: Math.round(((demoTotals[i] ?? 2) * (demoAvg[i] ?? 30)) / 100),
        avgProgress: demoAvg[i] ?? 30,
      }))
    : perCourseReal;

  const courseBarData = perCourse.slice(0, 6).map((p) => ({
    label: p.course.title.length > 14 ? p.course.title.slice(0, 12) + "…" : p.course.title,
    value: p.total,
  }));

  // Completion rate
  const completionRate = isDemo
    ? 58
    : myStudents.length
      ? Math.round((myStudents.filter((s) => s.completed).length / myStudents.length) * 100)
      : 0;
  const activeCount = isDemo ? 23 : myStudents.filter((s) => !s.completed).length;
  const doneCount = isDemo ? 32 : myStudents.filter((s) => s.completed).length;

  // Progress distribution buckets
  let buckets = [
    { label: "0–24%", value: 0 },
    { label: "25–49%", value: 0 },
    { label: "50–74%", value: 0 },
    { label: "75–99%", value: 0 },
    { label: "100%", value: 0 },
  ];
  for (const s of myStudents) {
    if (s.progress >= 100) buckets[4].value += 1;
    else if (s.progress >= 75) buckets[3].value += 1;
    else if (s.progress >= 50) buckets[2].value += 1;
    else if (s.progress >= 25) buckets[1].value += 1;
    else buckets[0].value += 1;
  }
  if (isDemo) {
    buckets = [
      { label: "0–24%", value: 8 },
      { label: "25–49%", value: 12 },
      { label: "50–74%", value: 16 },
      { label: "75–99%", value: 11 },
      { label: "100%", value: 13 },
    ];
  }

  // Sparkline series for stat cards
  const realSparkCourses = monthBuckets(myCourses.map(() => new Date().toISOString()), 6).map(
    (b) => b.hours,
  );
  const realSparkStudents = trendBuckets.map((b) => b.hours);
  const realSparkCompletions = monthBuckets(
    myStudents.filter((s) => s.completed).map((s) => s.enrolledAt),
    6,
  ).map((b) => b.hours);

  const sparkCourses = isDemo ? [1, 2, 2, 3, 3, 4] : realSparkCourses;
  const sparkStudents = isDemo ? [3, 5, 4, 7, 11, 14] : realSparkStudents;
  const sparkCompletions = isDemo ? [0, 1, 2, 4, 6, 9] : realSparkCompletions;

  const cards = [
    {
      label: "Courses you teach",
      value: stats.courses,
      icon: <Icon.Book size={18} />,
      href: "/teacher/courses",
      hint: "Across all categories",
      series: sparkCourses,
    },
    {
      label: "Enrolled students",
      value: isDemo ? 55 : stats.students,
      icon: <Icon.Users size={18} />,
      href: "/teacher/students",
      hint: "Unique learners in your classes",
      series: sparkStudents,
    },
    {
      label: "Completions",
      value: isDemo ? 32 : stats.completions,
      icon: <Icon.Award size={18} />,
      href: "/teacher/students",
      hint: "Students who finished a course",
      series: sparkCompletions,
    },
  ];

  const quickActions = [
    { icon: <Icon.FilePen size={18} />, label: "New assignment", href: "/teacher/assignments", tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
    { icon: <Icon.Calendar size={18} />, label: "Add schedule event", href: "/teacher/schedule", tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    { icon: <Icon.ListChecks size={18} />, label: "Gradebook", href: "/teacher/grades", tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    { icon: <Icon.BarChart3 size={18} />, label: "Analytics", href: "/teacher/analytics", tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
    { icon: <Icon.Video size={18} />, label: "Live classes", href: "/teacher/live", tint: "bg-rose-500/10 text-rose-500" },
    { icon: <Icon.Megaphone size={18} />, label: "Announce", href: "/teacher/announcements", tint: "bg-orange-500/10 text-orange-500" },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white p-6 sm:p-8 card-shadow">
        <TeacherHeroDecor />
        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20 uppercase tracking-wider font-semibold">
              <Icon.Sparkles size={11} /> Teacher portal
            </span>
            <h1 className="mt-3 text-2xl sm:text-4xl font-bold tracking-tight">
              Welcome back, {user?.name?.split(" ")[0] ?? "Teacher"}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-white/85 max-w-xl">
              <span className="hidden sm:inline">A quick look at your courses and the students learning from you. Jump in below to manage content or track progress.</span>
              <span className="sm:hidden">Your courses and student progress at a glance.</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap mt-1 sm:mt-0">
            <Link
              href="/teacher/students"
              className="inline-flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 px-3 sm:px-4 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-xs sm:text-sm font-semibold transition"
            >
              <Icon.User size={15} /> Students
            </Link>
            <Link
              href="/teacher/courses"
              className="inline-flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 px-3 sm:px-4 rounded-xl bg-white text-[var(--primary)] hover:brightness-95 text-xs sm:text-sm font-semibold transition"
            >
              <Icon.Book size={15} /> Courses
            </Link>
          </div>
        </div>
      </div>

      {/* Live refresh status bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-[var(--muted)] min-w-0">
          <LivePulse />
          <span className="truncate">Auto-refreshes every 30s · Updated <span className="font-medium text-[var(--foreground)]">{relativeTime(lastUpdated)}</span></span>
        </div>
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <span className="text-[var(--muted)]">Avg rating <span className="font-semibold text-[var(--foreground)]">⭐ 4.8</span></span>
          <span className="hidden sm:inline text-[var(--muted-2)]">·</span>
          <span className="text-[var(--muted)]">Revenue <span className="font-semibold text-emerald-600 dark:text-emerald-400">$810 this month</span></span>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--muted-2)] font-semibold mb-2">Quick actions</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--primary-soft)]/20 transition text-center"
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${a.tint}`}>
                {a.icon}
              </div>
              <p className="text-[11px] font-medium text-[var(--muted)] group-hover:text-[var(--foreground)] leading-tight line-clamp-2 w-full">{a.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Stat cards with sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="block group">
            <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-0.5 hover:border-[var(--primary)]/30">
              <CardBody className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center ring-1 ring-[var(--primary)]/15">
                    {c.icon}
                  </div>
                  <Icon.ChevronRight size={16} className="text-[var(--muted-2)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition" />
                </div>
                <p className="text-3xl font-bold tracking-tight">{c.value}</p>
                <p className="text-xs font-medium text-[var(--foreground)]">{c.label}</p>
                <div className="flex items-end justify-between gap-2 pt-1 min-w-0">
                  <p className="text-[11px] text-[var(--muted-2)] truncate">{c.hint}</p>
                  <Sparkline data={c.series.length >= 2 ? c.series : [0, 0, 0, 0, 0, 0]} width={80} height={28} />
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts row 1: enrollment trend + completion donut */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 mb-1">
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold flex items-center gap-2 flex-wrap">
                  Student enrollments
                  <LivePulse />
                </h2>
                <p className="text-xs text-[var(--muted)]">New sign-ups · last 6 months</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isDemo && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)] uppercase tracking-wider font-semibold">
                    Sample
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-semibold">
                  <Icon.TrendingUp size={12} /> Last 6 mo
                </span>
              </div>
            </div>
            <div className="h-[180px] sm:h-[220px] mt-3">
              <LineChart data={trendBuckets} yFormatter={(v) => Math.round(v).toString()} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold">Completion rate</h2>
              <Badge variant="info">{completionRate}%</Badge>
            </div>
            <p className="text-xs text-[var(--muted)]">Across your students</p>
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
                <p className="text-sm font-bold mt-0.5">{doneCount}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts row 2: per-course bars + progress distribution */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="font-semibold">Enrollments per course</h2>
                <p className="text-xs text-[var(--muted)]">Where your students are right now</p>
              </div>
              <Icon.BarChart3 size={16} className="text-[var(--muted-2)]" />
            </div>
            {courseBarData.length === 0 ? (
              <p className="text-sm text-[var(--muted)] py-10 text-center">No enrollments yet.</p>
            ) : (
              <div className="h-[200px] sm:h-[240px] mt-3">
                <BarChart data={courseBarData} height={240} />
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="font-semibold">Progress distribution</h2>
                <p className="text-xs text-[var(--muted)]">How far along your students are</p>
              </div>
              <Icon.PieChart size={16} className="text-[var(--muted-2)]" />
            </div>
            {myStudents.length === 0 ? (
              <p className="text-sm text-[var(--muted)] py-10 text-center">No enrollments yet.</p>
            ) : (
              <div className="h-[200px] sm:h-[240px] mt-3">
                <BarChart data={buckets} height={240} />
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Course performance list */}
      {perCourse.length > 0 && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold">Course performance</h2>
                <p className="text-xs text-[var(--muted)]">Average completion progress per course</p>
              </div>
              <Link href="/teacher/courses" className="text-xs text-[var(--primary)] hover:underline font-medium">
                Manage
              </Link>
            </div>
            <ul className="space-y-3">
              {perCourse.slice(0, 5).map((p) => (
                <li key={p.course.id}>
                  <ProgressBar
                    label={p.course.title}
                    value={p.avgProgress}
                    hint={`${p.avgProgress}% avg · ${p.total} ${p.total === 1 ? "learner" : "learners"}`}
                  />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* Monthly earnings + Recent reviews */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 mb-1">
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold flex items-center gap-2 flex-wrap">
                  Monthly earnings
                  <LivePulse />
                </h2>
                <p className="text-xs text-[var(--muted)]">Revenue · last 6 months</p>
              </div>
              <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold self-start whitespace-nowrap">↑ 37% vs last period</span>
            </div>
            <div className="h-[180px] sm:h-[220px] mt-3">
              <LineChart data={EARNINGS_MOCK} yFormatter={(v) => `$${v}`} />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h2 className="font-semibold mb-3">Recent reviews</h2>
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[var(--surface-2)]">
              <p className="text-3xl font-bold leading-none">4.8</p>
              <div>
                <div className="flex items-center gap-0.5 text-amber-400 mb-0.5">
                  {[1, 2, 3, 4, 5].map((i) => <Icon.Star key={i} size={13} />)}
                </div>
                <p className="text-xs text-[var(--muted)]">Based on 128 reviews</p>
              </div>
            </div>
            <ul className="space-y-3">
              {MOCK_REVIEWS.map((r) => (
                <li key={r.id} className="space-y-0.5 pb-3 border-b border-[var(--border)] last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">{r.student}</p>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: r.rating }).map((_, i) => <Icon.Star key={i} size={10} />)}
                    </div>
                  </div>
                  <p className="text-xs text-[var(--muted)]">&ldquo;{r.comment}&rdquo;</p>
                  <p className="text-[10px] text-[var(--muted-2)]">{r.course} · {r.date}</p>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      {/* Upcoming live classes */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Upcoming live classes</h2>
            <Link href="/teacher/live" className="text-xs text-[var(--primary)] hover:underline font-medium">View schedule</Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {UPCOMING_CLASSES.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition">
                <span className="text-2xl shrink-0">{c.emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.title}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{c.time}</p>
                  <p className="text-xs text-[var(--primary)] mt-0.5 font-medium">{c.students} enrolled</p>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4 min-w-0 overflow-hidden">
        <Card className="overflow-hidden">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Your courses</h2>
              <Link href="/teacher/courses" className="text-xs text-[var(--primary)] hover:underline font-medium">
                Manage
              </Link>
            </div>
            {myCourses.length === 0 ? (
              <p className="text-sm text-[var(--muted)] py-6 text-center">
                You aren&apos;t assigned to any courses yet. Ask an admin to assign you as the instructor on a course.
              </p>
            ) : (
              <ul className="space-y-3">
                {myCourses.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg overflow-hidden border border-[var(--border)] shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center justify-between gap-1.5 min-w-0">
                        <p className="text-sm font-medium truncate flex-1 min-w-0">{c.title}</p>
                        <Badge variant="default" className="shrink-0 text-[10px] ml-auto">{c.level}</Badge>
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-0.5 truncate">
                        {c.category} · {c.chapters.length} chapters
                      </p>
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
              <h2 className="font-semibold">Recent activity</h2>
              <Link href="/teacher/students" className="text-xs text-[var(--primary)] hover:underline font-medium">
                View all
              </Link>
            </div>
            {recentStudents.length === 0 ? (
              <p className="text-sm text-[var(--muted)] py-6 text-center">No students have enrolled yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentStudents.map((s) => (
                  <li key={`${s.userId}-${s.courseId}`} className="flex items-start gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white font-semibold inline-flex items-center justify-center text-sm">
                      {s.userName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{s.userName}</p>
                        {s.completed ? (
                          <Badge variant="success" className="shrink-0 text-[10px]">Done</Badge>
                        ) : (
                          <Badge variant="info" className="shrink-0 text-[10px]">{s.progress}%</Badge>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-0.5 truncate">
                        {s.courseTitle} · {relativeTime(s.enrolledAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
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

function TeacherHeroDecor() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg viewBox="0 0 800 220" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="teacher-dots" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" fill="white" />
          </pattern>
          <linearGradient id="teacher-wave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="0.15" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#teacher-dots)" opacity="0.25" />
        <path d="M0 170 Q 220 100 440 150 T 800 120 L 800 220 L 0 220 Z" fill="url(#teacher-wave)" />
        {/* Floating chart bars */}
        <g opacity="0.18">
          <rect x="560" y="80" width="14" height="36" rx="3" fill="white" />
          <rect x="582" y="60" width="14" height="56" rx="3" fill="white" />
          <rect x="604" y="40" width="14" height="76" rx="3" fill="white" />
          <rect x="626" y="70" width="14" height="46" rx="3" fill="white" />
        </g>
        {/* Floating book */}
        <g opacity="0.15" transform="translate(680 130)">
          <rect x="0" y="0" width="60" height="42" rx="6" fill="white" />
          <rect x="8" y="10" width="28" height="4" rx="2" fill="rgba(0,0,0,0.25)" />
          <rect x="8" y="20" width="40" height="3" rx="1.5" fill="rgba(0,0,0,0.25)" />
          <rect x="8" y="28" width="34" height="3" rx="1.5" fill="rgba(0,0,0,0.25)" />
        </g>
        <circle cx="120" cy="40" r="44" fill="white" opacity="0.07" />
        <circle cx="80" cy="60" r="18" fill="white" opacity="0.10" />
      </svg>
    </div>
  );
}
