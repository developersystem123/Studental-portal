"use client";

import * as React from "react";
import Link from "next/link";
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Progress, StatCard } from "@/components/ui";
import Icon from "@/components/icons";
import { BarChart, Donut, Heatmap, LineChart, ProgressBar, RadialBars, Sparkline } from "@/components/charts";
import { useAuth, useData } from "@/lib/store";
import {
  ACTIVITY_HEATMAP,
  COURSES,
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_DEADLINES,
  HOURS_BY_CATEGORY,
  LEADERBOARD,
  QUIZ_SCORE_HISTORY,
  RECENT_BADGES,
  RECOMMENDED_NEXT,
  SKILL_MASTERY,
  STUDY_STREAK,
  STUDY_TIME_OF_DAY,
  UPCOMING_LIVE_SESSIONS,
  WEEKLY_GOAL,
  WEEKLY_HOURS,
  XP_DATA,
} from "@/lib/mockData";
import { formatHours } from "@/lib/utils";

const BADGE_ICONS = {
  flame: <Icon.TrendingUp size={20} />,
  star: <Icon.Star size={20} />,
  award: <Icon.Award size={20} />,
  moon: <Icon.Moon size={20} />,
} as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const { enrollments, certificates } = useData();
  const [liveCount, setLiveCount] = React.useState(3842);
  React.useEffect(() => {
    const id = setInterval(() => setLiveCount((n) => Math.max(0, n + Math.floor(Math.random() * 5) - 2)), 4000);
    return () => clearInterval(id);
  }, []);

  const inProgress = enrollments.filter((e) => !e.completed);
  const totalMinutes = enrollments.reduce((sum, e) => {
    const c = COURSES.find((x) => x.id === e.courseId);
    if (!c) return sum;
    return sum + Math.round((c.durationMinutes * e.progress) / 100);
  }, 0);
  const avgScore =
    certificates.length === 0
      ? 0
      : Math.round(certificates.reduce((s, c) => s + c.score, 0) / certificates.length);

  // Quiz line chart needs the LineChart shape ({day, hours}).
  const quizLineData = QUIZ_SCORE_HISTORY.map((q, i) => ({ day: `Q${i + 1}`, hours: q.score }));
  const heatmapWeeks = 12;
  const xpPct = Math.min(100, (XP_DATA.xp / XP_DATA.xpForNext) * 100);
  const goalPct = Math.min(100, (WEEKLY_GOAL.doneHours / WEEKLY_GOAL.goalHours) * 100);

  return (
    <div className="space-y-6">
      {/* Hero banner (student, styled like teacher portal) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white p-6 sm:p-8 card-shadow">
        <TeacherHeroDecor />
        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20 uppercase tracking-wider font-semibold">
              <Icon.Sparkles size={11} /> Student portal
            </span>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">Your learning dashboard</h1>
            <p className="mt-2 text-white/85 max-w-xl">
              You&apos;re on a {STUDY_STREAK.current}-day streak — best yet was {STUDY_STREAK.longest}.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Link
              href="/my-courses"
              className="inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-sm font-semibold transition"
            >
              <Icon.Book size={16} /> My courses
            </Link>
            <Link href="/explore" className="inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-white text-[var(--primary)] hover:brightness-95 text-sm font-semibold transition">
              <Icon.Plus size={16} /> Browse
            </Link>
          </div>
        </div>
      </div>

      {/* Live platform pulse */}
      <div className="flex items-center gap-3 flex-wrap px-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--muted)]">
        <LivePulse />
        <span className="text-[var(--muted-2)]">|</span>
        <span><span className="font-semibold text-[var(--foreground)]">{liveCount.toLocaleString()}</span> students learning right now</span>
        <span className="text-[var(--muted-2)] hidden sm:inline">·</span>
        <span className="hidden sm:inline"><span className="font-semibold text-[var(--foreground)]">14</span> live classes active</span>
        <span className="text-[var(--muted-2)] hidden sm:inline">·</span>
        <span className="hidden sm:inline"><span className="font-semibold text-[var(--foreground)]">263</span> new enrollments today</span>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Enrolled Courses"
          value={enrollments.length}
          delta="+1 this month"
          tone="primary"
          icon={<Icon.Book size={22} />}
        />
        <StatCard
          label="Hours Learned"
          value={formatHours(totalMinutes)}
          delta="+3h this week"
          tone="accent"
          icon={<Icon.Clock size={22} />}
        />
        <StatCard
          label="Certificates"
          value={certificates.length}
          tone="warning"
          icon={<Icon.Award size={22} />}
        />
        <StatCard
          label="Avg. Score"
          value={`${avgScore}%`}
          delta={avgScore > 0 ? "Great work!" : "Take a quiz!"}
          tone="success"
          icon={<Icon.TrendingUp size={22} />}
        />
      </div>

    {/* Quiz scores + Hours by category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Quiz scores over time</CardTitle>
              <p className="text-xs text-[var(--muted)] mt-1">Last 12 attempts · trending up</p>
            </div>
            <Badge variant="success">
              <Icon.TrendingUp size={12} /> Avg {Math.round(
                QUIZ_SCORE_HISTORY.reduce((s, q) => s + q.score, 0) / QUIZ_SCORE_HISTORY.length,
              )}%
            </Badge>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <LineChart data={quizLineData} yFormatter={(v) => `${Math.round(v)}%`} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hours by category</CardTitle>
            <p className="text-xs text-[var(--muted)] mt-1">This semester</p>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <BarChart
                data={HOURS_BY_CATEGORY}
                valueLabel={(v) => `${v}h`}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      

      {/* Weekly hours + Skill mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Weekly learning hours</CardTitle>
              <p className="text-xs text-[var(--muted)] mt-1">Past 7 days</p>
            </div>
            <Badge variant="primary">
              <Icon.TrendingUp size={12} /> +18%
            </Badge>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <LineChart data={WEEKLY_HOURS} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skill mastery</CardTitle>
            <p className="text-xs text-[var(--muted)] mt-1">Across all enrolled tracks</p>
          </CardHeader>
          <CardBody>
            <div className="flex items-center justify-center">
              <RadialBars
                data={SKILL_MASTERY.map((s) => ({ label: s.category, value: s.mastery, color: s.color }))}
                size={200}
              />
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              {SKILL_MASTERY.map((s) => (
                <li key={s.category} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="truncate">{s.category}</span>
                  </span>
                  <span className="text-[var(--muted)] tabular-nums">{s.mastery}%</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      {/* Activity heatmap + Streak/XP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Study activity</CardTitle>
              <p className="text-xs text-[var(--muted)] mt-1">
                Last {heatmapWeeks} weeks · {STUDY_STREAK.daysActiveThisYear} active days this year
              </p>
            </div>
            <Badge variant="success">
              <Icon.TrendingUp size={12} /> Streak {STUDY_STREAK.current}d
            </Badge>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto scrollbar-thin">
              <div className="min-w-[560px] h-44">
                <Heatmap cells={ACTIVITY_HEATMAP} weeks={heatmapWeeks} />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Level &amp; goals</CardTitle>
          </CardHeader>
          <CardBody className="space-y-5">
            <div className="flex items-center gap-3">
              <Donut value={xpPct} size={84} label={`Lv ${XP_DATA.level}`} />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">{XP_DATA.rank}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {XP_DATA.xp.toLocaleString()} / {XP_DATA.xpForNext.toLocaleString()} XP
                </p>
                <p className="text-xs text-emerald-500 mt-0.5">+{XP_DATA.weeklyXp} XP this week</p>
              </div>
            </div>
            <div>
              <ProgressBar
                value={goalPct}
                label={`Weekly goal — ${WEEKLY_GOAL.doneHours.toFixed(1)}h of ${WEEKLY_GOAL.goalHours}h`}
                hint={`${Math.round(goalPct)}%`}
              />
              <p className="text-xs text-[var(--muted-2)] mt-2">
                {STUDY_STREAK.thisWeekSessions} of {STUDY_STREAK.weeklyGoalSessions} sessions logged this week
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Time-of-day + Upcoming deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Best study hours</CardTitle>
            <p className="text-xs text-[var(--muted)] mt-1">When you focus most</p>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2.5">
              {STUDY_TIME_OF_DAY.map((b) => {
                const max = Math.max(...STUDY_TIME_OF_DAY.map((x) => x.minutes), 1);
                const pct = (b.minutes / max) * 100;
                return (
                  <li key={b.bucket} className="flex items-center gap-2">
                    <span className="text-xs text-[var(--muted)] w-10 shrink-0 tabular-nums">{b.bucket}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--muted-2)] w-12 text-right tabular-nums">{b.minutes}m</span>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Upcoming deadlines</CardTitle>
            <Link href="/assignments" className="text-xs text-[var(--primary)] hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardBody className="space-y-3">
            {DEFAULT_DEADLINES.map((d) => (
              <div key={d.id} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--surface-2)]/60">
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Icon.Calendar size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{d.title}</p>
                  <p className="text-xs text-[var(--muted)]">{d.course}</p>
                </div>
                <span className="text-xs text-amber-500 font-semibold whitespace-nowrap self-center">{d.due}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Continue learning */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Continue learning</CardTitle>
          <Link href="/my-courses" className="text-xs text-[var(--primary)] hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardBody>
          {inProgress.length === 0 ? (
            <p className="text-sm text-[var(--muted)] text-center py-6">
              No courses in progress yet. <Link href="/explore" className="text-[var(--primary)]">Browse the catalog</Link>.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {inProgress.slice(0, 3).map((e) => {
                const course = COURSES.find((c) => c.id === e.courseId);
                if (!course) return null;
                return (
                  <Link key={e.courseId} href={`/my-courses/${course.id}`} className="group">
                    <div className="rounded-xl border border-[var(--border)] overflow-hidden hover:shadow-md transition">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={course.thumbnail} alt="" className="w-full h-28 object-cover" />
                      <div className="p-4">
                        <p className="text-sm font-semibold line-clamp-1 group-hover:text-[var(--primary)]">
                          {course.title}
                        </p>
                        <p className="text-xs text-[var(--muted)] mt-0.5 mb-3">{course.instructor}</p>
                        <Progress value={e.progress} />
                        <p className="text-xs text-[var(--muted)] mt-1.5">{e.progress}% complete</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Live sessions + Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Upcoming live sessions</CardTitle>
            <Link href="/live" className="text-xs text-[var(--primary)] hover:underline">
              Browse all
            </Link>
          </CardHeader>
          <CardBody className="space-y-3">
            {UPCOMING_LIVE_SESSIONS.map((s) => (
              <div key={s.id} className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border)]">
                <div className="h-10 w-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                  <Icon.Video size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{s.title}</p>
                  <p className="text-xs text-[var(--muted)] truncate">
                    {s.host} · {s.course}
                  </p>
                </div>
                <span className="text-xs text-[var(--primary)] font-semibold whitespace-nowrap self-center">
                  {s.at}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent badges</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-3">
            {RECENT_BADGES.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-[var(--border)] p-3 hover:shadow-md transition"
                title={b.description}
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-pink-500/20 text-amber-500 flex items-center justify-center">
                  {BADGE_ICONS[b.icon as keyof typeof BADGE_ICONS] ?? <Icon.Award size={20} />}
                </div>
                <p className="text-xs font-semibold mt-2 line-clamp-1">{b.name}</p>
                <p className="text-[10px] text-[var(--muted-2)] mt-0.5">{b.earnedAt}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Leaderboard + Recommended next */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Friends leaderboard</CardTitle>
            <p className="text-xs text-[var(--muted)] mt-1">Study hours this week</p>
          </CardHeader>
          <CardBody className="space-y-3">
            {LEADERBOARD.map((row, i) => {
              const max = Math.max(...LEADERBOARD.map((r) => r.hours));
              const pct = (row.hours / max) * 100;
              return (
                <div key={row.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-[var(--muted-2)] w-4 text-right tabular-nums">{i + 1}.</span>
                      <span className={row.you ? "font-semibold text-[var(--primary)]" : ""}>
                        {row.name}
                      </span>
                    </span>
                    <span className="text-[var(--muted)] tabular-nums">{row.hours.toFixed(1)}h</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div
                      className={
                        "h-full rounded-full " +
                        (row.you
                          ? "bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
                          : "bg-[var(--muted-2)]/60")
                      }
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recommended next</CardTitle>
            <Badge variant="primary">
              <Icon.Sparkles size={12} /> AI picks
            </Badge>
          </CardHeader>
          <CardBody className="space-y-3">
            {RECOMMENDED_NEXT.map((r) => (
              <Link
                key={r.id}
                href="/my-courses"
                className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition group"
              >
                <div className="h-10 w-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                  <Icon.PlayCircle size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate group-hover:text-[var(--primary)]">{r.title}</p>
                  <p className="text-xs text-[var(--muted)] truncate">
                    {r.course} · {r.durationMin}m · {r.reason}
                  </p>
                </div>
                <Icon.ChevronRight size={16} className="text-[var(--muted-2)] self-center" />
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]">
              <Sparkline data={QUIZ_SCORE_HISTORY.map((q) => q.score)} width={120} height={28} />
              <span>Your quiz performance is trending up</span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent announcements</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {DEFAULT_ANNOUNCEMENTS.map((a) => (
            <div key={a.id} className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                <Icon.Megaphone size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{a.author}</span>{" "}
                  <span className="text-xs text-[var(--muted)]">· {a.role} · {a.when}</span>
                </p>
                <p className="text-sm text-[var(--muted)] mt-0.5">{a.message}</p>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
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
        <g opacity="0.18">
          <rect x="560" y="80" width="14" height="36" rx="3" fill="white" />
          <rect x="582" y="60" width="14" height="56" rx="3" fill="white" />
          <rect x="604" y="40" width="14" height="76" rx="3" fill="white" />
          <rect x="626" y="70" width="14" height="46" rx="3" fill="white" />
        </g>
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
