import { Router, type IRouter, type Request } from "express";
import { db, usersTable, transactionsTable, type UserRow } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { PlaySlotBody, PlaySpinBody, PlayLuckyBoxBody } from "@workspace/api-zod";
import { requireUser } from "../lib/auth";
import {
  spinSlot,
  spinWheel,
  generateLuckyBoxes,
  rarityFromMultiplier,
  WHEEL_SEGMENTS,
  SLOT_SYMBOLS,
  MIN_BET,
  MAX_BET,
} from "../lib/games";

const router: IRouter = Router();

interface PlayedRound {
  bet: number;
  multiplier: number;
  won: number;          // gross win (paid back, includes bet on a 1× multiplier)
  netChange: number;    // net change in balance (won - bet)
  newBalance: number;
  reason: string;
  source: string;
}

async function applyRound(
  userId: string,
  bet: number,
  multiplier: number,
  reason: string,
  source: string,
): Promise<PlayedRound> {
  const won = Math.floor(bet * multiplier);
  const netChange = won - bet;

  // Single atomic balance update.
  const [updated] = await db
    .update(usersTable)
    .set({ coins: sql`${usersTable.coins} + ${netChange}` })
    .where(eq(usersTable.id, userId))
    .returning({ coins: usersTable.coins });

  await db.insert(transactionsTable).values({
    userId,
    amount: netChange,
    reason: `${reason} (goýum: ${bet})`,
    source,
  });

  return {
    bet,
    multiplier,
    won,
    netChange,
    newBalance: updated?.coins ?? 0,
    reason,
    source,
  };
}

function validateBet(user: UserRow, bet: number): { ok: true } | { ok: false; status: number; error: string } {
  if (!Number.isInteger(bet) || bet < MIN_BET) {
    return { ok: false, status: 400, error: `Iň pes goýum ${MIN_BET} teňňe` };
  }
  if (bet > MAX_BET) {
    return { ok: false, status: 400, error: `Iň ýokary goýum ${MAX_BET} teňňe` };
  }
  if (user.coins < bet) {
    return { ok: false, status: 400, error: "Teňňäňiz ýeterli däl" };
  }
  return { ok: true };
}

router.get("/games/config", (_req, res) => {
  res.json({
    minBet: MIN_BET,
    maxBet: MAX_BET,
    wheelSegments: WHEEL_SEGMENTS.map((s) => ({
      multiplier: s.multiplier,
      label: s.label,
      color: s.color,
      rarity: s.rarity,
    })),
    slotSymbols: [...SLOT_SYMBOLS],
  });
});

router.post("/games/slot", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  const parsed = PlaySlotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Goýum nädogry" });
    return;
  }
  const bet = parsed.data.bet;
  const v = validateBet(user, bet);
  if (!v.ok) {
    res.status(v.status).json({ error: v.error });
    return;
  }

  const result = spinSlot();
  const round = await applyRound(user.id, bet, result.multiplier, "Slot maşyn", "game_slot");

  res.json({
    bet,
    symbols: result.symbols,
    multiplier: result.multiplier,
    won: round.won,
    netChange: round.netChange,
    newBalance: round.newBalance,
    label:
      result.multiplier > 0
        ? `${result.label} · +${round.netChange}`
        : "Şowsuz",
    rarity: result.rarity,
    outcome: result.outcome,
  });
});

router.post("/games/spin", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  const parsed = PlaySpinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Goýum nädogry" });
    return;
  }
  const bet = parsed.data.bet;
  const v = validateBet(user, bet);
  if (!v.ok) {
    res.status(v.status).json({ error: v.error });
    return;
  }

  const { segmentIndex, segment } = spinWheel();
  const round = await applyRound(user.id, bet, segment.multiplier, "Bagt çarhy", "game_spin");

  res.json({
    bet,
    segmentIndex,
    multiplier: segment.multiplier,
    won: round.won,
    netChange: round.netChange,
    newBalance: round.newBalance,
    label:
      segment.multiplier > 0
        ? `${segment.label} · ${round.netChange >= 0 ? "+" : ""}${round.netChange}`
        : "Şowsuz",
    rarity: segment.rarity,
  });
});

router.post("/games/luckybox", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  const parsed = PlayLuckyBoxBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Goýum nädogry" });
    return;
  }
  const { bet, pickIndex } = parsed.data;
  const v = validateBet(user, bet);
  if (!v.ok) {
    res.status(v.status).json({ error: v.error });
    return;
  }

  const boxes = generateLuckyBoxes();
  const picked = boxes[pickIndex]!;
  const round = await applyRound(user.id, bet, picked.multiplier, "Bagt gutusy", "game_luckybox");

  res.json({
    bet,
    pickIndex,
    boxes,
    multiplier: picked.multiplier,
    won: round.won,
    netChange: round.netChange,
    newBalance: round.newBalance,
    label:
      picked.multiplier > 0
        ? `${picked.multiplier}× · ${round.netChange >= 0 ? "+" : ""}${round.netChange}`
        : "Boş guty",
    rarity: rarityFromMultiplier(picked.multiplier),
  });
});

export default router;
