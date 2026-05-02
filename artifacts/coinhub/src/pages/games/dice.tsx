import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMe, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ChevronLeft, TrendingUp, TrendingDown } from "lucide-react";
import { BetSelector } from "@/components/BetSelector";
import { cn, fmtCoins } from "@/lib/utils";
import { CoinIcon } from "@/components/CoinIcon";
import confetti from "canvas-confetti";

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export default function DiceGame() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const [bet, setBet] = useState(10);
  const [choice, setChoice] = useState<"high" | "low" | null>(null);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [displayDice, setDisplayDice] = useState<[number, number] | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const handleRoll = async () => {
    if (!choice || rolling || !user || bet > user.coins) return;
    setRolling(true);
    setResult(null);

    // Animate dice rolling
    let ticks = 0;
    const interval = setInterval(() => {
      setDisplayDice([
        Math.ceil(Math.random() * 6),
        Math.ceil(Math.random() * 6),
      ]);
      ticks++;
      if (ticks >= 12) clearInterval(interval);
    }, 80);

    try {
      const res = await fetch("/api/games/dice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet, choice }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Ýalňyşlyk", variant: "destructive" });
        return;
      }
      clearInterval(interval);
      setDisplayDice([data.dice1, data.dice2]);
      setResult(data);
      if (data.netChange > 0) {
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
      }
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
    } catch {
      toast({ title: "Ýalňyşlyk", variant: "destructive" });
    } finally {
      setRolling(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 space-y-5 pb-24">
        <div className="flex items-center gap-3">
          <Link href="/games">
            <button className="w-9 h-9 rounded-xl bg-card border border-primary/15 flex items-center justify-center text-muted-foreground hover:text-primary active:scale-95">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-xl font-black italic gold-text-gradient uppercase tracking-tighter">Zar Oýny</h1>
        </div>

        {/* How to play */}
        <div className="bg-card/50 border border-primary/10 rounded-2xl p-4 text-xs text-muted-foreground">
          <p className="font-bold text-white mb-1 uppercase tracking-widest text-[10px]">Nähili oýnamaly?</p>
          <p>2 zar atylýar. <span className="text-primary font-bold">ÝOKARY</span> = jemi 8-12, <span className="text-blue-400 font-bold">AŞAKY</span> = jemi 2-7. Dogry taraf saýlasaňyz 1.85× gazanarsyňyz.</p>
        </div>

        {/* Dice display */}
        <div className="bg-card border border-primary/20 rounded-3xl p-8 flex flex-col items-center gap-4 gold-glow">
          <div className="flex gap-6">
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                animate={rolling ? { rotate: [0, 360], scale: [1, 0.8, 1] } : {}}
                transition={{ duration: 0.8, repeat: rolling ? Infinity : 0, ease: "linear" }}
                className="w-20 h-20 rounded-2xl bg-background border-2 border-primary/30 flex items-center justify-center text-5xl shadow-[0_0_20px_rgba(212,175,55,0.15)]"
              >
                {displayDice ? DICE_FACES[(displayDice[i] ?? 1) - 1] : "?"}
              </motion.div>
            ))}
          </div>

          {displayDice && !rolling && (
            <div className="text-center">
              <p className="text-2xl font-black gold-text-gradient">Jemi: {displayDice[0] + displayDice[1]}</p>
            </div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "px-5 py-2 rounded-xl font-black text-sm uppercase tracking-wider",
                  result.netChange > 0 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-destructive/20 text-destructive border border-destructive/30",
                )}
              >
                {result.netChange > 0 ? `+${fmtCoins(result.netChange)}` : fmtCoins(result.netChange)} TMT
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Choice buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setChoice("high")}
            className={cn(
              "h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 font-black text-sm uppercase tracking-tight transition-all active:scale-[0.98]",
              choice === "high" ? "bg-primary/20 border-primary text-primary gold-glow" : "bg-card border-primary/20 text-muted-foreground hover:text-primary hover:border-primary/40",
            )}
          >
            <TrendingUp className="w-5 h-5" />
            Ýokary (8-12)
          </button>
          <button
            onClick={() => setChoice("low")}
            className={cn(
              "h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 font-black text-sm uppercase tracking-tight transition-all active:scale-[0.98]",
              choice === "low" ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-card border-primary/20 text-muted-foreground hover:text-blue-400 hover:border-blue-500/40",
            )}
          >
            <TrendingDown className="w-5 h-5" />
            Aşaky (2-7)
          </button>
        </div>

        <BetSelector value={bet} onChange={setBet} min={5} max={Math.min(10000, user?.coins ?? 10000)} />

        <button
          onClick={handleRoll}
          disabled={rolling || !choice || !user || bet > (user?.coins ?? 0)}
          className="w-full h-14 rounded-2xl gold-gradient text-black font-black text-base uppercase tracking-widest disabled:opacity-50 active:scale-[0.99] shadow-[0_0_20px_rgba(212,175,55,0.3)]"
        >
          {rolling ? "Atylýar..." : choice ? `${choice === "high" ? "ÝOKARY" : "AŞAKY"} — Zar at` : "Taraf saýlaň"}
        </button>

        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span className="flex items-center gap-1">Balans: <CoinIcon size="xs" /><span className="font-bold text-white">{fmtCoins(user?.coins)}</span></span>
          <span>Ýeňiş: ×1.85</span>
        </div>
      </div>
    </Layout>
  );
}
