import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/auth-server";
import { toClientCourse } from "@/lib/serializers";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: { chapters: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ courses: courses.map(toClientCourse) });
  } catch (err) {
    return errorResponse(err);
  }
}
