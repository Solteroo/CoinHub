import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterUserBody, LoginUserBody } from "@workspace/api-zod";
import {
  hashPassword,
  verifyPassword,
  createSession,
  clearSession,
  generatePublicId,
} from "../lib/auth";
import { serializeUser } from "../lib/serializers";
import { STARTING_COINS } from "../lib/games";

const router: IRouter = Router();

const AVATAR_COLORS = ["#D4AF37", "#E94E77", "#3DA5D9", "#7CB518", "#9B5DE5", "#F77F00"];
function pickAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] ?? "#D4AF37";
}

router.post("/auth/register", async (req, res) => {
  const body = (req.body ?? {}) as { email?: string; password?: string };
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password || password.length < 4) {
    res.status(400).json({ error: "Email we açar söz gerek" });
    return;
  }

  const existingEmail = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  if (existingEmail.length > 0) {
    res.status(409).json({ error: "Bu email eýýäm hasaba alnan" });
    return;
  }

  let publicId = generatePublicId();
  for (let i = 0; i < 5; i++) {
    const dup = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.publicId, publicId))
      .limit(1);
    if (dup.length === 0) break;
    publicId = generatePublicId();
  }

  // Auto-generate a temp username from email prefix + publicId suffix
  const emailPrefix = email.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 14) ?? "user";
  const tempUsername = `${emailPrefix}_${publicId.toLowerCase()}`;

  const [user] = await db
    .insert(usersTable)
    .values({
      username: tempUsername,
      publicId,
      passwordHash: hashPassword(password),
      coins: STARTING_COINS,
      email,
      avatarColor: pickAvatarColor(),
    })
    .returning();
  if (!user) {
    res.status(500).json({ error: "Ulanyjy döredilmedi" });
    return;
  }
  await createSession(res, user.id);
  res.json({ user: serializeUser(user, { bonusReady: true }) });
});

router.post("/auth/login", async (req, res) => {
  const body = (req.body ?? {}) as { email?: string; password?: string };
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    res.status(400).json({ error: "Email we açar söz gerek" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Email ýa-da açar söz nädogry" });
    return;
  }
  await createSession(res, user.id);
  res.json({ user: serializeUser(user) });
});

router.post("/auth/logout", (req, res) => {
  clearSession(req, res);
  res.json({ ok: true });
});

export default router;
