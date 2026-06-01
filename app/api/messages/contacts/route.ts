import { prisma } from "@/lib/db";
import { errorResponse, requireUser } from "@/lib/auth-server";

// Returns users the current user can message: instructors of enrolled courses + admins.
export async function GET() {
  try {
    const me = await requireUser();
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: me.id },
      include: { course: { select: { instructor: true } } },
    });
    const instructorNames = new Set(enrollments.map((e) => e.course.instructor));

    const contacts = await prisma.user.findMany({
      where: {
        id: { not: me.id },
        OR: [{ role: "Admin" }, { role: "Instructor", name: { in: Array.from(instructorNames) } }],
      },
      select: { id: true, name: true, avatar: true, role: true },
      orderBy: { name: "asc" },
    });
    return Response.json({ contacts });
  } catch (err) {
    return errorResponse(err);
  }
}
