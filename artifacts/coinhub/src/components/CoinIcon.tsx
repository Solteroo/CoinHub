import { cn } from "@/lib/utils";

interface CoinIconProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

const sizes = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-7 h-7",
};

export function CoinIcon({ className, size = "sm" }: CoinIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("inline-block shrink-0 drop-shadow-[0_0_4px_rgba(212,175,55,0.6)]", sizes[size], className)}
    >
      <defs>
        <radialGradient id="coin-face" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFF8D6" />
          <stop offset="45%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8B6508" />
        </radialGradient>
        <radialGradient id="coin-edge" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#DAA520" />
          <stop offset="100%" stopColor="#8B6508" />
        </radialGradient>
      </defs>
      {/* Coin body */}
      <ellipse cx="12" cy="13" rx="10" ry="3" fill="url(#coin-edge)" />
      <circle cx="12" cy="11" r="10" fill="url(#coin-face)" />
      <circle cx="12" cy="11" r="9" fill="none" stroke="#DAA520" strokeWidth="0.5" strokeOpacity="0.6" />
      {/* C letter */}
      <path
        d="M14.5 7.5C13.7 7.0 12.9 6.8 12 6.8C9.7 6.8 8 8.5 8 11C8 13.5 9.7 15.2 12 15.2C12.9 15.2 13.7 15.0 14.5 14.5"
        stroke="#3a2800"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** Inline display of a coin amount: icon + formatted number */
export function CoinAmount({ value, className, size = "sm" }: { value: number | null | undefined; className?: string; size?: CoinIconProps["size"] }) {
  const n = Math.trunc(Number(value ?? 0));
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums", className)}>
      <CoinIcon size={size} />
      <span>{sign}{abs}</span>
    </span>
  );
}
