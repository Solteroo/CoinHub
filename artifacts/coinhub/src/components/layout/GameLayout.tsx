import { useState } from "react";
import { Menu, Home, Gamepad2, Wallet, User, X, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { fmtCoins, cn } from "@/lib/utils";
import { COIN } from "@/lib/coin";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useI18n } from "@/i18n";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { t } = useI18n();

  const go = (href: string) => { setMenuOpen(false); setLocation(href); };

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: "#0b131e" }}>
      {/* Ambient radial glow from top */}
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{ background: `radial-gradient(ellipse 90% 55% at 50% -5%, ${bgGlow ?? accentColor}28 0%, transparent 70%)` }} />
      {/* Subtle grid texture */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.035]"
        style={{ backgroundImage: `linear-gradient(${accentColor} 1px, transparent 1px), linear-gradient(90deg, ${accentColor} 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />
      {/* Bottom ambient glow */}
      <div className="absolute bottom-0 inset-x-0 h-48 pointer-events-none z-0"
        style={{ background: `radial-gradient(ellipse 70% 60% at 50% 100%, ${bgGlow ?? accentColor}12 0%, transparent 70%)` }} />

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
          {/* Menu button (replaces back button) */}
          <button
            onClick={() => setMenuOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <Menu className="w-5 h-5 text-white/70" />
          </button>

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
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl border cursor-pointer active:scale-95"
            style={{ background: `${accentColor}12`, borderColor: `${accentColor}35`, boxShadow: `0 0 16px ${accentColor}18` }}
            onClick={() => go("/wallet")}
          >
            <span className="text-xs font-black tabular-nums" style={{ color: accentColor }}>
              {fmtCoins(user?.coins ?? 0)}
            </span>
            <span className="text-[9px] font-black opacity-70" style={{ color: accentColor }}>{COIN}</span>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">{children}</div>
      </div>

      {/* Navigation Sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[260px] p-0 border-r border-white/10" style={{ background: "#0b131e" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/8"
            style={{ paddingTop: "max(16px, env(safe-area-inset-top, 16px))" }}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{emoji}</span>
              <span className="font-black text-sm uppercase tracking-tight" style={{ color: accentColor }}>{title}</span>
            </div>
            <button onClick={() => setMenuOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white active:scale-90"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Balance */}
          {user && (
            <div className="mx-3 my-3 rounded-2xl p-3 border border-white/8 flex items-center justify-between cursor-pointer active:scale-[0.99]"
              style={{ background: `${accentColor}10` }} onClick={() => go("/wallet")}>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{t("your_balance")}</span>
              <div className="flex items-center gap-1">
                <span className="font-black tabular-nums text-sm" style={{ color: accentColor }}>{fmtCoins(user.coins)}</span>
                <span className="text-[9px] font-black opacity-60" style={{ color: accentColor }}>{COIN}</span>
              </div>
            </div>
          )}

          {/* Nav items */}
          <nav className="px-3 space-y-1">
            <NavItem icon={Home} label={t("nav_home")} onClick={() => go("/home")} />
            <NavItem icon={Gamepad2} label={t("nav_games")} onClick={() => go(backHref)} accent={accentColor} />
            <NavItem icon={Wallet} label={t("nav_wallet")} onClick={() => go("/wallet")} />
            <NavItem icon={User} label={t("nav_profile")} onClick={() => go("/profile")} />
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function NavItem({ icon: Icon, label, onClick, accent }: { icon: any; label: string; onClick: () => void; accent?: string }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold active:scale-[0.98] transition-all text-white/70 hover:text-white hover:bg-white/5"
    >
      <Icon className="w-4 h-4 shrink-0" style={{ color: accent }} />
      <span className="flex-1 text-left">{label}</span>
      <ChevronRight className="w-3.5 h-3.5 opacity-30" />
    </button>
  );
}
