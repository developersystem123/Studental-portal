import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { setSession } from "@/lib/session";
import { errorResponse } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as { email?: string; password?: string };
    if (!email || !password) {
      return Response.json({ error: "Email and password are required." }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return Response.json({ error: "No account found with this email." }, { status: 404 });
    }
    if (!verifyPassword(password, user.password)) {
      return Response.json({ error: "Incorrect password." }, { status: 401 });
    }
    await setSession(user.id);
    const { password: _p, ...safe } = user;
    return Response.json({ user: safe });
  } catch (err) {
    return errorResponse(err);
  }
}
