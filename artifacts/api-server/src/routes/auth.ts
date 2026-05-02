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
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Maglumatlar nädogry" });
    return;
  }
  const { username, password, email } = parsed.data;
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Bu ulanyjy ady eýýäm bar" });
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

  const [user] = await db
    .insert(usersTable)
    .values({
      username,
      publicId,
      passwordHash: hashPassword(password),
      coins: STARTING_COINS,
      email: email ?? null,
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
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Maglumatlar nädogry" });
    return;
  }
  const { username, password } = parsed.data;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Ulanyjy ady ýa-da açar söz nädogry" });
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
