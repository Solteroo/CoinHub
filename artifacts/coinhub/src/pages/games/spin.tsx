import { GameLayout } from "@/components/layout/GameLayout";
import { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { usePlaySpin, useGetGamesConfig, useGetMe, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BetSelector } from "@/components/BetSelector";
import confetti from "canvas-confetti";
import { useI18n } from "@/i18n";
import { COIN } from "@/lib/coin";
import { playWin, playLose, playClick } from "@/lib/sounds";
import { fmtCoins } from "@/lib/utils";

const ACCENT = "#3b82f6";

export default function SpinGame() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: config } = useGetGamesConfig();
  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const controls = useAnimation();
  const playSpin = usePlaySpin();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    if (config?.minBet && bet < config.minBet) setBet(config.minBet);
  }, [config]);

  const handleSpin = () => {
    if (spinning || !user || bet > user.coins || bet < (config?.minBet ?? 1)) return;
    setSpinning(true);
    playClick();
    controls.start({ rotate: [0, 1080], transition: { duration: 1.5, ease: "linear", repeat: Infinity } });

    playSpin.mutate({ data: { bet } }, {
      onSuccess: async (result) => {
        const segments = config?.wheelSegments ?? [];
        const segmentCount = segments.length || 12;
        const segmentAngle = 360 / segmentCount;
        const targetSegment = result.segmentIndex ?? 0;
        const finalRotation = (6 * 360) + (360 - (targetSegment * segmentAngle + segmentAngle / 2));
        controls.stop();
        await controls.start({ rotate: finalRotation, transition: { duration: 5, ease: [0.15, 0, 0.15, 1] } });
        setLastResult(result);
        if (result.won > 0) {
          playWin();
          if (result.multiplier >= 10) confetti({ particleCount: 200, spread: 80, origin: { y: 0.5 }, colors: [ACCENT, "#93c5fd"] });
          else confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
          toast({ title: `🎉 ${result.label}`, description: `+${result.won} ${COIN}` });
        } else {
          playLose();
          toast({ title: t("unlucky"), description: t("no_win_desc"), variant: "destructive" });
        }
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
        setSpinning(false);
      },
      onError: (err: any) => {
        controls.stop();
        setSpinning(false);
        toast({ title: t("error"), description: err.message, variant: "destructive" });
      },
    });
  };

  const segments = config?.wheelSegments ?? [];
  const segmentCount = segments.length || 12;
  const segmentAngle = 360 / segmentCount;

  return (
    <GameLayout title={t("game_spin_title")} emoji="🎡" accentColor={ACCENT}>
      <div
        className="flex-1 flex flex-col px-4 pt-4 gap-3 items-center"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))" }}
      >
        {/* Wheel — fills remaining space */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          <div className="relative flex items-center justify-center" style={{ width: "min(280px, 75vw)", height: "min(280px, 75vw)" }}>
            <div
              className="absolute inset-[-12px] rounded-full"
              style={{
                background: `radial-gradient(circle, transparent 46%, ${ACCENT}20 55%, transparent 66%)`,
                boxShadow: `0 0 80px ${ACCENT}30, 0 0 160px ${ACCENT}12`,
              }}
            />
            <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 z-30">
              <div className="w-0 h-0" style={{ borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "24px solid white", filter: "drop-shadow(0 0 8px rgba(255,255,255,0.95))" }} />
            </div>
            <motion.div
              animate={controls}
              className="w-full h-full rounded-full relative overflow-hidden border-4"
              style={{ transformOrigin: "center", borderColor: `${ACCENT}70`, boxShadow: `0 0 50px ${ACCENT}35, inset 0 0 30px rgba(0,0,0,0.6)` }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {segments.length > 0 ? segments.map((seg: any, i: number) => {
                  const startAngle = i * segmentAngle;
                  const endAngle = startAngle + segmentAngle;
                  const x1 = 50 + 50 * Math.cos(Math.PI * startAngle / 180);
                  const y1 = 50 + 50 * Math.sin(Math.PI * startAngle / 180);
                  const x2 = 50 + 50 * Math.cos(Math.PI * endAngle / 180);
                  const y2 = 50 + 50 * Math.sin(Math.PI * endAngle / 180);
                  return (
                    <g key={i}>
                      <path d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`} fill={seg.color} stroke="rgba(0,0,0,0.3)" strokeWidth="0.4" />
                      <text x="75" y="50" fill="white" fontSize="3.2" fontWeight="900" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${startAngle + segmentAngle / 2}, 50, 50)`} className="uppercase">{seg.label}</text>
                    </g>
                  );
                }) : Array.from({ length: 12 }, (_, i) => {
                  const start = i * 30; const end = start + 30;
                  const x1 = 50 + 50 * Math.cos(Math.PI * start / 180); const y1 = 50 + 50 * Math.sin(Math.PI * start / 180);
                  const x2 = 50 + 50 * Math.cos(Math.PI * end / 180); const y2 = 50 + 50 * Math.sin(Math.PI * end / 180);
                  const colors = ["#1e3a5f","#2d5a8e","#1e3a5f","#2d5a8e","#1a1a2e","#2d3a6e","#1e3a5f","#2d5a8e","#1e3a5f","#2d5a8e","#1a1a2e","#2d3a6e"];
                  return <path key={i} d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`} fill={colors[i]} stroke="rgba(0,0,0,0.3)" strokeWidth="0.4" />;
                })}
                <circle cx="50" cy="50" r="9" fill="#06060f" stroke={ACCENT} strokeWidth="2" />
                <circle cx="50" cy="50" r="4" fill={ACCENT} />
              </svg>
            </motion.div>
          </div>
        </div>

        {/* Result */}
        {lastResult && (
          <motion.div
            key={lastResult.won}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`shrink-0 px-8 py-2.5 rounded-2xl font-black text-base uppercase tracking-wider border ${lastResult.won > 0 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-white/5 text-white/40 border-white/10"}`}
          >
            {lastResult.won > 0 ? `${lastResult.label} · +${fmtCoins(lastResult.won)} ${COIN}` : t("unlucky")}
          </motion.div>
        )}

        {/* Max mult label */}
        <p className="shrink-0 text-[11px] text-white/35 font-bold uppercase tracking-widest">
          {t("max_multiplier_label")}: <span style={{ color: ACCENT }}>{Math.max(...(config?.wheelSegments?.map((s: any) => s.multiplier) || [0]))}×</span>
        </p>

        {/* Bet */}
        <div className="shrink-0 w-full">
          <BetSelector value={bet} onChange={setBet} min={config?.minBet ?? 1} max={user?.coins ?? 0} disabled={spinning} />
        </div>

        {/* Spin button */}
        <button
          onClick={handleSpin}
          disabled={spinning || !user || (user?.coins ?? 0) < bet}
          className="shrink-0 w-full h-16 rounded-2xl font-black text-xl uppercase tracking-widest disabled:opacity-35 active:scale-[0.98] transition-all"
          style={{
            background: !spinning ? `linear-gradient(135deg, ${ACCENT}, #2563eb)` : "rgba(255,255,255,0.07)",
            boxShadow: !spinning ? `0 0 40px ${ACCENT}65, 0 0 90px ${ACCENT}22` : undefined,
            color: !spinning ? "#fff" : "rgba(255,255,255,0.3)",
          }}
        >
          {spinning ? `⟳ ${t("spinning")}` : t("spin_btn")}
        </button>
      </div>
    </GameLayout>
  );
}
