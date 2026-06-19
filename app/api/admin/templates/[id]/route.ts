// Admin-facing: update / delete a single message template.

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

function extractVariables(...parts: string[]): string[] {
  const found = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  for (const part of parts) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(part))) found.add(m[1]);
  }
  return [...found];
}

// PATCH /api/admin/templates/[id] — edit name/channel/subject/body/enabled.
// The `key` is immutable so references to the template stay stable.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = (await req.json()) as {
      name?: string;
      channel?: Channel;
      subject?: string;
      body?: string;
      enabled?: boolean;
    };

    const existing = await prisma.messageTemplate.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Template not found.");

    const channel: Channel = body.channel && CHANNELS.includes(body.channel)
      ? body.channel
      : (existing.channel as Channel);
    const nextSubjectRaw = body.subject !== undefined ? body.subject.trim() : (existing.subject ?? "");
    const nextBody = body.body !== undefined ? body.body.trim() : existing.body;

    if (body.name !== undefined && !body.name.trim())
      throw new HttpError(400, "Name can't be empty.");
    if (body.body !== undefined && !nextBody)
      throw new HttpError(400, "Template body can't be empty.");
    if (channel !== "sms" && !nextSubjectRaw)
      throw new HttpError(400, "An email subject is required.");

    const subject = channel === "sms" ? null : nextSubjectRaw;

    const updated = await prisma.messageTemplate.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        channel,
        subject,
        body: nextBody,
        variables: extractVariables(subject ?? "", nextBody),
        ...(body.enabled !== undefined && { enabled: body.enabled }),
      },
    });

    return Response.json({ template: toClient(updated) });
  } catch (err) {
    return errorResponse(err);
  }
}

// DELETE /api/admin/templates/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.messageTemplate.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
