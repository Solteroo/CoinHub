import { Router, type IRouter, type Request } from "express";
import { db, usersTable, transactionsTable, type UserRow } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { PlayTapBody } from "@workspace/api-zod";
import { requireUser } from "../lib/auth";
import {
  SPIN_SEGMENTS,
  BOX_REWARDS,
  pickWeighted,
  TAP_COIN_PER_TAP,
  TAP_MAX_PER_SUBMIT,
  TAP_COOLDOWN_MS,
  dailyBonusForStreak,
  nextDailyClaimAt,
  streakStillValid,
} from "../lib/games";

const router: IRouter = Router();

async function awardCoins(
  userId: string,
  amount: number,
  reason: string,
  source: string,
): Promise<number> {
  const [updated] = await db
    .update(usersTable)
    .set({ coins: sql`${usersTable.coins} + ${amount}` })
    .where(eq(usersTable.id, userId))
    .returning({ coins: usersTable.coins });
  if (amount !== 0) {
    await db.insert(transactionsTable).values({
      userId,
      amount,
      reason,
      source,
    });
  }
  return updated?.coins ?? 0;
}

router.post("/games/spin", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  const { item, index } = pickWeighted(SPIN_SEGMENTS);
  const newBalance = await awardCoins(
    user.id,
    item.value,
    "Pökgi aýlamak",
    "game_spin",
  );
  res.json({
    won: item.value,
    newBalance,
    label: item.value > 0 ? `+${item.value} teňňe` : "Şu gezek bagt ýok",
    segmentIndex: index,
    rarity: item.rarity,
  });
});

router.post("/games/luckybox", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  const { item } = pickWeighted(BOX_REWARDS);
  const newBalance = await awardCoins(
    user.id,
    item.value,
    "Bagt gutusy",
    "game_luckybox",
  );
  res.json({
    won: item.value,
    newBalance,
    label: item.value > 0 ? `+${item.value} teňňe` : "Boş guty",
    rarity: item.rarity,
  });
});

router.post("/games/tap", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  const parsed = PlayTapBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Nädogry maglumat" });
    return;
  }
  const taps = Math.min(parsed.data.taps, TAP_MAX_PER_SUBMIT);
  if (user.lastTapAt) {
    const since = Date.now() - user.lastTapAt.getTime();
    if (since < TAP_COOLDOWN_MS) {
      res.status(429).json({ error: "Çalt urýaňyz, biraz garaşyň" });
      return;
    }
  }
  const earned = taps * TAP_COIN_PER_TAP;
  const newBalance = await awardCoins(
    user.id,
    earned,
    `Basmak oýny ×${taps}`,
    "game_tap",
  );
  await db
    .update(usersTable)
    .set({ lastTapAt: new Date() })
    .where(eq(usersTable.id, user.id));
  res.json({
    won: earned,
    newBalance,
    label: `+${earned} teňňe`,
    rarity: "common",
  });
});

router.get("/games/daily-bonus/status", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  if (!user.lastDailyClaimAt) {
    res.json({ canClaim: true, nextClaimAt: null, streak: user.dailyStreak });
    return;
  }
  const next = nextDailyClaimAt(user.lastDailyClaimAt);
  const canClaim = Date.now() >= next.getTime();
  res.json({
    canClaim,
    nextClaimAt: canClaim ? null : next.toISOString(),
    streak: user.dailyStreak,
  });
});

router.post("/games/daily-bonus", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  if (user.lastDailyClaimAt) {
    const next = nextDailyClaimAt(user.lastDailyClaimAt);
    if (Date.now() < next.getTime()) {
      res.status(429).json({ error: "Indiki baýraga entek wagt bar" });
      return;
    }
  }
  const newStreak =
    user.lastDailyClaimAt && streakStillValid(user.lastDailyClaimAt)
      ? user.dailyStreak + 1
      : 1;
  const reward = dailyBonusForStreak(newStreak);

  const newBalance = await awardCoins(
    user.id,
    reward,
    `Günlük baýrak (${newStreak}-nji gün)`,
    "daily_bonus",
  );
  await db
    .update(usersTable)
    .set({ lastDailyClaimAt: new Date(), dailyStreak: newStreak })
    .where(eq(usersTable.id, user.id));

  res.json({
    won: reward,
    newBalance,
    label: `+${reward} teňňe (${newStreak}-nji gün)`,
    rarity: newStreak >= 7 ? "epic" : newStreak >= 3 ? "rare" : "common",
  });
});

export default router;
