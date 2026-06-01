import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { errorResponse, requireAdmin } from "@/lib/auth-server";
import { uid } from "@/lib/utils";

export async function GET() {
  try {
    await requireAdmin();
    const students = await prisma.user.findMany({
      where: { role: "Student" },
      include: {
        _count: { select: { enrollments: true, certificates: true } },
        enrollments: { select: { completed: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const rows = students.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone ?? undefined,
      education: u.education ?? "None",
      createdAt: u.createdAt.toISOString(),
      enrolledCount: u._count.enrollments,
      completedCount: u.enrollments.filter((e) => e.completed).length,
      certificateCount: u._count.certificates,
    }));
    return Response.json({ students: rows });
  } catch (err) {
    return errorResponse(err);
  }
}

type CreateBody = { name?: string; email?: string; password?: string; phone?: string };

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as CreateBody;
    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    if (name.length < 2 || !email || password.length < 6)
      return Response.json({ error: "Name, email and 6+ char password required." }, { status: 400 });
    const dup = await prisma.user.findUnique({ where: { email } });
    if (dup) return Response.json({ error: "An account with this email exists." }, { status: 409 });
    await prisma.user.create({
      data: {
        id: uid(),
        name,
        email,
        password: hashPassword(password),
        role: "Student",
        phone: body.phone ?? "",
        education: "None",
      },
    });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
