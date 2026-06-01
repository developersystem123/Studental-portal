"use client";

import * as React from "react";
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, StatCard, useToast } from "@/components/ui";
import Icon from "@/components/icons";
import { BADGES } from "@/lib/gamification";

type BadgeItem = {
  key: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
};

type Gamification = {
  xp: number;
  level: number;
  intoLevel: number;
  perLevel: number;
  toNext: number;
  progress: number;
  currentStreak: number;
  longestStreak: number;
  rank: number | null;
  totalLearners: number;
  activity: {
    chaptersCompleted: number;
    certificates: number;
    quizzesPassed: number;
    coursesCompleted: number;
  };
  badges: BadgeItem[];
  leaderboard: { rank: number; name: string; xp: number; isMe: boolean }[];
};

type BadgeFilter = "all" | "earned" | "locked";

// How close a learner is to each badge (returns 0–1)
function badgeProgress(key: string, activity: Gamification["activity"], streak: number): number {
  switch (key) {
    case "first-steps": return 1;
    case "quick-learner": return Math.min(1, activity.chaptersCompleted / 10);
    case "dedicated": return Math.min(1, activity.chaptersCompleted / 25);
    case "certified": return Math.min(1, activity.certificates / 1);
    case "scholar": return Math.min(1, activity.certificates / 3);
    case "quiz-master": return Math.min(1, activity.quizzesPassed / 5);
    case "course-champion": return Math.min(1, activity.coursesCompleted / 1);
    case "streak-star": return Math.min(1, streak / 7);
    default: return 0;
  }
}

function badgeHint(key: string, activity: Gamification["activity"], streak: number): string | null {
  switch (key) {
    case "quick-learner": {
      const left = 10 - activity.chaptersCompleted;
      return left > 0 ? `Complete ${left} more chapter${left > 1 ? "s" : ""}` : null;
    }
    case "dedicated": {
      const left = 25 - activity.chaptersCompleted;
      return left > 0 ? `Complete ${left} more chapter${left > 1 ? "s" : ""}` : null;
    }
    case "scholar": {
      const left = 3 - activity.certificates;
      return left > 0 ? `Earn ${left} more certificate${left > 1 ? "s" : ""}` : null;
    }
    case "quiz-master": {
      const left = 5 - activity.quizzesPassed;
      return left > 0 ? `Pass ${left} more quiz${left > 1 ? "zes" : ""}` : null;
    }
    case "course-champion":
      return activity.coursesCompleted < 1 ? "Finish any course" : null;
    case "streak-star": {
      const left = 7 - streak;
      return left > 0 ? `${left} more day${left > 1 ? "s" : ""} in a row` : null;
    }
    default: return null;
  }
}

function SkeletonXP() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse">
      <div className="h-32 bg-[var(--surface-2)]" />
    </div>
  );
}

function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-24 rounded-xl bg-[var(--surface-2)] animate-pulse" />
      ))}
    </div>
  );
}

const RANK_MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function AchievementsPage() {
  const [data, setData] = React.useState<Gamification | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [badgeFilter, setBadgeFilter] = React.useState<BadgeFilter>("all");
  const toast = useToast();

  React.useEffect(() => {
    fetch("/api/gamification")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  function shareAchievements() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.push({ title: "Profile link copied!", tone: "success" });
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Achievements</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Earn XP, keep your streak alive, and unlock badges as you learn.</p>
        </div>
        <SkeletonXP />
        <SkeletonGrid count={4} />
        <div className="h-64 rounded-xl bg-[var(--surface-2)] animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-[var(--muted)]">Couldn&apos;t load achievements.</p>
        </CardBody>
      </Card>
    );
  }

  const earnedCount = data.badges.filter((b) => b.earned).length;
  const filteredBadges = data.badges.filter((b) => {
    if (badgeFilter === "earned") return b.earned;
    if (badgeFilter === "locked") return !b.earned;
    return true;
  });

  // Find the next closest badge to earn
  const nextBadge = data.badges
    .filter((b) => !b.earned)
    .map((b) => ({ ...b, pct: badgeProgress(b.key, data.activity, data.currentStreak) }))
    .sort((a, z) => z.pct - a.pct)[0];

  // XP breakdown contributions
  const xpParts = [
    { label: "Chapters", count: data.activity.chaptersCompleted, xp: data.activity.chaptersCompleted * 10, unit: "×10 XP" },
    { label: "Quizzes passed", count: data.activity.quizzesPassed, xp: data.activity.quizzesPassed * 25, unit: "×25 XP" },
    { label: "Courses done", count: data.activity.coursesCompleted, xp: data.activity.coursesCompleted * 50, unit: "×50 XP" },
    { label: "Certificates", count: data.activity.certificates, xp: data.activity.certificates * 100, unit: "×100 XP" },
  ];
  const totalXpBreakdown = xpParts.reduce((s, p) => s + p.xp, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Achievements</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Earn XP, keep your streak alive, and unlock badges as you learn.
          </p>
        </div>
        <Button variant="outline" onClick={shareAchievements}>
          <Icon.Copy size={14} /> Share
        </Button>
      </div>

      {/* Level + XP card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white p-6">
          <div className="flex items-center gap-5 flex-wrap">
            <div className="h-16 w-16 rounded-2xl bg-white/15 backdrop-blur flex flex-col items-center justify-center shrink-0 shadow-lg shadow-black/20">
              <span className="text-[10px] uppercase tracking-wider opacity-80">Level</span>
              <span className="text-2xl font-bold leading-none">{data.level}</span>
            </div>
            <div className="flex-1 min-w-[12rem]">
              <p className="text-sm text-white/80">Total XP</p>
              <p className="text-3xl font-bold">{data.xp.toLocaleString()} XP</p>
              <div className="mt-2.5">
                <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                  <div className="h-full rounded-full bg-white transition-all" style={{ width: `${data.progress}%` }} />
                </div>
                <div className="flex justify-between text-xs text-white/75 mt-1">
                  <span>{data.intoLevel} XP into level {data.level}</span>
                  <span>{data.toNext} XP to level {data.level + 1}</span>
                </div>
              </div>
            </div>
            {data.rank && (
              <div className="shrink-0 text-center">
                <p className="text-3xl font-bold">#{data.rank}</p>
                <p className="text-xs text-white/75">of {data.totalLearners} learners</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Current streak"
          value={`${data.currentStreak} day${data.currentStreak === 1 ? "" : "s"}`}
          icon={<Icon.TrendingUp size={20} />}
          tone="warning"
        />
        <StatCard
          label="Longest streak"
          value={`${data.longestStreak} days`}
          icon={<Icon.Award size={20} />}
          tone="accent"
        />
        <StatCard
          label="Badges earned"
          value={`${earnedCount} / ${data.badges.length}`}
          icon={<Icon.Star size={20} />}
        />
        <StatCard
          label="Leaderboard rank"
          value={data.rank ? `#${data.rank}` : "—"}
          icon={<Icon.BarChart3 size={20} />}
          tone="success"
        />
      </div>

      {/* Next badge callout */}
      {nextBadge && (
        <div className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary-soft)]/30 px-5 py-3.5 flex items-center gap-4">
          <span className="text-2xl">{nextBadge.icon}</span>
          <div className="flex-1">
            <p className="text-sm font-semibold">
              Next up: <span className="text-[var(--primary)]">{nextBadge.name}</span>
            </p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {badgeHint(nextBadge.key, data.activity, data.currentStreak) ?? nextBadge.description}
            </p>
            <div className="mt-1.5 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all"
                style={{ width: `${Math.round(nextBadge.pct * 100)}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-semibold text-[var(--primary)] shrink-0">
            {Math.round(nextBadge.pct * 100)}%
          </span>
        </div>
      )}

      {/* Badges */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle>Badges</CardTitle>
            <div className="flex items-center gap-1">
              {(["all", "earned", "locked"] as BadgeFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setBadgeFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition capitalize ${
                    badgeFilter === f
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {f === "all" ? `All (${data.badges.length})` : f === "earned" ? `Earned (${earnedCount})` : `Locked (${data.badges.length - earnedCount})`}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {filteredBadges.length === 0 ? (
            <p className="text-sm text-[var(--muted)] text-center py-6">
              {badgeFilter === "earned" ? "No badges earned yet. Keep learning!" : "All badges earned! 🎉"}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredBadges.map((b) => {
                const pct = badgeProgress(b.key, data.activity, data.currentStreak);
                const hint = !b.earned ? badgeHint(b.key, data.activity, data.currentStreak) : null;
                return (
                  <div
                    key={b.key}
                    className={`rounded-xl border p-4 text-center transition ${
                      b.earned
                        ? "border-[var(--primary)]/40 bg-[var(--primary-soft)]/40"
                        : "border-[var(--border)] bg-[var(--surface)]"
                    }`}
                  >
                    <div className={`text-3xl ${b.earned ? "" : "grayscale opacity-50"}`}>{b.icon}</div>
                    <p className={`font-semibold text-sm mt-2 ${b.earned ? "" : "text-[var(--muted)]"}`}>{b.name}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-2">{b.description}</p>

                    {b.earned ? (
                      <Badge variant="success" className="mt-2">
                        <Icon.Check size={11} /> Earned
                      </Badge>
                    ) : (
                      <div className="mt-2 space-y-1.5">
                        <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--primary)] transition-all"
                            style={{ width: `${Math.round(pct * 100)}%` }}
                          />
                        </div>
                        {hint && <p className="text-[10px] text-[var(--muted-2)]">{hint}</p>}
                        <Badge variant="default" className="mt-1">
                          <Icon.Lock size={11} /> Locked
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Leaderboard</CardTitle>
            {data.rank && (
              <span className="text-xs text-[var(--muted)]">
                You&apos;re ranked <span className="font-semibold text-[var(--foreground)]">#{data.rank}</span> of {data.totalLearners} learners
              </span>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {data.leaderboard.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No learners ranked yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {data.leaderboard.map((r) => (
                <li
                  key={r.rank}
                  className={`flex items-center gap-3 py-3 ${
                    r.isMe ? "bg-[var(--primary-soft)]/30 -mx-5 px-5 rounded-lg" : ""
                  }`}
                >
                  <span className="text-xl w-8 text-center shrink-0">
                    {RANK_MEDAL[r.rank] ?? (
                      <span className="h-8 w-8 rounded-full bg-[var(--surface-2)] text-[var(--muted)] text-sm font-bold inline-flex items-center justify-center">
                        {r.rank}
                      </span>
                    )}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-xs font-bold flex items-center justify-center shrink-0">
                    {r.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="flex-1 min-w-0 font-medium truncate">
                    {r.name}{" "}
                    {r.isMe && <span className="text-[var(--primary)] text-xs font-semibold">(You)</span>}
                  </span>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-sm font-bold text-[var(--foreground)]">{r.xp.toLocaleString()}</span>
                    <span className="text-[10px] text-[var(--muted)]">XP</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* XP breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>How you earned your XP</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {xpParts.map((p) => {
              const pct = totalXpBreakdown > 0 ? (p.xp / totalXpBreakdown) * 100 : 0;
              return (
                <div key={p.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.label}</span>
                      <span className="text-xs text-[var(--muted)]">× {p.count}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--muted)]">{p.unit}</span>
                      <span className="font-semibold text-[var(--primary)] w-14 text-right">{p.xp} XP</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--primary)] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
