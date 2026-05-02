import { GameLayout } from "@/components/layout/GameLayout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMe, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowUp, ArrowDown } from "lucide-react";
import { BetSelector } from "@/components/BetSelector";
import { cn, fmtCoins } from "@/lib/utils";
import { COIN } from "@/lib/coin";
import confetti from "canvas-confetti";
import { useI18n } from "@/i18n";
import { playWin, playLose, playClick } from "@/lib/sounds";

const CARD_NAMES = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = ["♠", "♥", "♦", "♣"];
const ACCENT = "#eab308";

export default function HiLoGame() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const [bet, setBet] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [suit] = useState(() => SUITS[Math.floor(Math.random() * 4)] ?? "♠");
  const [flipped, setFlipped] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  const isRed = suit === "♥" || suit === "♦";

  const handlePlay = async (choice: "high" | "low") => {
    if (loading || !user || bet > user.coins) return;
    setLoading(true);
    setResult(null);
    setFlipped(false);
    playClick();

    try {
      const res = await fetch("/api/games/hilo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet, choice }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error ?? t("error"), variant: "destructive" }); return; }
      await new Promise((r) => setTimeout(r, 200));
      setFlipped(true);
      await new Promise((r) => setTimeout(r, 400));
      setResult(data);
      if (data.netChange > 0) {
        playWin();
        confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 }, colors: [ACCENT, "#fde047"] });
      } else {
        playLose();
      }
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
    } catch {
      toast({ title: t("error"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setFlipped(false); };

  const actionBtns = !result ? (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => handlePlay("high")}
        disabled={loading || !user || bet > (user?.coins ?? 0)}
        className="h-16 rounded-2xl font-black text-sm uppercase tracking-tight flex flex-col items-center justify-center gap-1.5 active:scale-[0.97] disabled:opacity-40 transition-all border-2"
        style={{
          background: `${ACCENT}18`,
          borderColor: `${ACCENT}60`,
          color: ACCENT,
          boxShadow: `0 0 25px ${ACCENT}30`,
        }}
      >
        <ArrowUp className="w-5 h-5" />
        HI (8–K) · 1.85×
      </button>
      <button
        onClick={() => handlePlay("low")}
        disabled={loading || !user || bet > (user?.coins ?? 0)}
        className="h-16 rounded-2xl font-black text-sm uppercase tracking-tight flex flex-col items-center justify-center gap-1.5 active:scale-[0.97] disabled:opacity-40 transition-all border-2"
        style={{
          background: "rgba(96,165,250,0.15)",
          borderColor: "rgba(96,165,250,0.5)",
          color: "#60a5fa",
          boxShadow: "0 0 25px rgba(96,165,250,0.2)",
        }}
      >
        <ArrowDown className="w-5 h-5" />
        LO (A–6) · 1.85×
      </button>
    </div>
  ) : (
    <button
      onClick={reset}
      className="w-full h-16 rounded-2xl font-black text-base uppercase tracking-widest active:scale-[0.98] transition-all"
      style={{
        background: `linear-gradient(135deg, ${ACCENT}, #ca8a04)`,
        boxShadow: `0 0 30px ${ACCENT}50`,
        color: "#000",
      }}
    >
      {t("play_again")}
    </button>
  );

  return (
    <GameLayout title={t("game_hilo_title")} emoji="🃏" accentColor={ACCENT} bottomAction={actionBtns}>
      <div className="flex flex-col gap-5 px-4 pt-5 pb-4 items-center">

        <div className="w-full flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotateY: flipped ? 0 : 90 }}
            transition={{ duration: 0.35 }}
            className="w-36 h-48 rounded-2xl border-2 flex flex-col items-center justify-center shadow-2xl"
            style={{
              background: result !== null ? "#fff" : "rgba(255,255,255,0.06)",
              borderColor: result !== null
                ? (result.netChange > 0 ? "#22c55e" : "#ef4444")
                : "rgba(255,255,255,0.15)",
              boxShadow: result !== null
                ? (result.netChange > 0 ? "0 0 40px rgba(34,197,94,0.4)" : "0 0 40px rgba(239,68,68,0.3)")
                : `0 0 30px ${ACCENT}30`,
            }}
          >
            {result !== null ? (
              <div className={cn("text-center", isRed ? "text-red-600" : "text-gray-900")}>
                <div className="text-6xl font-black leading-none">{CARD_NAMES[result.card]}</div>
                <div className="text-4xl leading-none mt-2">{suit}</div>
              </div>
            ) : (
              <div className="text-5xl opacity-20 font-black" style={{ color: ACCENT }}>?</div>
            )}
          </motion.div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ y: 10, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                className={cn(
                  "px-8 py-3 rounded-2xl font-black text-xl uppercase tracking-wider border",
                  result.netChange > 0
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-red-500/20 text-red-400 border-red-500/40",
                )}
              >
                {CARD_NAMES[result.card]} {suit} · {result.netChange > 0 ? "+" : ""}{fmtCoins(result.netChange)} {COIN}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-full flex gap-1 overflow-x-auto pb-1 no-scrollbar">
          {CARD_NAMES.slice(1).map((name, i) => {
            const val = i + 1;
            const isHigh = val >= 8;
            const isLow = val <= 6;
            return (
              <div
                key={name}
                className="w-9 h-10 rounded-lg flex flex-col items-center justify-center text-[11px] font-black shrink-0 border"
                style={{
                  background: isHigh ? `${ACCENT}20` : isLow ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.03)",
                  borderColor: isHigh ? `${ACCENT}60` : isLow ? "rgba(96,165,250,0.5)" : "rgba(255,255,255,0.07)",
                  color: isHigh ? ACCENT : isLow ? "#60a5fa" : "rgba(255,255,255,0.3)",
                }}
              >
                {name}
              </div>
            );
          })}
        </div>
        <div className="w-full flex gap-4 text-[11px] font-bold justify-center">
          <span style={{ color: "#60a5fa" }}>▲ LO: A–6</span>
          <span className="text-white/30">7 = 0</span>
          <span style={{ color: ACCENT }}>▲ HI: 8–K</span>
        </div>

        <div className="w-full">
          <BetSelector value={bet} onChange={setBet} min={5} max={Math.min(10000, user?.coins ?? 10000)} />
        </div>
      </div>
    </GameLayout>
  );
}
