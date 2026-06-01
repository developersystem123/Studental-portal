// Helpers for the physical (in-person) classes feature: turning Prisma rows
// into the flat client types, and computing attendance summaries. Kept in one
// place so every route handler reports identical shapes and identical math.

import type {
  PhysicalClass as DbPhysicalClass,
  Course as DbCourse,
  User as DbUser,
  PhysicalAttendance as DbAttendance,
} from "./generated/prisma/client";
import { prisma } from "./db";
import { HttpError } from "./auth-server";
import { categoryToClient } from "./serializers";
import {
  DAYS_OF_WEEK,
  PHYSICAL_CLASS_STATUSES,
  type AttendanceRecord,
  type AttendanceStatus,
  type PhysicalClass,
  type PhysicalClassRosterEntry,
  type PhysicalClassStatus,
  type PhysicalEnrollmentStatus,
} from "./mockData";

type PcWithRelations = DbPhysicalClass & {
  course: Pick<DbCourse, "title" | "thumbnail" | "category" | "level">;
  instructor: Pick<DbUser, "name">;
  _count?: { enrollments: number };
};

export function toClientPhysicalClass(
  pc: PcWithRelations,
  enrolledCount?: number,
): PhysicalClass {
  return {
    id: pc.id,
    courseId: pc.courseId,
    courseTitle: pc.course.title,
    courseThumbnail: pc.course.thumbnail,
    courseCategory: categoryToClient(pc.course.category),
    courseLevel: pc.course.level,
    instructorId: pc.instructorId,
    instructorName: pc.instructor.name,
    title: pc.title,
    campus: pc.campus,
    room: pc.room,
    batch: pc.batch,
    capacity: pc.capacity,
    enrolledCount: enrolledCount ?? pc._count?.enrollments ?? 0,
    startDate: pc.startDate.toISOString(),
    endDate: pc.endDate.toISOString(),
    daysOfWeek: pc.daysOfWeek,
    status: pc.status,
    notes: pc.notes ?? undefined,
    createdAt: pc.createdAt.toISOString(),
  };
}

export function toAttendanceRecord(a: DbAttendance): AttendanceRecord {
  return {
    date: a.date.toISOString(),
    status: a.status,
    note: a.note ?? undefined,
  };
}

// Per-student attendance summary. `late` counts as half a session attended —
// matching the convention already used by the teacher attendance screen.
export function attendanceSummary(records: { status: AttendanceStatus }[]) {
  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;
  for (const r of records) {
    if (r.status === "present") present++;
    else if (r.status === "absent") absent++;
    else if (r.status === "late") late++;
    else if (r.status === "excused") excused++;
  }
  const sessionsHeld = records.length;
  const attendanceRate =
    sessionsHeld === 0
      ? 0
      : Math.round(((present + late * 0.5) / sessionsHeld) * 100);
  return { present, absent, late, excused, sessionsHeld, attendanceRate };
}

// Normalize a "YYYY-MM-DD" (or ISO) string to a midnight-UTC Date so the
// [physicalClassId, studentId, date] unique key is stable per session day.
export function sessionDate(input: string): Date {
  const day = input.slice(0, 10);
  const d = new Date(`${day}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid session date.");
  return d;
}

type RosterEnrollment = {
  id: string;
  studentId: string;
  status: PhysicalEnrollmentStatus;
  enrolledAt: Date;
  student: { name: string; email: string };
};

// Combine a batch's enrollments with all its attendance rows into roster rows.
export function buildRoster(
  enrollments: RosterEnrollment[],
  attendance: { studentId: string; status: AttendanceStatus }[],
): PhysicalClassRosterEntry[] {
  return enrollments.map((e) => {
    const recs = attendance.filter((a) => a.studentId === e.studentId);
    return {
      enrollmentId: e.id,
      studentId: e.studentId,
      studentName: e.student.name,
      studentEmail: e.student.email,
      enrollmentStatus: e.status,
      enrolledAt: e.enrolledAt.toISOString(),
      ...attendanceSummary(recs),
    };
  });
}

export type PhysicalClassInput = {
  courseId?: string;
  instructorId?: string;
  title?: string;
  campus?: string;
  room?: string;
  batch?: string;
  capacity?: number;
  startDate?: string;
  endDate?: string;
  daysOfWeek?: string[];
  status?: PhysicalClassStatus;
  notes?: string;
};

// Validate + normalize a physical-class payload. `partial` mode (for PATCH)
// only checks fields that were actually supplied. Throws HttpError on any
// problem so route handlers stay tiny.
export async function validatePhysicalClassInput(
  body: PhysicalClassInput,
  partial: boolean,
): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {};

  if (body.courseId !== undefined || !partial) {
    const course = await prisma.course.findUnique({ where: { id: body.courseId } });
    if (!course) throw new HttpError(400, "Select a valid course.");
    data.courseId = course.id;
  }
  if (body.instructorId !== undefined || !partial) {
    const teacher = await prisma.user.findUnique({ where: { id: body.instructorId } });
    if (!teacher || teacher.role !== "Instructor")
      throw new HttpError(400, "Select a valid instructor.");
    data.instructorId = teacher.id;
  }
  if (body.title !== undefined || !partial) {
    const t = (body.title ?? "").trim();
    if (t.length < 3) throw new HttpError(400, "Batch title must be at least 3 characters.");
    data.title = t;
  }
  for (const key of ["campus", "room", "batch"] as const) {
    if (body[key] !== undefined || !partial) {
      const v = (body[key] ?? "").trim();
      if (!v) throw new HttpError(400, `${key[0].toUpperCase()}${key.slice(1)} is required.`);
      data[key] = v;
    }
  }
  if (body.capacity !== undefined || !partial) {
    const c = Number(body.capacity);
    if (!Number.isInteger(c) || c < 1 || c > 500)
      throw new HttpError(400, "Capacity must be between 1 and 500.");
    data.capacity = c;
  }
  if (body.startDate !== undefined || !partial) {
    const d = new Date(body.startDate ?? "");
    if (Number.isNaN(d.getTime())) throw new HttpError(400, "Enter a valid start date.");
    data.startDate = d;
  }
  if (body.endDate !== undefined || !partial) {
    const d = new Date(body.endDate ?? "");
    if (Number.isNaN(d.getTime())) throw new HttpError(400, "Enter a valid end date.");
    data.endDate = d;
  }
  if (data.startDate && data.endDate && (data.endDate as Date) < (data.startDate as Date))
    throw new HttpError(400, "End date must be on or after the start date.");
  if (body.daysOfWeek !== undefined || !partial) {
    const days = (body.daysOfWeek ?? []).filter((d) =>
      (DAYS_OF_WEEK as readonly string[]).includes(d),
    );
    if (days.length === 0) throw new HttpError(400, "Pick at least one class day.");
    data.daysOfWeek = days;
  }
  if (body.status !== undefined) {
    if (!PHYSICAL_CLASS_STATUSES.includes(body.status))
      throw new HttpError(400, "Invalid class status.");
    data.status = body.status;
  }
  if (body.notes !== undefined) data.notes = body.notes.trim() || null;

  return data;
}
