import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth-server";

// GET /api/admin/support — every support ticket on the platform, with the
// requester and a reply count. Most-recently-active first.
export async function GET() {
  try {
    await requireAdmin();
    const rows = await prisma.supportTicket.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { replies: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const tickets = rows.map((t) => ({
      id: t.id,
      subject: t.subject,
      body: t.body,
      category: t.category,
      priority: t.priority,
      status: t.status,
      replyCount: t._count.replies,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      userId: t.user.id,
      userName: t.user.name,
      userEmail: t.user.email,
      userAvatar: t.user.avatar,
    }));

    return Response.json({ tickets });
  } catch (err) {
    return errorResponse(err);
  }
}
