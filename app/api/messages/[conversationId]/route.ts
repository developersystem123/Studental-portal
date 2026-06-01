import { prisma } from "@/lib/db";
import { errorResponse, requireUser, HttpError } from "@/lib/auth-server";

// Fetch all messages in a conversation (and mark inbound ones as read).
export async function GET(_req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const me = await requireUser();
    const { conversationId } = await params;

    // Validate that me is a participant. conversationId format: "id1:id2" sorted.
    const parts = conversationId.split(":");
    if (parts.length !== 2 || !parts.includes(me.id)) {
      throw new HttpError(403, "Not part of this conversation.");
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    // Mark inbound unread as read.
    await prisma.message.updateMany({
      where: { conversationId, toUserId: me.id, read: false },
      data: { read: true },
    });

    return Response.json({
      messages: messages.map((m) => ({
        id: m.id,
        fromUserId: m.fromUserId,
        toUserId: m.toUserId,
        body: m.body,
        read: m.read,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
