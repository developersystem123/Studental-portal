import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher, HttpError } from "@/lib/auth-server";
import { toClientChapter } from "@/lib/serializers";

async function getOwnedChapter(courseId: string, chapterId: string, teacherName: string) {
  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId, courseId },
    include: { course: { select: { instructor: true } } },
  });
  if (!chapter) throw new HttpError(404, "Chapter not found.");
  if (chapter.course.instructor !== teacherName) throw new HttpError(403, "Not your course.");
  return chapter;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; chapterId: string }> },
) {
  try {
    const me = await requireTeacher();
    const { id, chapterId } = await params;
    await getOwnedChapter(id, chapterId, me.name);

    const body = (await request.json()) as {
      title?: string;
      videoUrl?: string;
      duration?: number;
      resources?: { name: string; url: string }[] | null;
      order?: number;
    };

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) {
      const t = body.title.trim();
      if (t.length < 2) throw new HttpError(400, "Title must be at least 2 characters.");
      data.title = t;
    }
    if (body.videoUrl !== undefined) data.videoUrl = body.videoUrl.trim();
    if (body.duration !== undefined) data.duration = Math.max(0, Math.round(Number(body.duration) || 0));
    if (body.resources !== undefined) data.resources = body.resources;
    if (body.order !== undefined) data.order = body.order;

    const updated = await prisma.chapter.update({ where: { id: chapterId }, data });

    // Recalculate course total duration when chapter duration changes
    if (body.duration !== undefined) {
      const allChapters = await prisma.chapter.findMany({
        where: { courseId: id },
        select: { duration: true },
      });
      const totalSeconds = allChapters.reduce((s, c) => s + c.duration, 0);
      await prisma.course.update({
        where: { id },
        data: { durationMinutes: Math.round(totalSeconds / 60) },
      });
    }

    return Response.json({ chapter: toClientChapter(updated) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; chapterId: string }> },
) {
  try {
    const me = await requireTeacher();
    const { id, chapterId } = await params;
    await getOwnedChapter(id, chapterId, me.name);
    await prisma.chapter.delete({ where: { id: chapterId } });

    // Recalculate course total duration
    const allChapters = await prisma.chapter.findMany({
      where: { courseId: id },
      select: { duration: true },
    });
    const totalSeconds = allChapters.reduce((s, c) => s + c.duration, 0);
    await prisma.course.update({
      where: { id },
      data: { durationMinutes: Math.round(totalSeconds / 60) },
    });

    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
