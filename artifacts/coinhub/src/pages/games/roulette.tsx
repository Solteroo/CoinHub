import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMe, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { BetSelector } from "@/components/BetSelector";
import { cn, fmtCoins } from "@/lib/utils";
import { CoinIcon } from "@/components/CoinIcon";
import confetti from "canvas-confetti";

const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

function getColor(n: number) {
  if (n === 0) return "green";
  return RED.has(n) ? "red" : "black";
}

export default function RouletteGame() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const [bet, setBet] = useState(10);
  const [betType, setBetType] = useState<"red" | "black" | "zero" | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const handleSpin = async () => {
    if (!betType || spinning || !user || bet > user.coins) return;
    setSpinning(true);
    setResult(null);

    let ticks = 0;
    const interval = setInterval(() => {
      setDisplayNumber(Math.floor(Math.random() * 37));
      ticks++;
      if (ticks >= 20) clearInterval(interval);
    }, 100);

    try {
      const res = await fetch("/api/games/roulette", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet, betType }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error ?? "Ýalňyşlyk", variant: "destructive" }); return; }
      clearInterval(interval);
      setDisplayNumber(data.number);
      setResult(data);
      if (data.netChange > 0) confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
    } catch {
      toast({ title: "Ýalňyşlyk", variant: "destructive" });
    } finally {
      setSpinning(false);
    }
  };

  const numColor = displayNumber === null ? null : getColor(displayNumber);

  return (
    <Layout>
      <div className="p-4 space-y-5 pb-24">
        <div className="flex items-center gap-3">
          <Link href="/games">
            <button className="w-9 h-9 rounded-xl bg-card border border-primary/15 flex items-center justify-center text-muted-foreground hover:text-primary active:scale-95">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-xl font-black italic gold-text-gradient uppercase tracking-tighter">Ruletka</h1>
        </div>

        <div className="bg-card/50 border border-primary/10 rounded-2xl p-4 text-xs text-muted-foreground">
          <p className="font-bold text-white mb-1 uppercase tracking-widest text-[10px]">Nähili oýnamaly?</p>
          <p>0-36 san aýlanýar. <span className="text-red-500 font-bold">Gyzyl</span>/<span className="text-gray-300 font-bold">Gara</span> = 1.9×. <span className="text-green-500 font-bold">Nol</span> = 14×.</p>
        </div>

        {/* Roulette wheel display */}
        <div className="bg-card border border-primary/20 rounded-3xl p-8 flex flex-col items-center gap-4 gold-glow">
          <motion.div
            animate={spinning ? { rotate: 360 } : {}}
            transition={{ duration: 1.5, repeat: spinning ? Infinity : 0, ease: "linear" }}
            className="relative w-36 h-36"
          >
            {/* Wheel */}
            <div className="w-36 h-36 rounded-full border-4 border-primary/40 bg-background flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.2)]">
              <div
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all duration-500",
                  numColor === "red" ? "bg-red-600 border-red-400" :
                  numColor === "black" ? "bg-gray-900 border-gray-600" :
                  numColor === "green" ? "bg-green-700 border-green-500" :
                  "bg-card border-primary/20",
                )}
              >
                <span className="text-3xl font-black text-white">
                  {displayNumber !== null ? displayNumber : "?"}
                </span>
              </div>
            </div>
            {/* Ball indicator */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-4 h-4 rounded-full bg-white shadow-lg" />
          </motion.div>

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

        {/* Number grid preview (red/black layout) */}
        <div className="grid grid-cols-6 gap-1">
          {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className={cn(
                "aspect-square rounded flex items-center justify-center text-[10px] font-bold",
                RED.has(n) ? "bg-red-700/60" : "bg-gray-800/80",
                result?.number === n && "ring-2 ring-primary",
              )}
            >
              {n}
            </div>
          ))}
          <div className={cn("aspect-square rounded flex items-center justify-center text-[10px] font-bold bg-green-800/80 col-span-2", result?.number === 0 && "ring-2 ring-primary")}>
            0
          </div>
        </div>

        {/* Bet type selector */}
        <div className="grid grid-cols-3 gap-2">
          {(["red", "black", "zero"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setBetType(type)}
              className={cn(
                "h-14 rounded-2xl border-2 font-black text-sm uppercase tracking-tight transition-all active:scale-[0.98]",
                type === "red" && (betType === "red" ? "bg-red-600 border-red-400 text-white" : "bg-red-900/30 border-red-700/40 text-red-400 hover:border-red-600"),
                type === "black" && (betType === "black" ? "bg-gray-700 border-gray-400 text-white" : "bg-gray-900/30 border-gray-700/40 text-gray-300 hover:border-gray-500"),
                type === "zero" && (betType === "zero" ? "bg-green-600 border-green-400 text-white gold-glow" : "bg-green-900/30 border-green-700/40 text-green-400 hover:border-green-600"),
              )}
            >
              {type === "red" ? "Gyzyl ×1.9" : type === "black" ? "Gara ×1.9" : "Nol ×14"}
            </button>
          ))}
        </div>

        <BetSelector value={bet} onChange={setBet} min={5} max={Math.min(10000, user?.coins ?? 10000)} />

        <button
          onClick={handleSpin}
          disabled={spinning || !betType || !user || bet > (user?.coins ?? 0)}
          className="w-full h-14 rounded-2xl gold-gradient text-black font-black text-base uppercase tracking-widest disabled:opacity-50 active:scale-[0.99] shadow-[0_0_20px_rgba(212,175,55,0.3)]"
        >
          {spinning ? "Aýlanýar..." : "Ruletka aýlan"}
        </button>

        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span className="flex items-center gap-1">Balans: <CoinIcon size="xs" /><span className="font-bold text-white">{fmtCoins(user?.coins)}</span></span>
          <span>Gyzyl/Gara: ×1.9 · Nol: ×14</span>
        </div>
      </div>
    </Layout>
  );
}
