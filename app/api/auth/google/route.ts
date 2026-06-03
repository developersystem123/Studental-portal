// Mock Google sign-in: creates or signs in a fixed demo Google user.
// SECURITY: This endpoint is only accessible in non-production environments.
// Replace with a real OAuth2 code-exchange flow before going live.
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { setSession } from "@/lib/session";
import { errorResponse } from "@/lib/auth-server";

const GOOGLE_USER_ID = "u-google";
const GOOGLE_EMAIL = "googleuser@gmail.com";

export async function POST() {
  // Block this mock endpoint in production to prevent trivial account takeover.
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Google sign-in is not available." }, { status: 404 });
  }

  try {
    let user = await prisma.user.findUnique({ where: { id: GOOGLE_USER_ID } });
    if (!user) {
      const { randomBytes } = await import("node:crypto");
      user = await prisma.user.create({
        data: {
          id: GOOGLE_USER_ID,
          name: "Google User",
          email: GOOGLE_EMAIL,
          // Random password — Google users only sign in via this route.
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
