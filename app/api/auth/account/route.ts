import { prisma } from "@/lib/db";
import { clearSession } from "@/lib/session";
import { errorResponse, requireUser } from "@/lib/auth-server";

export async function DELETE() {
  try {
    const me = await requireUser();
    await prisma.user.delete({ where: { id: me.id } });
    await clearSession();
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
