import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin, HttpError } from "@/lib/auth-server";

// DELETE /api/admin/notifications/[id] — admins can delete any notification
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const n = await prisma.notification.findUnique({ where: { id } });
    if (!n) throw new HttpError(404, "Notification not found.");
    await prisma.notification.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
