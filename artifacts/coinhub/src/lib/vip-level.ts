export type VipTier = "bronze" | "silver" | "gold" | "vip";

export interface LevelInfo {
  tier: VipTier;
  label: string;
  emoji: string;
  barColor: string;
  textColor: string;
  borderColor: string;
  bgColor: string;
  min: number;
  max: number | null;
  xpPercent: number;
  nextLabel: string | null;
}

export function getVipLevel(coins: number): LevelInfo {
  if (coins >= 20000) {
    return {
      tier: "vip",
      label: "VIP",
      emoji: "👑",
      barColor: "bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500",
      textColor: "text-yellow-400",
      borderColor: "border-yellow-500/50",
      bgColor: "bg-yellow-500/10",
      min: 20000,
      max: null,
      xpPercent: 100,
      nextLabel: null,
    };
  }
  if (coins >= 5000) {
    return {
      tier: "gold",
      label: "Gold",
      emoji: "🥇",
      barColor: "bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-400",
      textColor: "text-yellow-500",
      borderColor: "border-yellow-600/40",
      bgColor: "bg-yellow-600/10",
      min: 5000,
      max: 20000,
      xpPercent: Math.round(((coins - 5000) / 15000) * 100),
      nextLabel: "VIP",
    };
  }
  if (coins >= 1000) {
    return {
      tier: "silver",
      label: "Silver",
      emoji: "🥈",
      barColor: "bg-gradient-to-r from-slate-500 via-slate-400 to-slate-300",
      textColor: "text-slate-300",
      borderColor: "border-slate-400/40",
      bgColor: "bg-slate-400/10",
      min: 1000,
      max: 5000,
      xpPercent: Math.round(((coins - 1000) / 4000) * 100),
      nextLabel: "Gold",
    };
  }
  return {
    tier: "bronze",
    label: "Bronze",
    emoji: "🥉",
    barColor: "bg-gradient-to-r from-amber-800 via-amber-700 to-amber-600",
    textColor: "text-amber-600",
    borderColor: "border-amber-700/40",
    bgColor: "bg-amber-700/10",
    min: 0,
    max: 1000,
    xpPercent: Math.round((coins / 1000) * 100),
    nextLabel: "Silver",
  };
}
