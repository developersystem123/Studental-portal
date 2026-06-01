// Teacher-facing: certificates for the teacher's own courses, and issuing new
// ones to students who have completed them.

import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher, HttpError } from "@/lib/auth-server";
import { uid } from "@/lib/utils";

function toClient(c: {
  id: string;
  userId: string;
  courseId: string;
  score: number;
  verifyCode: string;
  issuedAt: Date;
  course: { title: string };
  user: { name: string; email: string };
}) {
  return {
    id: c.id,
    userId: c.userId,
    courseId: c.courseId,
    studentName: c.user.name,
    studentEmail: c.user.email,
    courseTitle: c.course.title,
    score: c.score,
    verifyCode: c.verifyCode,
    issuedAt: c.issuedAt.toISOString(),
  };
}

export async function GET() {
  try {
    const me = await requireTeacher();
    const myCourses = await prisma.course.findMany({
      where: { instructor: me.name },
      select: { id: true },
    });
    const courseIds = myCourses.map((c) => c.id);
    const rows = await prisma.certificate.findMany({
      where: { courseId: { in: courseIds } },
      orderBy: { issuedAt: "desc" },
      include: {
        course: { select: { title: true } },
        user: { select: { name: true, email: true } },
      },
    });
    return Response.json({ certificates: rows.map(toClient) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const me = await requireTeacher();
    const { userId, courseId, score } = (await request.json()) as {
      userId?: string;
      courseId?: string;
      score?: number;
    };
    if (!userId || !courseId || typeof score !== "number")
      throw new HttpError(400, "Student, course and score are required.");

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new HttpError(404, "Course not found.");
    if (course.instructor !== me.name)
      throw new HttpError(403, "You can only issue certificates for your own courses.");

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment)
      throw new HttpError(400, "That student isn't enrolled in this course.");

    const existing = await prisma.certificate.findFirst({ where: { userId, courseId } });
    if (existing)
      throw new HttpError(409, "This student already has a certificate for this course.");

    const safe = Math.max(0, Math.min(100, Math.round(score)));
    const created = await prisma.certificate.create({
      data: {
        id: uid(),
        userId,
        courseId,
        score: safe,
        verifyCode: `EDU-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      },
      include: {
        course: { select: { title: true } },
        user: { select: { name: true, email: true } },
      },
    });
    return Response.json({ certificate: toClient(created) });
  } catch (err) {
    return errorResponse(err);
  }
}
