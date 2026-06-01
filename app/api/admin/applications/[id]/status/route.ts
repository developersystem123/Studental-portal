// Admin-facing: decide on an in-person application. Approving also places the
// student into a physical class batch — creating their enrollment — so the
// approval and the actual seat are always in sync.

import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin, HttpError } from "@/lib/auth-server";
import { uid } from "@/lib/utils";
import type { ApplicationStatus } from "@/lib/generated/prisma/client";

type Body = {
  status?: ApplicationStatus;
  note?: string;
  physicalClassId?: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { status, note, physicalClassId } = (await request.json()) as Body;

    if (!status || !["pending", "approved", "rejected"].includes(status))
      throw new HttpError(400, "Invalid status.");

    const application = await prisma.physicalApplication.findUnique({ where: { id } });
    if (!application) throw new HttpError(404, "Application not found.");

    const existingEnrollment = await prisma.physicalClassEnrollment.findUnique({
      where: { applicationId: id },
    });

    if (status === "approved") {
      if (!physicalClassId)
        throw new HttpError(400, "Select a batch to place the student in.");

      const pc = await prisma.physicalClass.findUnique({
        where: { id: physicalClassId },
        include: { _count: { select: { enrollments: true } } },
      });
      if (!pc) throw new HttpError(404, "Selected batch not found.");
      if (pc.courseId !== application.courseId)
        throw new HttpError(400, "That batch is for a different course.");

      // Free seats, ignoring a seat this application already holds.
      const heldHere = existingEnrollment?.physicalClassId === physicalClassId ? 1 : 0;
      if (pc._count.enrollments - heldHere >= pc.capacity)
        throw new HttpError(409, "That batch is already full.");

      // Block double-placing the same student via a different application.
      const clash = await prisma.physicalClassEnrollment.findUnique({
        where: {
          physicalClassId_studentId: {
            physicalClassId,
            studentId: application.studentId,
          },
        },
      });
      if (clash && clash.applicationId !== id)
        throw new HttpError(409, "This student is already enrolled in that batch.");

      await prisma.$transaction([
        ...(existingEnrollment
          ? [prisma.physicalClassEnrollment.delete({ where: { id: existingEnrollment.id } })]
          : []),
        prisma.physicalClassEnrollment.create({
          data: {
            physicalClassId,
            studentId: application.studentId,
            applicationId: id,
            status: "active",
          },
        }),
        prisma.physicalApplication.update({
          where: { id },
          data: { status, reviewedAt: new Date(), reviewNote: note ?? application.reviewNote },
        }),
        prisma.notification.create({
          data: {
            id: uid(),
            userId: application.studentId,
            type: "announcement",
            title: "In-person application approved",
            message: `You've been placed in "${pc.title}". Check your Physical Classes for the schedule.`,
          },
        }),
      ]);
      return Response.json({ ok: true });
    }

    // Rejected or moved back to pending — release any seat they were given.
    await prisma.$transaction([
      ...(existingEnrollment
        ? [prisma.physicalClassEnrollment.delete({ where: { id: existingEnrollment.id } })]
        : []),
      prisma.physicalApplication.update({
        where: { id },
        data: { status, reviewedAt: new Date(), reviewNote: note ?? application.reviewNote },
      }),
      ...(status === "rejected"
        ? [
            prisma.notification.create({
              data: {
                id: uid(),
                userId: application.studentId,
                type: "announcement",
                title: "In-person application update",
                message: note?.trim()
                  ? `Your in-person application was not approved: ${note.trim()}`
                  : "Your in-person application was not approved this time.",
              },
            }),
          ]
        : []),
    ]);
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
