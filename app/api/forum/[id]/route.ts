import { prisma } from "@/lib/db";
import { errorResponse, requireUser, HttpError } from "@/lib/auth-server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const post = await prisma.forumPost.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
        course: { select: { id: true, title: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
        },
      },
    });
    if (!post) throw new HttpError(404, "Post not found.");

    // Bump view count
    await prisma.forumPost.update({ where: { id }, data: { views: { increment: 1 } } });

    return Response.json({
      post: {
        id: post.id,
        title: post.title,
        body: post.body,
        category: post.category,
        pinned: post.pinned,
        views: post.views + 1,
        createdAt: post.createdAt.toISOString(),
        author: { id: post.user.id, name: post.user.name, avatar: post.user.avatar, role: post.user.role },
        course: post.course,
        replies: post.replies.map((r) => ({
          id: r.id,
          body: r.body,
          createdAt: r.createdAt.toISOString(),
          author: { id: r.user.id, name: r.user.name, avatar: r.user.avatar, role: r.user.role },
        })),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    const { id } = await params;
    const { body } = (await req.json()) as { body?: string };
    if (!body?.trim()) throw new HttpError(400, "Reply body is required.");

    const post = await prisma.forumPost.findUnique({ where: { id } });
    if (!post) throw new HttpError(404, "Post not found.");

    const reply = await prisma.forumReply.create({
      data: { postId: id, userId: me.id, body: body.trim() },
      include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
    });

    return Response.json({
      reply: {
        id: reply.id,
        body: reply.body,
        createdAt: reply.createdAt.toISOString(),
        author: {
          id: reply.user.id,
          name: reply.user.name,
          avatar: reply.user.avatar,
          role: reply.user.role,
        },
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
