// Student-facing: private lesson notes & video bookmarks for a course.

import { prisma } from "@/lib/db";
import { errorResponse, requireUser, HttpError } from "@/lib/auth-server";

function toClient(n: {
  id: string;
  courseId: string;
  chapterId: string;
  body: string;
  timestampSeconds: number | null;
  createdAt: Date;
}) {
  return {
    id: n.id,
    courseId: n.courseId,
    chapterId: n.chapterId,
    body: n.body,
    timestampSeconds: n.timestampSeconds ?? undefined,
    createdAt: n.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const me = await requireUser();
    const courseId = new URL(request.url).searchParams.get("courseId");
    const rows = await prisma.lessonNote.findMany({
      where: { userId: me.id, ...(courseId ? { courseId } : {}) },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ notes: rows.map(toClient) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const me = await requireUser();
    const body = (await request.json()) as {
      courseId?: string;
      chapterId?: string;
      body?: string;
      timestampSeconds?: number | null;
    };
    if (!body.courseId || !body.chapterId)
      throw new HttpError(400, "courseId and chapterId are required.");
    const text = (body.body ?? "").trim();
    if (!text) throw new HttpError(400, "The note can't be empty.");

    const course = await prisma.course.findUnique({ where: { id: body.courseId } });
    if (!course) throw new HttpError(404, "Course not found.");

    let ts: number | null = null;
    if (body.timestampSeconds !== null && body.timestampSeconds !== undefined) {
      const n = Number(body.timestampSeconds);
      if (Number.isFinite(n) && n >= 0) ts = Math.round(n);
    }

    const created = await prisma.lessonNote.create({
      data: {
        userId: me.id,
        courseId: body.courseId,
        chapterId: body.chapterId,
        body: text,
        timestampSeconds: ts,
      },
    });
    return Response.json({ note: toClient(created) });
  } catch (err) {
    return errorResponse(err);
  }
}
