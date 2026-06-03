import { sendEmailAsync } from "@/lib/email";
import { errorResponse } from "@/lib/auth-server";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  try {
    const { name, email, reason, message } = (await request.json()) as {
      name?: string;
      email?: string;
      reason?: string;
      message?: string;
    };

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return Response.json({ error: "Name, email, and message are required." }, { status: 400 });
    }
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (name.trim().length > 100) {
      return Response.json({ error: "Name must be 100 characters or less." }, { status: 400 });
    }
    if (message.trim().length > 2000) {
      return Response.json({ error: "Message must be 2000 characters or less." }, { status: 400 });
    }

    const safeName = escapeHtml(name.trim());
    const safeEmail = escapeHtml(email.trim());
    const safeReason = escapeHtml(reason ?? "General question");
    const safeMessage = escapeHtml(message.trim());

    // Send notification to support inbox.
    sendEmailAsync({
      to: process.env.SUPPORT_EMAIL ?? process.env.EMAIL_FROM ?? "support@eduportal.app",
      subject: `Contact form: ${safeReason} — from ${safeName}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:auto;padding:32px 20px;">
          <h2 style="color:#16a34a">New contact form submission</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr><td style="padding:6px 0;color:#6b7280;width:100px">Name</td><td style="font-weight:600">${safeName}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Email</td><td><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Reason</td><td>${safeReason}</td></tr>
          </table>
          <div style="background:#f9fafb;border-radius:8px;padding:16px;border:1px solid #e5e7eb;">
            <p style="margin:0;white-space:pre-wrap;">${safeMessage}</p>
          </div>
        </div>`,
    });

    // Send confirmation to the user.
    sendEmailAsync({
      to: email.trim(),
      subject: "We received your message — EduPortal",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;padding:32px 20px;">
          <h2 style="color:#16a34a">Got it, ${safeName}!</h2>
          <p>Thanks for reaching out. We've received your message about <strong>${safeReason}</strong> and will get back to you within 1 business day.</p>
          <p style="color:#6b7280;font-size:13px;">You don't need to reply to this email — just wait to hear from us.</p>
        </div>`,
    });

    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
