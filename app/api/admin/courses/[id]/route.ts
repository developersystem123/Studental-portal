import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth-server";
import { categoryToDb, toClientCourse } from "@/lib/serializers";
import { uid } from "@/lib/utils";
import type { Course as ClientCourse } from "@/lib/mockData";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = (await request.json()) as Partial<ClientCourse>;

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.thumbnail !== undefined) updateData.thumbnail = body.thumbnail;
    if (body.instructor !== undefined) updateData.instructor = body.instructor;
    if (body.instructorAvatar !== undefined) updateData.instructorAvatar = body.instructorAvatar;
    if (body.category !== undefined) updateData.category = categoryToDb(body.category);
    if (body.level !== undefined) updateData.level = body.level;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.durationMinutes !== undefined) updateData.durationMinutes = body.durationMinutes;
    if (body.rating !== undefined) updateData.rating = body.rating;
    if (body.reviews !== undefined) updateData.reviews = body.reviews;
    if (body.tags !== undefined) updateData.tags = body.tags;

    // Chapters are managed wholesale: if provided, replace all.
    if (body.chapters !== undefined) {
      await prisma.chapter.deleteMany({ where: { courseId: id } });
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...updateData,
        ...(body.chapters !== undefined
          ? {
              chapters: {
                create: body.chapters.map((ch, idx) => ({
                  id: ch.id || uid(),
                  title: ch.title,
                  duration: ch.duration,
                  videoUrl: ch.videoUrl,
                  resources: ch.resources ? JSON.parse(JSON.stringify(ch.resources)) : null,
                  order: idx,
                })),
              },
            }
          : {}),
      },
      include: { chapters: { orderBy: { order: "asc" } } },
    });
    return Response.json({ course: toClientCourse(updated) });
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
    await prisma.course.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
