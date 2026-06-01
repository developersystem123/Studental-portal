import { prisma } from "@/lib/db";
import { errorResponse, requireUser } from "@/lib/auth-server";
import type { EducationLevel } from "@/lib/generated/prisma/client";

type Body = {
  name?: string;
  email?: string;
  bio?: string;
  phone?: string;
  avatar?: string | null;
  banner?: string | null;
  education?: EducationLevel | null;
};

export async function PUT(request: Request) {
  try {
    const me = await requireUser();
    const body = (await request.json()) as Body;

    if (body.email && body.email !== me.email) {
      const lower = body.email.toLowerCase();
      if (!lower.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/))
        return Response.json({ error: "Enter a valid email." }, { status: 400 });
      const existing = await prisma.user.findUnique({ where: { email: lower } });
      if (existing && existing.id !== me.id) {
        return Response.json({ error: "Another account uses this email." }, { status: 409 });
      }
      body.email = lower;
    }

    const updated = await prisma.user.update({
      where: { id: me.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.bio !== undefined ? { bio: body.bio } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.avatar !== undefined ? { avatar: body.avatar } : {}),
        ...(body.banner !== undefined ? { banner: body.banner } : {}),
        ...(me.role === "Student" && body.education !== undefined
          ? { education: body.education }
          : {}),
      },
    });
    const { password: _p, ...safe } = updated;
    return Response.json({ user: safe });
  } catch (err) {
    return errorResponse(err);
  }
}
