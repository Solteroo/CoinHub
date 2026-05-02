import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { motion, useAnimation } from "framer-motion";
import {
  usePlayCrash,
  useGetMe,
  getGetMeQueryKey,
  getGetMyTransactionsQueryKey,
  getGetMyStatsQueryKey,
  getGetLeaderboardQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Rocket } from "lucide-react";
import { Link } from "wouter";
import { BetSelector } from "@/components/BetSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { useI18n } from "@/i18n";

export default function CrashGame() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const [bet, setBet] = useState(10);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [playing, setPlaying] = useState(false);
  const [multiplier, setMultiplier] = useState(1.0);
  const [history, setHistory] = useState<any[]>([]);
  const [status, setStatus] = useState<"idle" | "running" | "crashed" | "cashed">("idle");

  const playCrash = usePlayCrash();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();
  const rocketControls = useAnimation();

  const QUICK_CASHOUTS = [1.5, 2.0, 3.0, 5.0, 10.0, 25.0, 50.0];

  const handleStart = async () => {
    if (playing || !user || bet > user.coins || bet < 10) return;

    setPlaying(true);
    setStatus("running");
    setMultiplier(1.0);

    playCrash.mutate({ data: { bet, autoCashout } }, {
      onSuccess: async (res) => {
        const target = Math.min(res.crashAt, res.autoCashout);
        const DURATION_MS = 800 + Math.log(target) * 1500;
        const startTime = Date.now();

        rocketControls.start({
          x: ["0%", "80%"],
          y: ["0%", "-80%"],
          transition: { duration: DURATION_MS / 1000, ease: "easeIn" },
        });

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const t = Math.min(1, elapsed / DURATION_MS);
          const currentM = Math.pow(target, t);
          setMultiplier(currentM);
          if (t < 1) {
            requestAnimationFrame(animate);
          } else {
            finalizeGame(res);
          }
        };
        requestAnimationFrame(animate);
      },
      onError: (err: any) => {
        setPlaying(false);
        setStatus("idle");
        toast({ title: t("error"), description: err.message, variant: "destructive" });
      },
    });
  };

  const finalizeGame = (res: any) => {
    setHistory(prev => [res, ...prev].slice(0, 5));

    if (res.cashedOut) {
      setStatus("cashed");
      setMultiplier(res.autoCashout);
      if (res.multiplier >= 5) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      toast({ title: t("hot_win"), description: `+${res.netChange} TMT` });
    } else {
      setStatus("crashed");
      setMultiplier(res.crashAt);
      toast({ title: t("crashed_toast"), description: `-${res.bet} TMT`, variant: "destructive" });
    }

    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
    setPlaying(false);
  };

  return (
    <Layout hideNav>
      <div className="p-4 flex flex-col items-center min-h-[calc(100vh-80px)] pb-24">
        <div className="w-full flex justify-start mb-6">
          <Link href="/games" className="text-muted-foreground hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4" /> {t("back_btn")}
          </Link>
        </div>

        <h1 className="text-3xl font-black italic gold-text-gradient uppercase tracking-tighter mb-4 text-center">{t("game_crash_title")}</h1>

        <div className="w-full max-w-sm mb-4 bg-card/50 border border-primary/10 rounded-2xl p-4 text-xs text-muted-foreground">
          <p className="font-bold text-white mb-1 uppercase tracking-widest text-[10px]">{t("how_to_play")}</p>
          <p>{t("auto_cashout")} → <span className="text-primary font-bold">{t("start_btn")}</span></p>
        </div>

        <div className={cn(
          "w-full max-w-sm aspect-square bg-card border-2 border-primary/20 rounded-3xl relative overflow-hidden mb-8 flex items-center justify-center shadow-2xl",
          status === "crashed" && "animate-[shake_0.5s_ease-in-out]",
        )}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

          <div className="relative z-20 text-center">
            <motion.div
              key={status}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "text-6xl font-black tabular-nums drop-shadow-2xl",
                status === "running" ? "gold-text-gradient" :
                status === "cashed" ? "text-emerald-500" :
                status === "crashed" ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {multiplier.toFixed(2)}x
            </motion.div>
            {status === "cashed" && (
              <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-emerald-500 font-bold uppercase tracking-widest mt-2">
                {t("you_won")}
              </motion.p>
            )}
            {status === "crashed" && (
              <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-destructive font-bold uppercase tracking-widest mt-2">
                {t("crashed_label")}
              </motion.p>
            )}
          </div>

          <motion.div
            animate={status === "idle" ? { y: [0, -10, 0] } : rocketControls}
            transition={status === "idle" ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : undefined}
            className="absolute bottom-10 left-10 z-10"
          >
            <Rocket className={cn(
              "w-12 h-12 transition-colors",
              status === "running" ? "text-primary animate-pulse" :
              status === "cashed" ? "text-emerald-500" :
              status === "crashed" ? "text-destructive rotate-45" : "text-primary/40",
            )} />
            {status === "running" && (
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4 h-8 bg-gradient-to-t from-transparent to-orange-500/50 blur-sm rounded-full" />
            )}
          </motion.div>

          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: 'linear-gradient(to right, #D4AF37 1px, transparent 1px), linear-gradient(to bottom, #D4AF37 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          />
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">{t("bet_amount")}</p>
            <BetSelector value={bet} onChange={setBet} min={10} max={user?.coins ?? 0} disabled={playing} />
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">{t("auto_cashout")}</p>
            <div className="flex gap-2">
              <Input
                type="number" step="0.1" min="1.1" max="50"
                value={autoCashout}
                onChange={(e) => setAutoCashout(Math.min(50, Math.max(1.1, parseFloat(e.target.value) || 1.1)))}
                disabled={playing}
                className="bg-card border-primary/20 font-bold h-10 w-24 text-center"
              />
              <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                {QUICK_CASHOUTS.map(val => (
                  <button
                    key={val}
                    onClick={() => setAutoCashout(val)}
                    disabled={playing}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap",
                      autoCashout === val ? "bg-primary text-black border-primary" : "bg-card border-primary/10 text-muted-foreground hover:border-primary/30",
                    )}
                  >
                    {val}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={handleStart}
            disabled={playing || !user || user.coins < bet}
            className="w-full h-16 text-2xl gold-gradient text-black font-black uppercase italic tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all"
          >
            {playing ? t("in_flight") : t("start_btn")}
          </Button>

          {history.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">{t("recent_rounds")}</p>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {history.map((h, i) => (
                  <div key={i} className={cn(
                    "flex-shrink-0 px-3 py-1.5 rounded-xl border text-xs font-black tabular-nums",
                    h.cashedOut ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-destructive/10 border-destructive/20 text-destructive",
                  )}>
                    {h.cashedOut ? h.autoCashout.toFixed(2) : h.crashAt.toFixed(2)}x
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>
    </Layout>
  );
}
