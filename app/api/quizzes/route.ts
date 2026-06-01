import { prisma } from "@/lib/db";
import { errorResponse, requireUser } from "@/lib/auth-server";

// List quizzes for enrolled courses, with attempt summary.
export async function GET() {
  try {
    const me = await requireUser();
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: me.id },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((e) => e.courseId);

    const quizzes = await prisma.quiz.findMany({
      where: { courseId: { in: courseIds } },
      include: {
        course: { select: { title: true, thumbnail: true } },
        questions: { select: { id: true } },
        attempts: {
          where: { userId: me.id },
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({
      quizzes: quizzes.map((q) => ({
        id: q.id,
        courseId: q.courseId,
        courseTitle: q.course.title,
        courseThumbnail: q.course.thumbnail,
        title: q.title,
        description: q.description,
        durationMinutes: q.durationMinutes,
        passingScore: q.passingScore,
        questionCount: q.questions.length,
        lastAttempt: q.attempts[0]
          ? {
              id: q.attempts[0].id,
              score: q.attempts[0].score,
              percentage: q.attempts[0].percentage,
              passed: q.attempts[0].passed,
              completedAt: q.attempts[0].completedAt?.toISOString() ?? null,
            }
          : null,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
