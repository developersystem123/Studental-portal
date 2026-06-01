import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher } from "@/lib/auth-server";
import { categoryToDb, toClientCourse } from "@/lib/serializers";
import type { Course as ClientCourse } from "@/lib/mockData";

export async function GET() {
  try {
    const me = await requireTeacher();
    const courses = await prisma.course.findMany({
      where: { instructor: me.name },
      include: { chapters: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ courses: courses.map(toClientCourse) });
  } catch (err) {
    return errorResponse(err);
  }
}

type PatchBody = { id: string } & Partial<ClientCourse>;

export async function PATCH(request: Request) {
  try {
    const me = await requireTeacher();
    const body = (await request.json()) as PatchBody;
    if (!body.id) return Response.json({ error: "Course id required." }, { status: 400 });

    const target = await prisma.course.findUnique({ where: { id: body.id } });
    if (!target) return Response.json({ error: "Course not found." }, { status: 404 });
    if (target.instructor !== me.name)
      return Response.json({ error: "You can only edit courses you teach." }, { status: 403 });

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.slug !== undefined) data.slug = body.slug;
    if (body.description !== undefined) data.description = body.description;
    if (body.thumbnail !== undefined) data.thumbnail = body.thumbnail;
    if (body.instructorAvatar !== undefined) data.instructorAvatar = body.instructorAvatar;
    if (body.category !== undefined) data.category = categoryToDb(body.category);
    if (body.level !== undefined) data.level = body.level;
    if (body.price !== undefined) data.price = body.price;
    if (body.durationMinutes !== undefined) data.durationMinutes = body.durationMinutes;
    if (body.rating !== undefined) data.rating = body.rating;
    if (body.reviews !== undefined) data.reviews = body.reviews;
    if (body.tags !== undefined) data.tags = body.tags;
    // Teachers can't reassign instructor on their own courses.

    const updated = await prisma.course.update({
      where: { id: body.id },
      data,
      include: { chapters: { orderBy: { order: "asc" } } },
    });
    return Response.json({ course: toClientCourse(updated) });
  } catch (err) {
    return errorResponse(err);
  }
}
