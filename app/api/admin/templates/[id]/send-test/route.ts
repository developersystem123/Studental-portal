// Admin-facing: send a one-off test email for a message template to the
// signed-in admin's own inbox, with {{variable}} placeholders filled in with
// realistic sample data so the admin can see exactly what a recipient would
// receive. Reuses the existing Resend-backed sender in lib/email.ts — no new
// delivery pipeline is introduced. SMS-only templates are rejected since no
// SMS provider is wired up in this app yet.

import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin, HttpError } from "@/lib/auth-server";
import { sendEmail } from "@/lib/email";

const SAMPLE_VALUES: Record<string, string> = {
  name: "Jordan Lee",
  firstName: "Jordan",
  lastName: "Lee",
  fullName: "Jordan Lee",
  email: "jordan.lee@example.com",
  courseTitle: "Intro to Data Science",
  course: "Intro to Data Science",
  amount: "$49.00",
  price: "$49.00",
  date: "August 3, 2026",
  dueDate: "August 10, 2026",
  link: "https://eduportal.app/courses/data-science",
  url: "https://eduportal.app/courses/data-science",
  code: "SAVE20",
  couponCode: "SAVE20",
  phone: "+1 (555) 013-4782",
  instructor: "Dr. Amara Chen",
  certificateId: "CERT-8841",
  supportEmail: "support@eduportal.app",
};

function sampleValueFor(v: string): string {
  if (SAMPLE_VALUES[v]) return SAMPLE_VALUES[v];
  const key = Object.keys(SAMPLE_VALUES).find((k) => k.toLowerCase() === v.toLowerCase());
  if (key) return SAMPLE_VALUES[key];
  return `[${v.replace(/_/g, " ")}]`;
}

function renderSample(text: string): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, v: string) => sampleValueFor(v));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// POST /api/admin/templates/[id]/send-test
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const template = await prisma.messageTemplate.findUnique({ where: { id } });
    if (!template) throw new HttpError(404, "Template not found.");
    if (template.channel === "sms") {
      throw new HttpError(
        400,
        "This is an SMS-only template — test sending is only available for email channels right now.",
      );
    }

    const subject = renderSample(template.subject || template.name);
    const bodyText = renderSample(template.body);

    const result = await sendEmail({
      to: admin.email,
      subject: `[Test] ${subject}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:32px 20px;">
          <div style="display:inline-block;padding:4px 10px;border-radius:999px;background:#eef2ff;color:#4f46e5;font-size:12px;font-weight:600;margin-bottom:16px;">
            Test send &middot; ${escapeHtml(template.name)}
          </div>
          <div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px 24px;white-space:pre-wrap;line-height:1.6;">${escapeHtml(bodyText)}</div>
          <p style="color:#9ca3af;font-size:12px;margin-top:16px;">
            Sent to you as a preview of the &ldquo;${escapeHtml(template.name)}&rdquo; template with sample data.
            Real sends will use the actual recipient's details.
          </p>
        </div>`,
    });

    return Response.json({
      ok: true,
      to: admin.email,
      delivered: result.delivered,
      simulated: result.simulated,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
