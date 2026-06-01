import { prisma } from "@/lib/db";
import { errorResponse, requireUser, HttpError } from "@/lib/auth-server";
import type { TicketCategory, TicketPriority } from "@/lib/generated/prisma/client";

const VALID_CATEGORIES: TicketCategory[] = ["technical", "billing", "course", "account", "other"];
const VALID_PRIORITIES: TicketPriority[] = ["low", "medium", "high", "urgent"];

export async function GET() {
  try {
    const me = await requireUser();
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: me.id },
      include: { _count: { select: { replies: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return Response.json({
      tickets: tickets.map((t) => ({
        id: t.id,
        subject: t.subject,
        body: t.body,
        category: t.category,
        priority: t.priority,
        status: t.status,
        replyCount: t._count.replies,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const me = await requireUser();
    const { subject, body, category, priority } = (await request.json()) as {
      subject?: string;
      body?: string;
      category?: TicketCategory;
      priority?: TicketPriority;
    };
    if (!subject?.trim() || !body?.trim()) {
      throw new HttpError(400, "Subject and body are required.");
    }
    if (category && !VALID_CATEGORIES.includes(category)) {
      throw new HttpError(400, "Invalid category.");
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      throw new HttpError(400, "Invalid priority.");
    }
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: me.id,
        subject: subject.trim(),
        body: body.trim(),
        category: category ?? "other",
        priority: priority ?? "medium",
      },
    });
    return Response.json({ ticketId: ticket.id });
  } catch (err) {
    return errorResponse(err);
  }
}
