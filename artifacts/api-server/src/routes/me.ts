import { Router, type IRouter, type Request } from "express";
import { db, usersTable, transactionsTable, type UserRow } from "@workspace/db";
import { desc, eq, gt, sql, sum } from "drizzle-orm";
import { requireUser } from "../lib/auth";
import { serializeUser, serializeTransaction } from "../lib/serializers";

const router: IRouter = Router();

router.get("/me", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  res.json(serializeUser(user));
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
      sql`${transactionsTable.userId} = ${user.id} AND ${transactionsTable.source} IN ('game_spin','game_luckybox','game_tap','daily_bonus')`,
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

export default router;
