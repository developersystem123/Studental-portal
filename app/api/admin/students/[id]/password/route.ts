import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { errorResponse, requireAdmin } from "@/lib/auth-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { password } = (await request.json()) as { password?: string };
    if (!password || password.length < 6)
      return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target || target.role !== "Student")
      return Response.json({ error: "Student not found." }, { status: 404 });
    await prisma.user.update({ where: { id }, data: { password: hashPassword(password) } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
