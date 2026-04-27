import { Link } from "wouter";
import { Avatar } from "./Avatar";
import { OwnerBadge } from "./OwnerBadge";
import { cn } from "@/lib/utils";

interface UserChipProps {
  publicId: string;
  username: string;
  avatarColor?: string;
  isAdmin?: boolean;
  size?: "sm" | "md" | "lg";
  showId?: boolean;
  className?: string;
  asLink?: boolean;
}

export function UserChip({
  publicId,
  username,
  avatarColor = "#D4AF37",
  isAdmin = false,
  size = "md",
  showId = true,
  className,
  asLink = true,
}: UserChipProps) {
  const inner = (
    <div className={cn("flex items-center gap-2 group", className)}>
      <Avatar username={username} color={avatarColor} size={size === "lg" ? "md" : "sm"} />
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "font-bold text-white truncate group-hover:text-primary transition-colors",
            size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm",
          )}>
            {username}
          </span>
          {isAdmin && <OwnerBadge size="xs" />}
        </div>
        {showId && (
          <span className="text-[9px] font-mono text-muted-foreground tracking-wider">#{publicId}</span>
        )}
      </div>
    </div>
  );
  if (!asLink) return inner;
  return <Link href={`/u/${publicId}`}>{inner}</Link>;
}
