import { Router, type IRouter } from "express";
import { db, usersTable, passwordResetsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
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
import { sendPasswordResetEmail, isEmailConfigured } from "../lib/email";

const router: IRouter = Router();

const AVATAR_COLORS = ["#D4AF37", "#E94E77", "#3DA5D9", "#7CB518", "#9B5DE5", "#F77F00"];
function pickAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] ?? "#D4AF37";
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
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

router.post("/auth/logout", async (req, res) => {
  await clearSession(req, res);
  res.json({ ok: true });
});

// ── Forgot password — send 6-digit code to email ─────────────────────────────
router.post("/auth/forgot-password", async (req, res) => {
  const body = (req.body ?? {}) as { email?: string };
  const email = (body.email ?? "").trim().toLowerCase();

  if (!email) {
    res.status(400).json({ error: "Email gerek" });
    return;
  }

  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user) {
    // Don't reveal whether the email exists — always return success
    res.json({ ok: true });
    return;
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await db.insert(passwordResetsTable).values({ email, code, expiresAt });

  const sent = await sendPasswordResetEmail(email, code);

  res.json({ ok: true, emailSent: sent, emailConfigured: isEmailConfigured() });
});

// ── Reset password — validate code and set new password ──────────────────────
router.post("/auth/reset-password", async (req, res) => {
  const body = (req.body ?? {}) as { email?: string; code?: string; password?: string };
  const email = (body.email ?? "").trim().toLowerCase();
  const code = (body.code ?? "").trim();
  const password = body.password ?? "";

  if (!email || !code || !password) {
    res.status(400).json({ error: "Ähli meýdanlary dolduryň" });
    return;
  }
  if (password.length < 4) {
    res.status(400).json({ error: "Açar söz iň az 4 simwol bolmaly" });
    return;
  }

  const now = new Date();
  const [reset] = await db
    .select()
    .from(passwordResetsTable)
    .where(
      and(
        eq(passwordResetsTable.email, email),
        eq(passwordResetsTable.code, code),
        gt(passwordResetsTable.expiresAt, now),
      )
    )
    .orderBy(passwordResetsTable.createdAt)
    .limit(1);

  if (!reset || reset.usedAt) {
    res.status(400).json({ error: "Kod nädogry ýa-da möhleti geçdi" });
    return;
  }

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "Ulanyjy tapylmady" });
    return;
  }

  await db
    .update(usersTable)
    .set({ passwordHash: hashPassword(password) })
    .where(eq(usersTable.id, user.id));

  await db
    .update(passwordResetsTable)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetsTable.id, reset.id));

  res.json({ ok: true });
});

export default router;
