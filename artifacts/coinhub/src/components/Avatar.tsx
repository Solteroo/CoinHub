import { cn } from "@/lib/utils";

interface AvatarProps {
  username?: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Avatar({ username = "?", color = "#D4AF37", size = "md", className }: AvatarProps) {
  const initial = username.charAt(0).toUpperCase();

  const sizeClasses = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-2xl",
    xl: "w-24 h-24 text-4xl"
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-black text-white shrink-0 shadow-inner",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: color }}
    >
      {initial}
    </div>
  );
}
