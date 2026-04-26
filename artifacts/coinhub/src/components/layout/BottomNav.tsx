import { Link, useLocation } from "wouter";
import { Home, Gamepad2, Wallet, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/home", label: "Baş sahypa", icon: Home },
  { path: "/games", label: "Oýunlar", icon: Gamepad2 },
  { path: "/wallet", label: "Gapjyk", icon: Wallet },
  { path: "/leaderboard", label: "Lider", icon: Trophy },
  { path: "/profile", label: "Profil", icon: User },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-primary/20 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-4">
        {NAV_ITEMS.map((item) => {
          const isActive = location.startsWith(item.path);
          return (
            <Link key={item.path} href={item.path} className="flex-1 flex flex-col items-center justify-center gap-1 group relative">
              <div
                className={cn(
                  "p-1.5 rounded-full transition-all duration-300",
                  isActive ? "bg-primary/20 text-primary gold-glow" : "text-muted-foreground group-hover:text-primary/70"
                )}
              >
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
