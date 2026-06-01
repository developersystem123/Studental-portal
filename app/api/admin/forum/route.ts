// Admin-facing: every forum post, for moderation.

import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth-server";

export async function GET() {
  try {
    await requireAdmin();
    const posts = await prisma.forumPost.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
        _count: { select: { replies: true } },
      },
    });
    return Response.json({
      posts: posts.map((p) => ({
        id: p.id,
        title: p.title,
        body: p.body,
        category: p.category,
        pinned: p.pinned,
        views: p.views,
        createdAt: p.createdAt.toISOString(),
        authorName: p.user.name,
        authorEmail: p.user.email,
        courseTitle: p.course?.title ?? undefined,
        replyCount: p._count.replies,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
