import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth-server";

// AI moderation actions are persisted the same way ai-settings persists
// feature toggles / rate limits: as a JSON blob on the generic
// PlatformSetting key-value store (no dedicated Flag/Report model exists
// yet in the schema, so this reuses the already-established pattern rather
// than inventing a new table/migration).
const LOG_KEY = "ai_moderation_log";

export type ModerationAction = "dismiss" | "remove";

export type ModerationLogEntry = {
  action: ModerationAction;
  at: string;
  byId: string;
  byName: string;
  type?: string;
  snippet?: string;
};

type ModerationLog = Record<string, ModerationLogEntry>;

async function getLog(): Promise<ModerationLog> {
  const row = await prisma.platformSetting.findUnique({ where: { key: LOG_KEY } });
  return (row?.value as ModerationLog | undefined) ?? {};
}

// GET /api/admin/ai-moderation — return the persisted moderation decision log
// keyed by flagged-item id, so dismissed/removed flags survive page refreshes
// and stay in sync across admins.
export async function GET() {
  try {
    await requireAdmin();
    const log = await getLog();
    return Response.json({ log });
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/admin/ai-moderation — record an admin's decision on a flagged
// item (dismiss the flag, or remove the offending content).
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = (await request.json()) as {
      id?: string;
      action?: ModerationAction;
      type?: string;
      snippet?: string;
    };

    if (!body.id || (body.action !== "dismiss" && body.action !== "remove")) {
      return Response.json({ error: "A flagged item id and a valid action are required." }, { status: 400 });
    }

    const log = await getLog();
    const entry: ModerationLogEntry = {
      action: body.action,
      at: new Date().toISOString(),
      byId: admin.id,
      byName: admin.name || admin.email,
      type: body.type,
      snippet: body.snippet,
    };
    log[body.id] = entry;

    await prisma.platformSetting.upsert({
      where: { key: LOG_KEY },
      update: { value: log, updatedAt: new Date() },
      create: { key: LOG_KEY, value: log, updatedAt: new Date() },
    });

    return Response.json({ ok: true, entry });
  } catch (err) {
    return errorResponse(err);
  }
}
