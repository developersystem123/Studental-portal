import { prisma } from "@/lib/db";
import { errorResponse, requireUser } from "@/lib/auth-server";

async function visible(id: string, userId: string) {
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n) return null;
  if (n.userId !== null && n.userId !== userId) return null;
  return n;
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireUser();
    const { id } = await params;
    const n = await visible(id, me.id);
    if (!n) return Response.json({ error: "Not found." }, { status: 404 });
    await prisma.notification.update({ where: { id }, data: { read: true } });
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
    const me = await requireUser();
    const { id } = await params;
    const n = await visible(id, me.id);
    if (!n) return Response.json({ error: "Not found." }, { status: 404 });
    await prisma.notification.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
