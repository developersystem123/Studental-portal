import { prisma } from "@/lib/db";
import { errorResponse, requireUser } from "@/lib/auth-server";

function toClient(e: {
  courseId: string;
  enrolledAt: Date;
  progress: number;
  completedChapterIds: string[];
  completed: boolean;
}) {
  return {
    courseId: e.courseId,
    enrolledAt: e.enrolledAt.toISOString(),
    progress: e.progress,
    completedChapters: e.completedChapterIds,
    completed: e.completed,
  };
}

export async function GET() {
  try {
    const me = await requireUser();
    const rows = await prisma.enrollment.findMany({ where: { userId: me.id } });
    return Response.json({ enrollments: rows.map(toClient) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const me = await requireUser();
    const { courseId } = (await request.json()) as { courseId?: string };
    if (!courseId) return Response.json({ error: "courseId required." }, { status: 400 });

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return Response.json({ error: "Course not found." }, { status: 404 });

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: me.id, courseId } },
    });
    if (existing) return Response.json({ enrollment: toClient(existing) });

    const created = await prisma.enrollment.create({
      data: {
        userId: me.id,
        courseId,
        progress: 0,
        completedChapterIds: [],
        completed: false,
      },
    });
    return Response.json({ enrollment: toClient(created) });
  } catch (err) {
    return errorResponse(err);
  }
}
