import { prisma } from "@/lib/db";
import { errorResponse, requireUser } from "@/lib/auth-server";
import { uid } from "@/lib/utils";
import { meetsMatriculationRequirement } from "@/lib/mockData";
import type { ApplicationStatus, EducationLevel, PhysicalApplication } from "@/lib/generated/prisma/client";

function toClient(a: PhysicalApplication) {
  return {
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
    education: a.education as EducationLevel,
    institute: a.institute,
    passingYear: a.passingYear,
    obtainedMarks: a.obtainedMarks,
    totalMarks: a.totalMarks,
    campus: a.campus,
    batch: a.batch,
    motivation: a.motivation ?? undefined,
    status: a.status as ApplicationStatus,
    submittedAt: a.submittedAt.toISOString(),
    reviewedAt: a.reviewedAt?.toISOString(),
    reviewNote: a.reviewNote ?? undefined,
  };
}

export async function GET() {
  try {
    const me = await requireUser();
    const rows = await prisma.physicalApplication.findMany({
      where: { studentId: me.id },
      orderBy: { submittedAt: "desc" },
    });
    return Response.json({ applications: rows.map(toClient) });
  } catch (err) {
    return errorResponse(err);
  }
}

type ApplyBody = {
  courseId: string;
  fullName: string;
  fatherName: string;
  email: string;
  phone: string;
  cnic: string;
  dateOfBirth: string;
  address: string;
  city: string;
  education: EducationLevel;
  institute: string;
  passingYear: string;
  obtainedMarks: string;
  totalMarks: string;
  campus: string;
  batch: string;
  motivation?: string;
};

export async function POST(request: Request) {
  try {
    const me = await requireUser();
    if (me.role !== "Student")
      return Response.json({ error: "Only students can apply." }, { status: 403 });
    const body = (await request.json()) as ApplyBody;
    if (!body.courseId) return Response.json({ error: "courseId required." }, { status: 400 });
    if (!meetsMatriculationRequirement(body.education))
      return Response.json(
        { error: "You must have completed at least Matriculation to apply for in-person classes." },
        { status: 400 },
      );

    const dup = await prisma.physicalApplication.findFirst({
      where: {
        studentId: me.id,
        courseId: body.courseId,
        status: { in: ["pending", "approved"] },
      },
    });
    if (dup) {
      return Response.json(
        {
          error:
            dup.status === "approved"
              ? "You're already approved for in-person classes for this course."
              : "You already have a pending application for this course.",
        },
        { status: 409 },
      );
    }

    const created = await prisma.physicalApplication.create({
      data: {
        id: uid(),
        studentId: me.id,
        courseId: body.courseId,
        fullName: body.fullName,
        fatherName: body.fatherName,
        email: body.email,
        phone: body.phone,
        cnic: body.cnic,
        dateOfBirth: body.dateOfBirth,
        address: body.address,
        city: body.city,
        education: body.education,
        institute: body.institute,
        passingYear: body.passingYear,
        obtainedMarks: body.obtainedMarks,
        totalMarks: body.totalMarks,
        campus: body.campus,
        batch: body.batch,
        motivation: body.motivation,
        status: "pending",
      },
    });

    // Keep the user record's education in sync so the profile stays accurate.
    if (body.education && body.education !== me.education) {
      await prisma.user.update({
        where: { id: me.id },
        data: { education: body.education },
      });
    }

    return Response.json({ application: toClient(created) });
  } catch (err) {
    return errorResponse(err);
  }
}
