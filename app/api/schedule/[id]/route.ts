import { prisma } from "@/lib/db";
import { errorResponse, requireUser, HttpError } from "@/lib/auth-server";
import type { ScheduleType } from "@/lib/generated/prisma/client";

const VALID_TYPES: ScheduleType[] = ["class", "exam", "assignment", "meeting", "event"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    const { id } = await params;
    const event = await prisma.scheduleEvent.findUnique({ where: { id } });
    if (!event) throw new HttpError(404, "Event not found.");
    if (event.userId !== me.id) throw new HttpError(403, "Not your event.");

    const body = (await request.json()) as {
      title?: string;
      description?: string | null;
      type?: ScheduleType;
      startTime?: string;
      endTime?: string;
      location?: string | null;
      meetingUrl?: string | null;
      courseId?: string | null;
    };
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) {
      if (!body.title.trim()) throw new HttpError(400, "Title is required.");
      data.title = body.title.trim();
    }
    if (body.description !== undefined) data.description = body.description || null;
    if (body.type !== undefined) {
      if (!VALID_TYPES.includes(body.type)) throw new HttpError(400, "Invalid event type.");
      data.type = body.type;
    }
    if (body.startTime !== undefined) data.startTime = new Date(body.startTime);
    if (body.endTime !== undefined) data.endTime = new Date(body.endTime);
    if (body.location !== undefined) data.location = body.location || null;
    if (body.meetingUrl !== undefined) data.meetingUrl = body.meetingUrl || null;
    if (body.courseId !== undefined) data.courseId = body.courseId || null;

    const updated = await prisma.scheduleEvent.update({ where: { id }, data });
    return Response.json({
      event: {
        ...updated,
        startTime: updated.startTime.toISOString(),
        endTime: updated.endTime.toISOString(),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    const { id } = await params;
    const event = await prisma.scheduleEvent.findUnique({ where: { id } });
    if (!event) throw new HttpError(404, "Event not found.");
    if (event.userId !== me.id) throw new HttpError(403, "Not your event.");
    await prisma.scheduleEvent.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
