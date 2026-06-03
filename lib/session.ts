// HTTP-only signed session cookie. Carries just a userId; the rest of the
// user is fetched from the DB on each request.

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "eduportal_session";
const MAX_AGE_ADMIN   = 60 * 60 * 24 * 30; // 30 days  — Admin
const MAX_AGE_DEFAULT = 60 * 60 * 24;       // 24 hours — Student / Instructor

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET environment variable is not set. Cannot sign session cookies.");
    }
    // Dev-only fallback — never used in production.
    return "eduportal-dev-secret-change-me";
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function pack(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

function unpack(value: string | undefined | null): string | null {
  if (!value) return null;
  const idx = value.lastIndexOf(".");
  if (idx <= 0) return null;
  const userId = value.slice(0, idx);
  const sig = value.slice(idx + 1);
  const expected = sign(userId);
  const sigBuf = Buffer.from(sig, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expBuf)) return null;
  return userId;
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  return unpack(store.get(COOKIE_NAME)?.value);
}

export async function setSession(userId: string, role?: string): Promise<void> {
  const maxAge = role === "Admin" ? MAX_AGE_ADMIN : MAX_AGE_DEFAULT;
  const store = await cookies();
  store.set(COOKIE_NAME, pack(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
