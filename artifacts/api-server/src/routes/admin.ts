import { Router, type IRouter } from "express";
import { db, usersTable, transactionsTable, notificationsTable } from "@workspace/db";
import { and, desc, eq, gte, ilike, or, sql, sum } from "drizzle-orm";
import {
  AdminLoginBody,
  AdminAdjustCoinsBody,
  AdminListUsersQueryParams,
  AdminListTransactionsQueryParams,
} from "@workspace/api-zod";
import {
  ADMIN_PASSWORD,
  createAdminSession,
  clearAdminSession,
  isAdminAuthed,
  requireAdmin,
} from "../lib/auth";
import {
  serializeAdminUser,
  serializeTransaction,
} from "../lib/serializers";

const router: IRouter = Router();

router.post("/admin/login", (req, res) => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Nädogry maglumat" });
    return;
  }
  if (parsed.data.password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Açar söz nädogry" });
    return;
  }
  createAdminSession(res);
  res.json({ ok: true });
});

router.post("/admin/logout", (req, res) => {
  clearAdminSession(req, res);
  res.json({ ok: true });
});

router.get("/admin/me", (req, res) => {
  res.json({ isAdmin: isAdminAuthed(req) });
});

router.get("/admin/users", requireAdmin, async (req, res) => {
  const parsed = AdminListUsersQueryParams.safeParse(req.query);
  const search = parsed.success ? parsed.data.search : undefined;
  const baseQuery = db.select().from(usersTable);
  const rows = search
    ? await baseQuery
        .where(
          or(
            ilike(usersTable.username, `%${search}%`),
            ilike(usersTable.publicId, `%${search}%`),
          ),
        )
        .orderBy(desc(usersTable.coins))
        .limit(200)
    : await baseQuery.orderBy(desc(usersTable.coins)).limit(200);
  res.json(rows.map(serializeAdminUser));
});

router.get("/admin/users/:userId", requireAdmin, async (req, res) => {
  const userId = String(req.params["userId"] ?? "");
  if (!userId) {
    res.status(400).json({ error: "userId gerek" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(or(eq(usersTable.id, userId), eq(usersTable.publicId, userId)))
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "Ulanyjy tapylmady" });
    return;
  }
  const txs = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, user.id))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(100);
  res.json({
    user: serializeAdminUser(user),
    transactions: txs.map(serializeTransaction),
  });
});

router.post("/admin/users/:userId/coins", requireAdmin, async (req, res) => {
  const userId = String(req.params["userId"] ?? "");
  if (!userId) {
    res.status(400).json({ error: "userId gerek" });
    return;
  }
  const parsed = AdminAdjustCoinsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Maglumatlar nädogry" });
    return;
  }
  const { amount, reason } = parsed.data;
  if (amount === 0) {
    res.status(400).json({ error: "Möçberi 0 bolup bilmez" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(or(eq(usersTable.id, userId), eq(usersTable.publicId, userId)))
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "Ulanyjy tapylmady" });
    return;
  }

  if (amount < 0 && user.coins + amount < 0) {
    res.status(400).json({ error: "Ulanyjyda ýeterlik teňňe ýok" });
    return;
  }

  await db
    .update(usersTable)
    .set({ coins: sql`${usersTable.coins} + ${amount}` })
    .where(eq(usersTable.id, user.id));

  await db.insert(transactionsTable).values({
    userId: user.id,
    amount,
    reason,
    source: amount > 0 ? "admin_add" : "admin_remove",
  });

  const [updated] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, user.id))
    .limit(1);

  const txs = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, user.id))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(100);

  res.json({
    user: serializeAdminUser(updated!),
    transactions: txs.map(serializeTransaction),
  });
});

router.get("/admin/transactions", requireAdmin, async (req, res) => {
  const parsed = AdminListTransactionsQueryParams.safeParse(req.query);
  const userId = parsed.success ? parsed.data.userId : undefined;
  const baseQuery = db.select().from(transactionsTable);
  const rows = userId
    ? await baseQuery
        .where(eq(transactionsTable.userId, userId))
        .orderBy(desc(transactionsTable.createdAt))
        .limit(300)
    : await baseQuery.orderBy(desc(transactionsTable.createdAt)).limit(300);
  res.json(rows.map(serializeTransaction));
});

router.post("/admin/users/:userId/set-admin", requireAdmin, async (req, res) => {
  const userId = String(req.params["userId"] ?? "");
  const isAdmin = Boolean((req.body ?? {}).isAdmin) ? 1 : 0;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(or(eq(usersTable.id, userId), eq(usersTable.publicId, userId)))
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "Ulanyjy tapylmady" });
    return;
  }
  await db.update(usersTable).set({ isAdmin }).where(eq(usersTable.id, user.id));
  res.json({ ok: true });
});

router.post("/admin/users/:userId/ban-chat", requireAdmin, async (req, res) => {
  const userId = String(req.params["userId"] ?? "");
  const minutes = Math.max(0, Math.floor(Number((req.body ?? {}).minutes ?? 0)));
  if (!userId) {
    res.status(400).json({ error: "userId gerek" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(or(eq(usersTable.id, userId), eq(usersTable.publicId, userId)))
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "Ulanyjy tapylmady" });
    return;
  }
  const until = minutes > 0 ? new Date(Date.now() + minutes * 60_000) : null;
  await db.update(usersTable).set({ chatBanUntil: until }).where(eq(usersTable.id, user.id));
  if (minutes > 0) {
    await db.insert(notificationsTable).values({
      userId: user.id,
      title: "Çatda gadagan",
      body: `Çatda ${minutes} minut ýazyp bilmersiňiz.`,
      kind: "info",
    });
  }
  res.json({ ok: true });
});

router.get("/admin/stats", requireAdmin, async (_req, res) => {
  const [usersRow] = await db
    .select({ c: sql<number>`count(*)::int`.as("c") })
    .from(usersTable);
  const [coinsRow] = await db
    .select({ total: sum(usersTable.coins).as("total") })
    .from(usersTable);
  const [txRow] = await db
    .select({ c: sql<number>`count(*)::int`.as("c") })
    .from(transactionsTable);

  const dayAgo = new Date(Date.now() - 1000 * 60 * 60 * 24);
  const [todayAddedRow] = await db
    .select({ total: sum(transactionsTable.amount).as("total") })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.source, "admin_add"),
        gte(transactionsTable.createdAt, dayAgo),
      ),
    );

  res.json({
    totalUsers: Number(usersRow?.c ?? 0),
    totalCoinsInCirculation: Number(coinsRow?.total ?? 0),
    totalTransactions: Number(txRow?.c ?? 0),
    coinsAddedToday: Number(todayAddedRow?.total ?? 0),
  });
});

export default router;
