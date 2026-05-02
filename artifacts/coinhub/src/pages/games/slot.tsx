import { GameLayout } from "@/components/layout/GameLayout";
import { useState, useRef } from "react";
import { usePlaySlot, useGetGamesConfig, useGetMe, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BetSelector } from "@/components/BetSelector";
import { PixiSlot } from "@/components/games/PixiSlot";
import { ResultOverlay } from "@/components/games/ResultOverlay";
import confetti from "canvas-confetti";
import { cn, fmtCoins } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { COIN } from "@/lib/coin";
import { playWin, playLose, playClick } from "@/lib/sounds";

const ACCENT = "#7c3aed";
const SYMBOL_COLORS: Record<string, string> = {
  "7": "#ef4444", "★": "#D4AF37", "♦": "#3b82f6", "♥": "#ec4899", "♣": "#10b981", "BAR": "#f97316",
};

export default function SlotGame() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: config } = useGetGamesConfig();
  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [finalSymbols, setFinalSymbols] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);
  const resultRef = useRef<any>(null);
  const { t } = useI18n();
  const playSlot = usePlaySlot();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSpin = () => {
    if (spinning || !user || bet > user.coins || bet < (config?.minBet ?? 1)) return;
    setSpinning(true);
    setFinalSymbols([]);
    setShowResult(false);
    resultRef.current = null;
    playClick();

    playSlot.mutate({ data: { bet } }, {
      onSuccess: (data) => {
        resultRef.current = data;
        setFinalSymbols(data.symbols);
        setHistory(prev => [data, ...prev].slice(0, 6));
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
      },
      onError: (err: any) => {
        setSpinning(false);
        toast({ title: t("error"), description: err.message, variant: "destructive" });
      },
    });
  };

  const handleStopped = () => {
    setSpinning(false);
    const r = resultRef.current;
    if (!r) return;
    setResult(r);
    const netChange = r.won > 0 ? r.won - bet : -bet;
    setResult({ ...r, netChange });
    setShowResult(true);
    if (r.won > 0) {
      playWin();
      if (r.multiplier >= 30) confetti({ particleCount: 280, spread: 95, origin: { y: 0.4 }, colors: [ACCENT, "#D4AF37", "#fff"] });
      else confetti({ particleCount: 100, spread: 60, origin: { y: 0.5 }, colors: [ACCENT, "#a78bfa"] });
    } else {
      playLose();
    }
  };

  return (
    <GameLayout title={t("game_slot_title")} emoji="🎰" accentColor={ACCENT}>
      <div
        className="flex-1 flex flex-col px-4 gap-3"
        style={{ paddingTop: "16px", paddingBottom: "max(52px, env(safe-area-inset-bottom, 52px))" }}
      >
        {/* PixiJS GPU Slot Reels */}
        <div
          className="w-full rounded-3xl overflow-hidden shrink-0"
          style={{
            height: "clamp(170px, 26vh, 230px)",
            boxShadow: `0 0 60px rgba(124,58,237,0.3), 0 0 120px rgba(124,58,237,0.1)`,
          }}
        >
          <PixiSlot
            spinning={spinning}
            finalSymbols={finalSymbols}
            onStopped={handleStopped}
            accentColor={0x7c3aed}
          />
        </div>

        {/* History strip */}
        {history.length > 0 && (
          <div className="shrink-0 flex gap-2 overflow-x-auto no-scrollbar">
            {history.map((h, i) => (
              <div key={i} className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px]"
                style={{ background: h.won > 0 ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.04)", borderColor: h.won > 0 ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.07)" }}>
                <div className="flex gap-0.5">
                  {h.symbols.map((s: string, j: number) => (
                    <span key={j} className="font-black" style={{ color: SYMBOL_COLORS[s] ?? "#D4AF37" }}>{s}</span>
                  ))}
                </div>
                <span className={cn("font-black", h.won > 0 ? "text-emerald-400" : "text-white/30")}>
                  {h.won > 0 ? `+${fmtCoins(h.won - bet)}` : "—"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Paytable */}
        <div className="shrink-0 rounded-2xl px-4 py-3 border" style={{ background: "rgba(124,58,237,0.06)", borderColor: "rgba(124,58,237,0.2)" }}>
          <div className="grid grid-cols-3 gap-x-3 gap-y-1">
            {[
              { combo: "7-7-7", mult: "150×", color: "#ef4444" },
              { combo: "★-★-★", mult: "30×", color: "#D4AF37" },
              { combo: "♦-♦-♦", mult: "12×", color: "#3b82f6" },
              { combo: "♥-♥-♥", mult: "6×", color: "#ec4899" },
              { combo: "♣-♣-♣", mult: "3.5×", color: "#10b981" },
              { combo: "BAR×3", mult: "2.2×", color: "#f97316" },
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

        {/* SPIN button */}
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
          {spinning ? `⟳ ${t("spinning")}` : `🎰 ${t("spin_btn")}`}
        </button>
      </div>

      <ResultOverlay
        show={showResult}
        won={(result?.won ?? 0) > 0}
        amount={result?.won > 0 ? result.won - bet : bet}
        label={result?.label}
        multiplier={result?.multiplier}
        onDismiss={() => setShowResult(false)}
      />
    </GameLayout>
  );
}
