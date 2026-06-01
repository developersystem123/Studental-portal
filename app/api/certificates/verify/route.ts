// Public certificate verification — anyone (e.g. an employer) can confirm a
// certificate is genuine by its code. No authentication required.

import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/auth-server";

export async function GET(request: Request) {
  try {
    const code = new URL(request.url).searchParams.get("code")?.trim();
    if (!code) return Response.json({ valid: false, error: "A verification code is required." });

    const cert = await prisma.certificate.findUnique({
      where: { verifyCode: code },
      include: {
        course: { select: { title: true, category: true } },
        user: { select: { name: true } },
      },
    });
    if (!cert) return Response.json({ valid: false });

    return Response.json({
      valid: true,
      certificate: {
        verifyCode: cert.verifyCode,
        studentName: cert.user.name,
        courseTitle: cert.course.title,
        score: cert.score,
        issuedAt: cert.issuedAt.toISOString(),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
