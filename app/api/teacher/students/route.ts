import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher } from "@/lib/auth-server";

export async function GET() {
  try {
    const me = await requireTeacher();
    const myCourses = await prisma.course.findMany({
      where: { instructor: me.name },
      select: { id: true },
    });
    const courseIds = myCourses.map((c) => c.id);
    if (courseIds.length === 0) return Response.json({ students: [] });

    const rows = await prisma.enrollment.findMany({
      where: { courseId: { in: courseIds } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: {
          select: {
            id: true,
            title: true,
            certificates: { select: { id: true, userId: true } },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    const students = rows.map((e) => {
      const cert = e.course.certificates.find((c) => c.userId === e.user.id);
      return {
        userId: e.user.id,
        userName: e.user.name,
        userEmail: e.user.email,
        courseId: e.course.id,
        courseTitle: e.course.title,
        enrolledAt: e.enrolledAt.toISOString(),
        progress: e.progress,
        completed: e.completed,
        certificateId: cert?.id,
      };
    });
    return Response.json({ students });
  } catch (err) {
    return errorResponse(err);
  }
}
