import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth-server";
import { uid } from "@/lib/utils";
import type { NotificationType } from "@/lib/generated/prisma/client";

const VALID_TYPES: NotificationType[] = ["assignment", "announcement", "reminder", "achievement"];

function toClient(n: {
  id: string;
  userId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  user?: { id: string; name: string; email: string; avatar: string | null } | null;
}) {
  return {
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    read: n.read,
    broadcast: n.userId === null,
    createdAt: n.createdAt.toISOString(),
    user: n.user ?? null,
  };
}

// GET /api/admin/notifications — all notifications (broadcast + user-targeted)
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const type = url.searchParams.get("type") as NotificationType | null;
    const broadcast = url.searchParams.get("broadcast");

    const where: {
      type?: NotificationType;
      userId?: null;
    } = {};
    if (type && VALID_TYPES.includes(type)) where.type = type;
    if (broadcast === "true") where.userId = null;

    const rows = await prisma.notification.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const stats = {
      total: rows.length,
      broadcast: rows.filter((n) => n.userId === null).length,
      targeted: rows.filter((n) => n.userId !== null).length,
      unread: rows.filter((n) => !n.read).length,
    };

    return Response.json({ notifications: rows.map(toClient), stats });
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/admin/notifications — create a broadcast notification sent to all users
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { type, title, message, targetUserId } = (await request.json()) as {
      type?: NotificationType;
      title?: string;
      message?: string;
      targetUserId?: string | null;
    };

    if (!type || !VALID_TYPES.includes(type))
      return Response.json({ error: "Valid type is required (assignment|announcement|reminder|achievement)." }, { status: 400 });
    if (!title?.trim()) return Response.json({ error: "Title is required." }, { status: 400 });
    if (!message?.trim()) return Response.json({ error: "Message is required." }, { status: 400 });

    // If targetUserId is provided, send to that user only; otherwise broadcast (userId = null)
    const n = await prisma.notification.create({
      data: {
        id: uid(),
        userId: targetUserId ?? null,
        type,
        title: title.trim(),
        message: message.trim(),
        read: false,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    return Response.json({ notification: toClient(n) }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
