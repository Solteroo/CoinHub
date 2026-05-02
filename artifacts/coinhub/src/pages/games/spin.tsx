import { Layout } from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { usePlaySpin, useGetGamesConfig, useGetMe, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { BetSelector } from "@/components/BetSelector";
import confetti from "canvas-confetti";
import { useI18n } from "@/i18n";

export default function SpinGame() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: config } = useGetGamesConfig();
  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
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

    controls.start({
      rotate: [0, 1080],
      transition: { duration: 1.5, ease: "linear", repeat: Infinity },
    });

    playSpin.mutate({ data: { bet } }, {
      onSuccess: async (result) => {
        const segments = config?.wheelSegments ?? [];
        const segmentCount = segments.length || 12;
        const segmentAngle = 360 / segmentCount;
        const targetSegment = result.segmentIndex ?? 0;
        const fullTurns = 6;
        const finalRotation = (fullTurns * 360) + (360 - (targetSegment * segmentAngle + segmentAngle / 2));

        controls.stop();
        await controls.start({
          rotate: finalRotation,
          transition: { duration: 5, ease: [0.15, 0, 0.15, 1] },
        });

        if (result.won > 0) {
          if (result.multiplier >= 10) {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          }
          toast({ title: t("congrats"), description: `${result.label} ${t("won_multiplier_msg").replace("multipliýator! teňňe gazandyňyz!", "")} ${result.won} TMT` });
        } else {
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
    <Layout hideNav>
      <div className="p-4 flex flex-col items-center min-h-[calc(100vh-80px)] pb-24">
        <div className="w-full flex justify-start mb-6">
          <Link href="/games" className="text-muted-foreground hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4" /> {t("back_btn")}
          </Link>
        </div>

        <h1 className="text-3xl font-black italic gold-text-gradient uppercase tracking-tighter mb-6">{t("game_spin_title")}</h1>

        <div className="w-full max-w-sm mb-6 bg-card/50 border border-primary/10 rounded-2xl p-4 text-xs text-muted-foreground">
          <p className="font-bold text-white mb-1 uppercase tracking-widest text-[10px]">{t("how_to_play")}</p>
          <p>{t("bet_amount")}. <span className="text-primary font-bold">{t("spin_btn")}</span>.</p>
        </div>

        <div className="relative w-80 h-80 mb-12">
          <div className="absolute -inset-4 border-8 border-primary/20 rounded-full gold-glow" />
          <div className="absolute top-[-25px] left-1/2 -translate-x-1/2 z-30 filter drop-shadow-[0_0_10px_rgba(212,175,55,0.8)]">
            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-primary" />
          </div>

          <motion.div
            animate={controls}
            className="w-full h-full rounded-full border-4 border-primary/50 relative overflow-hidden bg-background shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            style={{ transformOrigin: "center" }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {segments.length > 0 ? segments.map((seg, i) => {
                const startAngle = i * segmentAngle;
                const endAngle = startAngle + segmentAngle;
                const x1 = 50 + 50 * Math.cos(Math.PI * startAngle / 180);
                const y1 = 50 + 50 * Math.sin(Math.PI * startAngle / 180);
                const x2 = 50 + 50 * Math.cos(Math.PI * endAngle / 180);
                const y2 = 50 + 50 * Math.sin(Math.PI * endAngle / 180);
                return (
                  <g key={i}>
                    <path
                      d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                      fill={seg.color}
                      stroke="rgba(0,0,0,0.2)"
                      strokeWidth="0.5"
                    />
                    <text
                      x="75" y="50" fill="white" fontSize="3.5" fontWeight="900"
                      textAnchor="middle" dominantBaseline="middle"
                      transform={`rotate(${startAngle + segmentAngle / 2}, 50, 50)`}
                      className="uppercase tracking-tighter"
                    >
                      {seg.label}
                    </text>
                  </g>
                );
              }) : <circle cx="50" cy="50" r="45" fill="#1a1a24" />}
              <circle cx="50" cy="50" r="8" fill="#0a0a0f" stroke="#D4AF37" strokeWidth="2" />
              <circle cx="50" cy="50" r="3" fill="#D4AF37" />
            </svg>
          </motion.div>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <BetSelector value={bet} onChange={setBet} min={config?.minBet ?? 1} max={user?.coins ?? 0} disabled={spinning} />

          <Button
            onClick={handleSpin}
            disabled={spinning || !user || user.coins < bet}
            className="w-full h-16 text-2xl gold-gradient text-black font-black uppercase italic tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all"
          >
            {spinning ? t("spinning") : t("spin_btn")}
          </Button>

          <p className="text-[10px] text-center text-muted-foreground uppercase tracking-[0.3em] font-bold">
            {t("max_multiplier_label")}: {Math.max(...(config?.wheelSegments?.map(s => s.multiplier) || [0]))}x
          </p>
        </div>
      </div>
    </Layout>
  );
}
