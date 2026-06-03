import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/auth-server";

const FEATURE_KEY = "ai_features";
const LIMITS_KEY  = "ai_rate_limits";

const DEFAULT_FEATURES: Record<string, boolean> = {
  chat_student: true,
  chat_teacher: true,
  quiz_gen:     true,
  assignment:   true,
  moderation:   true,
};

const DEFAULT_LIMITS: Record<string, string> = {
  free_daily:    "10",
  pro_daily:     "Unlimited",
  teacher_daily: "Unlimited",
  max_tokens:    "4096",
};

async function getSetting(key: string, fallback: Record<string, unknown>) {
  const row = await prisma.platformSetting.findUnique({ where: { key } });
  if (!row) return fallback;
  return row.value as Record<string, unknown>;
}

// GET /api/admin/ai-settings — return current feature toggles + rate limits
export async function GET() {
  try {
    await requireAdmin();
    const [features, limits] = await Promise.all([
      getSetting(FEATURE_KEY, DEFAULT_FEATURES),
      getSetting(LIMITS_KEY, DEFAULT_LIMITS),
    ]);
    return Response.json({ features, limits });
  } catch (err) {
    return errorResponse(err);
  }
}

// PATCH /api/admin/ai-settings — persist feature toggles and/or rate limits
export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as {
      features?: Record<string, boolean>;
      limits?: Record<string, string>;
    };

    const now = new Date();
    const ops = [];

    if (body.features) {
      ops.push(
        prisma.platformSetting.upsert({
          where: { key: FEATURE_KEY },
          update: { value: body.features, updatedAt: now },
          create: { key: FEATURE_KEY, value: body.features, updatedAt: now },
        }),
      );
    }
    if (body.limits) {
      ops.push(
        prisma.platformSetting.upsert({
          where: { key: LIMITS_KEY },
          update: { value: body.limits, updatedAt: now },
          create: { key: LIMITS_KEY, value: body.limits, updatedAt: now },
        }),
      );
    }

    if (ops.length === 0) {
      return Response.json({ error: "Nothing to update." }, { status: 400 });
    }

    await Promise.all(ops);
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
