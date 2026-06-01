import { prisma } from "@/lib/db";
import { errorResponse, requireUser, HttpError } from "@/lib/auth-server";
import type { ForumCategory } from "@/lib/generated/prisma/client";

const VALID_CATEGORIES: ForumCategory[] = ["general", "question", "announcement", "discussion"];

export async function GET(request: Request) {
  try {
    await requireUser();
    const url = new URL(request.url);
    const category = url.searchParams.get("category") as ForumCategory | null;
    const courseId = url.searchParams.get("courseId");
    const search = url.searchParams.get("q")?.trim();

    const posts = await prisma.forumPost.findMany({
      where: {
        ...(category && VALID_CATEGORIES.includes(category) ? { category } : {}),
        ...(courseId ? { courseId } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { body: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
        course: { select: { id: true, title: true } },
        _count: { select: { replies: true } },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 100,
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
        replyCount: p._count.replies,
        author: { id: p.user.id, name: p.user.name, avatar: p.user.avatar, role: p.user.role },
        course: p.course ? { id: p.course.id, title: p.course.title } : null,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const me = await requireUser();
    const { title, body, category, courseId } = (await request.json()) as {
      title?: string;
      body?: string;
      category?: ForumCategory;
      courseId?: string;
    };
    if (!title?.trim() || !body?.trim()) {
      throw new HttpError(400, "Title and body are required.");
    }
    if (category && !VALID_CATEGORIES.includes(category)) {
      throw new HttpError(400, "Invalid category.");
    }
    const post = await prisma.forumPost.create({
      data: {
        userId: me.id,
        title: title.trim(),
        body: body.trim(),
        category: category ?? "general",
        courseId: courseId ?? null,
      },
    });
    return Response.json({ postId: post.id });
  } catch (err) {
    return errorResponse(err);
  }
}
