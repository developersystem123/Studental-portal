import { prisma } from "@/lib/db";
import { errorResponse, requireUser } from "@/lib/auth-server";

const DEFAULTS = {
  emailNotifications: true,
  pushNotifications: true,
  weeklyDigest: true,
  marketingEmails: false,
  language: "en",
  timezone: "UTC",
  theme: "auto",
};

export async function GET() {
  try {
    const me = await requireUser();
    const settings = await prisma.userSettings.findUnique({ where: { userId: me.id } });
    return Response.json({
      settings: settings ?? { userId: me.id, ...DEFAULTS },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(request: Request) {
  try {
    const me = await requireUser();
    const patch = (await request.json()) as Partial<typeof DEFAULTS>;
    const allowed = (
      [
        "emailNotifications",
        "pushNotifications",
        "weeklyDigest",
        "marketingEmails",
        "language",
        "timezone",
        "theme",
      ] as const
    ).reduce<Record<string, unknown>>((acc, k) => {
      if (k in patch) acc[k] = patch[k as keyof typeof DEFAULTS];
      return acc;
    }, {});

    const settings = await prisma.userSettings.upsert({
      where: { userId: me.id },
      create: { userId: me.id, ...DEFAULTS, ...allowed },
      update: allowed,
    });
    return Response.json({ settings });
  } catch (err) {
    return errorResponse(err);
  }
}
