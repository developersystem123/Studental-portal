import { prisma } from "@/lib/db";
import { errorResponse, requireUser } from "@/lib/auth-server";

// Withdraw a pending application.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireUser();
    const { id } = await params;
    const app = await prisma.physicalApplication.findUnique({ where: { id } });
    if (!app || app.studentId !== me.id)
      return Response.json({ error: "Application not found." }, { status: 404 });
    if (app.status !== "pending")
      return Response.json(
        { error: "Only pending applications can be withdrawn." },
        { status: 400 },
      );
    await prisma.physicalApplication.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
