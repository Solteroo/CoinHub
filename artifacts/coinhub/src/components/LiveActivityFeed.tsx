import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, fmtCoins } from "@/lib/utils";
import { COIN } from "@/lib/coin";
import { useI18n } from "@/i18n";

export const FAKE_USERNAMES = [
  "Merdan", "Aynur", "Kemal", "Didar", "Leila",
  "Serdar", "Bekmurat", "Nasiba", "Timur", "Aziz",
  "Güller", "Sapar", "Öwez", "Dildora", "Marat",
  "Zoya", "Gülnar", "Ali", "Söhbet", "Maral",
  "Bayram", "Gülşen", "Döwran", "Nargiza", "Arslan",
  "Mekan", "Laýly", "Nurýagdy", "Ogulgerek", "Jumadurdy",
];

const GAMES_TM = ["Slot Maşyn", "Bagt Uçuşy", "Zar Oýny", "Hi-Lo", "Plinko", "Ruletka", "Bagt Çarhy", "Minalar", "Bagt Gutusy"];
const WIN_AMOUNTS = [50, 75, 100, 150, 200, 350, 500, 750, 1000, 1500, 2000, 3000, 5000];
const LOSS_AMOUNTS = [15, 25, 50, 75, 100, 150, 200, 300];
const WIN_MULTS = ["×1.9", "×2.1", "×3.5", "×5.0", "×8.0", "×12×", "×1.6", "×2.0", "×4.2"];

let uid = 1000;
function genActivity() {
  const isWin = Math.random() > 0.35;
  const amounts = isWin ? WIN_AMOUNTS : LOSS_AMOUNTS;
  const mult = isWin ? WIN_MULTS[Math.floor(Math.random() * WIN_MULTS.length)] : null;
  return {
    id: uid++,
    name: FAKE_USERNAMES[Math.floor(Math.random() * FAKE_USERNAMES.length)],
    game: GAMES_TM[Math.floor(Math.random() * GAMES_TM.length)],
    amount: amounts[Math.floor(Math.random() * amounts.length)],
    mult,
    isWin,
  };
}

const INITIAL = Array.from({ length: 6 }, genActivity);

export function LiveActivityFeed({ title }: { title?: string }) {
  const [items, setItems] = useState(INITIAL);
  const { t } = useI18n();

  useEffect(() => {
    const intervals = [2200, 3100, 1800, 4000];
    let i = 0;
    const next = () => {
      const delay = intervals[i % intervals.length]!;
      i++;
      return setTimeout(() => {
        setItems((prev) => [genActivity(), ...prev.slice(0, 7)]);
        t_ref = next();
      }, delay);
    };
    let t_ref = next();
    return () => clearTimeout(t_ref);
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
        <div className="ml-auto flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-60" />
          <span className="text-[9px] font-bold text-white/30">{(312 + Math.floor(Math.random() * 20)).toLocaleString("ru-RU")}</span>
        </div>
      </div>

      <div className="max-h-48 overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          {items.slice(0, 7).map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="flex items-center justify-between px-4 py-2 border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Color dot */}
                <div className={cn(
                  "w-1.5 h-6 rounded-full shrink-0",
                  item.isWin ? "bg-emerald-500" : "bg-red-500/60",
                )} />
                {/* Avatar initial */}
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-black shrink-0"
                  style={{ background: item.isWin ? "#34d399" : "#f87171" }}>
                  {item.name[0]}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white/90 truncate block">{item.name}</span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{item.game}</span>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <span className={cn(
                  "text-xs font-black tabular-nums block",
                  item.isWin ? "text-emerald-400" : "text-red-400/80",
                )}>
                  {item.isWin ? "+" : "−"}{fmtCoins(item.amount)}{COIN}
                </span>
                {item.mult && (
                  <span className="text-[9px] text-emerald-400/60 font-bold">{item.mult}</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
