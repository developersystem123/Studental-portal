import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { setSession } from "@/lib/session";
import { errorResponse } from "@/lib/auth-server";
import type { EducationLevel, Role } from "@/lib/generated/prisma/client"; // Role used for prisma.create type
import { uid } from "@/lib/utils";
import { sendEmailAsync, welcomeEmail } from "@/lib/email";
import { EDUCATION_LEVELS } from "@/lib/mockData";

type Body = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  education?: EducationLevel;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const phone = (body.phone ?? "").trim();
    const password = body.password ?? "";
    const role: Role = "Student";
    const rawEducation = body.education ?? "None";
    if (!EDUCATION_LEVELS.includes(rawEducation as EducationLevel)) {
      return Response.json({ error: "Invalid education level." }, { status: 400 });
    }
    const education: EducationLevel = rawEducation as EducationLevel;

    const NAME_RE = /^[A-Za-z][A-Za-z\s.'-]*$/;
    if (name.length < 2) return Response.json({ error: "Name is too short." }, { status: 400 });
    if (name.length > 60) return Response.json({ error: "Name is too long." }, { status: 400 });
    if (!NAME_RE.test(name))
      return Response.json(
        { error: "Name can only contain letters, spaces, dots, hyphens and apostrophes." },
        { status: 400 },
      );
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/))
      return Response.json({ error: "Enter a valid email." }, { status: 400 });

    if (phone) {
      if (!/^\+?[\d\s-]+$/.test(phone))
        return Response.json(
          { error: "Phone can only contain digits, spaces, hyphens and an optional leading +." },
          { status: 400 },
        );
      const phoneDigits = phone.replace(/\D/g, "");
      if (phoneDigits.length < 10)
        return Response.json({ error: "Phone must have at least 10 digits." }, { status: 400 });
      if (phoneDigits.length > 15)
        return Response.json({ error: "Phone can have at most 15 digits." }, { status: 400 });
    }

    if (password.length < 8)
      return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    if (password.length > 64)
      return Response.json({ error: "Password is too long." }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: {
        id: uid(),
        name,
        email,
        password: hashPassword(password),
        role,
        education,
        bio: "",
        phone,
      },
    });
    await setSession(user.id, user.role);

    // Send a welcome email asynchronously — never blocks the response.
    sendEmailAsync({ to: user.email, ...welcomeEmail(user.name) });

    const { password: _p, ...safe } = user;
    return Response.json({ user: safe });
  } catch (err) {
    return errorResponse(err);
  }
}
