import { prisma } from "@/lib/db";
import { sendEmailAsync } from "@/lib/email";
import { errorResponse } from "@/lib/auth-server";
import { createHmac } from "node:crypto";

function signResetToken(userId: string, ts: number): string {
  const secret = process.env.SESSION_SECRET ?? "eduportal-dev-secret-change-me";
  const payload = `${userId}:${ts}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };
    if (!email || !email.match(/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/)) {
      // Always return ok to prevent email enumeration.
      return Response.json({ ok: true });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Always return 200 to prevent email enumeration.
    if (!user) {
      return Response.json({ ok: true });
    }

    // Build an HMAC-signed token: base64url(userId:timestamp:sig).
    const ts = Date.now();
    const token = signResetToken(user.id, ts);
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;

    sendEmailAsync({
      to: user.email,
      subject: "Reset your EduPortal password",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:500px;margin:auto;padding:32px 20px;">
          <h2 style="color:#16a34a">Reset your password</h2>
          <p>Hi ${escapeHtml(user.name)},</p>
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
