// Teacher-facing: update or delete one quiz (and replace its questions).

import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher, HttpError } from "@/lib/auth-server";

type QuestionInput = { prompt?: string; options?: string[]; answerIndex?: number };

function cleanQuestions(raw: unknown) {
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

async function ownedQuiz(id: string, teacherName: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { course: { select: { instructor: true } } },
  });
  if (!quiz) throw new HttpError(404, "Quiz not found.");
  if (quiz.course.instructor !== teacherName)
    throw new HttpError(403, "You can only manage quizzes in your own courses.");
  return quiz;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireTeacher();
    const { id } = await params;
    await ownedQuiz(id, me.name);

    const body = (await request.json()) as {
      title?: string;
      description?: string;
      durationMinutes?: number;
      passingScore?: number;
      questions?: unknown;
    };
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) {
      if (body.title.trim().length < 3)
        throw new HttpError(400, "Title must be at least 3 characters.");
      data.title = body.title.trim();
    }
    if (body.description !== undefined) data.description = body.description.trim();
    if (body.durationMinutes !== undefined)
      data.durationMinutes = Math.max(1, Math.round(Number(body.durationMinutes) || 15));
    if (body.passingScore !== undefined)
      data.passingScore = Math.min(100, Math.max(0, Math.round(Number(body.passingScore) || 60)));

    // Replacing questions: validate first, then swap atomically.
    if (body.questions !== undefined) {
      const questions = cleanQuestions(body.questions);
      await prisma.$transaction([
        prisma.quizQuestion.deleteMany({ where: { quizId: id } }),
        prisma.quiz.update({
          where: { id },
          data: { ...data, questions: { create: questions } },
        }),
      ]);
    } else {
      await prisma.quiz.update({ where: { id }, data });
    }
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireTeacher();
    const { id } = await params;
    await ownedQuiz(id, me.name);
    await prisma.quiz.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
