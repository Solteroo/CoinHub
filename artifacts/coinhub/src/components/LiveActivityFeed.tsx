import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, fmtCoins } from "@/lib/utils";
import { Zap } from "lucide-react";

const NAMES = [
  "Ali", "Merdan", "Aynur", "Kemal", "Didar", "Leila",
  "Serdar", "Gülnar", "Timur", "Aziz", "Zoya", "Marat",
  "Bekmurat", "Nasiba", "Öwez", "Dildora", "Sapar", "Güller",
];
const GAMES = ["Slot", "Crash", "Dice", "Hi-Lo", "Plinko", "Roulette", "Spin", "Mines", "Lucky Box"];
const WIN_AMOUNTS = [25, 50, 75, 100, 150, 200, 350, 500, 750, 1000, 1500, 2000, 3000];
const LOSS_AMOUNTS = [10, 25, 50, 75, 100, 150, 200];

let uid = 1000;
function genActivity() {
  const isWin = Math.random() > 0.38;
  const amounts = isWin ? WIN_AMOUNTS : LOSS_AMOUNTS;
  return {
    id: uid++,
    name: NAMES[Math.floor(Math.random() * NAMES.length)],
    game: GAMES[Math.floor(Math.random() * GAMES.length)],
    amount: amounts[Math.floor(Math.random() * amounts.length)],
    isWin,
  };
}

const INITIAL = Array.from({ length: 5 }, genActivity);

export function LiveActivityFeed({ title }: { title?: string }) {
  const [items, setItems] = useState(INITIAL);

  useEffect(() => {
    const t = setInterval(() => {
      setItems((prev) => [genActivity(), ...prev.slice(0, 6)]);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-card/50 border border-primary/10 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-primary/10 bg-black/20">
        <div className="relative flex items-center justify-center w-5 h-5">
          <div className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-60" />
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
          {title ?? "LIVE"}
        </span>
        <Zap className="w-3 h-3 text-primary ml-auto" />
      </div>

      <div className="max-h-44 overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          {items.slice(0, 6).map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="flex items-center justify-between px-4 py-2 border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn(
                  "w-1.5 h-6 rounded-full shrink-0",
                  item.isWin ? "bg-emerald-500" : "bg-red-500/70",
                )} />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white/90 truncate block">{item.name}</span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{item.game}</span>
                </div>
              </div>
              <span className={cn(
                "text-xs font-black tabular-nums shrink-0",
                item.isWin ? "text-emerald-400" : "text-red-400/80",
              )}>
                {item.isWin ? "+" : "−"}{fmtCoins(item.amount)} <span className="text-[9px] opacity-70">TMT</span>
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
