import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { setSession } from "@/lib/session";
import { errorResponse } from "@/lib/auth-server";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

function getRedirectUri(req: Request) {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}/api/auth/google/callback`;
}

// ── GET /api/auth/google ──────────────────────────────────────────────────────
// Redirects the browser to Google's OAuth consent screen.
// When GOOGLE_CLIENT_ID is not configured, falls back to the dev mock so the
// app keeps working locally without credentials.
export async function GET(req: Request) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    // No Google credentials — redirect to the dev mock endpoint.
    return Response.redirect(new URL("/api/auth/google/mock", req.url));
  }

  const state = randomBytes(16).toString("hex");

  // Store state in a short-lived cookie to validate in the callback.
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: getRedirectUri(req),
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });

  return Response.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
}

// ── POST /api/auth/google ─────────────────────────────────────────────────────
// Dev-only mock kept for backward compatibility (store's loginWithGoogle path).
// Blocked in production.
const GOOGLE_USER_ID = "u-google";
const GOOGLE_EMAIL = "googleuser@gmail.com";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Google sign-in is not available." }, { status: 404 });
  }

  try {
    let user = await prisma.user.findUnique({ where: { id: GOOGLE_USER_ID } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: GOOGLE_USER_ID,
          name: "Google User",
          email: GOOGLE_EMAIL,
          password: hashPassword(randomBytes(16).toString("hex")),
          role: "Student",
          googleConnected: true,
          education: "None",
        },
      });
    }
    await setSession(user.id, user.role);
    const { password: _p, ...safe } = user;
    return Response.json({ user: safe });
  } catch (err) {
    return errorResponse(err);
  }
}
