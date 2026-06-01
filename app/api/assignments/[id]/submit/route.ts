import { prisma } from "@/lib/db";
import { errorResponse, requireUser, HttpError } from "@/lib/auth-server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    const { id } = await params;
    const { content, fileUrl } = (await request.json()) as { content?: string; fileUrl?: string };
    const text = content?.trim() ?? "";
    if (!text && !fileUrl) {
      return Response.json(
        { error: "Add a written answer or attach a file." },
        { status: 400 },
      );
    }

    const assignment = await prisma.assignment.findUnique({ where: { id } });
    if (!assignment) throw new HttpError(404, "Assignment not found.");
    if (assignment.status !== "open") {
      throw new HttpError(400, "This assignment is no longer accepting submissions.");
    }

    // Check enrolled
    const enrolled = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: me.id, courseId: assignment.courseId } },
    });
    if (!enrolled) throw new HttpError(403, "You must be enrolled in the course.");

    const late = new Date() > assignment.dueDate;
    const submission = await prisma.assignmentSubmission.upsert({
      where: { assignmentId_userId: { assignmentId: id, userId: me.id } },
      update: {
        content: text,
        fileUrl: fileUrl ?? null,
        status: late ? "late" : "submitted",
        submittedAt: new Date(),
      },
      create: {
        assignmentId: id,
        userId: me.id,
        content: text,
        fileUrl: fileUrl ?? null,
        status: late ? "late" : "submitted",
      },
    });

    return Response.json({
      submission: {
        id: submission.id,
        status: submission.status,
        submittedAt: submission.submittedAt.toISOString(),
        content: submission.content,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
