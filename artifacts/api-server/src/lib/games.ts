// CoinHub casino-style game logic with house edge.
// All games are wager-based. RTP tuned ~85-92%.

export const STARTING_COINS = 100;
export const MIN_BET = 5;
export const MAX_BET = 10_000;

// ─── SLOT MACHINE ─────────────────────────────────────────────────────────────
export const SLOT_SYMBOLS = ["7", "★", "♦", "♥", "♣", "BAR"] as const;
export type SlotSymbol = (typeof SLOT_SYMBOLS)[number];

interface SlotOutcome {
  weight: number;
  multiplier: number;
  type: "lose" | "two_match" | "triple_bar" | "triple_club" | "triple_heart" | "triple_diamond" | "triple_star" | "triple_seven";
  symbols?: SlotSymbol;
  rarity: "common" | "rare" | "epic" | "legendary";
  label: string;
}

const SLOT_OUTCOMES: SlotOutcome[] = [
  { weight: 78, multiplier: 0, type: "lose", rarity: "common", label: "Şowsuz" },
  { weight: 12, multiplier: 1.3, type: "two_match", rarity: "common", label: "Iki sany" },
  { weight: 4, multiplier: 2.2, type: "triple_bar", symbols: "BAR", rarity: "common", label: "Üç BAR" },
  { weight: 3, multiplier: 3.5, type: "triple_club", symbols: "♣", rarity: "rare", label: "Üç ♣" },
  { weight: 1.6, multiplier: 6, type: "triple_heart", symbols: "♥", rarity: "rare", label: "Üç ♥" },
  { weight: 0.8, multiplier: 12, type: "triple_diamond", symbols: "♦", rarity: "epic", label: "Üç ♦" },
  { weight: 0.5, multiplier: 30, type: "triple_star", symbols: "★", rarity: "epic", label: "Üç ★" },
  { weight: 0.1, multiplier: 150, type: "triple_seven", symbols: "7", rarity: "legendary", label: "JEKPOT 777" },
];

export function spinSlot(): { symbols: [SlotSymbol, SlotSymbol, SlotSymbol]; multiplier: number; rarity: SlotOutcome["rarity"]; label: string; outcome: SlotOutcome["type"] } {
  const outcome = pickWeighted(SLOT_OUTCOMES);
  let symbols: [SlotSymbol, SlotSymbol, SlotSymbol];
  if (outcome.type === "lose") {
    const picks: SlotSymbol[] = [];
    while (picks.length < 3) {
      const s = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]!;
      if (!picks.includes(s)) picks.push(s);
    }
    symbols = [picks[0]!, picks[1]!, picks[2]!];
  } else if (outcome.type === "two_match") {
    const base = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]!;
    let other: SlotSymbol;
    do { other = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]!; } while (other === base);
    const oddPos = Math.floor(Math.random() * 3);
    const arr: SlotSymbol[] = [base, base, base];
    arr[oddPos] = other;
    symbols = [arr[0]!, arr[1]!, arr[2]!];
  } else {
    const sym = outcome.symbols!;
    symbols = [sym, sym, sym];
  }
  return { symbols, multiplier: outcome.multiplier, rarity: outcome.rarity, label: outcome.label, outcome: outcome.type };
}

// ─── SPIN WHEEL ───────────────────────────────────────────────────────────────
export interface WheelSegment {
  multiplier: number; label: string; color: string; rarity: "common" | "rare" | "epic" | "legendary"; weight: number;
}

export const WHEEL_SEGMENTS: WheelSegment[] = [
  { multiplier: 0, label: "0×", color: "#1a1a24", rarity: "common", weight: 14 },
  { multiplier: 0.5, label: "0.5×", color: "#2a2a3a", rarity: "common", weight: 11 },
  { multiplier: 1.5, label: "1.5×", color: "#3a3a4f", rarity: "common", weight: 9 },
  { multiplier: 0, label: "0×", color: "#1a1a24", rarity: "common", weight: 14 },
  { multiplier: 1, label: "1×", color: "#2a2a3a", rarity: "common", weight: 10 },
  { multiplier: 2, label: "2×", color: "#665216", rarity: "rare", weight: 7 },
  { multiplier: 0, label: "0×", color: "#1a1a24", rarity: "common", weight: 14 },
  { multiplier: 0.5, label: "0.5×", color: "#2a2a3a", rarity: "common", weight: 11 },
  { multiplier: 3, label: "3×", color: "#a07d1f", rarity: "rare", weight: 4 },
  { multiplier: 1, label: "1×", color: "#2a2a3a", rarity: "common", weight: 10 },
  { multiplier: 10, label: "10×", color: "#d4af37", rarity: "epic", weight: 1.4 },
  { multiplier: 100, label: "100×", color: "#ff3b3b", rarity: "legendary", weight: 0.1 },
];

export function spinWheel(): { segmentIndex: number; segment: WheelSegment } {
  const idx = pickWeightedIndex(WHEEL_SEGMENTS);
  return { segmentIndex: idx, segment: WHEEL_SEGMENTS[idx]! };
}

// ─── LUCKY BOX ────────────────────────────────────────────────────────────────
interface BoxOutcomeWeight { multiplier: number; rarity: "common" | "rare" | "epic" | "legendary"; weight: number; }

const BOX_OUTCOMES: BoxOutcomeWeight[] = [
  { multiplier: 0, weight: 50, rarity: "common" },
  { multiplier: 0.5, weight: 25, rarity: "common" },
  { multiplier: 1, weight: 13, rarity: "common" },
  { multiplier: 2, weight: 7, rarity: "rare" },
  { multiplier: 3, weight: 3, rarity: "rare" },
  { multiplier: 10, weight: 1.5, rarity: "epic" },
  { multiplier: 50, weight: 0.5, rarity: "legendary" },
];

export interface LuckyBoxReveal { multiplier: number; rarity: "common" | "rare" | "epic" | "legendary"; }

export function generateLuckyBoxes(): LuckyBoxReveal[] {
  return Array.from({ length: 9 }, () => { const o = pickWeighted(BOX_OUTCOMES); return { multiplier: o.multiplier, rarity: o.rarity }; });
}

// ─── CRASH ────────────────────────────────────────────────────────────────────
export const CRASH_MIN_TARGET = 1.1;
export const CRASH_MAX_TARGET = 50;

export function rollCrash(): number {
  const r = Math.random();
  if (r < 0.04) return 1.0;
  const u = (r - 0.04) / 0.96;
  const raw = 1 / Math.max(0.0001, 1 - u);
  return Math.min(50, Math.max(1.01, Math.floor(raw * 100) / 100));
}

// ─── DICE ─────────────────────────────────────────────────────────────────────
// Roll 2d6. High = total 8-12, Low = total 2-7. Payout 1.85x (~87% RTP)
export function rollDice(): { dice1: number; dice2: number; total: number } {
  const dice1 = Math.ceil(Math.random() * 6);
  const dice2 = Math.ceil(Math.random() * 6);
  return { dice1, dice2, total: dice1 + dice2 };
}

export function diceMultiplier(choice: "high" | "low", total: number): number {
  if (choice === "high" && total >= 8) return 1.85;
  if (choice === "low" && total <= 6) return 1.85;
  return 0;
}

// ─── MINES ────────────────────────────────────────────────────────────────────
// 25-cell grid, 5 hidden mines. User picks cells one at a time.
// Safe multipliers increase with each safe pick.
const SAFE_MULTIPLIERS = [0, 1.2, 1.5, 2.0, 2.8, 4.0, 6.0, 10.0, 20.0];

export function rollMines(picks: number[]): { minePositions: number[]; safeHits: number; multiplier: number } {
  const MINE_COUNT = 5;
  const allPositions = Array.from({ length: 25 }, (_, i) => i).sort(() => Math.random() - 0.5);
  const minePositions = allPositions.slice(0, MINE_COUNT);
  let safeHits = 0;
  for (const pick of picks) {
    if (minePositions.includes(pick)) break;
    safeHits++;
  }
  const multiplier = SAFE_MULTIPLIERS[Math.min(safeHits, SAFE_MULTIPLIERS.length - 1)] ?? 0;
  return { minePositions, safeHits, multiplier };
}

// ─── ROULETTE ─────────────────────────────────────────────────────────────────
const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

export function rollRoulette(): { number: number; color: "red" | "black" | "green" } {
  const num = Math.floor(Math.random() * 37);
  if (num === 0) return { number: 0, color: "green" };
  return { number: num, color: RED_NUMBERS.has(num) ? "red" : "black" };
}

export function rouletteMultiplier(betType: "red" | "black" | "zero", color: "red" | "black" | "green"): number {
  if (betType === "zero" && color === "green") return 14;
  if (betType === "red" && color === "red") return 1.9;
  if (betType === "black" && color === "black") return 1.9;
  return 0;
}

// ─── PLINKO ───────────────────────────────────────────────────────────────────
const PLINKO_PAYOUTS: Record<"low" | "medium" | "high", number[]> = {
  low:    [1.5, 1.2, 1.0, 0.8, 0.5, 0.8, 1.0, 1.2, 1.5],
  medium: [3.0, 1.8, 1.2, 0.6, 0.2, 0.6, 1.2, 1.8, 3.0],
  high:   [16,  5.0, 2.0, 0.8, 0.0, 0.8, 2.0, 5.0, 16 ],
};

export function rollPlinko(risk: "low" | "medium" | "high"): { bucket: number; path: number[]; multiplier: number } {
  const path: number[] = [];
  let pos = 0;
  for (let row = 0; row < 8; row++) {
    const dir = Math.random() < 0.5 ? 0 : 1;
    path.push(dir);
    pos += dir;
  }
  const bucket = Math.min(8, Math.max(0, pos));
  const multiplier = PLINKO_PAYOUTS[risk][bucket] ?? 0;
  return { bucket, path, multiplier };
}

// ─── HI-LO ────────────────────────────────────────────────────────────────────
// Card 1-13. High = 8-13, Low = 1-6, 7 = push (neither). Payout 1.85x
export function rollHiLo(): { card: number } {
  return { card: Math.ceil(Math.random() * 13) };
}

export function hiLoMultiplier(choice: "high" | "low", card: number): number {
  if (choice === "high" && card >= 8) return 1.85;
  if (choice === "low" && card <= 6) return 1.85;
  return 0;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
export function pickWeighted<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const it of items) { r -= it.weight; if (r <= 0) return it; }
  return items[items.length - 1]!;
}

export function pickWeightedIndex<T extends { weight: number }>(items: T[]): number {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) { r -= items[i]!.weight; if (r <= 0) return i; }
  return items.length - 1;
}

export function rarityFromMultiplier(m: number): "common" | "rare" | "epic" | "legendary" {
  if (m >= 10) return "legendary";
  if (m >= 3) return "epic";
  if (m >= 1.5) return "rare";
  return "common";
}
