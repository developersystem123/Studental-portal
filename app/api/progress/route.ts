import { prisma } from "@/lib/db";
import { errorResponse, requireUser } from "@/lib/auth-server";

export async function GET() {
  try {
    const me = await requireUser();
    const [enrollments, certificates, quizAttempts, submissions] = await Promise.all([
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
    });
  } catch (err) {
    return errorResponse(err);
  }
}
