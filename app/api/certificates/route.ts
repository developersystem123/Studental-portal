import { prisma } from "@/lib/db";
import { errorResponse, requireUser } from "@/lib/auth-server";
import { uid } from "@/lib/utils";

function toClient(c: {
  id: string;
  courseId: string;
  issuedAt: Date;
  score: number;
  verifyCode: string;
}) {
  return {
    id: c.id,
    courseId: c.courseId,
    issuedAt: c.issuedAt.toISOString(),
    score: c.score,
    verifyCode: c.verifyCode,
  };
}

export async function GET() {
  try {
    const me = await requireUser();
    const rows = await prisma.certificate.findMany({ where: { userId: me.id } });
    return Response.json({ certificates: rows.map(toClient) });
  } catch (err) {
    return errorResponse(err);
  }
}

// Self-award (used by the in-app exam flow).
export async function POST(request: Request) {
  try {
    const me = await requireUser();
    const { courseId, score } = (await request.json()) as { courseId?: string; score?: number };
    if (!courseId || typeof score !== "number")
      return Response.json({ error: "courseId and numeric score required." }, { status: 400 });

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return Response.json({ error: "Course not found." }, { status: 404 });

    const cert = await prisma.certificate.create({
      data: {
        id: uid(),
        userId: me.id,
        courseId,
        score: Math.max(0, Math.min(100, Math.round(score))),
        verifyCode: `EDU-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      },
    });
    return Response.json({ certificate: toClient(cert) });
  } catch (err) {
    return errorResponse(err);
  }
}
