// Dev-only mock Google sign-in.
// Used when GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not configured.
// Blocked in production.
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { setSession } from "@/lib/session";

const MOCK_GOOGLE_ID = "mock-google-id";
const MOCK_EMAIL = "googleuser@demo.com";
const MOCK_NAME = "Demo Google User";

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return Response.redirect(new URL("/login?error=google_unavailable", req.url));
  }

  try {
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: MOCK_GOOGLE_ID }, { email: MOCK_EMAIL }] },
    });

    if (!user) {
      const uid = `u-gmock-${randomBytes(6).toString("hex")}`;
      user = await prisma.user.create({
        data: {
          id: uid,
          name: MOCK_NAME,
          email: MOCK_EMAIL,
          password: hashPassword(randomBytes(16).toString("hex")),
          role: "Student",
          googleId: MOCK_GOOGLE_ID,
          googleConnected: true,
          education: "None",
        },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: MOCK_GOOGLE_ID, googleConnected: true },
      });
    }

    await setSession(user.id, user.role);

    const url = new URL(req.url);
    const dest = `${url.protocol}//${url.host}/dashboard`;
    return Response.redirect(dest);
  } catch (err) {
    console.error("[Google mock] error:", err);
    const url = new URL(req.url);
    return Response.redirect(`${url.protocol}//${url.host}/login?error=google_db_error`);
  }
}
