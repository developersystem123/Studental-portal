import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth-server";
import { categoryToClient } from "@/lib/serializers";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await prisma.physicalApplication.findMany({
      include: {
        student: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, category: true, instructor: true } },
        physicalEnrollment: {
          include: { physicalClass: { select: { id: true, title: true } } },
        },
      },
      orderBy: { submittedAt: "desc" },
    });
    const applications = rows.map((a) => ({
      id: a.id,
      studentId: a.studentId,
      courseId: a.courseId,
      fullName: a.fullName,
      fatherName: a.fatherName,
      email: a.email,
      phone: a.phone,
      cnic: a.cnic,
      dateOfBirth: a.dateOfBirth,
      address: a.address,
      city: a.city,
      education: a.education,
      institute: a.institute,
      passingYear: a.passingYear,
      obtainedMarks: a.obtainedMarks,
      totalMarks: a.totalMarks,
      campus: a.campus,
      batch: a.batch,
      motivation: a.motivation ?? undefined,
      status: a.status,
      submittedAt: a.submittedAt.toISOString(),
      reviewedAt: a.reviewedAt?.toISOString(),
      reviewNote: a.reviewNote ?? undefined,
      physicalClassId: a.physicalEnrollment?.physicalClassId ?? undefined,
      physicalClassTitle: a.physicalEnrollment?.physicalClass.title ?? undefined,
      studentName: a.student.name,
      studentEmail: a.student.email,
      courseTitle: a.course.title,
      courseCategory: categoryToClient(a.course.category),
      instructor: a.course.instructor,
    }));
    return Response.json({ applications });
  } catch (err) {
    return errorResponse(err);
  }
}
