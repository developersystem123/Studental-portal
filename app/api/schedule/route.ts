import { prisma } from "@/lib/db";
import { errorResponse, requireUser, HttpError } from "@/lib/auth-server";
import type { ScheduleType } from "@/lib/generated/prisma/client";

const VALID_TYPES: ScheduleType[] = ["class", "exam", "assignment", "meeting", "event"];

export async function GET() {
  try {
    const me = await requireUser();
    const events = await prisma.scheduleEvent.findMany({
      where: { userId: me.id },
      include: { course: { select: { id: true, title: true } } },
      orderBy: { startTime: "asc" },
    });
    return Response.json({
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        type: e.type,
        startTime: e.startTime.toISOString(),
        endTime: e.endTime.toISOString(),
        location: e.location,
        meetingUrl: e.meetingUrl,
        courseId: e.courseId,
        courseTitle: e.course?.title ?? null,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const me = await requireUser();
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      type?: ScheduleType;
      startTime?: string;
      endTime?: string;
      location?: string;
      meetingUrl?: string;
      courseId?: string;
    };
    if (!body.title || !body.startTime || !body.endTime) {
      throw new HttpError(400, "title, startTime, and endTime are required.");
    }
    if (body.type && !VALID_TYPES.includes(body.type)) {
      throw new HttpError(400, "Invalid event type.");
    }
    const event = await prisma.scheduleEvent.create({
      data: {
        userId: me.id,
        title: body.title,
        description: body.description ?? null,
        type: body.type ?? "event",
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        location: body.location ?? null,
        meetingUrl: body.meetingUrl ?? null,
        courseId: body.courseId ?? null,
      },
    });
    return Response.json({ event: { ...event, startTime: event.startTime.toISOString(), endTime: event.endTime.toISOString() } });
  } catch (err) {
    return errorResponse(err);
  }
}
