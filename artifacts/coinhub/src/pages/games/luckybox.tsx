import { GameLayout } from "@/components/layout/GameLayout";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayLuckyBox, useGetGamesConfig, useGetMe, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Lock, Unlock, RefreshCw } from "lucide-react";
import { BetSelector } from "@/components/BetSelector";
import { RarityBadge } from "@/components/RarityBadge";
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
  const { t } = useI18n();

  const playBox = usePlayLuckyBox();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (config?.minBet && bet < config.minBet) setBet(config.minBet);
  }, [config]);

  const handleOpen = (index: number) => {
    if (playing || pickedIndex !== null || !user || bet > user.coins) return;
    setPlaying(true);
    setPickedIndex(index);
    playClick();

    playBox.mutate({ data: { bet, pickIndex: index } }, {
      onSuccess: (res) => {
        setResult(res);
        if (res.won > 0) {
          playWin();
          if (res.multiplier >= 10) {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.5 }, colors: [ACCENT, "#fde68a"] });
          }
          toast({ title: `📦 ${res.label}`, description: `+${res.won} ${COIN}` });
        } else {
          playLose();
        }
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

  const reset = () => {
    if (playing) return;
    setPickedIndex(null);
    setResult(null);
  };

  const playAgainBtn = pickedIndex !== null && !playing && result ? (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={reset}
      className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-[0.98] flex items-center justify-center gap-3 border border-white/10 text-white/60"
      style={{ background: "rgba(255,255,255,0.05)" }}
    >
      <RefreshCw className="w-5 h-5" />
      {t("play_again")}
    </motion.button>
  ) : undefined;

  return (
    <GameLayout title={t("game_luckybox_title")} emoji="📦" accentColor={ACCENT} bottomAction={playAgainBtn}>
      <div className="flex flex-col items-center gap-5 px-4 pt-5 pb-4">

        <div className="w-full">
          {pickedIndex === null ? (
            <BetSelector value={bet} onChange={setBet} min={config?.minBet ?? 1} max={user?.coins ?? 0} />
          ) : (
            <div
              className="rounded-2xl p-4 text-center border"
              style={{ background: `${ACCENT}10`, borderColor: `${ACCENT}30` }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">{t("bet_placed")}</p>
              <p className="text-2xl font-black" style={{ color: ACCENT }}>{bet} {COIN}</p>
            </div>
          )}
        </div>

        {pickedIndex === null && (
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xs font-black uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            📦 {t("choose_box")}
          </motion.p>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "w-full text-center py-4 rounded-2xl font-black text-lg uppercase tracking-wider border",
                result.won > 0
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : "bg-white/5 text-white/40 border-white/10",
              )}
            >
              {result.won > 0 ? (
                <>
                  <div>{result.label}</div>
                  <div className="text-3xl mt-1">+{fmtCoins(result.won)} {COIN}</div>
                </>
              ) : (
                <div>{t("unlucky")}</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-3 gap-3 w-full">
          {Array.from({ length: 9 }).map((_, i) => {
            const isPicked = pickedIndex === i;
            const reveal = result?.boxes?.[i];
            const isRevealed = !!result;
            const hasWin = reveal?.multiplier > 0;

            return (
              <AnimatePresence key={i} mode="wait">
                {!isRevealed ? (
                  <motion.button
                    key="closed"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    whileHover={!playing ? { scale: 1.06, y: -4 } : {}}
                    whileTap={!playing ? { scale: 0.94 } : {}}
                    onClick={() => handleOpen(i)}
                    transition={{ delay: i * 0.03 }}
                    className="aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                    style={{
                      background: isPicked ? `${ACCENT}25` : "rgba(255,255,255,0.04)",
                      borderColor: isPicked ? ACCENT : "rgba(255,255,255,0.1)",
                      boxShadow: isPicked ? `0 0 25px ${ACCENT}40` : undefined,
                    }}
                  >
                    <Lock className="w-8 h-8" style={{ color: isPicked ? ACCENT : "rgba(255,255,255,0.2)" }} />
                    <span className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
                      #{i + 1}
                    </span>
                  </motion.button>
                ) : (
                  <motion.div
                    key="revealed"
                    initial={{ rotateY: 90, scale: 0.8 }}
                    animate={{ rotateY: 0, scale: isPicked ? 1.05 : 1 }}
                    transition={{ delay: i * 0.06, type: "spring", stiffness: 200, damping: 20 }}
                    className="aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1"
                    style={{
                      background: isPicked && hasWin ? "rgba(52,211,153,0.15)"
                        : isPicked && !hasWin ? "rgba(239,68,68,0.15)"
                        : !isPicked && hasWin ? `${ACCENT}10`
                        : "rgba(255,255,255,0.03)",
                      borderColor: isPicked && hasWin ? "rgba(52,211,153,0.5)"
                        : isPicked && !hasWin ? "rgba(239,68,68,0.4)"
                        : !isPicked && hasWin ? `${ACCENT}40`
                        : "rgba(255,255,255,0.06)",
                      boxShadow: isPicked && hasWin ? "0 0 25px rgba(52,211,153,0.3)"
                        : isPicked && !hasWin ? "0 0 20px rgba(239,68,68,0.2)"
                        : undefined,
                    }}
                  >
                    {reveal && (
                      <>
                        <Unlock className={cn("w-5 h-5", hasWin ? "text-emerald-400" : "text-white/20")} />
                        <span
                          className="text-2xl font-black italic tabular-nums"
                          style={{ color: hasWin ? (isPicked ? "#34d399" : ACCENT) : "rgba(255,255,255,0.2)" }}
                        >
                          {reveal.multiplier}×
                        </span>
                        {isPicked && result?.rarity && (
                          <RarityBadge rarity={result.rarity} className="scale-90" />
                        )}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </div>
      </div>
    </GameLayout>
  );
}
