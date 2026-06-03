import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin, HttpError } from "@/lib/auth-server";
import { categoryToDb } from "@/lib/serializers";
import type { CourseCategory, CourseLevel } from "@/lib/mockData";

const LEVELS: CourseLevel[] = ["Beginner", "Intermediate", "Advanced"];

type Body = {
  title?: string;
  description?: string;
  category?: CourseCategory;
  level?: CourseLevel;
  featured?: boolean;
  courseIds?: string[];
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = (await request.json()) as Body;

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) {
      const t = body.title.trim();
      if (t.length < 3) throw new HttpError(400, "Title is too short.");
      data.title = t;
    }
    if (body.description !== undefined) {
      const d = body.description.trim();
      if (d.length < 10) throw new HttpError(400, "Description is too short.");
      data.description = d;
    }
    if (body.category !== undefined) data.category = categoryToDb(body.category);
    if (body.level !== undefined && LEVELS.includes(body.level)) data.level = body.level;
    if (body.featured !== undefined) data.featured = Boolean(body.featured);

    // Courses are managed wholesale: if provided, replace the full set atomically.
    if (body.courseIds !== undefined) {
      data.courses = {
        create: body.courseIds.map((courseId, idx) => ({ courseId, order: idx })),
      };
      // Run delete + update inside a transaction so a failed update doesn't leave orphaned state.
      await prisma.$transaction([
        prisma.learningPathCourse.deleteMany({ where: { pathId: id } }),
        prisma.learningPath.update({ where: { id }, data }),
      ]);
    } else {
      await prisma.learningPath.update({ where: { id }, data });
    }
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
    await prisma.learningPath.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
