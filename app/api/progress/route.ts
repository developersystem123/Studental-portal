import { prisma } from "@/lib/db";
import { errorResponse, requireUser } from "@/lib/auth-server";

export async function GET() {
  try {
    const me = await requireUser();

    // Compute a Monday-aligned 12-week window (84 days) ending at end of today.
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const dow = todayUTC.getUTCDay(); // 0=Sun … 6=Sat
    const daysSinceMonday = dow === 0 ? 6 : dow - 1;
    const thisWeekMonday = new Date(todayUTC);
    thisWeekMonday.setUTCDate(todayUTC.getUTCDate() - daysSinceMonday);
    const windowStart = new Date(thisWeekMonday);
    windowStart.setUTCDate(thisWeekMonday.getUTCDate() - 77); // 11 weeks before this week

    const [enrollments, certificates, quizAttempts, submissions, lessonNotes, userStats] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId: me.id },
        include: { course: { select: { title: true, durationMinutes: true, category: true } } },
      }),
      prisma.certificate.count({ where: { userId: me.id } }),
      prisma.quizAttempt.findMany({
        where: { userId: me.id, completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        include: { quiz: { select: { title: true } } },
      }),
      prisma.assignmentSubmission.findMany({
        where: { userId: me.id },
        include: { assignment: { select: { points: true, title: true } } },
      }),
      prisma.lessonNote.findMany({
        where: { userId: me.id, createdAt: { gte: windowStart } },
        select: { createdAt: true },
      }),
      prisma.userStats.findUnique({ where: { userId: me.id } }),
    ]);

    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter((e) => e.completed).length;
    const totalMinutesLearned = enrollments.reduce(
      (sum, e) => sum + Math.round((e.course.durationMinutes * e.progress) / 100),
      0,
    );
    const averageQuizScore =
      quizAttempts.length === 0
        ? 0
        : Math.round(quizAttempts.reduce((s, a) => s + a.percentage, 0) / quizAttempts.length);

    // Category breakdown
    const byCategory: Record<string, { enrolled: number; minutesLearned: number }> = {};
    for (const e of enrollments) {
      const k = e.course.category;
      const minutes = Math.round((e.course.durationMinutes * e.progress) / 100);
      byCategory[k] = byCategory[k] ?? { enrolled: 0, minutesLearned: 0 };
      byCategory[k].enrolled += 1;
      byCategory[k].minutesLearned += minutes;
    }

    // Build activity-per-date map from quiz completions, submissions, and notes.
    const activityByDate: Record<string, number> = {};
    const addActivity = (d: Date | string | null) => {
      if (!d) return;
      const key = (d instanceof Date ? d : new Date(d)).toISOString().split("T")[0];
      activityByDate[key] = (activityByDate[key] ?? 0) + 1;
    };
    for (const a of quizAttempts) addActivity(a.completedAt);
    for (const s of submissions)  addActivity(s.submittedAt);
    for (const n of lessonNotes)  addActivity(n.createdAt);

    // Build 84-cell heatmap: week=0 is oldest, week=11 is current; day=0=Mon, day=6=Sun.
    const heatmap: { day: number; week: number; value: number }[] = [];
    for (let week = 0; week < 12; week++) {
      for (let day = 0; day < 7; day++) {
        const date = new Date(windowStart);
        date.setUTCDate(windowStart.getUTCDate() + week * 7 + day);
        const isFuture = date > todayUTC;
        const dateStr = date.toISOString().split("T")[0];
        const count = isFuture ? 0 : (activityByDate[dateStr] ?? 0);
        let value = 0;
        if (count >= 1) value = 1;
        if (count >= 3) value = 2;
        if (count >= 6) value = 3;
        if (count >= 10) value = 4;
        heatmap.push({ day, week, value });
      }
    }

    // Count distinct active days this calendar year (from all-time data, not just window).
    const currentYear = todayUTC.getUTCFullYear().toString();
    const daysActiveThisYear = Object.keys(activityByDate).filter(
      (d) => d.startsWith(currentYear) && (activityByDate[d] ?? 0) > 0,
    ).length;

    return Response.json({
      stats: {
        totalCourses,
        completedCourses,
        inProgressCourses: totalCourses - completedCourses,
        totalMinutesLearned,
        certificates,
        averageQuizScore,
        quizzesTaken: quizAttempts.length,
        assignmentsSubmitted: submissions.length,
        assignmentsGraded: submissions.filter((s) => s.status === "graded").length,
      },
      enrollments: enrollments.map((e) => ({
        courseId: e.courseId,
        courseTitle: e.course.title,
        progress: e.progress,
        completed: e.completed,
        category: e.course.category,
      })),
      recentQuizzes: quizAttempts.slice(0, 5).map((a) => ({
        id: a.id,
        quizTitle: a.quiz.title,
        percentage: a.percentage,
        passed: a.passed,
        completedAt: a.completedAt?.toISOString() ?? null,
      })),
      byCategory,
      heatmap,
      streak: {
        current: userStats?.currentStreak ?? 0,
        longest: userStats?.longestStreak ?? 0,
        daysActiveThisYear,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
