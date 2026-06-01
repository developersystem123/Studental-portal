// Teacher-facing: attendance for a regular (online) course. GET returns every
// attendance row for one of the teacher's courses; POST saves one session day.

import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher, HttpError } from "@/lib/auth-server";
import { sessionDate } from "@/lib/physical";
import { ATTENDANCE_STATUSES, type AttendanceStatus } from "@/lib/mockData";

// A teacher "owns" a course when they are listed as its instructor.
async function ownedCourse(courseId: string, teacherName: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new HttpError(404, "Course not found.");
  if (course.instructor !== teacherName)
    throw new HttpError(403, "You can only manage attendance for courses you teach.");
  return course;
}

export async function GET(request: Request) {
  try {
    const me = await requireTeacher();
    const courseId = new URL(request.url).searchParams.get("courseId");
    if (!courseId) throw new HttpError(400, "A courseId is required.");
    await ownedCourse(courseId, me.name);

    const rows = await prisma.courseAttendance.findMany({
      where: { courseId },
      orderBy: { date: "asc" },
    });
    return Response.json({
      records: rows.map((r) => ({
        studentId: r.studentId,
        date: r.date.toISOString(),
        status: r.status,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

type Mark = { studentId: string; status: AttendanceStatus };

export async function POST(request: Request) {
  try {
    const me = await requireTeacher();
    const body = (await request.json()) as {
      courseId?: string;
      date?: string;
      marks?: Mark[];
    };
    if (!body.courseId) throw new HttpError(400, "A courseId is required.");
    if (!body.date) throw new HttpError(400, "A session date is required.");
    await ownedCourse(body.courseId, me.name);

    const date = sessionDate(body.date);
    const marks = Array.isArray(body.marks) ? body.marks : [];
    for (const m of marks) {
      if (!m.studentId || !ATTENDANCE_STATUSES.includes(m.status))
        throw new HttpError(400, "Each mark needs a student and a valid status.");
    }

    // Only mark students actually enrolled in this course.
    const enrolled = await prisma.enrollment.findMany({
      where: { courseId: body.courseId },
      select: { userId: true },
    });
    const enrolledIds = new Set(enrolled.map((e) => e.userId));
    const valid = marks.filter((m) => enrolledIds.has(m.studentId));
    const keepIds = valid.map((m) => m.studentId);

    await prisma.$transaction([
      prisma.courseAttendance.deleteMany({
        where: { courseId: body.courseId, date, studentId: { notIn: keepIds } },
      }),
      ...valid.map((m) =>
        prisma.courseAttendance.upsert({
          where: {
            courseId_studentId_date: {
              courseId: body.courseId!,
              studentId: m.studentId,
              date,
            },
          },
          create: {
            courseId: body.courseId!,
            studentId: m.studentId,
            date,
            status: m.status,
            markedById: me.id,
          },
          update: { status: m.status, markedById: me.id, markedAt: new Date() },
        }),
      ),
    ]);

    return Response.json({ ok: true, saved: valid.length });
  } catch (err) {
    return errorResponse(err);
  }
}
