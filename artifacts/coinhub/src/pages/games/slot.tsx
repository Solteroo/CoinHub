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
  "7": "#ef4444", "★": "#D4AF37", "♦": "#3b82f6", "♥": "#ec4899", "♣": "#10b981", "BAR": "#f97316",
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

  useEffect(() => { if (config?.minBet && bet < config.minBet) setBet(config.minBet); }, [config]);

  const handleSpin = async () => {
    if (spinning || !user || bet > user.coins || bet < (config?.minBet ?? 1)) return;
    setSpinning(true);
    setLastResult(null);
    playClick();
    const symbols = ["7", "★", "♦", "♥", "♣", "BAR"];
    const spinAnimations = reelControls.map((_, i) =>
      new Promise<void>((resolve) => {
        let count = 0;
        const id = setInterval(() => {
          setReels((prev) => { const next = [...prev]; next[i] = symbols[Math.floor(Math.random() * symbols.length)] ?? "★"; return next; });
          if (++count > 15 + i * 5) { clearInterval(id); resolve(); }
        }, 60 + i * 20);
      })
    );
    playSlot.mutate({ data: { bet } }, {
      onSuccess: async (result) => {
        await Promise.all(spinAnimations);
        setReels(result.symbols);
        setLastResult(result);
        setHistory((prev) => [result, ...prev].slice(0, 8));
        if (result.won > 0) {
          playWin();
          if (result.multiplier >= 30) confetti({ particleCount: 300, spread: 100, origin: { y: 0.4 }, colors: [ACCENT, "#D4AF37", "#fff"] });
          else confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 }, colors: [ACCENT, "#a78bfa"] });
          toast({ title: result.label, description: `+${result.won} ${COIN}` });
        } else { playLose(); }
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
        setSpinning(false);
      },
      onError: (err: any) => { setSpinning(false); toast({ title: t("error"), description: err.message, variant: "destructive" }); },
    });
  };

  return (
    <GameLayout title={t("game_slot_title")} emoji="🎰" accentColor={ACCENT}>
      <div
        className="flex-1 flex flex-col px-4 pt-4 gap-3"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))" }}
      >
        {/* Reels — fills remaining space */}
        <div
          className="flex-1 min-h-0 rounded-3xl border flex flex-col items-center justify-center gap-4 relative overflow-hidden"
          style={{ background: "rgba(124,58,237,0.07)", borderColor: "rgba(124,58,237,0.3)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 70% 50% at 50% 40%, ${ACCENT}15, transparent 70%)` }}
          />
          <div className="flex gap-3 z-10">
            {Array.from({ length: REEL_COUNT }, (_, i) => (
              <motion.div
                key={i}
                animate={reelControls[i]}
                className="w-24 h-24 rounded-2xl border-2 flex items-center justify-center shadow-2xl"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  borderColor: spinning ? `${ACCENT}90` : "rgba(255,255,255,0.1)",
                  boxShadow: spinning ? `0 0 30px ${ACCENT}50` : undefined,
                  fontSize: "52px",
                  lineHeight: 1,
                }}
              >
                <span style={{ color: SYMBOL_COLORS[reels[i] ?? "★"] ?? "#D4AF37" }}>{reels[i]}</span>
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "z-10 px-6 py-2 rounded-xl font-black text-sm uppercase tracking-wider border",
                  lastResult.won > 0 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-white/5 text-white/30 border-white/10",
                )}
              >
                {lastResult.won > 0 ? `${lastResult.label} · +${fmtCoins(lastResult.won)} ${COIN}` : "— " + t("no_win_desc")}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* History strip */}
        {history.length > 0 && (
          <div className="shrink-0 flex gap-2 overflow-x-auto no-scrollbar">
            {history.map((h, i) => (
              <div key={i} className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px]"
                style={{ background: h.won > 0 ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.04)", borderColor: h.won > 0 ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.07)" }}>
                <div className="flex gap-0.5">
                  {h.symbols.map((s: string, j: number) => <span key={j} className="font-black" style={{ color: SYMBOL_COLORS[s] ?? "#D4AF37" }}>{s}</span>)}
                </div>
                <span className={cn("font-black", h.won > 0 ? "text-emerald-400" : "text-white/30")}>
                  {h.won > 0 ? `+${h.won}` : "—"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Paytable compact */}
        <div className="shrink-0 rounded-2xl px-4 py-3 border" style={{ background: "rgba(124,58,237,0.06)", borderColor: "rgba(124,58,237,0.2)" }}>
          <div className="grid grid-cols-3 gap-x-3 gap-y-1">
            {[{ combo: "7-7-7", mult: "150×", color: "#ef4444" }, { combo: "★-★-★", mult: "30×", color: "#D4AF37" }, { combo: "♦-♦-♦", mult: "12×", color: "#3b82f6" },
              { combo: "♥-♥-♥", mult: "6×", color: "#ec4899" }, { combo: "♣-♣-♣", mult: "3.5×", color: "#10b981" }, { combo: "BAR×3", mult: "2.2×", color: "#f97316" },
            ].map(({ combo, mult, color }) => (
              <div key={combo} className="flex items-center justify-between text-[10px] font-bold">
                <span style={{ color }}>{combo}</span>
                <span className="text-white/60">{mult}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bet */}
        <div className="shrink-0">
          <BetSelector value={bet} onChange={setBet} min={config?.minBet ?? 1} max={user?.coins ?? 0} disabled={spinning} />
        </div>

        {/* Spin button */}
        <button
          onClick={handleSpin}
          disabled={spinning || !user || (user?.coins ?? 0) < bet}
          className="shrink-0 w-full h-16 rounded-2xl font-black text-xl uppercase tracking-widest disabled:opacity-35 active:scale-[0.98] transition-all"
          style={{
            background: !spinning ? `linear-gradient(135deg, ${ACCENT}, #5b21b6)` : "rgba(255,255,255,0.07)",
            boxShadow: !spinning ? `0 0 40px ${ACCENT}55, 0 0 90px ${ACCENT}20` : undefined,
            color: !spinning ? "#fff" : "rgba(255,255,255,0.3)",
          }}
        >
          {spinning ? `🎰 ${t("spinning")}` : `🎰 ${t("spin_btn")}`}
        </button>
      </div>
    </GameLayout>
  );
}
