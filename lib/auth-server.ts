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
  return Response.json({ error: publicErrorMessage(err) }, { status: 500 });
}

const GENERIC_ERROR = "Something went wrong. Please try again in a moment.";

// Never leak raw internal errors (Prisma stack traces, DB credentials, file paths) to the client.
function publicErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return GENERIC_ERROR;
  const name = err.constructor?.name ?? err.name ?? "";
  const msg = err.message ?? "";

  if (name.startsWith("PrismaClient") || /prisma|invocation/i.test(msg)) {
    if (/Authentication failed|Can't reach database|connect|ECONNREFUSED|timed out/i.test(msg)) {
      return "We couldn't connect to the server right now. Please try again later.";
    }
    if (/Unique constraint/i.test(msg)) return "This record already exists.";
    return GENERIC_ERROR;
  }

  // Short, single-line messages thrown intentionally (e.g. "Invalid session date.") are safe to show.
  if (msg && msg.length <= 120 && !msg.includes("\n") && !/[\\/]{2}|[A-Z]:\\|_KEY|SECRET/.test(msg)) {
    return msg;
  }
  return GENERIC_ERROR;
}

export { HttpError };
