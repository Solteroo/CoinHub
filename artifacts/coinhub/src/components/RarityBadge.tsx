import { cn } from "@/lib/utils";

interface RarityBadgeProps {
  rarity: string;
  className?: string;
}

export function RarityBadge({ rarity, className }: RarityBadgeProps) {
  const normalizedRarity = rarity.toLowerCase();
  
  const styles: Record<string, string> = {
    common: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    rare: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    epic: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    legendary: "bg-primary/10 text-primary border-primary/20 animate-pulse gold-glow",
  };

  return (
    <span className={cn(
      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
      styles[normalizedRarity] || styles.common,
      className
    )}>
      {rarity}
    </span>
  );
}
