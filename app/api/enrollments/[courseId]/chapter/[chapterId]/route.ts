import { prisma } from "@/lib/db";
import { errorResponse, requireUser } from "@/lib/auth-server";

// PUT toggles whether a chapter is marked complete for the current user.
export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> },
) {
  try {
    const me = await requireUser();
    const { courseId, chapterId } = await params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { chapters: { select: { id: true } } },
    });
    if (!course) return Response.json({ error: "Course not found." }, { status: 404 });
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: me.id, courseId } },
    });
    if (!enrollment) return Response.json({ error: "Not enrolled." }, { status: 404 });

    const done = new Set(enrollment.completedChapterIds);
    if (done.has(chapterId)) done.delete(chapterId);
    else done.add(chapterId);

    const completedChapterIds = [...done];
    const total = course.chapters.length || 1;
    const progress = Math.round((completedChapterIds.length / total) * 100);
    const completed = progress >= 100;

    const updated = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { completedChapterIds, progress, completed },
    });
    return Response.json({
      enrollment: {
        courseId: updated.courseId,
        enrolledAt: updated.enrolledAt.toISOString(),
        progress: updated.progress,
        completedChapters: updated.completedChapterIds,
        completed: updated.completed,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
