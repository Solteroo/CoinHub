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
    <div className="min-h-[100dvh] w-full flex justify-center" style={{ background: "#06060f" }}>
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 20%, ${bgGlow ?? accentColor}18 0%, transparent 70%)`,
        }}
      />

      <div className={cn("w-full max-w-md flex flex-col relative z-10 min-h-[100dvh]", className)}>
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 pt-safe-top py-3 bg-black/40 backdrop-blur-xl border-b border-white/5">
          <Link href={backHref}>
            <button className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white active:scale-95 transition-all shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl leading-none shrink-0">{emoji}</span>
            <h1
              className="text-base font-black tracking-tight uppercase truncate"
              style={{ color: accentColor }}
            >
              {title}
            </h1>
          </div>

          <div
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl border"
            style={{ background: `${accentColor}15`, borderColor: `${accentColor}40` }}
          >
            <span className="text-xs font-black tabular-nums" style={{ color: accentColor }}>
              {fmtCoins(user?.coins ?? 0)}
            </span>
            <span className="text-[9px] font-black opacity-70" style={{ color: accentColor }}>
              {COIN}
            </span>
          </div>
        </div>

        {/* Game content */}
        <div className="flex-1 flex flex-col overflow-y-auto pb-safe-bottom pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}
