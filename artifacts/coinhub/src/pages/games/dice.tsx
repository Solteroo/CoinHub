import { GameLayout } from "@/components/layout/GameLayout";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMe, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown } from "lucide-react";
import { BetSelector } from "@/components/BetSelector";
import { PixiDice } from "@/components/games/PixiDice";
import { ResultOverlay } from "@/components/games/ResultOverlay";
import confetti from "canvas-confetti";
import { useI18n } from "@/i18n";
import { playWin, playLose, playClick } from "@/lib/sounds";

const ACCENT = "#10b981";

export default function DiceGame() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const [bet, setBet] = useState(10);
  const [choice, setChoice] = useState<"high" | "low" | null>(null);
  const [rolling, setRolling] = useState(false);
  const [finalDice, setFinalDice] = useState<[number, number] | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);
  const resultRef = useRef<any>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  const handleRoll = async () => {
    if (!choice || rolling || !user || bet > user.coins) return;
    setRolling(true);
    setFinalDice(null);
    setShowResult(false);
    resultRef.current = null;
    playClick();

    try {
      const res = await fetch("/api/games/dice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet, choice }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error ?? t("error"), variant: "destructive" }); setRolling(false); return; }
      resultRef.current = data;
      setFinalDice([data.dice1, data.dice2]);
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
    } catch {
      toast({ title: t("error"), variant: "destructive" });
      setRolling(false);
    }
  };

  const handleRolled = () => {
    setRolling(false);
    const r = resultRef.current;
    if (!r) return;
    setResult(r);
    setShowResult(true);
    if (r.netChange > 0) {
      playWin();
      confetti({ particleCount: 120, spread: 65, origin: { y: 0.5 }, colors: ["#10b981", "#34d399"] });
    } else {
      playLose();
    }
  };

  return (
    <GameLayout title={t("game_dice_title")} emoji="🎲" accentColor={ACCENT}>
      <div
        className="flex-1 flex flex-col px-4 gap-3"
        style={{ paddingTop: "16px", paddingBottom: "max(52px, env(safe-area-inset-bottom, 52px))" }}
      >
        {/* PixiJS GPU Dice */}
        <div
          className="w-full rounded-3xl overflow-hidden shrink-0"
          style={{
            height: "clamp(160px, 25vh, 220px)",
            background: "rgba(16,185,129,0.04)",
            border: "1px solid rgba(16,185,129,0.2)",
            boxShadow: `0 0 60px rgba(16,185,129,0.15)`,
          }}
        >
          <PixiDice
            rolling={rolling}
            finalDice={finalDice}
            onRolled={handleRolled}
            accentColor={0x10b981}
          />
        </div>

        {/* HIGH / LOW buttons */}
        <div className="shrink-0 grid grid-cols-2 gap-3">
          {([
            { id: "high", icon: TrendingUp, label: t("dice_high"), range: "7–12", mult: "1.60×", color: "#34d399", bg: "rgba(52,211,153,0.12)" },
            { id: "low",  icon: TrendingDown, label: t("dice_low"),  range: "2–6",  mult: "2.15×", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
          ] as const).map(({ id, icon: Icon, label, range, mult, color, bg }) => (
            <button
              key={id}
              onClick={() => { setChoice(id); playClick(); }}
              disabled={rolling}
              className="h-16 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-black text-sm uppercase tracking-tight transition-all active:scale-[0.97] disabled:opacity-40"
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
                <div className="text-[9px] font-bold opacity-60">{range} · {mult}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Bet */}
        <div className="shrink-0">
          <BetSelector value={bet} onChange={setBet} min={5} max={Math.min(10000, user?.coins ?? 10000)} disabled={rolling} />
        </div>

        {/* ROLL button */}
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
          {rolling ? "🎲 ..." : choice ? `${choice === "high" ? "▲ " + t("dice_high") : "▼ " + t("dice_low")} — ${t("roll_btn") || "ROLL"}` : t("choose_side")}
        </button>
      </div>

      <ResultOverlay
        show={showResult}
        won={(result?.netChange ?? 0) > 0}
        amount={Math.abs(result?.netChange ?? 0)}
        onDismiss={() => setShowResult(false)}
      />
    </GameLayout>
  );
}
