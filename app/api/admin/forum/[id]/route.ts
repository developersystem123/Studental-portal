// Admin-facing: moderate one forum post — pin/unpin or delete it.

import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin, HttpError } from "@/lib/auth-server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const post = await prisma.forumPost.findUnique({ where: { id } });
    if (!post) throw new HttpError(404, "Post not found.");

    const { pinned } = (await request.json()) as { pinned?: boolean };
    if (typeof pinned !== "boolean")
      throw new HttpError(400, "A boolean `pinned` value is required.");

    await prisma.forumPost.update({ where: { id }, data: { pinned } });
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
    const post = await prisma.forumPost.findUnique({ where: { id } });
    if (!post) throw new HttpError(404, "Post not found.");
    // Replies cascade-delete with the post.
    await prisma.forumPost.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
