import { cn } from "@/lib/utils";

interface AvatarProps {
  username?: string;
  color?: string;
  emoji?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Avatar({ username = "?", color = "#D4AF37", emoji, size = "md", className }: AvatarProps) {
  const initial = username.charAt(0).toUpperCase();

  const sizeClasses = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-2xl",
    xl: "w-24 h-24 text-4xl",
  };

  const emojiSizes = {
    sm: "text-xs leading-none",
    md: "text-lg leading-none",
    lg: "text-3xl leading-none",
    xl: "text-5xl leading-none",
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-black text-white shrink-0 shadow-inner select-none",
        sizeClasses[size],
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {emoji ? (
        <span className={emojiSizes[size]}>{emoji}</span>
      ) : (
        initial
      )}
    </div>
  );
}
