import { Router, type IRouter, type Request } from "express";
import { randomBytes } from "node:crypto";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createSession, generatePublicId } from "../lib/auth";
import { STARTING_COINS } from "../lib/games";

const router: IRouter = Router();

const pendingStates = new Map<string, number>();

const AVATAR_COLORS = ["#D4AF37", "#E94E77", "#3DA5D9", "#7CB518", "#9B5DE5", "#F77F00"];
function pickAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] ?? "#D4AF37";
}

function getRedirectUri(req: Request): string {
  const proto = req.get("x-forwarded-proto") || "https";
  const host = req.get("x-forwarded-host") || req.get("host") || "localhost";
  return `${proto}://${host}/api/auth/google/callback`;
}

router.get("/auth/google", (req, res) => {
  const clientId = process.env["GOOGLE_CLIENT_ID"];
  if (!clientId) {
    res.redirect("/?error=oauth_not_configured");
    return;
  }

  const state = randomBytes(16).toString("hex");
  pendingStates.set(state, Date.now() + 10 * 60 * 1000);

  const redirectUri = getRedirectUri(req);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "select_account");

  res.redirect(url.toString());
});

router.get("/auth/google/callback", async (req, res) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    res.redirect("/?error=oauth_denied");
    return;
  }

  const expiry = pendingStates.get(state);
  if (!expiry || expiry < Date.now()) {
    res.redirect("/?error=oauth_state");
    return;
  }
  pendingStates.delete(state);

  const clientId = process.env["GOOGLE_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
  if (!clientId || !clientSecret) {
    res.redirect("/?error=oauth_not_configured");
    return;
  }

  try {
    const redirectUri = getRedirectUri(req);

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenRes.ok || !tokenData.access_token) {
      res.redirect("/?error=oauth_token");
      return;
    }

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = (await userInfoRes.json()) as {
      id?: string;
      email?: string;
      name?: string;
      given_name?: string;
    };

    const { id: googleId, email, name, given_name } = googleUser;

    if (!googleId || !email) {
      res.redirect("/?error=oauth_userinfo");
      return;
    }

    const ownerEmail = process.env["OWNER_EMAIL"] ?? "";

    let user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.googleId, googleId))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!user && email) {
      user = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1)
        .then((r) => r[0] ?? null);

      if (user && !user.googleId) {
        await db
          .update(usersTable)
          .set({ googleId, isAdmin: ownerEmail && email === ownerEmail ? 1 : user.isAdmin })
          .where(eq(usersTable.id, user.id));
      }
    }

    if (!user) {
      const rawName = (given_name ?? name ?? email.split("@")[0]).replace(/[^a-zA-Z0-9_]/g, "").slice(0, 18) || "user";
      let username = rawName;
      for (let attempt = 1; attempt <= 20; attempt++) {
        const existing = await db
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(eq(usersTable.username, username))
          .limit(1);
        if (existing.length === 0) break;
        username = `${rawName}${attempt}`;
      }

      let publicId = generatePublicId();
      for (let i = 0; i < 5; i++) {
        const dup = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.publicId, publicId)).limit(1);
        if (dup.length === 0) break;
        publicId = generatePublicId();
      }

      const [newUser] = await db
        .insert(usersTable)
        .values({
          username,
          publicId,
          passwordHash: `google-oauth:${randomBytes(16).toString("hex")}`,
          googleId,
          email,
          coins: STARTING_COINS,
          avatarColor: pickAvatarColor(),
          isAdmin: ownerEmail && email === ownerEmail ? 1 : 0,
        })
        .returning();

      user = newUser ?? null;
    }

    if (!user) {
      res.redirect("/?error=oauth_create_user");
      return;
    }

    if (ownerEmail && email === ownerEmail && user.isAdmin !== 1) {
      await db.update(usersTable).set({ isAdmin: 1 }).where(eq(usersTable.id, user.id));
    }

    createSession(res, user.id);
    res.redirect("/home");
  } catch (err) {
    res.redirect("/?error=oauth_server");
  }
});

export default router;
