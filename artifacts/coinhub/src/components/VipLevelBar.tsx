import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getVipLevel } from "@/lib/vip-level";
import { Crown } from "lucide-react";

interface Props {
  coins: number;
  compact?: boolean;
}

export function VipLevelBar({ coins, compact = false }: Props) {
  const lvl = getVipLevel(coins);

  if (compact) {
    return (
      <div className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider",
        lvl.textColor,
        lvl.borderColor,
        lvl.bgColor,
      )}>
        <span>{lvl.emoji}</span>
        <span>{lvl.label}</span>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl p-3 border", lvl.borderColor, lvl.bgColor)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{lvl.emoji}</span>
          <span className={cn("text-xs font-black uppercase tracking-wider", lvl.textColor)}>{lvl.label}</span>
        </div>
        {lvl.nextLabel && (
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
            <Crown className="w-2.5 h-2.5" />
            <span>{lvl.nextLabel}</span>
          </div>
        )}
      </div>
      <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${lvl.xpPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className={cn("h-full rounded-full", lvl.barColor)}
        />
      </div>
      {lvl.nextLabel && (
        <p className="text-[9px] text-muted-foreground mt-1 text-right tabular-nums font-bold">
          {lvl.xpPercent}%
        </p>
      )}
    </div>
  );
}
