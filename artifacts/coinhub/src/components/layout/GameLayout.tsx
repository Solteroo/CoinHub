import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { fmtCoins, cn } from "@/lib/utils";
import { COIN } from "@/lib/coin";

interface GameLayoutProps {
  title: string;
  emoji: string;
  accentColor: string;
  bgGlow?: string;
  backHref?: string;
  children: React.ReactNode;
  className?: string;
}

export function GameLayout({
  title,
  emoji,
  accentColor,
  bgGlow,
  backHref = "/games",
  children,
  className,
}: GameLayoutProps) {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: "#0b131e" }}>
      {/* Ambient radial glow from top */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(ellipse 90% 55% at 50% -5%, ${bgGlow ?? accentColor}28 0%, transparent 70%)`,
        }}
      />
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(${accentColor} 1px, transparent 1px), linear-gradient(90deg, ${accentColor} 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />
      {/* Bottom ambient glow */}
      <div
        className="absolute bottom-0 inset-x-0 h-48 pointer-events-none z-0"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 100%, ${bgGlow ?? accentColor}12 0%, transparent 70%)`,
        }}
      />

      <div className={cn("w-full h-full flex flex-col relative z-10 max-w-md mx-auto", className)}>
        {/* Header */}
        <div
          className="shrink-0 flex items-center justify-between px-4 py-3 border-b"
          style={{
            paddingTop: "max(12px, env(safe-area-inset-top, 12px))",
            background: "rgba(11,19,30,0.9)",
            backdropFilter: "blur(24px)",
            borderColor: `${accentColor}20`,
          }}
        >
          <Link href={backHref}>
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </button>
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl leading-none shrink-0">{emoji}</span>
            <h1
              className="text-base font-black tracking-tight uppercase truncate"
              style={{ color: accentColor, textShadow: `0 0 20px ${accentColor}60` }}
            >
              {title}
            </h1>
          </div>

          <div
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl border"
            style={{
              background: `${accentColor}12`,
              borderColor: `${accentColor}35`,
              boxShadow: `0 0 16px ${accentColor}18`,
            }}
          >
            <span className="text-xs font-black tabular-nums" style={{ color: accentColor }}>
              {fmtCoins(user?.coins ?? 0)}
            </span>
            <span className="text-[9px] font-black opacity-70" style={{ color: accentColor }}>
              {COIN}
            </span>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
