// HTTP-only signed session cookie. Carries just a userId; the rest of the
// user is fetched from the DB on each request.

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "eduportal_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  // SESSION_SECRET should be set in .env for production. Falls back to a
  // dev-only default so local development just works.
  return process.env.SESSION_SECRET || "eduportal-dev-secret-change-me";
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

export async function setSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, pack(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
