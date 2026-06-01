// Mock Google sign-in: creates or signs in a fixed demo Google user.
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { setSession } from "@/lib/session";
import { errorResponse } from "@/lib/auth-server";

const GOOGLE_USER_ID = "u-google";
const GOOGLE_EMAIL = "googleuser@gmail.com";

export async function POST() {
  try {
    let user = await prisma.user.findUnique({ where: { id: GOOGLE_USER_ID } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: GOOGLE_USER_ID,
          name: "Google User",
          email: GOOGLE_EMAIL,
          // Random password — Google users only sign in via this route.
          password: hashPassword(Math.random().toString(36).slice(2)),
          role: "Student",
          googleConnected: true,
          education: "None",
        },
      });
    }
    await setSession(user.id);
    const { password: _p, ...safe } = user;
    return Response.json({ user: safe });
  } catch (err) {
    return errorResponse(err);
  }
}
