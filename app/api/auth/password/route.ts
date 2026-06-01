import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { errorResponse, requireUser } from "@/lib/auth-server";

export async function PUT(request: Request) {
  try {
    const me = await requireUser();
    const { current, next } = (await request.json()) as { current?: string; next?: string };
    if (!current || !next)
      return Response.json({ error: "Both passwords are required." }, { status: 400 });
    if (next.length < 8)
      return Response.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    if (current === next)
      return Response.json({ error: "New password must be different." }, { status: 400 });

    const full = await prisma.user.findUnique({ where: { id: me.id } });
    if (!full) return Response.json({ error: "Account not found." }, { status: 404 });
    if (!verifyPassword(current, full.password))
      return Response.json({ error: "Current password is incorrect." }, { status: 401 });

    await prisma.user.update({
      where: { id: me.id },
      data: { password: hashPassword(next) },
    });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
