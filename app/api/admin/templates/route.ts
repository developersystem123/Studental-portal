// Admin-facing: list and create reusable email / SMS message templates.

import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin, HttpError } from "@/lib/auth-server";
import type { MessageTemplate } from "@/lib/generated/prisma/client";

const CHANNELS = ["email", "sms", "both"] as const;
type Channel = (typeof CHANNELS)[number];

function toClient(t: MessageTemplate) {
  return {
    id: t.id,
    key: t.key,
    name: t.name,
    channel: t.channel as Channel,
    subject: t.subject ?? "",
    body: t.body,
    variables: t.variables,
    enabled: t.enabled,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

// Pull {{variable}} tokens out of subject + body so the stored list always
// matches what the template actually references.
function extractVariables(...parts: string[]): string[] {
  const found = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  for (const part of parts) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(part))) found.add(m[1]);
  }
  return [...found];
}

export async function GET() {
  try {
    await requireAdmin();
    const rows = await prisma.messageTemplate.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json({ templates: rows.map(toClient) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as {
      key?: string;
      name?: string;
      channel?: Channel;
      subject?: string;
      body?: string;
      enabled?: boolean;
    };

    const key = (body.key ?? "").trim().toLowerCase().replace(/\s+/g, "_");
    if (!/^[a-z0-9_]{3,40}$/.test(key))
      throw new HttpError(400, "Key must be 3–40 lowercase letters, numbers or underscores.");
    const name = (body.name ?? "").trim();
    if (!name) throw new HttpError(400, "Name is required.");
    const channel: Channel = CHANNELS.includes(body.channel as Channel)
      ? (body.channel as Channel)
      : "email";
    const text = (body.body ?? "").trim();
    if (!text) throw new HttpError(400, "Template body is required.");
    const subject = (body.subject ?? "").trim();
    if (channel !== "sms" && !subject)
      throw new HttpError(400, "An email subject is required.");

    const dup = await prisma.messageTemplate.findUnique({ where: { key } });
    if (dup) throw new HttpError(409, "A template with that key already exists.");

    const created = await prisma.messageTemplate.create({
      data: {
        key,
        name,
        channel,
        subject: channel === "sms" ? null : subject,
        body: text,
        variables: extractVariables(subject, text),
        enabled: body.enabled ?? true,
      },
    });
    return Response.json({ template: toClient(created) });
  } catch (err) {
    return errorResponse(err);
  }
}
