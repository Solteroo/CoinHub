import { GameLayout } from "@/components/layout/GameLayout";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  usePlayCrash,
  useGetMe,
  getGetMeQueryKey,
  getGetMyTransactionsQueryKey,
  getGetMyStatsQueryKey,
  getGetLeaderboardQueryKey,
} from "@workspace/api-client-react";
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
  const rocketRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rocketPos, setRocketPos] = useState({ x: 10, y: 80 });

  const playCrash = usePlayCrash();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  const handleStart = async () => {
    if (playing || !user || bet > user.coins || bet < 10) return;
    setPlaying(true);
    setStatus("running");
    setMultiplier(1.0);
    setRocketPos({ x: 10, y: 80 });
    playClick();

    playCrash.mutate({ data: { bet, autoCashout } }, {
      onSuccess: async (res) => {
        const target = Math.min(res.crashAt, res.autoCashout);
        const DURATION_MS = 800 + Math.log(target) * 1500;
        const startTime = Date.now();

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const t = Math.min(1, elapsed / DURATION_MS);
          const currentM = 1 + (target - 1) * Math.pow(t, 0.7);
          setMultiplier(currentM);
          setRocketPos({
            x: 10 + t * 75,
            y: 80 - t * 70,
          });
          if (t < 1) {
            requestAnimationFrame(animate);
          } else {
            finalizeGame(res);
          }
        };
        requestAnimationFrame(animate);
      },
      onError: (err: any) => {
        setPlaying(false);
        setStatus("idle");
        toast({ title: t("error"), description: err.message, variant: "destructive" });
      },
    });
  };

  const finalizeGame = (res: any) => {
    setHistory(prev => [res, ...prev].slice(0, 6));

    if (res.cashedOut) {
      setStatus("cashed");
      setMultiplier(res.autoCashout);
      playWin();
      if (res.multiplier >= 5) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: [ACCENT, "#fca5a5"] });
      toast({ title: `🚀 ${t("hot_win")}`, description: `+${res.netChange} ${COIN}` });
    } else {
      setStatus("crashed");
      setMultiplier(res.crashAt);
      playLose();
      toast({ title: `💥 ${t("crashed_toast")}`, description: `-${res.bet} ${COIN}`, variant: "destructive" });
    }

    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
    setPlaying(false);
  };

  return (
    <GameLayout title={t("game_crash_title")} emoji="🚀" accentColor={ACCENT}>
      <div className="flex flex-col gap-4 px-4 pt-4">

        {/* Crash visual */}
        <div
          className="w-full rounded-3xl relative overflow-hidden border"
          style={{
            height: "200px",
            background: "linear-gradient(180deg, #0a0015 0%, #12001f 100%)",
            borderColor: status === "crashed" ? "rgba(239,68,68,0.4)" : status === "cashed" ? "rgba(52,211,153,0.4)" : "rgba(239,68,68,0.2)",
            boxShadow: status === "crashed" ? "0 0 30px rgba(239,68,68,0.2)" : status === "cashed" ? "0 0 30px rgba(52,211,153,0.2)" : undefined,
          }}
        >
          {/* Grid lines */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "linear-gradient(to right, #ef4444 1px, transparent 1px), linear-gradient(to bottom, #ef4444 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Multiplier display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              key={status}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "text-7xl font-black tabular-nums",
                status === "running" ? "text-white" :
                status === "cashed" ? "text-emerald-400" :
                status === "crashed" ? "text-red-400" : "text-white/30",
              )}
              style={{
                textShadow: status === "running"
                  ? `0 0 30px rgba(239,68,68,0.5)`
                  : status === "cashed" ? "0 0 30px rgba(52,211,153,0.5)"
                  : status === "crashed" ? "0 0 30px rgba(239,68,68,0.4)"
                  : undefined,
              }}
            >
              {multiplier.toFixed(2)}×
            </motion.div>
          </div>

          {/* Status label */}
          {(status === "cashed" || status === "crashed") && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn(
                "absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2 rounded-xl font-black text-sm uppercase tracking-widest border",
                status === "cashed" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-red-500/20 text-red-400 border-red-500/40",
              )}
            >
              {status === "cashed" ? `✓ ${t("you_won")}` : `💥 ${t("crashed_label")}`}
            </motion.div>
          )}

          {/* Rocket */}
          <motion.div
            className="absolute"
            style={{
              left: `${rocketPos.x}%`,
              top: `${rocketPos.y}%`,
              transition: status === "running" ? "none" : undefined,
            }}
          >
            <Rocket
              className={cn(
                "w-10 h-10 transition-colors",
                status === "running" ? "text-white" :
                status === "cashed" ? "text-emerald-400" :
                status === "crashed" ? "text-red-400 rotate-180" : "text-white/20",
              )}
              style={{
                filter: status === "running" ? "drop-shadow(0 0 8px rgba(255,255,255,0.8))" : undefined,
                transform: status === "crashed" ? "rotate(135deg)" : status === "running" ? "rotate(-45deg)" : undefined,
              }}
            />
            {status === "running" && (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-12 rounded-full blur-sm opacity-60"
                style={{ background: "linear-gradient(to top, transparent, #f97316, #ef4444)" }}
              />
            )}
          </motion.div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {history.map((h, i) => (
              <div
                key={i}
                className="shrink-0 px-3 py-1.5 rounded-xl border text-xs font-black tabular-nums"
                style={{
                  background: h.cashedOut ? "rgba(52,211,153,0.12)" : "rgba(239,68,68,0.12)",
                  borderColor: h.cashedOut ? "rgba(52,211,153,0.3)" : "rgba(239,68,68,0.3)",
                  color: h.cashedOut ? "#34d399" : "#f87171",
                }}
              >
                {h.cashedOut ? h.autoCashout.toFixed(2) : h.crashAt.toFixed(2)}×
              </div>
            ))}
          </div>
        )}

        {/* Auto cashout */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">{t("auto_cashout")}</p>
          <div className="flex gap-2 flex-wrap">
            <Input
              type="number" step="0.1" min="1.1" max="50"
              value={autoCashout}
              onChange={e => setAutoCashout(Math.min(50, Math.max(1.1, parseFloat(e.target.value) || 1.1)))}
              disabled={playing}
              className="w-20 h-10 bg-white/5 border-white/10 font-black text-center text-white"
            />
            <div className="flex gap-1.5 flex-wrap">
              {QUICK_CASHOUTS.map(val => (
                <button
                  key={val}
                  onClick={() => setAutoCashout(val)}
                  disabled={playing}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all"
                  style={{
                    background: autoCashout === val ? `${ACCENT}20` : "rgba(255,255,255,0.04)",
                    borderColor: autoCashout === val ? `${ACCENT}60` : "rgba(255,255,255,0.08)",
                    color: autoCashout === val ? ACCENT : "rgba(255,255,255,0.5)",
                  }}
                >
                  {val}×
                </button>
              ))}
            </div>
          </div>
        </div>

        <BetSelector value={bet} onChange={setBet} min={10} max={user?.coins ?? 0} disabled={playing} />

        <button
          onClick={handleStart}
          disabled={playing || !user || user.coins < bet}
          className="w-full h-16 rounded-2xl font-black text-xl uppercase tracking-widest disabled:opacity-40 active:scale-[0.98] transition-all"
          style={{
            background: !playing ? `linear-gradient(135deg, ${ACCENT}, #b91c1c)` : "rgba(255,255,255,0.07)",
            boxShadow: !playing ? `0 0 40px ${ACCENT}40` : undefined,
            color: !playing ? "#fff" : "rgba(255,255,255,0.3)",
          }}
        >
          {playing ? `🚀 ${t("in_flight")}` : t("start_btn")}
        </button>
      </div>
    </GameLayout>
  );
}
