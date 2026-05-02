import { GameLayout } from "@/components/layout/GameLayout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMe, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown } from "lucide-react";
import { BetSelector } from "@/components/BetSelector";
import { cn, fmtCoins } from "@/lib/utils";
import { COIN } from "@/lib/coin";
import confetti from "canvas-confetti";
import { useI18n } from "@/i18n";
import { playWin, playLose, playClick } from "@/lib/sounds";

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const ACCENT = "#10b981";

export default function DiceGame() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const [bet, setBet] = useState(10);
  const [choice, setChoice] = useState<"high" | "low" | null>(null);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [displayDice, setDisplayDice] = useState<[number, number] | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  const handleRoll = async () => {
    if (!choice || rolling || !user || bet > user.coins) return;
    setRolling(true);
    setResult(null);
    playClick();

    let ticks = 0;
    const interval = setInterval(() => {
      setDisplayDice([Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)]);
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
      if (!res.ok) { toast({ title: data.error ?? t("error"), variant: "destructive" }); return; }
      clearInterval(interval);
      setDisplayDice([data.dice1, data.dice2]);
      setResult(data);
      if (data.netChange > 0) {
        playWin();
        confetti({ particleCount: 80, spread: 55, origin: { y: 0.6 }, colors: ["#10b981", "#34d399"] });
      } else {
        playLose();
      }
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
    } catch {
      toast({ title: t("error"), variant: "destructive" });
    } finally {
      setRolling(false);
    }
  };

  return (
    <GameLayout title={t("game_dice_title")} emoji="🎲" accentColor={ACCENT}>
      <div className="flex flex-col items-center gap-5 px-4 pt-6">

        {/* Dice Display */}
        <div
          className="w-full rounded-3xl p-8 flex flex-col items-center gap-5 border"
          style={{ background: "rgba(16,185,129,0.05)", borderColor: "rgba(16,185,129,0.2)" }}
        >
          <div className="flex gap-8 items-center">
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                animate={rolling ? { rotate: [0, 180, 360], scale: [1, 0.8, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: rolling ? Infinity : 0, ease: "linear" }}
                className="w-24 h-24 rounded-2xl border-2 flex items-center justify-center text-6xl shadow-2xl select-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderColor: rolling ? ACCENT : "rgba(255,255,255,0.1)",
                  boxShadow: rolling ? `0 0 30px ${ACCENT}40` : undefined,
                }}
              >
                {displayDice ? DICE_FACES[(displayDice[i] ?? 1) - 1] : "?"}
              </motion.div>
            ))}
          </div>

          {displayDice && !rolling && (
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
              <p className="text-3xl font-black" style={{ color: ACCENT }}>
                {t("total_label")}: {displayDice[0] + displayDice[1]}
              </p>
            </motion.div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "px-8 py-3 rounded-2xl font-black text-lg uppercase tracking-wider border",
                  result.netChange > 0
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-red-500/20 text-red-400 border-red-500/40",
                )}
              >
                {result.netChange > 0 ? `+${fmtCoins(result.netChange)}` : fmtCoins(result.netChange)} {COIN}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Choice buttons */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={() => { setChoice("high"); playClick(); }}
            className={cn(
              "h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 font-black text-sm uppercase tracking-tight transition-all active:scale-[0.97]",
              choice === "high"
                ? "border-emerald-400 text-emerald-400"
                : "border-white/10 text-white/50 hover:border-emerald-400/50 hover:text-emerald-400/70",
            )}
            style={{
              background: choice === "high" ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.03)",
              boxShadow: choice === "high" ? "0 0 30px rgba(52,211,153,0.2)" : undefined,
            }}
          >
            <TrendingUp className="w-6 h-6" />
            <span>{t("dice_high")}</span>
            <span className="text-[10px] font-bold opacity-70">8-12 · 1.96×</span>
          </button>
          <button
            onClick={() => { setChoice("low"); playClick(); }}
            className={cn(
              "h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 font-black text-sm uppercase tracking-tight transition-all active:scale-[0.97]",
              choice === "low"
                ? "border-blue-400 text-blue-400"
                : "border-white/10 text-white/50 hover:border-blue-400/50 hover:text-blue-400/70",
            )}
            style={{
              background: choice === "low" ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.03)",
              boxShadow: choice === "low" ? "0 0 30px rgba(96,165,250,0.2)" : undefined,
            }}
          >
            <TrendingDown className="w-6 h-6" />
            <span>{t("dice_low")}</span>
            <span className="text-[10px] font-bold opacity-70">2-6 · 1.96×</span>
          </button>
        </div>

        {/* Bet selector */}
        <div className="w-full">
          <BetSelector value={bet} onChange={setBet} min={5} max={Math.min(10000, user?.coins ?? 10000)} />
        </div>

        {/* Roll button */}
        <button
          onClick={handleRoll}
          disabled={rolling || !choice || !user || bet > (user?.coins ?? 0)}
          className="w-full h-16 rounded-2xl font-black text-base uppercase tracking-widest disabled:opacity-40 active:scale-[0.98] transition-all text-black"
          style={{
            background: rolling || !choice
              ? "rgba(255,255,255,0.1)"
              : `linear-gradient(135deg, ${ACCENT}, #059669)`,
            boxShadow: !rolling && choice ? `0 0 30px ${ACCENT}50` : undefined,
            color: rolling || !choice ? "rgba(255,255,255,0.4)" : "#000",
          }}
        >
          {rolling ? "⚀ ⚁ ⚂..." : choice ? `${choice === "high" ? "▲ " + t("dice_high") : "▼ " + t("dice_low")} — ${t("roll_btn") || "ROLL"}` : t("choose_side")}
        </button>
      </div>
    </GameLayout>
  );
}
