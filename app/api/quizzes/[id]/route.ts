import { prisma } from "@/lib/db";
import { errorResponse, requireUser, HttpError } from "@/lib/auth-server";

// Fetch quiz with questions (correct answers stripped) for taking the quiz.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    const { id } = await params;
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: "asc" } },
        course: { select: { id: true, title: true } },
      },
    });
    if (!quiz) throw new HttpError(404, "Quiz not found.");

    // Must be enrolled.
    const enrolled = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: me.id, courseId: quiz.courseId } },
    });
    if (!enrolled) throw new HttpError(403, "You must be enrolled in the course to take this quiz.");

    return Response.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        durationMinutes: quiz.durationMinutes,
        passingScore: quiz.passingScore,
        courseTitle: quiz.course.title,
        questions: quiz.questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options as string[],
          points: q.points,
          // correctIndex intentionally omitted
        })),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

// Submit quiz answers. answers = { [questionId]: chosenIndex }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    const { id } = await params;
    const { answers } = (await req.json()) as { answers?: Record<string, number> };
    if (!answers || typeof answers !== "object") {
      return Response.json({ error: "answers required." }, { status: 400 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: true },
    });
    if (!quiz) throw new HttpError(404, "Quiz not found.");

    const enrolled = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: me.id, courseId: quiz.courseId } },
    });
    if (!enrolled) throw new HttpError(403, "Not enrolled.");

    let score = 0;
    let totalPoints = 0;
    for (const q of quiz.questions) {
      totalPoints += q.points;
      if (answers[q.id] === q.correctIndex) score += q.points;
    }
    const percentage = totalPoints === 0 ? 0 : Math.round((score / totalPoints) * 100);
    const passed = percentage >= quiz.passingScore;

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: me.id,
        score,
        percentage,
        passed,
        answers,
        completedAt: new Date(),
      },
    });

    return Response.json({
      attempt: {
        id: attempt.id,
        score,
        totalPoints,
        percentage,
        passed,
        completedAt: attempt.completedAt?.toISOString(),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
