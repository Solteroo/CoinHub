import { Router, type IRouter, type Request } from "express";
import {
  db,
  usersTable,
  transactionsTable,
  notificationsTable,
  directMessagesTable,
  type UserRow,
} from "@workspace/db";
import { and, desc, eq, gt, isNull, ne, sql, sum } from "drizzle-orm";
import { requireUser } from "../lib/auth";
import {
  serializeUser,
  serializeTransaction,
  serializePublicUser,
  bonusReady,
  BONUS_AMOUNT,
  BONUS_INTERVAL_MS,
} from "../lib/serializers";

const router: IRouter = Router();

async function computeMeExtras(userId: string, lastBonusAt: Date | null) {
  const [notifRow] = await db
    .select({ c: sql<number>`count(*)::int`.as("c") })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.userId, userId), isNull(notificationsTable.readAt)));
  const [dmRow] = await db
    .select({ c: sql<number>`count(*)::int`.as("c") })
    .from(directMessagesTable)
    .where(and(eq(directMessagesTable.toId, userId), isNull(directMessagesTable.readAt)));
  return {
    bonusReady: bonusReady(lastBonusAt),
    unreadNotifications: Number(notifRow?.c ?? 0),
    unreadDms: Number(dmRow?.c ?? 0),
  };
}

router.get("/me", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  const extras = await computeMeExtras(user.id, user.lastBonusAt);
  res.json(serializeUser(user, extras));
});

router.get("/me/transactions", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  const rows = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, user.id))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(100);
  res.json(rows.map(serializeTransaction));
});

router.get("/me/stats", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;

  const [earnedRow] = await db
    .select({ total: sum(transactionsTable.amount).as("total") })
    .from(transactionsTable)
    .where(
      sql`${transactionsTable.userId} = ${user.id} AND ${transactionsTable.amount} > 0`,
    );

  const [spentRow] = await db
    .select({ total: sum(transactionsTable.amount).as("total") })
    .from(transactionsTable)
    .where(
      sql`${transactionsTable.userId} = ${user.id} AND ${transactionsTable.amount} < 0`,
    );

  const [gamesRow] = await db
    .select({ c: sql<number>`count(*)::int`.as("c") })
    .from(transactionsTable)
    .where(
      sql`${transactionsTable.userId} = ${user.id} AND ${transactionsTable.source} IN ('game_spin','game_luckybox','game_slot','game_crash')`,
    );

  const [rankRow] = await db
    .select({ c: sql<number>`count(*)::int + 1`.as("c") })
    .from(usersTable)
    .where(gt(usersTable.coins, user.coins));

  const totalEarned = Number(earnedRow?.total ?? 0);
  const totalSpent = Math.abs(Number(spentRow?.total ?? 0));
  const gamesPlayed = Number(gamesRow?.c ?? 0);
  const rank = rankRow ? Number(rankRow.c) : null;

  res.json({ totalEarned, totalSpent, gamesPlayed, rank });
});

router.patch("/me/profile", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  const body = (req.body ?? {}) as {
    bio?: string;
    avatarColor?: string;
    email?: string;
  };
  const updates: Record<string, unknown> = {};
  if (typeof body.bio === "string") {
    const trimmed = body.bio.trim().slice(0, 200);
    updates["bio"] = trimmed.length > 0 ? trimmed : null;
  }
  if (typeof body.avatarColor === "string" && /^#[0-9A-Fa-f]{6}$/.test(body.avatarColor)) {
    updates["avatarColor"] = body.avatarColor;
  }
  if (typeof body.email === "string") {
    const t = body.email.trim().slice(0, 120);
    updates["email"] = t.length > 0 ? t : null;
  }
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Üýtgetmek üçin maglumat ýok" });
    return;
  }
  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, user.id))
    .returning();
  if (!updated) {
    res.status(500).json({ error: "Saklanmady" });
    return;
  }
  const extras = await computeMeExtras(updated.id, updated.lastBonusAt);
  res.json(serializeUser(updated, extras));
});

router.post("/me/transfer", requireUser, async (req, res) => {
  const sender = (req as Request & { user: UserRow }).user;
  const body = (req.body ?? {}) as {
    recipientPublicId?: string;
    amount?: number;
    note?: string;
  };
  const recipientPublicId = String(body.recipientPublicId ?? "").trim();
  const amount = Math.floor(Number(body.amount));
  const note = (body.note ?? "").toString().trim().slice(0, 100);
  if (!recipientPublicId || !Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: "Maglumatlar nädogry" });
    return;
  }
  if (recipientPublicId === sender.publicId) {
    res.status(400).json({ error: "Özüňize geçirip bilmersiňiz" });
    return;
  }
  if (sender.coins < amount) {
    res.status(400).json({ error: "Ýeterlik TMT ýok" });
    return;
  }

  const [recipient] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.publicId, recipientPublicId))
    .limit(1);
  if (!recipient) {
    res.status(404).json({ error: "Alyjy tapylmady" });
    return;
  }

  await db.transaction(async (tx) => {
    const [debited] = await tx
      .update(usersTable)
      .set({ coins: sql`${usersTable.coins} - ${amount}` })
      .where(and(eq(usersTable.id, sender.id), gt(usersTable.coins, amount - 1)))
      .returning({ coins: usersTable.coins });
    if (!debited) throw new Error("INSUFFICIENT");
    await tx
      .update(usersTable)
      .set({ coins: sql`${usersTable.coins} + ${amount}` })
      .where(eq(usersTable.id, recipient.id));
    await tx.insert(transactionsTable).values([
      {
        userId: sender.id,
        amount: -amount,
        reason: `Geçirim: ${recipient.username} (${recipient.publicId})${note ? " - " + note : ""}`,
        source: "transfer_out",
      },
      {
        userId: recipient.id,
        amount: amount,
        reason: `Gelen: ${sender.username} (${sender.publicId})${note ? " - " + note : ""}`,
        source: "transfer_in",
      },
    ]);
    await tx.insert(notificationsTable).values({
      userId: recipient.id,
      title: "TMT geldi",
      body: `${sender.username} sizden ${amount} TMT iberdi${note ? ": " + note : ""}.`,
      kind: "transfer",
    });
  }).catch((e: unknown) => {
    if ((e as Error).message === "INSUFFICIENT") {
      res.status(400).json({ error: "Ýeterlik TMT ýok" });
      return;
    }
    throw e;
  });

  if (res.headersSent) return;

  const [refreshed] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, sender.id))
    .limit(1);

  res.json({
    ok: true,
    senderBalance: refreshed?.coins ?? sender.coins - amount,
    recipient: serializePublicUser(recipient),
    amount,
  });
});

router.post("/me/claim-bonus", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  if (!bonusReady(user.lastBonusAt)) {
    const next = (user.lastBonusAt?.getTime() ?? 0) + BONUS_INTERVAL_MS;
    res.json({
      granted: false,
      amount: 0,
      newBalance: user.coins,
      nextAvailableAt: new Date(next).toISOString(),
    });
    return;
  }
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(usersTable)
      .set({
        coins: sql`${usersTable.coins} + ${BONUS_AMOUNT}`,
        lastBonusAt: now,
      })
      .where(eq(usersTable.id, user.id));
    await tx.insert(transactionsTable).values({
      userId: user.id,
      amount: BONUS_AMOUNT,
      reason: "3 günlük bonus",
      source: "bonus",
    });
    await tx.insert(notificationsTable).values({
      userId: user.id,
      title: "Bonus alyndy",
      body: `Size ${BONUS_AMOUNT} TMT bonus berildi.`,
      kind: "bonus",
    });
  });
  const [refreshed] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, user.id))
    .limit(1);
  res.json({
    granted: true,
    amount: BONUS_AMOUNT,
    newBalance: refreshed?.coins ?? user.coins + BONUS_AMOUNT,
    nextAvailableAt: new Date(now.getTime() + BONUS_INTERVAL_MS).toISOString(),
  });
});

router.get("/me/notifications", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, user.id))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(
    rows.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      kind: n.kind,
      readAt: n.readAt ? n.readAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
    })),
  );
});

router.post("/me/notifications/mark-read", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  await db
    .update(notificationsTable)
    .set({ readAt: new Date() })
    .where(and(eq(notificationsTable.userId, user.id), isNull(notificationsTable.readAt)));
  res.json({ ok: true });
});

void ne;

export default router;
