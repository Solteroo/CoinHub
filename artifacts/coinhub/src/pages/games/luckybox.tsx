import { GameLayout } from "@/components/layout/GameLayout";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayLuckyBox, useGetGamesConfig, useGetMe, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Lock, Unlock, RefreshCw } from "lucide-react";
import { BetSelector } from "@/components/BetSelector";
import { RarityBadge } from "@/components/RarityBadge";
import { ResultOverlay } from "@/components/games/ResultOverlay";
import confetti from "canvas-confetti";
import { cn, fmtCoins } from "@/lib/utils";
import { COIN } from "@/lib/coin";
import { useI18n } from "@/i18n";
import { playWin, playLose, playClick } from "@/lib/sounds";

const ACCENT = "#f59e0b";

export default function LuckyBoxGame() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: config } = useGetGamesConfig();
  const [bet, setBet] = useState(10);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const { t } = useI18n();
  const playBox = usePlayLuckyBox();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => { if (config?.minBet && bet < config.minBet) setBet(config.minBet); }, [config]);

  const handleOpen = (index: number) => {
    if (playing || pickedIndex !== null || !user || bet > user.coins) return;
    setPlaying(true); setPickedIndex(index); setShowResult(false); playClick();
    playBox.mutate({ data: { bet, pickIndex: index } }, {
      onSuccess: (res) => {
        setResult(res);
        setTimeout(() => {
          setShowResult(true);
          if (res.won > 0) {
            playWin();
            if (res.multiplier >= 10) confetti({ particleCount: 160, spread: 75, origin: { y: 0.5 }, colors: [ACCENT, "#fde68a"] });
            else confetti({ particleCount: 70, spread: 50, origin: { y: 0.5 }, colors: [ACCENT, "#fde68a"] });
          } else {
            playLose();
          }
        }, 700);
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
        setPlaying(false);
      },
      onError: (err: any) => {
        setPlaying(false);
        setPickedIndex(null);
        toast({ title: t("error"), description: err.message, variant: "destructive" });
      },
    });
  };

  const reset = () => { if (playing) return; setPickedIndex(null); setResult(null); setShowResult(false); };

  return (
    <GameLayout title={t("game_luckybox_title")} emoji="📦" accentColor={ACCENT}>
      <div
        className="flex-1 flex flex-col px-4 gap-3"
        style={{ paddingTop: "16px", paddingBottom: "max(52px, env(safe-area-inset-bottom, 52px))" }}
      >
        {/* Bet / hint */}
        <div className="shrink-0">
          {pickedIndex === null ? (
            <>
              <BetSelector value={bet} onChange={setBet} min={config?.minBet ?? 1} max={user?.coins ?? 0} />
              <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
                className="text-center text-xs font-black uppercase tracking-[0.2em] mt-3" style={{ color: ACCENT }}>
                📦 {t("choose_box")}
              </motion.p>
            </>
          ) : (
            <div className="rounded-2xl p-3 text-center border flex items-center justify-center gap-3"
              style={{ background: `${ACCENT}10`, borderColor: `${ACCENT}30` }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{t("bet_placed")}</p>
              <p className="text-xl font-black" style={{ color: ACCENT }}>{bet} {COIN}</p>
            </div>
          )}
        </div>

        {/* 3×3 box grid */}
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div
            className="w-full grid grid-cols-3 gap-3 p-3 rounded-2xl"
            style={{
              background: "rgba(245,158,11,0.04)",
              border: "1px solid rgba(245,158,11,0.12)",
              boxShadow: "inset 0 2px 40px rgba(0,0,0,0.35)",
            }}
          >
            {Array.from({ length: 9 }).map((_, i) => {
              const isPicked = pickedIndex === i;
              const reveal = result?.boxes?.[i];
              const isRevealed = !!result;
              const hasWin = reveal?.multiplier > 0;

              return (
                <AnimatePresence key={i} mode="wait">
                  {!isRevealed ? (
                    <motion.button key="closed"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      whileHover={!playing ? { scale: 1.07, y: -5 } : {}}
                      whileTap={!playing ? { scale: 0.9 } : {}}
                      onClick={() => handleOpen(i)}
                      transition={{ delay: i * 0.04 }}
                      className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 relative overflow-hidden"
                      style={{
                        background: isPicked
                          ? `linear-gradient(145deg, ${ACCENT}35, ${ACCENT}18)`
                          : "linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                        border: `2px solid ${isPicked ? ACCENT : "rgba(255,255,255,0.1)"}`,
                        boxShadow: isPicked
                          ? `0 0 32px ${ACCENT}55, inset 0 1px 0 rgba(255,255,255,0.2)`
                          : "inset 0 1px 0 rgba(255,255,255,0.08)",
                      }}
                    >
                      <div className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
                        style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.09), transparent)", borderRadius: "14px 14px 0 0" }} />
                      <span className="text-3xl leading-none select-none" style={{ filter: `drop-shadow(0 4px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 16px ${ACCENT}60)` }}>
                        {isPicked ? "📦" : "🎁"}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: isPicked ? ACCENT : "rgba(255,255,255,0.25)" }}>
                        #{i + 1}
                      </span>
                    </motion.button>
                  ) : (
                    <motion.div key="revealed"
                      initial={{ rotateY: 90, scale: 0.8 }}
                      animate={{ rotateY: 0, scale: isPicked ? 1.07 : 1 }}
                      transition={{ delay: i * 0.05, type: "spring", stiffness: 220, damping: 22 }}
                      className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 relative overflow-hidden"
                      style={{
                        background:
                          isPicked && hasWin ? "linear-gradient(145deg, rgba(52,211,153,0.25), rgba(52,211,153,0.12))"
                          : isPicked && !hasWin ? "linear-gradient(145deg, rgba(239,68,68,0.22), rgba(239,68,68,0.12))"
                          : hasWin ? `linear-gradient(145deg, ${ACCENT}18, ${ACCENT}08)`
                          : "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
                        border: `2px solid ${isPicked && hasWin ? "rgba(52,211,153,0.55)" : isPicked && !hasWin ? "rgba(239,68,68,0.45)" : hasWin ? `${ACCENT}45` : "rgba(255,255,255,0.07)"}`,
                        boxShadow:
                          isPicked && hasWin ? "0 0 28px rgba(52,211,153,0.4), inset 0 1px 0 rgba(255,255,255,0.15)"
                          : isPicked && !hasWin ? "0 0 22px rgba(239,68,68,0.3)"
                          : undefined,
                      }}>
                      <div className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
                        style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.07), transparent)", borderRadius: "14px 14px 0 0" }} />
                      {reveal && (
                        <>
                          <span className="text-xl leading-none select-none">
                            {isPicked && hasWin ? "✨" : isPicked && !hasWin ? "💨" : hasWin ? "💎" : "📭"}
                          </span>
                          <span className="text-xl font-black italic tabular-nums"
                            style={{
                              color: hasWin ? (isPicked ? "#34d399" : ACCENT) : "rgba(255,255,255,0.18)",
                              textShadow: hasWin ? `0 0 16px ${isPicked ? "rgba(52,211,153,0.7)" : `${ACCENT}70`}` : undefined,
                            }}>
                            {reveal.multiplier}×
                          </span>
                          {isPicked && result?.rarity && <RarityBadge rarity={result.rarity} className="scale-90" />}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              );
            })}
          </div>
        </div>

        {/* Play again */}
        <AnimatePresence>
          {pickedIndex !== null && !playing && result && (
            <motion.button initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              onClick={reset}
              className="shrink-0 w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-[0.98] flex items-center justify-center gap-3 border border-white/10 text-white/60"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              <RefreshCw className="w-5 h-5" />
              {t("play_again")}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <ResultOverlay
        show={showResult}
        won={(result?.won ?? 0) > 0}
        amount={result?.won > 0 ? result.won - bet : bet}
        label={result?.label}
        multiplier={result?.multiplier > 1 ? result.multiplier : undefined}
        onDismiss={() => setShowResult(false)}
      />
    </GameLayout>
  );
}
