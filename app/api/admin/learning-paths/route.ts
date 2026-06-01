import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin, HttpError } from "@/lib/auth-server";
import { categoryToClient, categoryToDb } from "@/lib/serializers";
import type { CourseCategory, CourseLevel } from "@/lib/mockData";

const LEVELS: CourseLevel[] = ["Beginner", "Intermediate", "Advanced"];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// A flat gradient thumbnail so new paths look intentional without an upload.
function pathThumbnail(): string {
  const palettes = [
    ["#16a34a", "#4ade80"],
    ["#15803d", "#86efac"],
    ["#166534", "#22c55e"],
    ["#14532d", "#4ade80"],
    ["#16a34a", "#34d399"],
  ];
  const [a, b] = palettes[Math.floor(Math.random() * palettes.length)];
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs><rect width='600' height='400' fill='url(%23g)'/></svg>`,
  )}`;
}

type Body = {
  title?: string;
  description?: string;
  category?: CourseCategory;
  level?: CourseLevel;
  featured?: boolean;
  courseIds?: string[];
};

export async function GET() {
  try {
    await requireAdmin();
    const paths = await prisma.learningPath.findMany({
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: {
        courses: {
          orderBy: { order: "asc" },
          include: { course: { select: { id: true, title: true } } },
        },
        _count: { select: { enrollments: true } },
      },
    });

    return Response.json({
      paths: paths.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description,
        thumbnail: p.thumbnail,
        category: categoryToClient(p.category),
        level: p.level,
        featured: p.featured,
        learners: p._count.enrollments,
        courseIds: p.courses.map((c) => c.courseId),
        courseTitles: p.courses.map((c) => c.course.title),
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as Body;

    const title = body.title?.trim();
    const description = body.description?.trim();
    if (!title || title.length < 3) throw new HttpError(400, "Title is too short.");
    if (!description || description.length < 10)
      throw new HttpError(400, "Description should be at least 10 characters.");
    if (!body.category) throw new HttpError(400, "Category is required.");
    const level: CourseLevel = body.level && LEVELS.includes(body.level) ? body.level : "Beginner";
    const courseIds = Array.isArray(body.courseIds) ? body.courseIds : [];

    // Ensure the slug is unique.
    const slugBase = slugify(title) || "path";
    let slug = slugBase;
    for (let i = 2; await prisma.learningPath.findUnique({ where: { slug } }); i++) {
      slug = `${slugBase}-${i}`;
    }

    const created = await prisma.learningPath.create({
      data: {
        title,
        slug,
        description,
        thumbnail: pathThumbnail(),
        category: categoryToDb(body.category),
        level,
        featured: Boolean(body.featured),
        courses: {
          create: courseIds.map((courseId, idx) => ({ courseId, order: idx })),
        },
      },
      select: { id: true },
    });

    return Response.json({ id: created.id });
  } catch (err) {
    return errorResponse(err);
  }
}
