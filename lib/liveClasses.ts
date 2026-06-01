// Helpers for the live-classes feature: serializing Prisma rows and validating
// admin create/update payloads. Kept out of route files so handlers stay tiny.

import { prisma } from "./db";
import { HttpError } from "./auth-server";
import type {
  LiveClass as DbLiveClass,
  Course as DbCourse,
  LiveClassStatus,
} from "./generated/prisma/client";

export const LIVE_CLASS_STATUSES: LiveClassStatus[] = [
  "upcoming",
  "live",
  "ended",
  "cancelled",
];

export function toClientLiveClass(
  c: DbLiveClass & { course: Pick<DbCourse, "title"> },
) {
  return {
    id: c.id,
    courseId: c.courseId,
    courseTitle: c.course.title,
    title: c.title,
    description: c.description,
    instructor: c.instructor,
    meetingUrl: c.meetingUrl,
    scheduledAt: c.scheduledAt.toISOString(),
    durationMinutes: c.durationMinutes,
    status: c.status,
    attendees: c.attendees,
    maxAttendees: c.maxAttendees ?? undefined,
    createdAt: c.createdAt.toISOString(),
  };
}

export type LiveClassInput = {
  courseId?: string;
  title?: string;
  description?: string;
  meetingUrl?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  status?: LiveClassStatus;
  maxAttendees?: number | null;
};

// Validate + normalize a payload. `partial` skips untouched fields (for PATCH).
export async function validateLiveClassInput(
  body: LiveClassInput,
  partial: boolean,
): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {};

  if (body.courseId !== undefined || !partial) {
    const course = await prisma.course.findUnique({ where: { id: body.courseId } });
    if (!course) throw new HttpError(400, "Select a valid course.");
    data.courseId = course.id;
    // The instructor label always tracks the course's instructor.
    data.instructor = course.instructor;
  }
  if (body.title !== undefined || !partial) {
    const t = (body.title ?? "").trim();
    if (t.length < 3) throw new HttpError(400, "Title must be at least 3 characters.");
    data.title = t;
  }
  if (body.description !== undefined || !partial) {
    data.description = (body.description ?? "").trim();
  }
  if (body.meetingUrl !== undefined || !partial) {
    const u = (body.meetingUrl ?? "").trim();
    if (!/^https?:\/\/\S+$/.test(u))
      throw new HttpError(400, "Enter a valid meeting URL (https://…).");
    data.meetingUrl = u;
  }
  if (body.scheduledAt !== undefined || !partial) {
    const d = new Date(body.scheduledAt ?? "");
    if (Number.isNaN(d.getTime())) throw new HttpError(400, "Enter a valid date & time.");
    data.scheduledAt = d;
  }
  if (body.durationMinutes !== undefined || !partial) {
    const n = Number(body.durationMinutes);
    if (!Number.isInteger(n) || n < 5 || n > 600)
      throw new HttpError(400, "Duration must be between 5 and 600 minutes.");
    data.durationMinutes = n;
  }
  if (body.status !== undefined) {
    if (!LIVE_CLASS_STATUSES.includes(body.status))
      throw new HttpError(400, "Invalid status.");
    data.status = body.status;
  }
  if (body.maxAttendees !== undefined) {
    if (body.maxAttendees === null) {
      data.maxAttendees = null;
    } else {
      const n = Number(body.maxAttendees);
      if (!Number.isInteger(n) || n < 1)
        throw new HttpError(400, "Max attendees must be 1 or more.");
      data.maxAttendees = n;
    }
  }
  return data;
}
