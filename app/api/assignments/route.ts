import { prisma } from "@/lib/db";
import { errorResponse, requireUser } from "@/lib/auth-server";

// List assignments for courses the user is enrolled in, with their submission status.
export async function GET() {
  try {
    const me = await requireUser();
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: me.id },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((e) => e.courseId);

    const assignments = await prisma.assignment.findMany({
      where: { courseId: { in: courseIds } },
      include: {
        course: { select: { id: true, title: true, thumbnail: true } },
        submissions: { where: { userId: me.id }, take: 1 },
      },
      orderBy: { dueDate: "asc" },
    });

    return Response.json({
      assignments: assignments.map((a) => ({
        id: a.id,
        courseId: a.courseId,
        courseTitle: a.course.title,
        courseThumbnail: a.course.thumbnail,
        title: a.title,
        description: a.description,
        points: a.points,
        dueDate: a.dueDate.toISOString(),
        status: a.status,
        submission: a.submissions[0]
          ? {
              id: a.submissions[0].id,
              status: a.submissions[0].status,
              grade: a.submissions[0].grade,
              feedback: a.submissions[0].feedback,
              submittedAt: a.submissions[0].submittedAt.toISOString(),
              content: a.submissions[0].content,
              fileUrl: a.submissions[0].fileUrl,
            }
          : null,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
