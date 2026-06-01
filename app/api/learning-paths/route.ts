import { prisma } from "@/lib/db";
import { errorResponse, getCurrentUser } from "@/lib/auth-server";
import { categoryToClient } from "@/lib/serializers";

// Public: list every learning path. When a user is signed in, each path also
// carries their enrolled flag and overall progress across its courses.
export async function GET() {
  try {
    const me = await getCurrentUser();

    const paths = await prisma.learningPath.findMany({
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: {
        courses: { select: { courseId: true, course: { select: { durationMinutes: true } } } },
        _count: { select: { enrollments: true } },
      },
    });

    // Pull the signed-in user's path enrollments + course progress once.
    const myPathIds = new Set<string>();
    const progressByCourse = new Map<string, { progress: number; completed: boolean }>();
    if (me) {
      const [pathEnrolls, courseEnrolls] = await Promise.all([
        prisma.learningPathEnrollment.findMany({
          where: { userId: me.id },
          select: { pathId: true },
        }),
        prisma.enrollment.findMany({
          where: { userId: me.id },
          select: { courseId: true, progress: true, completed: true },
        }),
      ]);
      for (const e of pathEnrolls) myPathIds.add(e.pathId);
      for (const e of courseEnrolls) {
        progressByCourse.set(e.courseId, { progress: e.progress, completed: e.completed });
      }
    }

    const result = paths.map((p) => {
      const courseIds = p.courses.map((c) => c.courseId);
      const totalMinutes = p.courses.reduce(
        (sum, c) => sum + (c.course?.durationMinutes ?? 0),
        0,
      );
      const progress =
        courseIds.length === 0
          ? 0
          : Math.round(
              courseIds.reduce((sum, id) => {
                const e = progressByCourse.get(id);
                return sum + (e ? (e.completed ? 100 : e.progress) : 0);
              }, 0) / courseIds.length,
            );

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description,
        thumbnail: p.thumbnail,
        category: categoryToClient(p.category),
        level: p.level,
        featured: p.featured,
        courseCount: courseIds.length,
        totalMinutes,
        learners: p._count.enrollments,
        enrolled: myPathIds.has(p.id),
        progress,
      };
    });

    return Response.json({ paths: result });
  } catch (err) {
    return errorResponse(err);
  }
}
