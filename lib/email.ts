// Thin email helper. Uses Resend's HTTP API via fetch (no SDK install). When
// RESEND_API_KEY is not set, emails are logged to the console instead of being
// sent, so the app works without an email provider — mirroring lib/claude.ts.
//
// To send real email: set RESEND_API_KEY (re_…) and optionally EMAIL_FROM in .env.

const RESEND_API = "https://api.resend.com/emails";
const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || "EduPortal <onboarding@resend.dev>";

export function hasEmailKey(): boolean {
  return Boolean(API_KEY && API_KEY.startsWith("re_"));
}

export type SendResult = { delivered: boolean; simulated: boolean; error?: string };

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  if (!hasEmailKey()) {
    console.log(`[email:simulated] → ${opts.to} — "${opts.subject}"`);
    return { delivered: false, simulated: true };
  }
  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: opts.to, subject: opts.subject, html: opts.html }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error(`[email] Resend error ${res.status}: ${t}`);
      return { delivered: false, simulated: false, error: `Resend error ${res.status}` };
    }
    return { delivered: true, simulated: false };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { delivered: false, simulated: false, error: (err as Error).message };
  }
}

/** Fire-and-forget send — never lets an email failure break the request flow. */
export function sendEmailAsync(opts: { to: string; subject: string; html: string }): void {
  void sendEmail(opts).catch((err) => console.error("[email] async send failed:", err));
}

/* ---------------- Templates ---------------- */

function escapeHtml(s: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return s.replace(/[&<>"']/g, (c) => map[c]);
}

function wrap(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;color:#1e2230;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
    <div style="background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6e6ee;">
      <div style="background:linear-gradient(135deg,#7c5cff,#22d3ee);padding:22px 28px;">
        <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">EduPortal</p>
      </div>
      <div style="padding:28px;">
        <h1 style="margin:0 0 14px;font-size:20px;">${title}</h1>
        ${bodyHtml}
      </div>
    </div>
    <p style="text-align:center;color:#9aa0b4;font-size:12px;margin-top:18px;">
      You received this email because you have an EduPortal account.
    </p>
  </div></body></html>`;
}

export function welcomeEmail(name: string) {
  return {
    subject: "Welcome to EduPortal 🎓",
    html: wrap(
      `Welcome aboard, ${escapeHtml(name)}!`,
      `<p style="line-height:1.6;">Your account is ready. Explore courses, track your progress,
       earn certificates, and learn with AI-powered study tools.</p>
       <p style="line-height:1.6;">Jump in any time from your dashboard — happy learning!</p>`,
    ),
  };
}

export function paymentReceiptEmail(opts: {
  name: string;
  description: string;
  amount: number; // smallest currency unit
  currency: string;
}) {
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: opts.currency,
  }).format(opts.amount / 100);
  return {
    subject: `Payment received — ${money}`,
    html: wrap(
      "Thanks for your payment",
      `<p style="line-height:1.6;">Hi ${escapeHtml(opts.name)}, we&rsquo;ve received your payment.</p>
       <table style="width:100%;border-collapse:collapse;margin:14px 0;">
         <tr>
           <td style="padding:8px 0;color:#6b7088;">Item</td>
           <td style="padding:8px 0;text-align:right;font-weight:600;">${escapeHtml(opts.description)}</td>
         </tr>
         <tr>
           <td style="padding:8px 0;color:#6b7088;border-top:1px solid #eeeef3;">Amount paid</td>
           <td style="padding:8px 0;text-align:right;font-weight:700;border-top:1px solid #eeeef3;">${money}</td>
         </tr>
       </table>
       <p style="line-height:1.6;color:#6b7088;font-size:13px;">This receipt confirms your transaction. Keep it for your records.</p>`,
    ),
  };
}
