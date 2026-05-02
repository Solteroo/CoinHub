import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { X, Percent, TrendingUp, Zap, Users, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { playOpenModal } from "@/lib/sounds";
import { useEffect, useRef } from "react";
import type { Volatility } from "@/lib/game-data";

export interface GameModalInfo {
  title: string;
  desc: string;
  href: string;
  emoji: string;
  badge: string;
  badgeClass: string;
  gradient: string;
  rtp: string;
  maxWin: string;
  volatility: Volatility;
  accentText: string;
}

interface Props {
  game: GameModalInfo | null;
  onClose: () => void;
}

const RECENT_WINS = [
  { name: "Merdan", amount: 1500, game: "Slot" },
  { name: "Aynur", amount: 350, game: "Crash" },
  { name: "Kemal", amount: 750, game: "Plinko" },
  { name: "Didar", amount: 2000, game: "Mines" },
];

function VolatilityDots({ v }: { v: Volatility }) {
  const count = v === "Low" ? 1 : v === "Medium" ? 2 : 3;
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            "w-2 h-2 rounded-full",
            i <= count ? "bg-primary" : "bg-white/15",
          )}
        />
      ))}
    </div>
  );
}

export function GamePreviewModal({ game, onClose }: Props) {
  const played = useRef(false);

  useEffect(() => {
    if (game && !played.current) {
      played.current = true;
      playOpenModal();
    }
    if (!game) played.current = false;
  }, [game]);

  return (
    <AnimatePresence>
      {game && (
        <>
          {/* Backdrop */}
          <motion.div
            key="bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-[60]"
          />

          {/* Panel — slides up from bottom */}
          <motion.div
            key="panel"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280, mass: 0.9 }}
            className="fixed bottom-0 left-0 right-0 z-[61] max-w-md mx-auto"
          >
            <div className={cn(
              "relative overflow-hidden bg-gradient-to-b rounded-t-[28px] border-t border-x border-primary/20 pb-safe",
              game.gradient,
            )}>
              {/* Subtle glow behind emoji */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />

              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center active:scale-90"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>

              <div className="px-5 pt-2 pb-6 space-y-4 relative z-10">
                {/* Emoji + Title */}
                <div className="flex items-center gap-4">
                  <div className="text-6xl leading-none drop-shadow-2xl select-none">{game.emoji}</div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-2xl font-black text-white uppercase italic tracking-tight leading-none">
                        {game.title}
                      </h2>
                    </div>
                    <span className={cn("inline-block mt-1.5 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider", game.badgeClass)}>
                      {game.badge}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-white/70 leading-relaxed">{game.desc}</p>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  <StatChip icon={Percent} label="RTP" value={game.rtp} accentText={game.accentText} />
                  <StatChip icon={TrendingUp} label="Max Win" value={game.maxWin} accentText={game.accentText} />
                  <div className="bg-black/30 rounded-xl p-2.5 border border-white/5 flex flex-col items-center gap-1">
                    <Zap className="w-3 h-3 text-muted-foreground" />
                    <p className="text-[8px] text-muted-foreground uppercase tracking-wider font-bold">Vol.</p>
                    <VolatilityDots v={game.volatility} />
                  </div>
                </div>

                {/* Recent jackpots */}
                <div className="bg-black/25 rounded-2xl border border-white/5 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Recent Winners
                    </span>
                  </div>
                  {RECENT_WINS.slice(0, 3).map((w, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-xs text-white/80 font-bold">{w.name}</span>
                      <span className="text-xs font-black text-emerald-400">+{w.amount.toLocaleString()} TMT</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link href={game.href} onClick={onClose}>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className="w-full h-14 rounded-2xl gold-gradient text-black font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 neon-pulse shadow-[0_4px_24px_rgba(212,175,55,0.5)]"
                  >
                    ▶ &nbsp;PLAY NOW
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatChip({ icon: Icon, label, value, accentText }: { icon: any; label: string; value: string; accentText: string }) {
  return (
    <div className="bg-black/30 rounded-xl p-2.5 border border-white/5 flex flex-col items-center gap-1">
      <Icon className="w-3 h-3 text-muted-foreground" />
      <p className="text-[8px] text-muted-foreground uppercase tracking-wider font-bold">{label}</p>
      <p className={cn("text-sm font-black tabular-nums", accentText)}>{value}</p>
    </div>
  );
}
