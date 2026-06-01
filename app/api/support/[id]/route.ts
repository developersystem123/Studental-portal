import { prisma } from "@/lib/db";
import { errorResponse, requireUser, HttpError } from "@/lib/auth-server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    const { id } = await params;
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
        },
      },
    });
    if (!ticket) throw new HttpError(404, "Ticket not found.");
    if (ticket.userId !== me.id && me.role !== "Admin") throw new HttpError(403, "Not your ticket.");
    return Response.json({
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        body: ticket.body,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        replies: ticket.replies.map((r) => ({
          id: r.id,
          body: r.body,
          createdAt: r.createdAt.toISOString(),
          isStaff: r.isStaff,
          author: { id: r.user.id, name: r.user.name, avatar: r.user.avatar, role: r.user.role },
        })),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    const { id } = await params;
    const { body } = (await req.json()) as { body?: string };
    if (!body?.trim()) throw new HttpError(400, "Reply body is required.");

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new HttpError(404, "Ticket not found.");
    if (ticket.userId !== me.id && me.role !== "Admin") throw new HttpError(403, "Not your ticket.");

    const reply = await prisma.supportReply.create({
      data: { ticketId: id, userId: me.id, body: body.trim(), isStaff: me.role === "Admin" },
    });
    // Bump ticket updatedAt; if customer replies a resolved ticket, reopen it.
    await prisma.supportTicket.update({
      where: { id },
      data: {
        updatedAt: new Date(),
        ...(ticket.status === "resolved" && me.role !== "Admin" ? { status: "open" } : {}),
      },
    });
    return Response.json({
      reply: {
        id: reply.id,
        body: reply.body,
        createdAt: reply.createdAt.toISOString(),
        isStaff: reply.isStaff,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
