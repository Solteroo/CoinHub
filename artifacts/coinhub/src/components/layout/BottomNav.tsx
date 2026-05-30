import { Link, useLocation } from "wouter";
import { Home, Gamepad2, Wallet, User, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n/translations";

const NAV_ITEMS: { path: string; labelKey: TranslationKey; icon: any; isCenter?: boolean }[] = [
  { path: "/home",        labelKey: "nav_home",    icon: Home },
  { path: "/games",       labelKey: "nav_games",   icon: Gamepad2 },
  { path: "/leaderboard", labelKey: "nav_top",     icon: Trophy, isCenter: true },
  { path: "/wallet",      labelKey: "nav_wallet",  icon: Wallet },
  { path: "/profile",     labelKey: "nav_profile", icon: User },
];

export function BottomNav() {
  const [location] = useLocation();
  const { t } = useI18n();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      style={{ background: "rgba(11,22,35,0.97)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="max-w-md mx-auto flex items-stretch justify-around h-[62px] px-1 relative">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.path || (item.path !== "/home" && location.startsWith(item.path));
          const label = t(item.labelKey);

          if (item.isCenter) {
            return (
              <div key={item.path} className="flex-1 flex flex-col items-center justify-end pb-1.5 relative">
                <Link href={item.path}>
                  <div
                    className="absolute -top-5 left-1/2 -translate-x-1/2 w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all active:scale-90"
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg,#F3E5AB,#D4AF37,#B8860B)"
                        : "linear-gradient(135deg,#d4af37cc,#b8860bcc)",
                      boxShadow: isActive ? "0 0 24px rgba(212,175,55,0.6), 0 4px 16px rgba(0,0,0,0.4)" : "0 4px 16px rgba(0,0,0,0.35)",
                      border: "3px solid rgba(11,22,35,0.97)",
                    }}
                  >
                    <item.icon className="w-6 h-6 text-black" strokeWidth={2.5} />
                  </div>
                </Link>
                <span className="text-[10px] font-bold uppercase tracking-tight mt-1 transition-colors"
                  style={{ color: isActive ? "#D4AF37" : "rgba(255,255,255,0.38)" }}>
                  {label}
                </span>
              </div>
            );
          }

          return (
            <Link key={item.path} href={item.path} className="flex-1 flex flex-col items-center justify-center gap-1 group active:scale-95 transition-transform">
              <div className="flex flex-col items-center gap-1">
                <item.icon
                  className="w-[22px] h-[22px] transition-all"
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={{ color: isActive ? "#D4AF37" : "rgba(255,255,255,0.38)" }}
                />
                <span className="text-[10px] font-bold tracking-tight transition-colors"
                  style={{ color: isActive ? "#D4AF37" : "rgba(255,255,255,0.38)" }}>
                  {label}
                </span>
              </div>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full" style={{ background: "#D4AF37" }} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
