import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth-server";

export async function GET() {
  try {
    await requireAdmin();
    const [students, teachers, courses, enrollments, certificates, pendingApplications] =
      await Promise.all([
        prisma.user.count({ where: { role: "Student" } }),
        prisma.user.count({ where: { role: "Instructor" } }),
        prisma.course.count(),
        prisma.enrollment.count(),
        prisma.certificate.count(),
        prisma.physicalApplication.count({ where: { status: "pending" } }),
      ]);
    return Response.json({
      stats: { students, teachers, courses, enrollments, certificates, pendingApplications },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
