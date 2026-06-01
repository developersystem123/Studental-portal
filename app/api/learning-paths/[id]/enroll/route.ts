import { prisma } from "@/lib/db";
import { errorResponse, requireUser, HttpError } from "@/lib/auth-server";

// Enrolling in a path also enrols the student in every course it contains, so
// the path becomes a single click to start a whole track.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireUser();

    // Block enrollment if the student's profile is incomplete.
    const missingPhone = !me.phone?.trim();
    const missingEdu = me.role === "Student" && (!me.education || me.education === "None");
    if (missingPhone || missingEdu) {
      throw new HttpError(
        422,
        "Please complete your profile (phone" +
          (me.role === "Student" ? " and education level" : "") +
          ") before enrolling.",
      );
    }

    const { id } = await params;

    const path = await prisma.learningPath.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: { courses: { select: { courseId: true } } },
    });
    if (!path) throw new HttpError(404, "Learning path not found.");

    await prisma.learningPathEnrollment.upsert({
      where: { userId_pathId: { userId: me.id, pathId: path.id } },
      update: {},
      create: { userId: me.id, pathId: path.id },
    });

    // Enrol in every course of the path, skipping ones already enrolled.
    if (path.courses.length > 0) {
      await prisma.enrollment.createMany({
        data: path.courses.map((c) => ({ userId: me.id, courseId: c.courseId })),
        skipDuplicates: true,
      });
    }

    return Response.json({ ok: true, enrolledCourses: path.courses.length });
  } catch (err) {
    return errorResponse(err);
  }
}

// Leaving a path only removes the path enrolment — individual course
// enrolments (and their progress) are kept.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireUser();
    const { id } = await params;

    const path = await prisma.learningPath.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    });
    if (!path) throw new HttpError(404, "Learning path not found.");

    await prisma.learningPathEnrollment
      .delete({ where: { userId_pathId: { userId: me.id, pathId: path.id } } })
      .catch(() => {});

    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
