import { Router, type IRouter, type Request } from "express";
import { db, usersTable, transactionsTable, type UserRow } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  PlaySlotBody, PlaySpinBody, PlayLuckyBoxBody, PlayCrashBody,
  PlayDiceBody, PlayMinesBody, PlayRouletteBody, PlayPlinkoBody, PlayHiLoBody,
} from "@workspace/api-zod";
import { requireUser } from "../lib/auth";
import {
  spinSlot, spinWheel, generateLuckyBoxes, rarityFromMultiplier, rollCrash,
  rollDice, diceMultiplier, rollMines, rollRoulette, rouletteMultiplier,
  rollPlinko, rollHiLo, hiLoMultiplier,
  WHEEL_SEGMENTS, SLOT_SYMBOLS, MIN_BET, MAX_BET, CRASH_MIN_TARGET, CRASH_MAX_TARGET,
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

router.post("/games/crash", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  const parsed = PlayCrashBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Goýum nädogry" });
    return;
  }
  const bet = parsed.data.bet;
  const autoCashout = Math.round(parsed.data.autoCashout * 100) / 100;
  if (autoCashout < CRASH_MIN_TARGET || autoCashout > CRASH_MAX_TARGET) {
    res.status(400).json({
      error: `Maksat ${CRASH_MIN_TARGET}× – ${CRASH_MAX_TARGET}× aralygynda bolmaly`,
    });
    return;
  }
  const v = validateBet(user, bet);
  if (!v.ok) {
    res.status(v.status).json({ error: v.error });
    return;
  }

  const crashAt = rollCrash();
  const cashedOut = crashAt >= autoCashout;
  const multiplier = cashedOut ? autoCashout : 0;
  const round = await applyRound(user.id, bet, multiplier, "Bagt uçuşy", "game_crash");

  res.json({
    bet,
    autoCashout,
    crashAt,
    multiplier,
    won: round.won,
    netChange: round.netChange,
    newBalance: round.newBalance,
    label: cashedOut
      ? `${autoCashout.toFixed(2)}× · +${round.netChange}`
      : `Partlady · ${crashAt.toFixed(2)}×`,
    rarity: rarityFromMultiplier(multiplier),
    cashedOut,
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

// ─── DICE ─────────────────────────────────────────────────────────────────────
router.post("/games/dice", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  const parsed = PlayDiceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Goýum nädogry" }); return; }
  const { bet, choice } = parsed.data;
  const v = validateBet(user, bet);
  if (!v.ok) { res.status(v.status).json({ error: v.error }); return; }
  const { dice1, dice2, total } = rollDice();
  const multiplier = diceMultiplier(choice, total);
  const round = await applyRound(user.id, bet, multiplier, "Zar oýny", "game_dice");
  res.json({ bet, dice1, dice2, total, choice, won: round.won, netChange: round.netChange, newBalance: round.newBalance, label: multiplier > 0 ? `${total} · +${round.netChange}` : `${total} · Şowsuz`, rarity: rarityFromMultiplier(multiplier) });
});

// ─── MINES ────────────────────────────────────────────────────────────────────
router.post("/games/mines", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  const parsed = PlayMinesBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Goýum nädogry" }); return; }
  const { bet, picks } = parsed.data;
  const v = validateBet(user, bet);
  if (!v.ok) { res.status(v.status).json({ error: v.error }); return; }
  const { minePositions, safeHits, multiplier } = rollMines(picks);
  const round = await applyRound(user.id, bet, multiplier, "Minalar oýny", "game_mines");
  const hitMine = picks.some((p: number) => minePositions.includes(p));
  res.json({ bet, minePositions, picks, safeHits, multiplier, won: round.won, netChange: round.netChange, newBalance: round.newBalance, label: hitMine ? "Mina! Şowsuz" : `${safeHits} howpsuz · +${round.netChange}`, rarity: rarityFromMultiplier(multiplier) });
});

// ─── ROULETTE ─────────────────────────────────────────────────────────────────
router.post("/games/roulette", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  const parsed = PlayRouletteBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Goýum nädogry" }); return; }
  const { bet, betType } = parsed.data;
  const v = validateBet(user, bet);
  if (!v.ok) { res.status(v.status).json({ error: v.error }); return; }
  const { number, color } = rollRoulette();
  const multiplier = rouletteMultiplier(betType as "red" | "black" | "zero", color);
  const round = await applyRound(user.id, bet, multiplier, "Ruletka", "game_roulette");
  const colorLabel = { red: "Gyzyl", black: "Gara", green: "Ýaşyl" }[color];
  res.json({ bet, number, color, betType, won: round.won, netChange: round.netChange, newBalance: round.newBalance, label: multiplier > 0 ? `${number} ${colorLabel} · +${round.netChange}` : `${number} ${colorLabel} · Şowsuz`, rarity: rarityFromMultiplier(multiplier) });
});

// ─── PLINKO ───────────────────────────────────────────────────────────────────
router.post("/games/plinko", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  const parsed = PlayPlinkoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Goýum nädogry" }); return; }
  const { bet, risk } = parsed.data;
  const v = validateBet(user, bet);
  if (!v.ok) { res.status(v.status).json({ error: v.error }); return; }
  const { bucket, path, multiplier } = rollPlinko(risk as "low" | "medium" | "high");
  const round = await applyRound(user.id, bet, multiplier, "Plinko", "game_plinko");
  res.json({ bet, bucket, risk, multiplier, path, won: round.won, netChange: round.netChange, newBalance: round.newBalance, label: multiplier > 0 ? `${multiplier}× · +${round.netChange}` : "Şowsuz", rarity: rarityFromMultiplier(multiplier) });
});

// ─── HI-LO ────────────────────────────────────────────────────────────────────
router.post("/games/hilo", requireUser, async (req, res) => {
  const user = (req as Request & { user: UserRow }).user;
  const parsed = PlayHiLoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Goýum nädogry" }); return; }
  const { bet, choice } = parsed.data;
  const v = validateBet(user, bet);
  if (!v.ok) { res.status(v.status).json({ error: v.error }); return; }
  const { card } = rollHiLo();
  const multiplier = hiLoMultiplier(choice as "high" | "low", card);
  const round = await applyRound(user.id, bet, multiplier, "Hi-Lo kart", "game_hilo");
  const cardNames = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const cardName = cardNames[card] ?? card.toString();
  res.json({ bet, card, choice, won: round.won, netChange: round.netChange, newBalance: round.newBalance, label: multiplier > 0 ? `${cardName} · +${round.netChange}` : `${cardName} · Şowsuz`, rarity: rarityFromMultiplier(multiplier) });
});

export default router;
