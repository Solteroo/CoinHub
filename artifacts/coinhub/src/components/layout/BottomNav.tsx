import { Link, useLocation } from "wouter";
import { Home, Gamepad2, Wallet, User, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { path: "/home", label: "Baş sahypa", icon: Home },
  { path: "/games", label: "Oýunlar", icon: Gamepad2 },
  { path: "/chat", label: "Çat", icon: MessageCircle, isCenter: true },
  { path: "/wallet", label: "Gapjyk", icon: Wallet },
  { path: "/profile", label: "Profil", icon: User },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-primary/20 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2 relative">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.path || (item.path !== "/home" && location.startsWith(item.path));
          
          if (item.isCenter) {
            return (
              <div key={item.path} className="flex-1 flex flex-col items-center justify-end h-full pb-1 relative">
                <Link href={item.path}>
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full gold-gradient flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)] z-50 border-4 border-background",
                      isActive && "animate-pulse"
                    )}
                  >
                    <item.icon className="w-7 h-7 text-black" strokeWidth={2.5} />
                  </motion.div>
                </Link>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-tighter mt-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </div>
            );
          }

          return (
            <Link key={item.path} href={item.path} className="flex-1 flex flex-col items-center justify-center gap-1 group">
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
