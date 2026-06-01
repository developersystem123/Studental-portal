// Teacher-facing: announcements the teacher posts to their courses.

import { prisma } from "@/lib/db";
import { errorResponse, requireTeacher, HttpError } from "@/lib/auth-server";
import type {
  Announcement,
  Course,
  AnnouncementPriority,
} from "@/lib/generated/prisma/client";

const PRIORITIES: AnnouncementPriority[] = ["normal", "important", "urgent"];

function toClient(a: Announcement & { course: Pick<Course, "title"> | null }) {
  return {
    id: a.id,
    courseId: a.courseId ?? "all",
    courseTitle: a.course?.title ?? "All my courses",
    title: a.title,
    body: a.body,
    priority: a.priority,
    pinned: a.pinned,
    createdAt: a.createdAt.toISOString(),
  };
}

type Body = {
  courseId?: string;
  title?: string;
  body?: string;
  priority?: AnnouncementPriority;
  pinned?: boolean;
};

// Resolve + validate the audience: "all"/empty → null, else a course the
// teacher actually owns.
async function resolveCourseId(raw: string | undefined, teacherName: string) {
  if (!raw || raw === "all") return null;
  const course = await prisma.course.findUnique({ where: { id: raw } });
  if (!course || course.instructor !== teacherName)
    throw new HttpError(400, "Select one of your own courses.");
  return course.id;
}

export async function GET() {
  try {
    const me = await requireTeacher();
    const rows = await prisma.announcement.findMany({
      where: { authorId: me.id },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      include: { course: { select: { title: true } } },
    });
    return Response.json({ announcements: rows.map(toClient) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const me = await requireTeacher();
    const body = (await request.json()) as Body;
    const title = (body.title ?? "").trim();
    const text = (body.body ?? "").trim();
    if (title.length < 3) throw new HttpError(400, "Title must be at least 3 characters.");
    if (text.length < 3) throw new HttpError(400, "Message can't be empty.");
    const priority: AnnouncementPriority = PRIORITIES.includes(body.priority as AnnouncementPriority)
      ? (body.priority as AnnouncementPriority)
      : "normal";
    const courseId = await resolveCourseId(body.courseId, me.name);

    const created = await prisma.announcement.create({
      data: {
        authorId: me.id,
        courseId,
        title,
        body: text,
        priority,
        pinned: Boolean(body.pinned),
      },
      include: { course: { select: { title: true } } },
    });
    return Response.json({ announcement: toClient(created) });
  } catch (err) {
    return errorResponse(err);
  }
}
