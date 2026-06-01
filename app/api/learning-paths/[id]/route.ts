import { prisma } from "@/lib/db";
import { errorResponse, getCurrentUser, HttpError } from "@/lib/auth-server";
import { categoryToClient } from "@/lib/serializers";

// Public: a single learning path with its ordered courses. Accepts either the
// path id or its slug so the URL can stay readable. When a user is signed in,
// each course carries their enrolment + progress.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await getCurrentUser();
    const { id } = await params;

    const path = await prisma.learningPath.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        courses: {
          orderBy: { order: "asc" },
          include: {
            course: {
              include: { chapters: { select: { id: true } } },
            },
          },
        },
        _count: { select: { enrollments: true } },
      },
    });
    if (!path) throw new HttpError(404, "Learning path not found.");

    const progressByCourse = new Map<string, { progress: number; completed: boolean }>();
    let enrolled = false;
    if (me) {
      const [pathEnroll, courseEnrolls] = await Promise.all([
        prisma.learningPathEnrollment.findUnique({
          where: { userId_pathId: { userId: me.id, pathId: path.id } },
        }),
        prisma.enrollment.findMany({
          where: { userId: me.id },
          select: { courseId: true, progress: true, completed: true },
        }),
      ]);
      enrolled = Boolean(pathEnroll);
      for (const e of courseEnrolls) {
        progressByCourse.set(e.courseId, { progress: e.progress, completed: e.completed });
      }
    }

    const courses = path.courses.map((pc) => {
      const c = pc.course;
      const e = progressByCourse.get(c.id);
      return {
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        thumbnail: c.thumbnail,
        instructor: c.instructor,
        category: categoryToClient(c.category),
        level: c.level,
        durationMinutes: c.durationMinutes,
        chapterCount: c.chapters.length,
        order: pc.order,
        enrolled: Boolean(e),
        courseProgress: e ? (e.completed ? 100 : e.progress) : 0,
        completed: e?.completed ?? false,
      };
    });

    const progress =
      courses.length === 0
        ? 0
        : Math.round(courses.reduce((s, c) => s + c.courseProgress, 0) / courses.length);

    return Response.json({
      path: {
        id: path.id,
        title: path.title,
        slug: path.slug,
        description: path.description,
        thumbnail: path.thumbnail,
        category: categoryToClient(path.category),
        level: path.level,
        featured: path.featured,
        learners: path._count.enrollments,
        totalMinutes: courses.reduce((s, c) => s + c.durationMinutes, 0),
        enrolled,
        progress,
        courses,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
