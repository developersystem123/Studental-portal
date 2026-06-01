import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth-server";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await prisma.enrollment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: {
          select: {
            id: true,
            title: true,
            instructor: true,
            certificates: { select: { id: true, userId: true } },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });
    const enrollments = rows.map((e) => {
      const cert = e.course.certificates.find((c) => c.userId === e.user.id);
      return {
        userId: e.user.id,
        userName: e.user.name,
        userEmail: e.user.email,
        courseId: e.course.id,
        courseTitle: e.course.title,
        instructor: e.course.instructor,
        enrolledAt: e.enrolledAt.toISOString(),
        progress: e.progress,
        completed: e.completed,
        certificateId: cert?.id,
      };
    });
    return Response.json({ enrollments });
  } catch (err) {
    return errorResponse(err);
  }
}
