// CoinHub casino-style game logic with house edge.
// All games are wager-based. RTP (return-to-player) is tuned ~85-92% so
// users naturally lose coins over time and need to contact admin to top up.

export const STARTING_COINS = 200;
export const MIN_BET = 10;
export const MAX_BET = 100_000;

// ─── SLOT MACHINE ────────────────────────────────────────────────────────────
// Symbols ordered by rarity (highest payout first).
export const SLOT_SYMBOLS = ["7", "★", "♦", "♥", "♣", "BAR"] as const;
export type SlotSymbol = (typeof SLOT_SYMBOLS)[number];

interface SlotOutcome {
  weight: number;
  multiplier: number;
  type:
    | "lose"
    | "two_match"
    | "triple_bar"
    | "triple_club"
    | "triple_heart"
    | "triple_diamond"
    | "triple_star"
    | "triple_seven";
  symbols?: SlotSymbol; // base symbol for triples / two-match
  rarity: "common" | "rare" | "epic" | "legendary";
  label: string;
}

// Tuned to ~85% RTP overall.
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

export function spinSlot(): {
  symbols: [SlotSymbol, SlotSymbol, SlotSymbol];
  multiplier: number;
  rarity: SlotOutcome["rarity"];
  label: string;
  outcome: SlotOutcome["type"];
} {
  const outcome = pickWeighted(SLOT_OUTCOMES);
  let symbols: [SlotSymbol, SlotSymbol, SlotSymbol];

  if (outcome.type === "lose") {
    // Pick 3 symbols ensuring not all 3 same and not 2 same
    const picks: SlotSymbol[] = [];
    while (picks.length < 3) {
      const s = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]!;
      if (!picks.includes(s)) picks.push(s);
    }
    symbols = [picks[0]!, picks[1]!, picks[2]!];
  } else if (outcome.type === "two_match") {
    const base = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]!;
    let other: SlotSymbol;
    do {
      other = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]!;
    } while (other === base);
    const oddPos = Math.floor(Math.random() * 3);
    const arr: SlotSymbol[] = [base, base, base];
    arr[oddPos] = other;
    symbols = [arr[0]!, arr[1]!, arr[2]!];
  } else {
    const sym = outcome.symbols!;
    symbols = [sym, sym, sym];
  }

  return {
    symbols,
    multiplier: outcome.multiplier,
    rarity: outcome.rarity,
    label: outcome.label,
    outcome: outcome.type,
  };
}

// ─── SPIN WHEEL ──────────────────────────────────────────────────────────────
export interface WheelSegment {
  multiplier: number;
  label: string;
  color: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  weight: number;
}

// 12 visual segments, weighted RNG → ~92% RTP (counting tied house cut on losses).
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

// ─── LUCKY BOX (9 boxes) ─────────────────────────────────────────────────────
interface BoxOutcomeWeight {
  multiplier: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  weight: number;
}

// ~85% RTP per pick.
const BOX_OUTCOMES: BoxOutcomeWeight[] = [
  { multiplier: 0, weight: 50, rarity: "common" },
  { multiplier: 0.5, weight: 25, rarity: "common" },
  { multiplier: 1, weight: 13, rarity: "common" },
  { multiplier: 2, weight: 7, rarity: "rare" },
  { multiplier: 3, weight: 3, rarity: "rare" },
  { multiplier: 10, weight: 1.5, rarity: "epic" },
  { multiplier: 50, weight: 0.5, rarity: "legendary" },
];

export interface LuckyBoxReveal {
  multiplier: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export function generateLuckyBoxes(): LuckyBoxReveal[] {
  return Array.from({ length: 9 }, () => {
    const o = pickWeighted(BOX_OUTCOMES);
    return { multiplier: o.multiplier, rarity: o.rarity };
  });
}

// ─── CRASH (rocket) ──────────────────────────────────────────────────────────
// Provably-fair-style crash: server rolls a crashAt ≥ 1.00. If user's
// autoCashout target is ≤ crashAt, payout = bet × autoCashout. Otherwise the
// rocket explodes before reaching the target → user loses bet.
//
// Distribution (≈96% RTP for any target T in [1.01, 50]):
//   - 4% of rounds → instant crash at 1.00× (house cut bucket)
//   - 96% of rounds → crashAt = clamp(1 / (1 - u), 1.01, 50) where u ∈ [0,1)
// P(crashAt ≥ T) = 0.96 / T  →  E[payout|cashout T] = 0.96 × bet
export const CRASH_MIN_TARGET = 1.1;
export const CRASH_MAX_TARGET = 50;

export function rollCrash(): number {
  const r = Math.random();
  if (r < 0.04) return 1.0;
  const u = (r - 0.04) / 0.96;
  const raw = 1 / Math.max(0.0001, 1 - u);
  return Math.min(50, Math.max(1.01, Math.floor(raw * 100) / 100));
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
export function pickWeighted<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= it.weight;
    if (r <= 0) return it;
  }
  return items[items.length - 1]!;
}

export function pickWeightedIndex<T extends { weight: number }>(items: T[]): number {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= items[i]!.weight;
    if (r <= 0) return i;
  }
  return items.length - 1;
}

export function rarityFromMultiplier(m: number): "common" | "rare" | "epic" | "legendary" {
  if (m >= 50) return "legendary";
  if (m >= 10) return "epic";
  if (m >= 2) return "rare";
  return "common";
}
