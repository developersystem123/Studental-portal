import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth-server";
import type { TicketStatus, TicketPriority } from "@/lib/generated/prisma/client";

const VALID_STATUSES: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];
const VALID_PRIORITIES: TicketPriority[] = ["low", "medium", "high", "urgent"];

// PATCH /api/admin/support/[id] — update a ticket's status and/or priority.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { status, priority } = (await request.json()) as {
      status?: TicketStatus;
      priority?: TicketPriority;
    };

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return Response.json({ error: "Invalid ticket status." }, { status: 400 });
    }
    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      return Response.json({ error: "Invalid ticket priority." }, { status: 400 });
    }
    if (status === undefined && priority === undefined) {
      return Response.json({ error: "Nothing to update." }, { status: 400 });
    }

    const target = await prisma.supportTicket.findUnique({ where: { id } });
    if (!target) {
      return Response.json({ error: "Ticket not found." }, { status: 404 });
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(priority !== undefined ? { priority } : {}),
      },
    });

    return Response.json({
      ok: true,
      ticket: {
        id: updated.id,
        status: updated.status,
        priority: updated.priority,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
