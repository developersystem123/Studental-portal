import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth-server";
import { uid } from "@/lib/utils";
import { categoryToDb, toClientCourse } from "@/lib/serializers";
import type { Course as ClientCourse } from "@/lib/mockData";

type Body = Partial<ClientCourse> & {
  title: string;
  description: string;
  thumbnail: string;
  instructor: string;
  category: ClientCourse["category"];
  level: ClientCourse["level"];
  price: number;
  durationMinutes: number;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as Body;
    const id = uid();
    const slugBase = (body.slug || slugify(body.title) || uid()).toLowerCase();
    // Ensure slug is unique.
    let slug = slugBase;
    for (let i = 2; await prisma.course.findUnique({ where: { slug } }); i++) {
      slug = `${slugBase}-${i}`;
    }

    const created = await prisma.course.create({
      data: {
        id,
        title: body.title,
        slug,
        description: body.description,
        thumbnail: body.thumbnail,
        instructor: body.instructor,
        instructorAvatar: body.instructorAvatar,
        category: categoryToDb(body.category),
        level: body.level,
        price: body.price,
        durationMinutes: body.durationMinutes,
        rating: body.rating ?? 4.5,
        reviews: body.reviews ?? 0,
        tags: body.tags ?? [],
        chapters: body.chapters
          ? {
              create: body.chapters.map((ch, idx) => ({
                id: ch.id || uid(),
                title: ch.title,
                duration: ch.duration,
                videoUrl: ch.videoUrl,
                resources: ch.resources ? JSON.parse(JSON.stringify(ch.resources)) : null,
                order: idx,
              })),
            }
          : undefined,
      },
      include: { chapters: { orderBy: { order: "asc" } } },
    });
    return Response.json({ course: toClientCourse(created) });
  } catch (err) {
    return errorResponse(err);
  }
}
