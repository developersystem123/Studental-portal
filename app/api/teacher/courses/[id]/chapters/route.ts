import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher, HttpError } from "@/lib/auth-server";
import { toClientChapter } from "@/lib/serializers";

async function getOwnedCourse(id: string, teacherName: string) {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw new HttpError(404, "Course not found.");
  if (course.instructor !== teacherName) throw new HttpError(403, "Not your course.");
  return course;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireTeacher();
    const { id } = await params;
    await getOwnedCourse(id, me.name);
    const chapters = await prisma.chapter.findMany({
      where: { courseId: id },
      orderBy: { order: "asc" },
    });
    return Response.json({ chapters: chapters.map(toClientChapter) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireTeacher();
    const { id } = await params;
    await getOwnedCourse(id, me.name);

    const body = (await request.json()) as {
      title?: string;
      videoUrl?: string;
      duration?: number;
      resources?: { name: string; url: string }[] | null;
    };

    const title = (body.title ?? "").trim();
    if (title.length < 2) throw new HttpError(400, "Title must be at least 2 characters.");

    const last = await prisma.chapter.findFirst({
      where: { courseId: id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const chapter = await prisma.chapter.create({
      data: {
        id: crypto.randomUUID(),
        courseId: id,
        title,
        videoUrl: (body.videoUrl ?? "").trim(),
        duration: Math.max(0, Math.round(Number(body.duration) || 0)),
        resources: body.resources ?? null,
        order: (last?.order ?? -1) + 1,
      },
    });

    // Update course durationMinutes from all chapters
    const allChapters = await prisma.chapter.findMany({
      where: { courseId: id },
      select: { duration: true },
    });
    const totalSeconds = allChapters.reduce((s, c) => s + c.duration, 0);
    await prisma.course.update({
      where: { id },
      data: { durationMinutes: Math.round(totalSeconds / 60) },
    });

    return Response.json({ chapter: toClientChapter(chapter) });
  } catch (err) {
    return errorResponse(err);
  }
}
