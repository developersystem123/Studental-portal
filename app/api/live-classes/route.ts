import { prisma } from "@/lib/db";
import { errorResponse, requireUser } from "@/lib/auth-server";

export async function GET() {
  try {
    const me = await requireUser();
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: me.id },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((e) => e.courseId);

    const classes = await prisma.liveClass.findMany({
      where: { courseId: { in: courseIds } },
      include: { course: { select: { title: true, thumbnail: true } } },
      orderBy: { scheduledAt: "asc" },
    });

    // Auto-derive a real-time status based on time when DB still says "upcoming".
    const now = Date.now();
    return Response.json({
      classes: classes.map((c) => {
        const start = c.scheduledAt.getTime();
        const end = start + c.durationMinutes * 60_000;
        let status = c.status;
        if (status === "upcoming" && now >= start && now <= end) status = "live";
        if (status !== "ended" && status !== "cancelled" && now > end) status = "ended";
        return {
          id: c.id,
          courseId: c.courseId,
          courseTitle: c.course.title,
          courseThumbnail: c.course.thumbnail,
          title: c.title,
          description: c.description,
          instructor: c.instructor,
          meetingUrl: c.meetingUrl,
          scheduledAt: c.scheduledAt.toISOString(),
          durationMinutes: c.durationMinutes,
          status,
          attendees: c.attendees,
          maxAttendees: c.maxAttendees,
        };
      }),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
