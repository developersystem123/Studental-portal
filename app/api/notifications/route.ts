import { prisma } from "@/lib/db";
import { errorResponse, requireUser } from "@/lib/auth-server";
import { uid } from "@/lib/utils";
import type { NotificationType } from "@/lib/generated/prisma/client";

function toClient(n: {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  };
}

// Returns broadcast notifications (userId = null) and any user-targeted ones.
export async function GET() {
  try {
    const me = await requireUser();
    const rows = await prisma.notification.findMany({
      where: { OR: [{ userId: null }, { userId: me.id }] },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ notifications: rows.map(toClient) });
  } catch (err) {
    return errorResponse(err);
  }
}

// Add a notification for the current user.
export async function POST(request: Request) {
  try {
    const me = await requireUser();
    const { type, title, message } = (await request.json()) as {
      type?: NotificationType;
      title?: string;
      message?: string;
    };
    if (!type || !title || !message)
      return Response.json({ error: "type, title and message required." }, { status: 400 });
    const n = await prisma.notification.create({
      data: {
        id: uid(),
        userId: me.id,
        type,
        title,
        message,
        read: false,
      },
    });
    return Response.json({ notification: toClient(n) });
  } catch (err) {
    return errorResponse(err);
  }
}

// Mark all user-targeted notifications read.
// Broadcast notifications (userId = null) share a single DB row and cannot
// be marked read per-user here, so we only update the user's own rows.
export async function PATCH() {
  try {
    const me = await requireUser();
    await prisma.notification.updateMany({
      where: { userId: me.id },
      data: { read: true },
    });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
