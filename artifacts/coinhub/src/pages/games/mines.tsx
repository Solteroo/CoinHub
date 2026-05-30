import { GameLayout } from "@/components/layout/GameLayout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMe, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Bomb, Star, RefreshCw } from "lucide-react";
import { BetSelector } from "@/components/BetSelector";
import { ResultOverlay } from "@/components/games/ResultOverlay";
import { cn, fmtCoins } from "@/lib/utils";
import { COIN } from "@/lib/coin";
import confetti from "canvas-confetti";
import { useI18n } from "@/i18n";
import { playWin, playLose, playClick } from "@/lib/sounds";

const MULTIPLIERS = [0, 1.2, 1.5, 2.0, 2.8, 4.0, 6.0, 10.0, 20.0];
const ACCENT = "#f97316";

export default function MinesGame() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const [bet, setBet] = useState(10);
  const [picks, setPicks] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  const maxPicks = 5;
  const currentMult = MULTIPLIERS[Math.min(picks.length, MULTIPLIERS.length - 1)] ?? 0;

  const togglePick = (idx: number) => {
    if (submitted || loading) return;
    playClick();
    setPicks(prev => prev.includes(idx) ? prev.filter(p => p !== idx) : prev.length < maxPicks ? [...prev, idx] : prev);
  };

  const handleSubmit = async () => {
    if (picks.length === 0 || loading || !user || bet > user.coins) return;
    setLoading(true);
    setShowResult(false);
    try {
      const res = await fetch("/api/games/mines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet, picks }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error ?? t("error"), variant: "destructive" }); return; }
      setResult(data);
      setSubmitted(true);
      setTimeout(() => {
        setShowResult(true);
        if (data.netChange > 0) {
          playWin();
          confetti({ particleCount: 120, spread: 65, origin: { y: 0.5 }, colors: ["#f97316", "#fb923c"] });
        } else {
          playLose();
        }
      }, 600);
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
    } catch { toast({ title: t("error"), variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const reset = () => { setPicks([]); setSubmitted(false); setResult(null); setShowResult(false); };

  const getCellState = (idx: number): "default" | "picked" | "safe" | "mine" => {
    if (!submitted) return picks.includes(idx) ? "picked" : "default";
    const isMine = result?.minePositions?.includes(idx);
    const isPicked = picks.includes(idx);
    if (isMine && isPicked) return "mine";
    if (!isMine && isPicked) return "safe";
    if (isMine) return "mine";
    return "default";
  };

  return (
    <GameLayout title={t("game_mines_title")} emoji="💣" accentColor={ACCENT}>
      <div
        className="flex-1 flex flex-col px-4 gap-3"
        style={{ paddingTop: "16px", paddingBottom: "max(52px, env(safe-area-inset-bottom, 52px))" }}
      >
        {/* Stats bar */}
        <div className="shrink-0 grid grid-cols-3 gap-2">
          {[
            { label: t("picks") || "Picks", value: `${picks.length}/${maxPicks}` },
            { label: t("multiplier") || "Mult", value: picks.length > 0 ? `${currentMult}×` : "—" },
            {
              label: t("win"),
              value: submitted && result ? (result.netChange > 0 ? `+${fmtCoins(result.netChange)}` : fmtCoins(result.netChange)) : "—",
              win: submitted && result?.netChange > 0,
              lose: submitted && result?.netChange <= 0 && result,
            },
          ].map(({ label, value, win, lose }: any) => (
            <div key={label} className="rounded-xl p-2.5 text-center border"
              style={{ background: win ? "rgba(52,211,153,0.12)" : lose ? "rgba(239,68,68,0.12)" : "rgba(249,115,22,0.08)", borderColor: win ? "rgba(52,211,153,0.3)" : lose ? "rgba(239,68,68,0.3)" : "rgba(249,115,22,0.18)" }}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">{label}</p>
              <p className={cn("text-base font-black", win ? "text-emerald-400" : lose ? "text-red-400" : "")} style={!win && !lose ? { color: ACCENT } : {}}>{value}</p>
            </div>
          ))}
        </div>

        {/* Mine grid */}
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div
            className="w-full grid grid-cols-5 gap-2 p-3 rounded-2xl"
            style={{
              background: "rgba(249,115,22,0.04)",
              border: "1px solid rgba(249,115,22,0.12)",
              boxShadow: "inset 0 2px 30px rgba(0,0,0,0.3)",
            }}
          >
            {Array.from({ length: 25 }, (_, i) => {
              const state = getCellState(i);
              return (
                <motion.button
                  key={i}
                  onClick={() => togglePick(i)}
                  whileTap={!submitted ? { scale: 0.82 } : {}}
                  whileHover={!submitted && state === "default" ? { scale: 1.06, y: -2 } : {}}
                  className="aspect-square rounded-xl flex items-center justify-center border transition-all relative overflow-hidden"
                  style={{
                    background:
                      state === "default"
                        ? "linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))"
                        : state === "picked"
                        ? `linear-gradient(145deg, ${ACCENT}30, ${ACCENT}18)`
                        : state === "safe"
                        ? "linear-gradient(145deg, rgba(52,211,153,0.28), rgba(52,211,153,0.15))"
                        : "linear-gradient(145deg, rgba(239,68,68,0.3), rgba(239,68,68,0.18))",
                    borderColor:
                      state === "default"
                        ? "rgba(255,255,255,0.09)"
                        : state === "picked"
                        ? `${ACCENT}80`
                        : state === "safe"
                        ? "rgba(52,211,153,0.7)"
                        : "rgba(239,68,68,0.75)",
                    boxShadow:
                      state === "picked"
                        ? `0 0 18px ${ACCENT}50, inset 0 1px 0 rgba(255,255,255,0.12)`
                        : state === "safe"
                        ? "0 0 18px rgba(52,211,153,0.45), inset 0 1px 0 rgba(255,255,255,0.15)"
                        : state === "mine"
                        ? "0 0 18px rgba(239,68,68,0.45), inset 0 1px 0 rgba(255,100,100,0.2)"
                        : "inset 0 1px 0 rgba(255,255,255,0.06)",
                  }}
                >
                  {/* Cell inner shine */}
                  {state === "default" && (
                    <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl pointer-events-none"
                      style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.07), transparent)" }} />
                  )}
                  <AnimatePresence mode="wait">
                    {state === "safe" && (
                      <motion.div key="safe" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 320, damping: 18 }}>
                        <Star className="w-4 h-4 fill-emerald-400 text-emerald-400" style={{ filter: "drop-shadow(0 0 6px rgba(52,211,153,0.8))" }} />
                      </motion.div>
                    )}
                    {state === "mine" && (
                      <motion.div key="mine" initial={{ scale: 0, rotate: 30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 280, damping: 15 }}>
                        <Bomb className="w-4 h-4 text-red-400" style={{ filter: "drop-shadow(0 0 8px rgba(239,68,68,0.9))" }} />
                      </motion.div>
                    )}
                    {state === "picked" && (
                      <motion.span key="picked" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        className="text-sm font-black" style={{ color: ACCENT, textShadow: `0 0 10px ${ACCENT}` }}>
                        {picks.indexOf(i) + 1}
                      </motion.span>
                    )}
                    {state === "default" && (
                      <motion.span key="default" className="text-[11px] text-white/10 font-bold select-none">
                        {i + 1}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Bet */}
        <div className="shrink-0">
          <BetSelector value={bet} onChange={setBet} min={5} max={Math.min(10000, user?.coins ?? 10000)} disabled={submitted} />
        </div>

        {/* Action button */}
        {!submitted ? (
          <button onClick={handleSubmit} disabled={picks.length === 0 || loading || !user || bet > (user?.coins ?? 0)}
            className="shrink-0 w-full h-16 rounded-2xl font-black text-base uppercase tracking-widest disabled:opacity-35 active:scale-[0.98] transition-all"
            style={{ background: picks.length > 0 ? `linear-gradient(135deg, ${ACCENT}, #ea580c)` : "rgba(255,255,255,0.07)", boxShadow: picks.length > 0 ? `0 0 36px ${ACCENT}55` : undefined, color: picks.length > 0 ? "#000" : "rgba(255,255,255,0.3)" }}>
            {loading ? t("checking") : picks.length === 0 ? t("choose_cell") : `${picks.length} ${t("cells_selected")} · ${currentMult}×`}
          </button>
        ) : (
          <button onClick={reset} className="shrink-0 w-full h-16 rounded-2xl font-black text-base uppercase tracking-widest active:scale-[0.98] flex items-center justify-center gap-3 text-white/70 border border-white/10" style={{ background: "rgba(255,255,255,0.05)" }}>
            <RefreshCw className="w-5 h-5" />
            {t("play_again")}
          </button>
        )}
      </div>

      <ResultOverlay
        show={showResult}
        won={(result?.netChange ?? 0) > 0}
        amount={Math.abs(result?.netChange ?? 0)}
        multiplier={result?.multiplier}
        onDismiss={() => setShowResult(false)}
      />
    </GameLayout>
  );
}
