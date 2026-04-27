import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export function OwnerBadge({ size = "sm", className }: { size?: "xs" | "sm" | "md"; className?: string }) {
  const sizes = {
    xs: "text-[8px] px-1 py-0.5 gap-0.5",
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-1 gap-1.5",
  } as const;
  const iconSizes = { xs: "w-2 h-2", sm: "w-2.5 h-2.5", md: "w-3 h-3" } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center font-black uppercase tracking-widest rounded-md",
        "bg-primary text-black border border-primary/60 shadow-[0_0_10px_rgba(212,175,55,0.5)]",
        sizes[size],
        className,
      )}
    >
      <Crown className={iconSizes[size]} />
      OWNER
    </span>
  );
}
