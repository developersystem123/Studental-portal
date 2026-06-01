// Teacher-facing: update or delete one of the teacher's announcements.

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireTeacher();
    const { id } = await params;
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Announcement not found.");
    if (existing.authorId !== me.id)
      throw new HttpError(403, "You can only edit your own announcements.");

    const body = (await request.json()) as Body;
    const data: Record<string, unknown> = {};

    if (body.title !== undefined) {
      const t = body.title.trim();
      if (t.length < 3) throw new HttpError(400, "Title must be at least 3 characters.");
      data.title = t;
    }
    if (body.body !== undefined) {
      const t = body.body.trim();
      if (t.length < 3) throw new HttpError(400, "Message can't be empty.");
      data.body = t;
    }
    if (body.priority !== undefined) {
      if (!PRIORITIES.includes(body.priority)) throw new HttpError(400, "Invalid priority.");
      data.priority = body.priority;
    }
    if (body.pinned !== undefined) data.pinned = Boolean(body.pinned);
    if (body.courseId !== undefined) {
      if (!body.courseId || body.courseId === "all") {
        data.courseId = null;
      } else {
        const course = await prisma.course.findUnique({ where: { id: body.courseId } });
        if (!course || course.instructor !== me.name)
          throw new HttpError(400, "Select one of your own courses.");
        data.courseId = course.id;
      }
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data,
      include: { course: { select: { title: true } } },
    });
    return Response.json({ announcement: toClient(updated) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await requireTeacher();
    const { id } = await params;
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Announcement not found.");
    if (existing.authorId !== me.id)
      throw new HttpError(403, "You can only delete your own announcements.");
    await prisma.announcement.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
