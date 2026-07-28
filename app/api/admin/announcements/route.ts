import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth-server";
import { audienceSize, getAudienceSizes } from "@/lib/audience";

// GET /api/admin/announcements — all announcements, newest first, plus live
// audience segment sizes (computed from real users/subscriptions) so the
// admin UI can show an accurate recipient-count preview.
export async function GET() {
  try {
    await requireAdmin();
    const [rows, audienceSizes] = await Promise.all([
      prisma.adminAnnouncement.findMany({ orderBy: { createdAt: "desc" } }),
      getAudienceSizes(),
    ]);
    const announcements = rows.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      audience: a.audience,
      channel: a.channel,
      status: a.status,
      sentAt: a.sentAt?.toISOString() ?? null,
      scheduledAt: a.scheduledAt?.toISOString() ?? null,
      reach: a.reach,
      createdAt: a.createdAt.toISOString(),
    }));
    return Response.json({ announcements, audienceSizes });
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/admin/announcements — create (send/schedule/draft)
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { title, body: message, audience = "all", channel = "in_app", status = "draft", scheduledAt } = body;

    if (!title?.trim() || !message?.trim()) {
      return Response.json({ error: "Title and body are required." }, { status: 400 });
    }

    const now = new Date();
    const isSent = status === "sent";
    const isScheduled = status === "scheduled";

    const reach = isSent ? audienceSize(await getAudienceSizes(), audience) : 0;

    const ann = await prisma.adminAnnouncement.create({
      data: {
        title: title.trim(),
        body: message.trim(),
        audience,
        channel,
        status,
        sentAt: isSent ? now : null,
        scheduledAt: isScheduled && scheduledAt ? new Date(scheduledAt) : null,
        reach,
      },
    });

    return Response.json({
      announcement: {
        ...ann,
        sentAt: ann.sentAt?.toISOString() ?? null,
        scheduledAt: ann.scheduledAt?.toISOString() ?? null,
        createdAt: ann.createdAt.toISOString(),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
