import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth-server";
import { uid } from "@/lib/utils";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await prisma.certificate.findMany({
      orderBy: { issuedAt: "desc" },
      include: {
        course: { select: { title: true } },
        user: { select: { name: true, email: true } },
      },
    });
    return Response.json({
      certificates: rows.map((c) => ({
        id: c.id,
        userId: c.userId,
        courseId: c.courseId,
        studentName: c.user.name,
        studentEmail: c.user.email,
        courseTitle: c.course.title,
        score: c.score,
        verifyCode: c.verifyCode,
        issuedAt: c.issuedAt.toISOString(),
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

type AwardBody = { userId?: string; courseId?: string; score?: number };

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { userId, courseId, score } = (await request.json()) as AwardBody;
    if (!userId || !courseId || typeof score !== "number")
      return Response.json({ error: "userId, courseId and score required." }, { status: 400 });
    const safe = Math.max(0, Math.min(100, Math.round(score)));
    const existing = await prisma.certificate.findFirst({ where: { userId, courseId } });
    if (existing) {
      return Response.json({
        certificate: {
          id: existing.id,
          courseId: existing.courseId,
          issuedAt: existing.issuedAt.toISOString(),
          score: existing.score,
          verifyCode: existing.verifyCode,
        },
      });
    }
    const created = await prisma.certificate.create({
      data: {
        id: uid(),
        userId,
        courseId,
        score: safe,
        verifyCode: `EDU-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      },
    });
    return Response.json({
      certificate: {
        id: created.id,
        courseId: created.courseId,
        issuedAt: created.issuedAt.toISOString(),
        score: created.score,
        verifyCode: created.verifyCode,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
