// Shared helper for computing real broadcast-audience segment sizes for the
// admin Announcements feature. Replaces the old hardcoded reach estimates
// with live counts straight from the database, so "Total reached" and the
// compose-modal preview reflect the actual current user base.

import { prisma } from "@/lib/db";

export type AudienceKey = "all" | "students" | "teachers" | "pro";

export type AudienceSizes = Record<AudienceKey, number>;

export async function getAudienceSizes(): Promise<AudienceSizes> {
  const [all, students, teachers, pro] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "Student" } }),
    prisma.user.count({ where: { role: "Instructor" } }),
    prisma.subscription.count({ where: { status: "active" } }),
  ]);
  return { all, students, teachers, pro };
}

export function audienceSize(sizes: AudienceSizes, audience: string): number {
  return sizes[(audience as AudienceKey) in sizes ? (audience as AudienceKey) : "all"] ?? 0;
}
