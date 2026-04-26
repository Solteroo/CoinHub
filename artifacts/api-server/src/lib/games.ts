export interface SpinSegment {
  value: number;
  weight: number;
  label: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export const SPIN_SEGMENTS: SpinSegment[] = [
  { value: 5, weight: 28, label: "+5", rarity: "common" },
  { value: 10, weight: 22, label: "+10", rarity: "common" },
  { value: 0, weight: 14, label: "0", rarity: "common" },
  { value: 25, weight: 16, label: "+25", rarity: "rare" },
  { value: 50, weight: 10, label: "+50", rarity: "rare" },
  { value: 100, weight: 6, label: "+100", rarity: "epic" },
  { value: 250, weight: 3, label: "+250", rarity: "epic" },
  { value: 1000, weight: 1, label: "+1000", rarity: "legendary" },
];

export interface BoxReward {
  value: number;
  weight: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export const BOX_REWARDS: BoxReward[] = [
  { value: 0, weight: 12, rarity: "common" },
  { value: 8, weight: 26, rarity: "common" },
  { value: 15, weight: 22, rarity: "common" },
  { value: 35, weight: 18, rarity: "rare" },
  { value: 75, weight: 12, rarity: "rare" },
  { value: 150, weight: 7, rarity: "epic" },
  { value: 500, weight: 2.5, rarity: "epic" },
  { value: 2000, weight: 0.5, rarity: "legendary" },
];

export function pickWeighted<T extends { weight: number }>(items: T[]): { item: T; index: number } {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= items[i]!.weight;
    if (r <= 0) return { item: items[i]!, index: i };
  }
  return { item: items[items.length - 1]!, index: items.length - 1 };
}

export const TAP_COIN_PER_TAP = 1;
export const TAP_MAX_PER_SUBMIT = 200;
export const TAP_COOLDOWN_MS = 1500;

export const DAILY_BONUS_BASE = 25;
export const DAILY_BONUS_STREAK_BONUS = 10;
export const DAILY_BONUS_MAX = 250;

export function dailyBonusForStreak(streak: number): number {
  return Math.min(DAILY_BONUS_BASE + streak * DAILY_BONUS_STREAK_BONUS, DAILY_BONUS_MAX);
}

export function nextDailyClaimAt(lastClaim: Date): Date {
  return new Date(lastClaim.getTime() + 1000 * 60 * 60 * 20);
}

export function streakStillValid(lastClaim: Date): boolean {
  const elapsed = Date.now() - lastClaim.getTime();
  return elapsed <= 1000 * 60 * 60 * 48;
}
