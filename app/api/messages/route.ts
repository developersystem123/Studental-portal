import { prisma } from "@/lib/db";
import { errorResponse, requireUser } from "@/lib/auth-server";

// List conversations for the current user (latest message per other-user).
export async function GET() {
  try {
    const me = await requireUser();
    const rows = await prisma.message.findMany({
      where: { OR: [{ fromUserId: me.id }, { toUserId: me.id }] },
      orderBy: { createdAt: "desc" },
      include: {
        from: { select: { id: true, name: true, avatar: true, role: true } },
        to: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    const seen = new Set<string>();
    const conversations: Array<{
      conversationId: string;
      other: { id: string; name: string; avatar: string | null; role: string };
      lastMessage: string;
      lastAt: string;
      unread: number;
    }> = [];

    for (const m of rows) {
      if (seen.has(m.conversationId)) continue;
      seen.add(m.conversationId);
      const other = m.fromUserId === me.id ? m.to : m.from;
      const unread = await prisma.message.count({
        where: { conversationId: m.conversationId, toUserId: me.id, read: false },
      });
      conversations.push({
        conversationId: m.conversationId,
        other: { id: other.id, name: other.name, avatar: other.avatar, role: other.role },
        lastMessage: m.body,
        lastAt: m.createdAt.toISOString(),
        unread,
      });
    }
    return Response.json({ conversations });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const me = await requireUser();
    const { toUserId, body } = (await request.json()) as { toUserId?: string; body?: string };
    if (!toUserId || !body?.trim()) {
      return Response.json({ error: "toUserId and body are required." }, { status: 400 });
    }
    if (toUserId === me.id) {
      return Response.json({ error: "Cannot message yourself." }, { status: 400 });
    }
    const other = await prisma.user.findUnique({ where: { id: toUserId } });
    if (!other) return Response.json({ error: "Recipient not found." }, { status: 404 });

    const conversationId = [me.id, toUserId].sort().join(":");
    const message = await prisma.message.create({
      data: { conversationId, fromUserId: me.id, toUserId, body: body.trim() },
    });
    return Response.json({
      message: {
        id: message.id,
        conversationId,
        fromUserId: message.fromUserId,
        toUserId: message.toUserId,
        body: message.body,
        read: message.read,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
