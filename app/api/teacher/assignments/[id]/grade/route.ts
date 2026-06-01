// Teacher-facing: grade one student's submission for an assignment.

import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher, HttpError } from "@/lib/auth-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireTeacher();
    const { id } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { course: { select: { instructor: true } } },
    });
    if (!assignment) throw new HttpError(404, "Assignment not found.");
    if (assignment.course.instructor !== me.name)
      throw new HttpError(403, "You can only grade your own assignments.");

    const { studentId, grade, feedback } = (await request.json()) as {
      studentId?: string;
      grade?: number | null;
      feedback?: string;
    };
    if (!studentId) throw new HttpError(400, "A studentId is required.");

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { assignmentId_userId: { assignmentId: id, userId: studentId } },
    });
    if (!submission) throw new HttpError(404, "That student hasn't submitted yet.");

    let score: number | null = null;
    if (grade !== null && grade !== undefined) {
      const n = Number(grade);
      if (!Number.isFinite(n) || n < 0 || n > assignment.points)
        throw new HttpError(400, `Grade must be between 0 and ${assignment.points}.`);
      score = Math.round(n);
    }

    await prisma.assignmentSubmission.update({
      where: { assignmentId_userId: { assignmentId: id, userId: studentId } },
      data: {
        grade: score,
        feedback: feedback?.trim() || null,
        status: score === null ? "submitted" : "graded",
        gradedAt: score === null ? null : new Date(),
      },
    });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
