import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth-server";

type PatchBody = { name?: string; email?: string; phone?: string; bio?: string };

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = (await request.json()) as PatchBody;
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target || target.role !== "Student")
      return Response.json({ error: "Student not found." }, { status: 404 });

    if (body.email && body.email.toLowerCase() !== target.email) {
      const dup = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
      if (dup && dup.id !== id)
        return Response.json({ error: "Another account uses this email." }, { status: 409 });
      body.email = body.email.toLowerCase();
    }

    await prisma.user.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.bio !== undefined ? { bio: body.bio } : {}),
      },
    });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target || target.role !== "Student")
      return Response.json({ error: "Student not found." }, { status: 404 });
    // Cascading deletes in schema take care of enrollments / certs / apps.
    await prisma.user.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
