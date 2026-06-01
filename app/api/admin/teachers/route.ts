import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { errorResponse, requireAdmin } from "@/lib/auth-server";
import { uid } from "@/lib/utils";

export async function GET() {
  try {
    await requireAdmin();
    const teachers = await prisma.user.findMany({
      where: { role: "Instructor" },
      orderBy: { createdAt: "desc" },
    });
    const courses = await prisma.course.findMany({
      select: { id: true, instructor: true, enrollments: { select: { userId: true } } },
    });

    const rows = teachers.map((t) => {
      const taught = courses.filter((c) => c.instructor === t.name);
      const studentIds = new Set<string>();
      for (const c of taught) {
        for (const e of c.enrollments) studentIds.add(e.userId);
      }
      return {
        id: t.id,
        name: t.name,
        email: t.email,
        phone: t.phone ?? undefined,
        bio: t.bio ?? undefined,
        createdAt: t.createdAt.toISOString(),
        courseCount: taught.length,
        studentCount: studentIds.size,
      };
    });
    return Response.json({ teachers: rows });
  } catch (err) {
    return errorResponse(err);
  }
}

type CreateBody = {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  bio?: string;
};

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
        role: "Instructor",
        phone: body.phone ?? "",
        bio: body.bio ?? "",
      },
    });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
