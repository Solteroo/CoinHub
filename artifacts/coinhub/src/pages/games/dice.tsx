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
      if (++ticks >= 14) clearInterval(interval);
    }, 75);
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
        confetti({ particleCount: 100, spread: 60, origin: { y: 0.5 }, colors: ["#10b981", "#34d399"] });
      } else { playLose(); }
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
    } catch { toast({ title: t("error"), variant: "destructive" }); }
    finally { setRolling(false); }
  };

  return (
    <GameLayout title={t("game_dice_title")} emoji="🎲" accentColor={ACCENT}>
      <div
        className="flex-1 flex flex-col px-4 pt-4 gap-3"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))" }}
      >
        {/* Dice visual — fills remaining space */}
        <div
          className="flex-1 min-h-0 rounded-3xl flex flex-col items-center justify-center gap-4 border relative overflow-hidden"
          style={{ background: "rgba(16,185,129,0.04)", borderColor: "rgba(16,185,129,0.18)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${ACCENT}10, transparent 70%)` }}
          />
          <div className="flex gap-7 items-center">
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                animate={rolling ? { rotate: [0, 180, 360], scale: [1, 0.85, 1.1, 1] } : {}}
                transition={{ duration: 0.4, repeat: rolling ? Infinity : 0, ease: "linear" }}
                className="w-28 h-28 rounded-3xl border-2 flex items-center justify-center select-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderColor: rolling ? `${ACCENT}80` : "rgba(255,255,255,0.1)",
                  boxShadow: rolling ? `0 0 40px ${ACCENT}40` : displayDice ? `0 0 20px ${ACCENT}20` : undefined,
                  fontSize: "72px",
                  lineHeight: 1,
                }}
              >
                {displayDice ? DICE_FACES[(displayDice[i] ?? 1) - 1] : "?"}
              </motion.div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {displayDice && !rolling && (
              <motion.p
                key={displayDice[0] + displayDice[1]}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-black tabular-nums"
                style={{ color: ACCENT, textShadow: `0 0 20px ${ACCENT}60` }}
              >
                {displayDice[0] + displayDice[1]}
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className={cn(
                  "px-8 py-2.5 rounded-2xl font-black text-lg uppercase tracking-wider border",
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

        {/* HIGH / LOW buttons */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          {([
            { id: "high", icon: TrendingUp, label: t("dice_high"), range: "8–12", color: "#34d399", bg: "rgba(52,211,153,0.12)" },
            { id: "low",  icon: TrendingDown, label: t("dice_low"),  range: "2–6",  color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
          ] as const).map(({ id, icon: Icon, label, range, color, bg }) => (
            <button
              key={id}
              onClick={() => { setChoice(id); playClick(); }}
              className="h-16 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-black text-sm uppercase tracking-tight transition-all active:scale-[0.97]"
              style={{
                background: choice === id ? bg : "rgba(255,255,255,0.03)",
                borderColor: choice === id ? color : "rgba(255,255,255,0.08)",
                color: choice === id ? color : "rgba(255,255,255,0.45)",
                boxShadow: choice === id ? `0 0 24px ${color}35` : undefined,
              }}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <div className="text-left">
                <div>{label}</div>
                <div className="text-[9px] font-bold opacity-60">{range} · 1.96×</div>
              </div>
            </button>
          ))}
        </div>

        {/* Bet */}
        <div className="shrink-0">
          <BetSelector value={bet} onChange={setBet} min={5} max={Math.min(10000, user?.coins ?? 10000)} />
        </div>

        {/* PLAY button */}
        <button
          onClick={handleRoll}
          disabled={rolling || !choice || !user || bet > (user?.coins ?? 0)}
          className="shrink-0 w-full h-16 rounded-2xl font-black text-base uppercase tracking-widest disabled:opacity-35 active:scale-[0.98] transition-all"
          style={{
            background: !rolling && choice ? `linear-gradient(135deg, ${ACCENT}, #059669)` : "rgba(255,255,255,0.08)",
            boxShadow: !rolling && choice ? `0 0 36px ${ACCENT}55, 0 0 80px ${ACCENT}18` : undefined,
            color: !rolling && choice ? "#000" : "rgba(255,255,255,0.35)",
          }}
        >
          {rolling ? "⚀ ⚁ ⚂..." : choice ? `${choice === "high" ? "▲ " + t("dice_high") : "▼ " + t("dice_low")} — ${t("roll_btn") || "ROLL"}` : t("choose_side")}
        </button>
      </div>
    </GameLayout>
  );
}
