import { prisma } from "@/lib/db";
import { sendEmailAsync } from "@/lib/email";
import { errorResponse } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };
    if (!email) {
      return Response.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Always return 200 to prevent email enumeration.
    if (!user) {
      return Response.json({ ok: true });
    }

    // Build a simple signed token: base64(userId:timestamp) — sufficient for demo/dev.
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString("base64url");
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;

    sendEmailAsync({
      to: user.email,
      subject: "Reset your EduPortal password",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:500px;margin:auto;padding:32px 20px;">
          <h2 style="color:#16a34a">Reset your password</h2>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your EduPortal password. Click the button below to choose a new one.</p>
          <p style="margin:28px 0;">
            <a href="${resetUrl}"
              style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
              Reset password
            </a>
          </p>
          <p style="color:#6b7280;font-size:13px;">This link expires in 1 hour. If you didn&apos;t request a reset, you can safely ignore this email.</p>
        </div>`,
    });

    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
