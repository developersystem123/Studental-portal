// Teacher-facing: quizzes across the teacher's courses, with questions + attempts.

import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher, HttpError } from "@/lib/auth-server";

type QuestionInput = { prompt?: string; options?: string[]; answerIndex?: number };

// Validate a list of MCQ questions from a create/update payload.
function cleanQuestions(raw: unknown): {
  question: string;
  options: string[];
  correctIndex: number;
  points: number;
  order: number;
}[] {
  const list = Array.isArray(raw) ? (raw as QuestionInput[]) : [];
  if (list.length === 0) throw new HttpError(400, "Add at least one question.");
  return list.map((q, i) => {
    const prompt = (q.prompt ?? "").trim();
    const options = (q.options ?? []).map((o) => (o ?? "").trim());
    if (!prompt) throw new HttpError(400, `Question ${i + 1} needs a prompt.`);
    if (options.length < 2 || options.some((o) => !o))
      throw new HttpError(400, `Question ${i + 1} needs all options filled in.`);
    const answerIndex = Number(q.answerIndex);
    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length)
      throw new HttpError(400, `Question ${i + 1} needs a correct answer selected.`);
    return { question: prompt, options, correctIndex: answerIndex, points: 1, order: i };
  });
}

export async function GET() {
  try {
    const me = await requireTeacher();
    const courses = await prisma.course.findMany({
      where: { instructor: me.name },
      select: { id: true, title: true },
    });
    const titleById = new Map(courses.map((c) => [c.id, c.title]));

    const rows = await prisma.quiz.findMany({
      where: { courseId: { in: courses.map((c) => c.id) } },
      orderBy: { createdAt: "desc" },
      include: {
        questions: { orderBy: { order: "asc" } },
        attempts: {
          where: { completedAt: { not: null } },
          include: { user: { select: { name: true } } },
        },
      },
    });

    return Response.json({
      quizzes: rows.map((q) => ({
        id: q.id,
        courseId: q.courseId,
        courseTitle: titleById.get(q.courseId) ?? "—",
        title: q.title,
        description: q.description,
        durationMinutes: q.durationMinutes,
        passingScore: q.passingScore,
        createdAt: q.createdAt.toISOString(),
        questions: q.questions.map((qq) => ({
          id: qq.id,
          prompt: qq.question,
          options: qq.options as string[],
          answerIndex: qq.correctIndex,
        })),
        attempts: q.attempts.map((a) => ({
          studentId: a.userId,
          studentName: a.user.name,
          score: a.score,
          percentage: a.percentage,
          completedAt: (a.completedAt ?? a.startedAt).toISOString(),
        })),
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const me = await requireTeacher();
    const body = (await request.json()) as {
      courseId?: string;
      title?: string;
      description?: string;
      durationMinutes?: number;
      passingScore?: number;
      questions?: unknown;
    };

    const course = await prisma.course.findUnique({ where: { id: body.courseId } });
    if (!course || course.instructor !== me.name)
      throw new HttpError(400, "Select one of your own courses.");
    const title = (body.title ?? "").trim();
    if (title.length < 3) throw new HttpError(400, "Title must be at least 3 characters.");
    const questions = cleanQuestions(body.questions);

    const created = await prisma.quiz.create({
      data: {
        courseId: course.id,
        title,
        description: (body.description ?? "").trim(),
        durationMinutes: Math.max(1, Math.round(Number(body.durationMinutes) || 15)),
        passingScore: Math.min(100, Math.max(0, Math.round(Number(body.passingScore) || 60))),
        questions: { create: questions },
      },
    });
    return Response.json({ id: created.id });
  } catch (err) {
    return errorResponse(err);
  }
}
