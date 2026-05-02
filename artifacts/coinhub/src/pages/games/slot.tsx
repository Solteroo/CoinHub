import { GameLayout } from "@/components/layout/GameLayout";
import { useState, useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { usePlaySlot, useGetGamesConfig, useGetMe, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BetSelector } from "@/components/BetSelector";
import confetti from "canvas-confetti";
import { cn, fmtCoins } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { COIN } from "@/lib/coin";
import { playWin, playLose, playClick } from "@/lib/sounds";

const REEL_COUNT = 3;
const ACCENT = "#7c3aed";

const SYMBOL_COLORS: Record<string, string> = {
  "7": "#ef4444",
  "★": "#D4AF37",
  "♦": "#3b82f6",
  "♥": "#ec4899",
  "♣": "#10b981",
  "BAR": "#f97316",
};

export default function SlotGame() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: config } = useGetGamesConfig();
  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState<string[]>(["★", "★", "★"]);
  const [history, setHistory] = useState<any[]>([]);
  const [lastResult, setLastResult] = useState<any>(null);
  const { t } = useI18n();

  const playSlot = usePlaySlot();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reelControls = [useAnimation(), useAnimation(), useAnimation()];

  useEffect(() => {
    if (config?.minBet && bet < config.minBet) setBet(config.minBet);
  }, [config]);

  const handleSpin = async () => {
    if (spinning || !user || bet > user.coins || bet < (config?.minBet ?? 1)) return;
    setSpinning(true);
    setLastResult(null);
    playClick();

    reelControls.forEach((ctrl, i) => {
      ctrl.start({
        y: [0, -80, -160, -80, 0],
        transition: { duration: 0.15, repeat: Infinity, ease: "linear", delay: i * 0.05 },
      });
    });

    playSlot.mutate({ data: { bet } }, {
      onSuccess: async (result) => {
        await new Promise(r => setTimeout(r, 800));

        for (let i = 0; i < REEL_COUNT; i++) {
          await new Promise(r => setTimeout(r, 250));
          await reelControls[i].start({
            y: [null, -40, 0],
            transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
          });
          setReels(prev => {
            const next = [...prev];
            next[i] = result.symbols[i];
            return next;
          });
        }

        setLastResult(result);

        if (result.won > 0) {
          playWin();
          if (result.outcome === "jackpot") {
            confetti({ particleCount: 250, spread: 80, origin: { y: 0.5 }, colors: ["#7c3aed", "#D4AF37", "#ffffff"] });
          } else if (result.multiplier >= 10) {
            confetti({ particleCount: 120, spread: 60, origin: { y: 0.6 } });
          }
          toast({ title: `🎰 ${result.label}`, description: `+${result.won} ${COIN} · ${result.multiplier}×` });
        } else {
          playLose();
        }

        setHistory(prev => [result, ...prev].slice(0, 5));
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
        setSpinning(false);
      },
      onError: (err: any) => {
        reelControls.forEach(c => c.stop());
        setSpinning(false);
        toast({ title: t("error"), description: err.message, variant: "destructive" });
      },
    });
  };

  return (
    <GameLayout title={t("game_slot_title")} emoji="🎰" accentColor={ACCENT}>
      <div className="flex flex-col items-center gap-5 px-4 pt-5">

        {/* Slot machine cabinet */}
        <div
          className="w-full max-w-xs rounded-3xl overflow-hidden border-2 relative"
          style={{
            background: "linear-gradient(180deg, #1a0a2e 0%, #0d0618 100%)",
            borderColor: `${ACCENT}60`,
            boxShadow: `0 0 50px ${ACCENT}25, inset 0 0 30px rgba(0,0,0,0.5)`,
          }}
        >
          {/* Top shine */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-10" />

          {/* Reels area */}
          <div className="flex gap-2 p-5 pb-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex-1 aspect-square rounded-xl border relative overflow-hidden flex items-center justify-center"
                style={{
                  background: "rgba(0,0,0,0.6)",
                  borderColor: spinning ? `${ACCENT}80` : "rgba(255,255,255,0.1)",
                  boxShadow: spinning ? `0 0 20px ${ACCENT}40` : undefined,
                }}
              >
                {/* Scanline overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 pointer-events-none z-10" />
                <motion.div
                  animate={reelControls[i]}
                  className="flex items-center justify-center w-full h-full"
                >
                  <span
                    className="text-5xl font-black leading-none select-none"
                    style={{
                      color: SYMBOL_COLORS[reels[i]] ?? "#D4AF37",
                      textShadow: `0 0 15px ${SYMBOL_COLORS[reels[i]] ?? "#D4AF37"}80`,
                      filter: spinning ? "blur(1px)" : "none",
                    }}
                  >
                    {reels[i]}
                  </span>
                </motion.div>
              </div>
            ))}
          </div>

          {/* Win line indicator */}
          <div className="px-5 pb-5">
            <AnimatePresence>
              {lastResult && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className={cn(
                    "text-center py-3 rounded-xl font-black text-base uppercase tracking-wider",
                    lastResult.won > 0
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-white/5 text-white/30 border border-white/10",
                  )}
                >
                  {lastResult.won > 0
                    ? `${lastResult.label} · +${fmtCoins(lastResult.won)} ${COIN}`
                    : "— " + t("no_win_desc")}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* History strip */}
        {history.length > 0 && (
          <div className="w-full flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {history.map((h, i) => (
              <div
                key={i}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border"
                style={{
                  background: h.won > 0 ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.04)",
                  borderColor: h.won > 0 ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex gap-0.5">
                  {h.symbols.map((s: string, j: number) => (
                    <span key={j} className="text-sm font-black" style={{ color: SYMBOL_COLORS[s] ?? "#D4AF37" }}>{s}</span>
                  ))}
                </div>
                <span className={cn("text-[10px] font-black", h.won > 0 ? "text-emerald-400" : "text-white/30")}>
                  {h.won > 0 ? `+${h.won}` : "—"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Paytable */}
        <div
          className="w-full rounded-2xl p-4 border"
          style={{ background: "rgba(124,58,237,0.06)", borderColor: "rgba(124,58,237,0.2)" }}
        >
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-3">Paytable</p>
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
            {[
              { combo: "7-7-7", mult: "150×", color: "#ef4444" },
              { combo: "★-★-★", mult: "30×", color: "#D4AF37" },
              { combo: "♦-♦-♦", mult: "12×", color: "#3b82f6" },
              { combo: "♥-♥-♥", mult: "6×", color: "#ec4899" },
              { combo: "♣-♣-♣", mult: "3.5×", color: "#10b981" },
              { combo: "BAR-BAR-BAR", mult: "2.2×", color: "#f97316" },
            ].map(({ combo, mult, color }) => (
              <div key={combo} className="flex items-center justify-between text-[11px] font-bold">
                <span style={{ color }}>{combo}</span>
                <span className="text-white/70">{mult}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bet selector */}
        <div className="w-full">
          <BetSelector value={bet} onChange={setBet} min={config?.minBet ?? 1} max={user?.coins ?? 0} disabled={spinning} />
        </div>

        {/* Spin button */}
        <button
          onClick={handleSpin}
          disabled={spinning || !user || user.coins < bet}
          className="w-full h-16 rounded-2xl font-black text-xl uppercase tracking-widest disabled:opacity-40 active:scale-[0.98] transition-all"
          style={{
            background: !spinning ? `linear-gradient(135deg, ${ACCENT}, #5b21b6)` : "rgba(255,255,255,0.07)",
            boxShadow: !spinning ? `0 0 40px ${ACCENT}50, 0 4px 20px rgba(0,0,0,0.5)` : undefined,
            color: !spinning ? "#fff" : "rgba(255,255,255,0.3)",
          }}
        >
          {spinning ? `🎰 ${t("spinning")}` : `🎰 ${t("spin_btn")}`}
        </button>
      </div>
    </GameLayout>
  );
}
