import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth-server";
import { audienceSize, getAudienceSizes } from "@/lib/audience";

// PATCH /api/admin/announcements/[id] — update (edit / re-send / schedule)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { title, body: message, audience, channel, status, scheduledAt } = body;

    const existing = await prisma.adminAnnouncement.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

    const now = new Date();
    const isSent = status === "sent";
    const isScheduled = status === "scheduled";

    // Only re-query segment sizes when this update actually sends the
    // announcement — a fresh reach snapshot at the moment it goes out.
    const reach = isSent
      ? existing.sentAt
        ? existing.reach
        : audienceSize(await getAudienceSizes(), audience ?? existing.audience)
      : existing.reach;

    const updated = await prisma.adminAnnouncement.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(message !== undefined && { body: message.trim() }),
        ...(audience !== undefined && { audience }),
        ...(channel !== undefined && { channel }),
        ...(status !== undefined && { status }),
        sentAt: isSent ? (existing.sentAt ?? now) : existing.sentAt,
        scheduledAt: isScheduled && scheduledAt ? new Date(scheduledAt) : isScheduled ? existing.scheduledAt : null,
        reach,
      },
    });

    return Response.json({
      announcement: {
        ...updated,
        sentAt: updated.sentAt?.toISOString() ?? null,
        scheduledAt: updated.scheduledAt?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

// DELETE /api/admin/announcements/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.adminAnnouncement.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
