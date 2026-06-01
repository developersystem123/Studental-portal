// Teacher-facing: read or save the attendance sheet for one session date of a
// batch. A POST fully syncs that day — marks not in the payload are removed.

import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher, HttpError } from "@/lib/auth-server";
import { sessionDate } from "@/lib/physical";
import { ATTENDANCE_STATUSES, type AttendanceStatus } from "@/lib/mockData";

async function ownedClass(id: string, teacherId: string) {
  const pc = await prisma.physicalClass.findUnique({ where: { id } });
  if (!pc) throw new HttpError(404, "Physical class not found.");
  if (pc.instructorId !== teacherId)
    throw new HttpError(403, "You can only manage batches you teach.");
  return pc;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireTeacher();
    const { id } = await params;
    await ownedClass(id, me.id);

    const dateParam = new URL(request.url).searchParams.get("date");
    if (!dateParam) throw new HttpError(400, "A session date is required.");

    const rows = await prisma.physicalAttendance.findMany({
      where: { physicalClassId: id, date: sessionDate(dateParam) },
    });
    return Response.json({
      date: dateParam.slice(0, 10),
      marks: rows.map((r) => ({
        studentId: r.studentId,
        status: r.status,
        note: r.note ?? undefined,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

type Mark = { studentId: string; status: AttendanceStatus; note?: string };

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireTeacher();
    const { id } = await params;
    await ownedClass(id, me.id);

    const body = (await request.json()) as { date?: string; marks?: Mark[] };
    if (!body.date) throw new HttpError(400, "A session date is required.");
    const date = sessionDate(body.date);
    const marks = Array.isArray(body.marks) ? body.marks : [];

    for (const m of marks) {
      if (!m.studentId || !ATTENDANCE_STATUSES.includes(m.status))
        throw new HttpError(400, "Each mark needs a student and a valid status.");
    }

    // Only mark students actually enrolled in this batch.
    const enrolled = await prisma.physicalClassEnrollment.findMany({
      where: { physicalClassId: id },
      select: { studentId: true },
    });
    const enrolledIds = new Set(enrolled.map((e) => e.studentId));
    const valid = marks.filter((m) => enrolledIds.has(m.studentId));
    const keepIds = valid.map((m) => m.studentId);

    await prisma.$transaction([
      // Drop marks for this date that are no longer present in the payload.
      prisma.physicalAttendance.deleteMany({
        where: { physicalClassId: id, date, studentId: { notIn: keepIds } },
      }),
      ...valid.map((m) =>
        prisma.physicalAttendance.upsert({
          where: {
            physicalClassId_studentId_date: {
              physicalClassId: id,
              studentId: m.studentId,
              date,
            },
          },
          create: {
            physicalClassId: id,
            studentId: m.studentId,
            date,
            status: m.status,
            note: m.note?.trim() || null,
            markedById: me.id,
          },
          update: {
            status: m.status,
            note: m.note?.trim() || null,
            markedById: me.id,
            markedAt: new Date(),
          },
        }),
      ),
    ]);

    return Response.json({ ok: true, saved: valid.length });
  } catch (err) {
    return errorResponse(err);
  }
}
