import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMe, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ChevronLeft, Bomb, Star, RefreshCw } from "lucide-react";
import { BetSelector } from "@/components/BetSelector";
import { cn, fmtCoins } from "@/lib/utils";
import { CoinIcon } from "@/components/CoinIcon";
import confetti from "canvas-confetti";

const MULTIPLIERS = [0, 1.2, 1.5, 2.0, 2.8, 4.0, 6.0, 10.0, 20.0];

export default function MinesGame() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const [bet, setBet] = useState(10);
  const [picks, setPicks] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const maxPicks = 5;
  const currentMult = MULTIPLIERS[Math.min(picks.length, MULTIPLIERS.length - 1)] ?? 0;

  const togglePick = (idx: number) => {
    if (submitted || loading) return;
    setPicks((prev) =>
      prev.includes(idx) ? prev.filter((p) => p !== idx) : prev.length < maxPicks ? [...prev, idx] : prev,
    );
  };

  const handleSubmit = async () => {
    if (picks.length === 0 || loading || !user || bet > user.coins) return;
    setLoading(true);
    try {
      const res = await fetch("/api/games/mines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet, picks }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error ?? "Ýalňyşlyk", variant: "destructive" }); return; }
      setResult(data);
      setSubmitted(true);
      if (data.netChange > 0) confetti({ particleCount: 70, spread: 55, origin: { y: 0.6 } });
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
    } catch {
      toast({ title: "Ýalňyşlyk", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPicks([]);
    setSubmitted(false);
    setResult(null);
  };

  const getCellState = (idx: number): "default" | "picked" | "safe" | "mine" => {
    if (!submitted) return picks.includes(idx) ? "picked" : "default";
    const isMine = result?.minePositions?.includes(idx);
    const isPicked = picks.includes(idx);
    if (isMine && isPicked) return "mine";
    if (!isMine && isPicked) return "safe";
    if (isMine) return "mine";
    return "default";
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
          <h1 className="text-xl font-black italic gold-text-gradient uppercase tracking-tighter">Minalar</h1>
        </div>

        <div className="bg-card/50 border border-primary/10 rounded-2xl p-4 text-xs text-muted-foreground">
          <p className="font-bold text-white mb-1 uppercase tracking-widest text-[10px]">Nähili oýnamaly?</p>
          <p>25 öýjükden saýlaň (iň köp {maxPicks}). 5 mina gizlenendir. Her howpsuz öýjük köp pul. Minany tapmasaňyz ýeňersiňiz.</p>
        </div>

        {/* Potential multiplier */}
        <div className="bg-card border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Saýlanan</p>
            <p className="text-lg font-black text-white">{picks.length} öýjük</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Potensial</p>
            <p className="text-lg font-black gold-text-gradient">{picks.length > 0 ? `${currentMult}×` : "—"}</p>
          </div>
          {submitted && result && (
            <div className={cn("text-right", result.netChange > 0 ? "text-emerald-400" : "text-destructive")}>
              <p className="text-[10px] font-bold uppercase tracking-widest">Netije</p>
              <p className="text-lg font-black">{result.netChange > 0 ? "+" : ""}{fmtCoins(result.netChange)}</p>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 25 }, (_, i) => {
            const state = getCellState(i);
            return (
              <motion.button
                key={i}
                onClick={() => togglePick(i)}
                whileTap={!submitted ? { scale: 0.9 } : {}}
                className={cn(
                  "aspect-square rounded-xl border-2 flex items-center justify-center text-xl font-black transition-all",
                  state === "default" && "bg-card/80 border-primary/10 hover:border-primary/40 hover:bg-primary/5",
                  state === "picked" && "bg-primary/20 border-primary text-primary gold-glow",
                  state === "safe" && "bg-emerald-500/30 border-emerald-500 text-emerald-400",
                  state === "mine" && "bg-destructive/30 border-destructive text-destructive",
                )}
              >
                <AnimatePresence>
                  {state === "safe" && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Star className="w-5 h-5" /></motion.div>}
                  {state === "mine" && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Bomb className="w-5 h-5" /></motion.div>}
                  {state === "picked" && <span className="text-primary text-xs font-black">{picks.indexOf(i) + 1}</span>}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        <BetSelector value={bet} onChange={setBet} min={5} max={Math.min(10000, user?.coins ?? 10000)} disabled={submitted} />

        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={picks.length === 0 || loading || !user || bet > (user?.coins ?? 0)}
            className="w-full h-14 rounded-2xl gold-gradient text-black font-black text-base uppercase tracking-widest disabled:opacity-50 active:scale-[0.99] shadow-[0_0_20px_rgba(212,175,55,0.3)]"
          >
            {loading ? "Barlanýar..." : picks.length === 0 ? "Öýjük saýlaň" : `${picks.length} öýjük — Başla`}
          </button>
        ) : (
          <button
            onClick={reset}
            className="w-full h-14 rounded-2xl bg-card border border-primary/30 text-primary font-black text-base uppercase tracking-widest active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Täzeden oýna
          </button>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span className="flex items-center gap-1">Balans: <CoinIcon size="xs" /><span className="font-bold text-white">{fmtCoins(user?.coins)}</span></span>
          <span>5 mina gizlenendir</span>
        </div>
      </div>
    </Layout>
  );
}
