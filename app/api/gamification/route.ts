// Student-facing: XP, level, learning streak, badges and leaderboard.
// XP and badges are derived live from real activity; the streak is the only
// piece of persisted state (and this call doubles as the daily check-in).

import { prisma } from "@/lib/db";
import { errorResponse, requireUser } from "@/lib/auth-server";
import {
  BADGES,
  computeXp,
  earnedBadges,
  levelInfo,
  rollStreak,
  type LearnerActivity,
} from "@/lib/gamification";

type Activity = LearnerActivity & { enrolledCount: number };

const blank = (): Activity => ({
  chaptersCompleted: 0,
  certificates: 0,
  quizzesPassed: 0,
  coursesCompleted: 0,
  enrolledCount: 0,
});

export async function GET() {
  try {
    const me = await requireUser();

    // 1. Streak check-in.
    const prev = await prisma.userStats.findUnique({ where: { userId: me.id } });
    const rolled = rollStreak(
      {
        currentStreak: prev?.currentStreak ?? 0,
        longestStreak: prev?.longestStreak ?? 0,
        lastActiveAt: prev?.lastActiveAt ?? null,
      },
      new Date(),
    );
    await prisma.userStats.upsert({
      where: { userId: me.id },
      create: { userId: me.id, ...rolled },
      update: rolled,
    });

    // 2. Bulk activity for every learner (for XP + leaderboard).
    const [enrollments, certificates, passedAttempts, students] = await Promise.all([
      prisma.enrollment.findMany({
        select: { userId: true, completedChapterIds: true, completed: true },
      }),
      prisma.certificate.findMany({ select: { userId: true } }),
      prisma.quizAttempt.findMany({ where: { passed: true }, select: { userId: true } }),
      prisma.user.findMany({ where: { role: "Student" }, select: { id: true, name: true } }),
    ]);

    const act = new Map<string, Activity>();
    const at = (id: string) => {
      let a = act.get(id);
      if (!a) {
        a = blank();
        act.set(id, a);
      }
      return a;
    };
    for (const e of enrollments) {
      const a = at(e.userId);
      a.enrolledCount += 1;
      a.chaptersCompleted += e.completedChapterIds.length;
      if (e.completed) a.coursesCompleted += 1;
    }
    for (const c of certificates) at(c.userId).certificates += 1;
    for (const q of passedAttempts) at(q.userId).quizzesPassed += 1;

    // 3. Leaderboard.
    const ranked = students
      .map((s) => ({ id: s.id, name: s.name, xp: computeXp(act.get(s.id) ?? blank()) }))
      .sort((a, b) => b.xp - a.xp);
    const leaderboard = ranked.slice(0, 10).map((r, i) => ({
      rank: i + 1,
      name: r.name,
      xp: r.xp,
      isMe: r.id === me.id,
    }));
    const myRank = ranked.findIndex((r) => r.id === me.id) + 1;

    // 4. My stats.
    const mine = act.get(me.id) ?? blank();
    const xp = computeXp(mine);
    const earned = earnedBadges({ ...mine, currentStreak: rolled.currentStreak });

    return Response.json({
      xp,
      ...levelInfo(xp),
      currentStreak: rolled.currentStreak,
      longestStreak: rolled.longestStreak,
      rank: myRank || null,
      totalLearners: ranked.length,
      activity: mine,
      badges: BADGES.map((b) => ({ ...b, earned: earned.includes(b.key) })),
      leaderboard,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
