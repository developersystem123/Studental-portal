import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher } from "@/lib/auth-server";

export async function GET() {
  try {
    const me = await requireTeacher();
    const myCourses = await prisma.course.findMany({
      where: { instructor: me.name },
      select: { id: true, enrollments: { select: { userId: true, completed: true } } },
    });
    const seenStudents = new Set<string>();
    let completions = 0;
    for (const c of myCourses) {
      for (const e of c.enrollments) {
        seenStudents.add(e.userId);
        if (e.completed) completions += 1;
      }
    }
    return Response.json({
      stats: { courses: myCourses.length, students: seenStudents.size, completions },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
