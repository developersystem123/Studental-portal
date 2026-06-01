// Gamification rules — XP weights, badge catalogue and the pure functions that
// derive a learner's XP, level and earned badges from their real activity.

export type LearnerActivity = {
  chaptersCompleted: number;
  certificates: number;
  quizzesPassed: number;
  coursesCompleted: number;
};

// XP awarded per kind of achievement.
export const XP_WEIGHTS = {
  chapter: 10,
  certificate: 100,
  quizPassed: 25,
  courseCompleted: 50,
} as const;

export function computeXp(a: LearnerActivity): number {
  return (
    a.chaptersCompleted * XP_WEIGHTS.chapter +
    a.certificates * XP_WEIGHTS.certificate +
    a.quizzesPassed * XP_WEIGHTS.quizPassed +
    a.coursesCompleted * XP_WEIGHTS.courseCompleted
  );
}

const XP_PER_LEVEL = 300;

export function levelInfo(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const intoLevel = xp % XP_PER_LEVEL;
  return {
    level,
    intoLevel,
    perLevel: XP_PER_LEVEL,
    toNext: XP_PER_LEVEL - intoLevel,
    progress: Math.round((intoLevel / XP_PER_LEVEL) * 100),
  };
}

export type Badge = {
  key: string;
  name: string;
  icon: string;
  description: string;
};

// The full badge catalogue.
export const BADGES: Badge[] = [
  { key: "first-steps", name: "First Steps", icon: "🌱", description: "Enrolled in your first course" },
  { key: "quick-learner", name: "Quick Learner", icon: "⚡", description: "Completed 10 chapters" },
  { key: "dedicated", name: "Dedicated", icon: "📈", description: "Completed 25 chapters" },
  { key: "certified", name: "Certified", icon: "🎓", description: "Earned your first certificate" },
  { key: "scholar", name: "Scholar", icon: "📚", description: "Earned 3 certificates" },
  { key: "quiz-master", name: "Quiz Master", icon: "🧠", description: "Passed 5 quizzes" },
  { key: "course-champion", name: "Course Champion", icon: "🏆", description: "Completed a whole course" },
  { key: "streak-star", name: "Streak Star", icon: "🔥", description: "Reached a 7-day learning streak" },
];

// Which badge keys this learner has earned.
export function earnedBadges(
  a: LearnerActivity & { enrolledCount: number; currentStreak: number },
): string[] {
  const earned: string[] = [];
  if (a.enrolledCount >= 1) earned.push("first-steps");
  if (a.chaptersCompleted >= 10) earned.push("quick-learner");
  if (a.chaptersCompleted >= 25) earned.push("dedicated");
  if (a.certificates >= 1) earned.push("certified");
  if (a.certificates >= 3) earned.push("scholar");
  if (a.quizzesPassed >= 5) earned.push("quiz-master");
  if (a.coursesCompleted >= 1) earned.push("course-champion");
  if (a.currentStreak >= 7) earned.push("streak-star");
  return earned;
}

// ---- Streak ----

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

// Given the stored streak state, work out today's streak after a check-in.
export function rollStreak(
  prev: { currentStreak: number; longestStreak: number; lastActiveAt: Date | null },
  now: Date,
): { currentStreak: number; longestStreak: number; lastActiveAt: Date } {
  if (!prev.lastActiveAt) {
    return { currentStreak: 1, longestStreak: 1, lastActiveAt: now };
  }
  const today = dayKey(now);
  const last = dayKey(prev.lastActiveAt);
  if (last === today) return { ...prev, lastActiveAt: prev.lastActiveAt };

  const yesterday = dayKey(new Date(now.getTime() - 86_400_000));
  const currentStreak = last === yesterday ? prev.currentStreak + 1 : 1;
  return {
    currentStreak,
    longestStreak: Math.max(currentStreak, prev.longestStreak),
    lastActiveAt: now,
  };
}
