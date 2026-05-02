import { GameLayout } from "@/components/layout/GameLayout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMe, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowUp, ArrowDown } from "lucide-react";
import { BetSelector } from "@/components/BetSelector";
import { ResultOverlay } from "@/components/games/ResultOverlay";
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
  const [showResult, setShowResult] = useState(false);
  const [suit] = useState(() => SUITS[Math.floor(Math.random() * 4)] ?? "♠");
  const [flipped, setFlipped] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();
  const isRed = suit === "♥" || suit === "♦";

  const handlePlay = async (choice: "high" | "low") => {
    if (loading || !user || bet > user.coins) return;
    setLoading(true); setResult(null); setFlipped(false); setShowResult(false); playClick();
    try {
      const res = await fetch("/api/games/hilo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet, choice }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error ?? t("error"), variant: "destructive" }); return; }
      await new Promise(r => setTimeout(r, 200));
      setFlipped(true);
      await new Promise(r => setTimeout(r, 400));
      setResult(data);
      setTimeout(() => {
        setShowResult(true);
        if (data.netChange > 0) { playWin(); confetti({ particleCount: 80, spread: 55, origin: { y: 0.5 }, colors: [ACCENT, "#fde047"] }); }
        else playLose();
      }, 300);
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
    } catch { toast({ title: t("error"), variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const reset = () => { setResult(null); setFlipped(false); setShowResult(false); };

  return (
    <GameLayout title={t("game_hilo_title")} emoji="🃏" accentColor={ACCENT}>
      <div
        className="flex-1 flex flex-col px-4 gap-4 items-center"
        style={{ paddingTop: "16px", paddingBottom: "max(52px, env(safe-area-inset-bottom, 52px))" }}
      >
        {/* Card display */}
        <div className="shrink-0 flex flex-col items-center gap-4" style={{ height: "clamp(200px, 32vh, 270px)", justifyContent: "center" }}>
          <motion.div
            animate={{ rotateY: flipped ? 0 : 90 }}
            transition={{ duration: 0.35 }}
            className="rounded-3xl border-2 flex flex-col items-center justify-center shadow-2xl"
            style={{
              width: "min(150px, 42vw)",
              height: "min(210px, 55vw)",
              background: result !== null ? "#fff" : "rgba(255,255,255,0.06)",
              borderColor: result !== null ? (result.netChange > 0 ? "#22c55e" : "#ef4444") : "rgba(255,255,255,0.15)",
              boxShadow: result !== null
                ? (result.netChange > 0 ? "0 0 50px rgba(34,197,94,0.5)" : "0 0 50px rgba(239,68,68,0.35)")
                : `0 0 40px ${ACCENT}35`,
            }}
          >
            {result !== null ? (
              <div className={cn("text-center", isRed ? "text-red-600" : "text-gray-900")}>
                <div className="font-black leading-none" style={{ fontSize: "clamp(52px, 14vw, 72px)" }}>{CARD_NAMES[result.card]}</div>
                <div className="leading-none mt-2" style={{ fontSize: "clamp(40px, 11vw, 56px)" }}>{suit}</div>
              </div>
            ) : (
              <div className="text-6xl opacity-20 font-black" style={{ color: ACCENT }}>?</div>
            )}
          </motion.div>

          {/* Reference strip */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar w-full px-2">
            {CARD_NAMES.slice(1).map((name, i) => {
              const val = i + 1; const isHigh = val >= 8; const isLow = val <= 6;
              return (
                <div key={name} className="w-8 h-9 rounded-lg flex flex-col items-center justify-center text-[10px] font-black shrink-0 border"
                  style={{ background: isHigh ? `${ACCENT}20` : isLow ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.03)", borderColor: isHigh ? `${ACCENT}60` : isLow ? "rgba(96,165,250,0.5)" : "rgba(255,255,255,0.07)", color: isHigh ? ACCENT : isLow ? "#60a5fa" : "rgba(255,255,255,0.3)" }}>
                  {name}
                </div>
              );
            })}
          </div>
          <div className="flex gap-5 text-[10px] font-bold">
            <span style={{ color: "#60a5fa" }}>▼ LO: A–6</span>
            <span className="text-white/25">7=0</span>
            <span style={{ color: ACCENT }}>▲ HI: 8–K</span>
          </div>
        </div>

        {/* Bet */}
        <div className="shrink-0 w-full">
          <BetSelector value={bet} onChange={setBet} min={5} max={Math.min(10000, user?.coins ?? 10000)} />
        </div>

        {/* HI/LO buttons or Play again */}
        {!result ? (
          <div className="shrink-0 grid grid-cols-2 gap-3 w-full">
            <button onClick={() => handlePlay("high")} disabled={loading || !user || bet > (user?.coins ?? 0)}
              className="h-16 rounded-2xl font-black text-sm uppercase tracking-tight flex flex-col items-center justify-center gap-1.5 active:scale-[0.97] disabled:opacity-35 border-2 transition-all"
              style={{ background: `${ACCENT}18`, borderColor: `${ACCENT}60`, color: ACCENT, boxShadow: `0 0 28px ${ACCENT}35` }}>
              <ArrowUp className="w-5 h-5" />
              HI (8–K) · 1.85×
            </button>
            <button onClick={() => handlePlay("low")} disabled={loading || !user || bet > (user?.coins ?? 0)}
              className="h-16 rounded-2xl font-black text-sm uppercase tracking-tight flex flex-col items-center justify-center gap-1.5 active:scale-[0.97] disabled:opacity-35 border-2 transition-all"
              style={{ background: "rgba(96,165,250,0.15)", borderColor: "rgba(96,165,250,0.5)", color: "#60a5fa", boxShadow: "0 0 28px rgba(96,165,250,0.25)" }}>
              <ArrowDown className="w-5 h-5" />
              LO (A–6) · 1.85×
            </button>
          </div>
        ) : (
          <button onClick={reset} className="shrink-0 w-full h-16 rounded-2xl font-black text-base uppercase tracking-widest active:scale-[0.98] transition-all"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #ca8a04)`, boxShadow: `0 0 36px ${ACCENT}55`, color: "#000" }}>
            {t("play_again")}
          </button>
        )}
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
