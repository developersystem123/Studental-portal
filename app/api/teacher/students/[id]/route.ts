import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher, HttpError } from "@/lib/auth-server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireTeacher();
    const { id } = await params;

    const myCourses = await prisma.course.findMany({
      where: { instructor: me.name },
      select: { id: true, title: true },
    });
    const myCourseIds = myCourses.map((c) => c.id);
    const titleById = new Map(myCourses.map((c) => [c.id, c.title]));

    const student = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, avatar: true, createdAt: true },
    });
    if (!student) throw new HttpError(404, "Student not found.");

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: id, courseId: { in: myCourseIds } },
      orderBy: { enrolledAt: "desc" },
    });
    if (enrollments.length === 0) throw new HttpError(403, "This student is not enrolled in your courses.");

    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId: id,
        quiz: { courseId: { in: myCourseIds } },
        completedAt: { not: null },
      },
      include: { quiz: { select: { title: true, courseId: true } } },
      orderBy: { completedAt: "desc" },
    });

    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        userId: id,
        assignment: { courseId: { in: myCourseIds } },
      },
      include: {
        assignment: { select: { title: true, courseId: true, points: true } },
      },
      orderBy: { submittedAt: "desc" },
    });

    const certificates = await prisma.certificate.findMany({
      where: { userId: id, courseId: { in: myCourseIds } },
    });
    const certByCourse = new Map(certificates.map((c) => [c.courseId, c.id]));

    const enrollmentData = enrollments.map((e) => ({
      courseId: e.courseId,
      courseTitle: titleById.get(e.courseId) ?? "—",
      enrolledAt: e.enrolledAt.toISOString(),
      progress: e.progress,
      completed: e.completed,
      certificateId: certByCourse.get(e.courseId) ?? null,
      quizAttempts: quizAttempts
        .filter((a) => a.quiz.courseId === e.courseId)
        .map((a) => ({
          quizTitle: a.quiz.title,
          score: a.score,
          percentage: a.percentage,
          passed: a.passed,
          completedAt: (a.completedAt ?? a.startedAt).toISOString(),
        })),
      submissions: submissions
        .filter((s) => s.assignment.courseId === e.courseId)
        .map((s) => ({
          assignmentTitle: s.assignment.title,
          points: s.assignment.points,
          status: s.status,
          grade: s.grade,
          feedback: s.feedback ?? "",
          submittedAt: s.submittedAt.toISOString(),
        })),
    }));

    return Response.json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        avatar: student.avatar,
        createdAt: student.createdAt.toISOString(),
      },
      enrollments: enrollmentData,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
