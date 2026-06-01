// Student-facing: delete one of the current user's lesson notes.

import { prisma } from "@/lib/db";
import { errorResponse, requireUser, HttpError } from "@/lib/auth-server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireUser();
    const { id } = await params;
    const note = await prisma.lessonNote.findUnique({ where: { id } });
    if (!note) throw new HttpError(404, "Note not found.");
    if (note.userId !== me.id) throw new HttpError(403, "Not your note.");
    await prisma.lessonNote.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
