import { Link, useLocation } from "wouter";
import { Home, Gamepad2, Wallet, User, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n";
import type { TranslationKey } from "@/i18n/translations";

const NAV_ITEMS: { path: string; labelKey: TranslationKey; icon: any; isCenter?: boolean }[] = [
  { path: "/home", labelKey: "nav_home", icon: Home },
  { path: "/games", labelKey: "nav_games", icon: Gamepad2 },
  { path: "/leaderboard", labelKey: "nav_top", icon: Trophy, isCenter: true },
  { path: "/wallet", labelKey: "nav_wallet", icon: Wallet },
  { path: "/profile", labelKey: "nav_profile", icon: User },
];

export function BottomNav() {
  const [location] = useLocation();
  const { t } = useI18n();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/85 backdrop-blur-2xl border-t border-primary/20 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2 relative">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.path || (item.path !== "/home" && location.startsWith(item.path));
          const label = t(item.labelKey);

          if (item.isCenter) {
            return (
              <div key={item.path} className="flex-1 flex flex-col items-center justify-end h-full pb-1 relative">
                <Link href={item.path}>
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full gold-gradient flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.5)] z-50 border-4 border-background",
                      isActive && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                    )}
                  >
                    <item.icon className="w-7 h-7 text-black" strokeWidth={2.5} />
                  </motion.div>
                </Link>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-tighter mt-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}>
                  {label}
                </span>
              </div>
            );
          }

          return (
            <Link key={item.path} href={item.path} className="flex-1 flex flex-col items-center justify-center gap-1 group">
              <div className={cn(
                "p-1.5 rounded-full transition-all duration-300",
                isActive ? "bg-primary/20 text-primary" : "text-muted-foreground group-hover:text-primary/70",
              )}>
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary/70",
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
