import { prisma } from "@/lib/db";
import { errorResponse, requireAdmin, HttpError } from "@/lib/auth-server";
import { generateTotpSecret, verifyTotp, totpUri } from "@/lib/totp";

// GET /api/admin/2fa — return current 2FA status and generate a new setup secret if not enabled
export async function GET() {
  try {
    const me = await requireAdmin();
    const user = await prisma.user.findUnique({
      where: { id: me.id },
      select: { totpEnabled: true, totpSecret: true, email: true, name: true },
    });
    if (!user) throw new HttpError(404, "User not found.");

    if (user.totpEnabled) {
      return Response.json({ enabled: true, uri: null, secret: null });
    }

    // Generate a fresh pending secret for the setup flow (not yet saved to DB)
    const secret = await generateTotpSecret();
    const uri    = totpUri(secret, user.email ?? user.name);
    return Response.json({ enabled: false, uri, secret });
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/admin/2fa — verify token + enable 2FA, or disable it
export async function POST(request: Request) {
  try {
    const me = await requireAdmin();
    const { action, secret, token } = (await request.json()) as {
      action: "enable" | "disable";
      secret?: string;
      token?: string;
    };

    if (action === "enable") {
      if (!secret?.trim() || !token?.trim()) throw new HttpError(400, "secret and token are required.");
      const valid = await verifyTotp(secret.trim(), token.trim());
      if (!valid) throw new HttpError(400, "Invalid token — check your authenticator app and try again.");

      await prisma.user.update({
        where: { id: me.id },
        data: { totpSecret: secret.trim(), totpEnabled: true },
      });
      return Response.json({ ok: true, enabled: true });
    }

    if (action === "disable") {
      if (!token?.trim()) throw new HttpError(400, "token is required to disable 2FA.");
      const user = await prisma.user.findUnique({ where: { id: me.id }, select: { totpSecret: true } });
      if (!user?.totpSecret) throw new HttpError(400, "2FA is not enabled.");
      const valid = await verifyTotp(user.totpSecret, token.trim());
      if (!valid) throw new HttpError(400, "Invalid token.");

      await prisma.user.update({
        where: { id: me.id },
        data: { totpSecret: null, totpEnabled: false },
      });
      return Response.json({ ok: true, enabled: false });
    }

    throw new HttpError(400, "action must be 'enable' or 'disable'.");
  } catch (err) {
    return errorResponse(err);
  }
}
