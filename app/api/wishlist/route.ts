import { prisma } from "@/lib/db";
import { errorResponse, requireUser, HttpError } from "@/lib/auth-server";

export async function GET() {
  try {
    const me = await requireUser();
    const items = await prisma.wishlistItem.findMany({
      where: { userId: me.id },
      include: {
        course: {
          include: { chapters: { select: { id: true } } },
        },
      },
      orderBy: { addedAt: "desc" },
    });
    return Response.json({
      items: items.map((i) => ({
        id: i.id,
        courseId: i.courseId,
        addedAt: i.addedAt.toISOString(),
        course: {
          id: i.course.id,
          title: i.course.title,
          slug: i.course.slug,
          description: i.course.description,
          thumbnail: i.course.thumbnail,
          instructor: i.course.instructor,
          category: i.course.category,
          level: i.course.level,
          price: i.course.price,
          rating: i.course.rating,
          reviews: i.course.reviews,
          durationMinutes: i.course.durationMinutes,
          chapterCount: i.course.chapters.length,
        },
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const me = await requireUser();
    const { courseId } = (await request.json()) as { courseId?: string };
    if (!courseId) throw new HttpError(400, "courseId required.");
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new HttpError(404, "Course not found.");
    const item = await prisma.wishlistItem.upsert({
      where: { userId_courseId: { userId: me.id, courseId } },
      update: {},
      create: { userId: me.id, courseId },
    });
    return Response.json({ id: item.id, courseId });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const me = await requireUser();
    const url = new URL(request.url);
    const courseId = url.searchParams.get("courseId");
    if (!courseId) throw new HttpError(400, "courseId required.");
    await prisma.wishlistItem
      .delete({ where: { userId_courseId: { userId: me.id, courseId } } })
      .catch(() => null);
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
