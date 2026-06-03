import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { setSession } from "@/lib/session";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

function getRedirectUri(req: Request) {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}/api/auth/google/callback`;
}

function errorRedirect(req: Request, msg: string) {
  const url = new URL(req.url);
  const loginUrl = new URL("/login", `${url.protocol}//${url.host}`);
  loginUrl.searchParams.set("error", msg);
  return Response.redirect(loginUrl.toString());
}

// ── GET /api/auth/google/callback ─────────────────────────────────────────────
// Google redirects here after the user approves the consent screen.
// Steps: validate state → exchange code for tokens → fetch Google profile
//        → upsert user in DB → set HTTP-only session cookie → redirect to app.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  // User denied access on Google's consent screen.
  if (errorParam) {
    return errorRedirect(req, "google_denied");
  }

  if (!code || !state) {
    return errorRedirect(req, "google_invalid");
  }

  // Validate CSRF state.
  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;
  cookieStore.delete("oauth_state");

  if (!storedState || storedState !== state) {
    return errorRedirect(req, "google_state_mismatch");
  }

  // Exchange authorisation code for access token.
  let accessToken: string;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: getRedirectUri(req),
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return errorRedirect(req, "google_token_failed");
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      return errorRedirect(req, "google_no_token");
    }
    accessToken = tokenData.access_token;
  } catch {
    return errorRedirect(req, "google_token_error");
  }

  // Fetch the user's Google profile.
  let googleProfile: { id: string; email: string; name: string; picture?: string };
  try {
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      return errorRedirect(req, "google_profile_failed");
    }

    googleProfile = await profileRes.json();
    if (!googleProfile.email) {
      return errorRedirect(req, "google_no_email");
    }
  } catch {
    return errorRedirect(req, "google_profile_error");
  }

  // Upsert user: find by googleId first, then by email, otherwise create.
  try {
    let user = await prisma.user.findUnique({
      where: { googleId: googleProfile.id },
    }).catch(() => null);

    if (!user) {
      // Check if a user with this email already exists (email+password account).
      user = await prisma.user.findUnique({
        where: { email: googleProfile.email },
      }).catch(() => null);

      if (user) {
        // Link the existing account to Google.
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleProfile.id,
            googleConnected: true,
            // Update avatar only if they don't have one yet.
            ...(googleProfile.picture && !user.avatar ? { avatar: googleProfile.picture } : {}),
          },
        });
      } else {
        // Brand-new user signing up via Google.
        const uid = `u-g-${randomBytes(8).toString("hex")}`;
        user = await prisma.user.create({
          data: {
            id: uid,
            name: googleProfile.name,
            email: googleProfile.email,
            password: hashPassword(randomBytes(32).toString("hex")),
            role: "Student",
            googleId: googleProfile.id,
            googleConnected: true,
            avatar: googleProfile.picture ?? null,
            education: "None",
          },
        });
      }
    }

    await setSession(user.id, user.role);

    // Determine redirect target based on role.
    const base = `${url.protocol}//${url.host}`;
    const dest =
      user.role === "Admin" ? `${base}/admin` :
      user.role === "Instructor" ? `${base}/teacher` :
      `${base}/dashboard`;

    return Response.redirect(dest);
  } catch {
    return errorRedirect(req, "google_db_error");
  }
}
