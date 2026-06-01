// Teacher-facing: forum threads across the teacher's courses, with replies.

import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher, HttpError } from "@/lib/auth-server";
import type { ForumCategory } from "@/lib/generated/prisma/client";

const CATEGORIES: ForumCategory[] = ["general", "question", "announcement", "discussion"];

export async function GET() {
  try {
    const me = await requireTeacher();
    const courses = await prisma.course.findMany({
      where: { instructor: me.name },
      select: { id: true },
    });
    const posts = await prisma.forumPost.findMany({
      where: { courseId: { in: courses.map((c) => c.id) } },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      include: {
        user: { select: { name: true, role: true } },
        course: { select: { title: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { name: true, role: true } } },
        },
      },
    });
    return Response.json({
      threads: posts.map((p) => ({
        id: p.id,
        courseId: p.courseId,
        courseTitle: p.course?.title ?? "—",
        title: p.title,
        body: p.body,
        category: p.category,
        pinned: p.pinned,
        views: p.views,
        createdAt: p.createdAt.toISOString(),
        authorName: p.user.name,
        authorRole: p.user.role,
        replies: p.replies.map((r) => ({
          id: r.id,
          body: r.body,
          createdAt: r.createdAt.toISOString(),
          authorName: r.user.name,
          authorRole: r.user.role,
        })),
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const me = await requireTeacher();
    const body = (await request.json()) as {
      courseId?: string;
      title?: string;
      body?: string;
      category?: ForumCategory;
    };
    const title = (body.title ?? "").trim();
    const text = (body.body ?? "").trim();
    if (title.length < 3) throw new HttpError(400, "Title must be at least 3 characters.");
    if (!text) throw new HttpError(400, "Body can't be empty.");

    const course = await prisma.course.findUnique({ where: { id: body.courseId } });
    if (!course || course.instructor !== me.name)
      throw new HttpError(400, "Select one of your own courses.");

    const category: ForumCategory = CATEGORIES.includes(body.category as ForumCategory)
      ? (body.category as ForumCategory)
      : "discussion";

    const created = await prisma.forumPost.create({
      data: { courseId: course.id, userId: me.id, title, body: text, category },
    });
    return Response.json({ id: created.id });
  } catch (err) {
    return errorResponse(err);
  }
}
