// Server-side auth helpers used by route handlers. Centralizes session lookup
// and role checks so individual routes stay tiny.

import { prisma } from "./db";
import { getSessionUserId } from "./session";
import type { Role, User } from "./generated/prisma/client";

export type SafeUser = Omit<User, "password">;
export type SafeUserWithPlan = SafeUser & { plan: string };

function stripPassword(u: User): SafeUser {
  const { password: _p, ...safe } = u;
  return safe;
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ? stripPassword(user) : null;
}

export async function getCurrentUserWithPlan(): Promise<SafeUserWithPlan | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const sub = await prisma.subscription.findUnique({
    where: { userId: user.id },
    include: { plan: true },
  });
  const planKey = sub?.status === "active" ? (sub.plan?.key ?? "free") : "free";
  const { password: _p, ...safe } = user;
  return { ...safe, plan: planKey };
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Not signed in.");
  return user;
}

export async function requireRole(role: Role): Promise<SafeUser> {
  const user = await requireUser();
  if (user.role !== role) throw new HttpError(403, `Forbidden — ${role} access only.`);
  return user;
}

export async function requireAdmin(): Promise<SafeUser> {
  return requireRole("Admin");
}

export async function requireTeacher(): Promise<SafeUser> {
  return requireRole("Instructor");
}

export async function requireStudent(): Promise<SafeUser> {
  return requireRole("Student");
}

// Turn any error (including HttpError) into a JSON Response.
export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error("[api] unexpected error:", err);
  const message = err instanceof Error ? err.message : "Internal error.";
  return Response.json({ error: message }, { status: 500 });
}

export { HttpError };
