import { GameLayout } from "@/components/layout/GameLayout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMe, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Bomb, Star, RefreshCw } from "lucide-react";
import { BetSelector } from "@/components/BetSelector";
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
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  const maxPicks = 5;
  const currentMult = MULTIPLIERS[Math.min(picks.length, MULTIPLIERS.length - 1)] ?? 0;

  const togglePick = (idx: number) => {
    if (submitted || loading) return;
    playClick();
    setPicks((prev) =>
      prev.includes(idx) ? prev.filter((p) => p !== idx) : prev.length < maxPicks ? [...prev, idx] : prev,
    );
  };

  const handleSubmit = async () => {
    if (picks.length === 0 || loading || !user || bet > user.coins) return;
    setLoading(true);
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
      if (data.netChange > 0) {
        playWin();
        confetti({ particleCount: 100, spread: 60, origin: { y: 0.5 }, colors: ["#f97316", "#fb923c"] });
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

  const reset = () => {
    setPicks([]);
    setSubmitted(false);
    setResult(null);
  };

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
      <div className="flex flex-col gap-4 px-4 pt-4">

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl p-3 text-center" style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">{t("picks") || "Picks"}</p>
            <p className="text-lg font-black" style={{ color: ACCENT }}>{picks.length}/{maxPicks}</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">{t("multiplier") || "Mult"}</p>
            <p className="text-lg font-black" style={{ color: ACCENT }}>{picks.length > 0 ? `${currentMult}×` : "—"}</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: submitted && result?.netChange > 0 ? "rgba(52,211,153,0.15)" : submitted && result ? "rgba(239,68,68,0.15)" : "rgba(249,115,22,0.1)", border: `1px solid ${submitted && result?.netChange > 0 ? "rgba(52,211,153,0.3)" : submitted && result ? "rgba(239,68,68,0.3)" : "rgba(249,115,22,0.2)"}` }}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">{t("win")}</p>
            <p className={cn("text-lg font-black", submitted && result?.netChange > 0 ? "text-emerald-400" : submitted && result ? "text-red-400" : "text-white/20")}>
              {submitted && result ? (result.netChange > 0 ? `+${fmtCoins(result.netChange)}` : fmtCoins(result.netChange)) : "—"}
            </p>
          </div>
        </div>

        {/* Mine grid */}
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 25 }, (_, i) => {
            const state = getCellState(i);
            return (
              <motion.button
                key={i}
                onClick={() => togglePick(i)}
                whileTap={!submitted ? { scale: 0.88 } : {}}
                className="aspect-square rounded-xl flex items-center justify-center text-xl font-black transition-all border-2"
                style={{
                  background: state === "default" ? "rgba(255,255,255,0.04)"
                    : state === "picked" ? "rgba(249,115,22,0.2)"
                    : state === "safe" ? "rgba(52,211,153,0.2)"
                    : "rgba(239,68,68,0.2)",
                  borderColor: state === "default" ? "rgba(255,255,255,0.07)"
                    : state === "picked" ? "rgba(249,115,22,0.6)"
                    : state === "safe" ? "rgba(52,211,153,0.6)"
                    : "rgba(239,68,68,0.6)",
                  boxShadow: state === "picked" ? `0 0 15px ${ACCENT}40`
                    : state === "safe" ? "0 0 15px rgba(52,211,153,0.3)"
                    : state === "mine" ? "0 0 15px rgba(239,68,68,0.3)"
                    : undefined,
                }}
              >
                <AnimatePresence>
                  {state === "safe" && (
                    <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                      <Star className="w-5 h-5 text-emerald-400" />
                    </motion.div>
                  )}
                  {state === "mine" && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                      <Bomb className="w-5 h-5 text-red-400" />
                    </motion.div>
                  )}
                  {state === "picked" && (
                    <motion.span
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="text-xs font-black"
                      style={{ color: ACCENT }}
                    >
                      {picks.indexOf(i) + 1}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        {/* Bet selector */}
        <BetSelector value={bet} onChange={setBet} min={5} max={Math.min(10000, user?.coins ?? 10000)} disabled={submitted} />

        {/* Action button */}
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={picks.length === 0 || loading || !user || bet > (user?.coins ?? 0)}
            className="w-full h-16 rounded-2xl font-black text-base uppercase tracking-widest disabled:opacity-40 active:scale-[0.98] transition-all"
            style={{
              background: picks.length > 0 ? `linear-gradient(135deg, ${ACCENT}, #ea580c)` : "rgba(255,255,255,0.07)",
              boxShadow: picks.length > 0 ? `0 0 30px ${ACCENT}50` : undefined,
              color: picks.length > 0 ? "#000" : "rgba(255,255,255,0.3)",
            }}
          >
            {loading ? t("checking") : picks.length === 0 ? t("choose_cell") : `${picks.length} ${t("cells_selected")} · ${currentMult}×`}
          </button>
        ) : (
          <button
            onClick={reset}
            className="w-full h-16 rounded-2xl font-black text-base uppercase tracking-widest active:scale-[0.98] flex items-center justify-center gap-3 text-white/70 border border-white/10"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <RefreshCw className="w-5 h-5" />
            {t("play_again")}
          </button>
        )}
      </div>
    </GameLayout>
  );
}
