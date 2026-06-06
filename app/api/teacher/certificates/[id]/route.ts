import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher, HttpError } from "@/lib/auth-server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireTeacher();
    const { id } = await params;

    const cert = await prisma.certificate.findUnique({
      where: { id },
      include: { course: { select: { instructor: true } } },
    });
    if (!cert) throw new HttpError(404, "Certificate not found.");
    if (cert.course.instructor !== me.name)
      throw new HttpError(403, "You can only revoke certificates for your own courses.");

    await prisma.certificate.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
