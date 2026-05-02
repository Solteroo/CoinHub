import { GameLayout } from "@/components/layout/GameLayout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayCrash, useGetMe, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Rocket } from "lucide-react";
import { BetSelector } from "@/components/BetSelector";
import { Input } from "@/components/ui/input";
import { cn, fmtCoins } from "@/lib/utils";
import { COIN } from "@/lib/coin";
import confetti from "canvas-confetti";
import { useI18n } from "@/i18n";
import { playWin, playLose, playClick } from "@/lib/sounds";

const ACCENT = "#ef4444";
const QUICK_CASHOUTS = [1.5, 2.0, 3.0, 5.0, 10.0, 25.0];

export default function CrashGame() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const [bet, setBet] = useState(10);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [playing, setPlaying] = useState(false);
  const [multiplier, setMultiplier] = useState(1.0);
  const [history, setHistory] = useState<any[]>([]);
  const [status, setStatus] = useState<"idle" | "running" | "crashed" | "cashed">("idle");
  const [rocketPos, setRocketPos] = useState({ x: 10, y: 80 });
  const playCrash = usePlayCrash();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  const finalizeGame = (res: any) => {
    setHistory(prev => [res, ...prev].slice(0, 6));
    if (res.cashedOut) {
      setStatus("cashed"); setMultiplier(res.autoCashout); playWin();
      if (res.multiplier >= 5) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: [ACCENT, "#fca5a5"] });
      toast({ title: `🚀 ${t("hot_win")}`, description: `+${res.netChange} ${COIN}` });
    } else {
      setStatus("crashed"); setMultiplier(res.crashAt); playLose();
      toast({ title: `💥 ${t("crashed_toast")}`, description: `-${res.bet} ${COIN}`, variant: "destructive" });
    }
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
    setPlaying(false);
  };

  const handleStart = () => {
    if (playing || !user || bet > user.coins || bet < 10) return;
    setPlaying(true); setStatus("running"); setMultiplier(1.0); setRocketPos({ x: 10, y: 80 }); playClick();
    playCrash.mutate({ data: { bet, autoCashout } }, {
      onSuccess: (res) => {
        const target = Math.min(res.crashAt, res.autoCashout);
        const DURATION_MS = 800 + Math.log(target) * 1500;
        const startTime = Date.now();
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const t = Math.min(1, elapsed / DURATION_MS);
          setMultiplier(1 + (target - 1) * Math.pow(t, 0.7));
          setRocketPos({ x: 10 + t * 75, y: 80 - t * 70 });
          if (t < 1) requestAnimationFrame(animate); else finalizeGame(res);
        };
        requestAnimationFrame(animate);
      },
      onError: (err: any) => { setPlaying(false); setStatus("idle"); toast({ title: t("error"), description: err.message, variant: "destructive" }); },
    });
  };

  return (
    <GameLayout title={t("game_crash_title")} emoji="🚀" accentColor={ACCENT}>
      <div
        className="flex-1 flex flex-col px-4 pt-4 gap-3"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))" }}
      >
        {/* Crash chart — fills remaining space */}
        <div
          className="flex-1 min-h-0 rounded-3xl relative overflow-hidden border"
          style={{
            background: "linear-gradient(180deg, #0a0015 0%, #12001f 100%)",
            borderColor: status === "crashed" ? "rgba(239,68,68,0.5)" : status === "cashed" ? "rgba(52,211,153,0.5)" : "rgba(239,68,68,0.2)",
            boxShadow: status === "crashed" ? "0 0 30px rgba(239,68,68,0.15)" : status === "cashed" ? "0 0 30px rgba(52,211,153,0.15)" : undefined,
          }}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(to right, #ef4444 1px, transparent 1px), linear-gradient(to bottom, #ef4444 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              key={status}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn("font-black tabular-nums", status === "running" ? "text-white text-8xl" : status === "cashed" ? "text-emerald-400 text-7xl" : status === "crashed" ? "text-red-400 text-7xl" : "text-white/20 text-7xl")}
              style={{ textShadow: status === "running" ? `0 0 40px rgba(239,68,68,0.6)` : status === "cashed" ? "0 0 40px rgba(52,211,153,0.6)" : status === "crashed" ? "0 0 40px rgba(239,68,68,0.5)" : undefined }}
            >
              {multiplier.toFixed(2)}×
            </motion.div>
          </div>

          {(status === "cashed" || status === "crashed") && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className={cn("absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2 rounded-xl font-black text-sm uppercase tracking-widest border",
                status === "cashed" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-red-500/20 text-red-400 border-red-500/40"
              )}>
              {status === "cashed" ? `✓ ${t("you_won")}` : `💥 ${t("crashed_label")}`}
            </motion.div>
          )}

          <motion.div className="absolute" style={{ left: `${rocketPos.x}%`, top: `${rocketPos.y}%` }}>
            <Rocket
              className={cn("w-10 h-10", status === "running" ? "text-white" : status === "cashed" ? "text-emerald-400" : "text-white/20")}
              style={{
                filter: status === "running" ? "drop-shadow(0 0 10px rgba(255,255,255,0.9))" : undefined,
                transform: status === "crashed" ? "rotate(135deg)" : status === "running" ? "rotate(-45deg)" : undefined,
              }}
            />
            {status === "running" && <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-12 rounded-full blur-sm opacity-60" style={{ background: "linear-gradient(to top, transparent, #f97316, #ef4444)" }} />}
          </motion.div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="shrink-0 flex gap-2 overflow-x-auto no-scrollbar">
            {history.map((h, i) => (
              <div key={i} className="shrink-0 px-3 py-1.5 rounded-xl border text-xs font-black tabular-nums"
                style={{ background: h.cashedOut ? "rgba(52,211,153,0.12)" : "rgba(239,68,68,0.12)", borderColor: h.cashedOut ? "rgba(52,211,153,0.3)" : "rgba(239,68,68,0.3)", color: h.cashedOut ? "#34d399" : "#f87171" }}>
                {h.cashedOut ? h.autoCashout.toFixed(2) : h.crashAt.toFixed(2)}×
              </div>
            ))}
          </div>
        )}

        {/* Auto cashout */}
        <div className="shrink-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">{t("auto_cashout")}</p>
          <div className="flex gap-2 items-center flex-wrap">
            <Input
              type="number" step="0.1" min="1.1" max="50" value={autoCashout}
              onChange={e => setAutoCashout(Math.min(50, Math.max(1.1, parseFloat(e.target.value) || 1.1)))}
              disabled={playing}
              className="w-20 h-9 bg-white/5 border-white/10 font-black text-center text-white text-sm"
            />
            <div className="flex gap-1.5 flex-wrap">
              {QUICK_CASHOUTS.map(val => (
                <button key={val} onClick={() => setAutoCashout(val)} disabled={playing}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-black border transition-all"
                  style={{ background: autoCashout === val ? `${ACCENT}20` : "rgba(255,255,255,0.04)", borderColor: autoCashout === val ? `${ACCENT}60` : "rgba(255,255,255,0.08)", color: autoCashout === val ? ACCENT : "rgba(255,255,255,0.5)" }}>
                  {val}×
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bet */}
        <div className="shrink-0">
          <BetSelector value={bet} onChange={setBet} min={10} max={user?.coins ?? 0} disabled={playing} />
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={playing || !user || (user?.coins ?? 0) < bet}
          className="shrink-0 w-full h-16 rounded-2xl font-black text-xl uppercase tracking-widest disabled:opacity-35 active:scale-[0.98] transition-all"
          style={{
            background: !playing ? `linear-gradient(135deg, ${ACCENT}, #b91c1c)` : "rgba(255,255,255,0.07)",
            boxShadow: !playing ? `0 0 40px ${ACCENT}50, 0 0 90px ${ACCENT}18` : undefined,
            color: !playing ? "#fff" : "rgba(255,255,255,0.3)",
          }}
        >
          {playing ? `🚀 ${t("in_flight")}` : t("start_btn")}
        </button>
      </div>
    </GameLayout>
  );
}
