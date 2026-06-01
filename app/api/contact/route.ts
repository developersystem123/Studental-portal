import { sendEmailAsync } from "@/lib/email";
import { errorResponse } from "@/lib/auth-server";

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

    // Send notification to support inbox.
    sendEmailAsync({
      to: process.env.SUPPORT_EMAIL ?? process.env.EMAIL_FROM ?? "support@eduportal.app",
      subject: `Contact form: ${reason ?? "General question"} — from ${name}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:auto;padding:32px 20px;">
          <h2 style="color:#16a34a">New contact form submission</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr><td style="padding:6px 0;color:#6b7280;width:100px">Name</td><td style="font-weight:600">${name}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Reason</td><td>${reason ?? "General question"}</td></tr>
          </table>
          <div style="background:#f9fafb;border-radius:8px;padding:16px;border:1px solid #e5e7eb;">
            <p style="margin:0;white-space:pre-wrap;">${message}</p>
          </div>
        </div>`,
    });

    // Send confirmation to the user.
    sendEmailAsync({
      to: email,
      subject: "We received your message — EduPortal",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;padding:32px 20px;">
          <h2 style="color:#16a34a">Got it, ${name}!</h2>
          <p>Thanks for reaching out. We've received your message about <strong>${reason ?? "your inquiry"}</strong> and will get back to you within 1 business day.</p>
          <p style="color:#6b7280;font-size:13px;">You don't need to reply to this email — just wait to hear from us.</p>
        </div>`,
    });

    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
