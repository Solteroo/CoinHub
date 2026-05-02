import { Layout } from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { usePlaySlot, useGetGamesConfig, useGetMe, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { BetSelector } from "@/components/BetSelector";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

const REEL_COUNT = 3;

export default function SlotGame() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: config } = useGetGamesConfig();
  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState<string[]>(["?", "?", "?"]);
  const [history, setHistory] = useState<any[]>([]);
  const { t } = useI18n();

  const playSlot = usePlaySlot();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reelControls = [useAnimation(), useAnimation(), useAnimation()];

  useEffect(() => {
    if (config?.minBet && bet < config.minBet) setBet(config.minBet);
  }, [config]);

  const handleSpin = async () => {
    if (spinning || !user || bet > user.coins || bet < (config?.minBet ?? 1)) return;

    setSpinning(true);

    reelControls.forEach((controls, i) => {
      controls.start({
        y: [0, -1000],
        transition: { duration: 0.2, repeat: Infinity, ease: "linear", delay: i * 0.1 },
      });
    });

    playSlot.mutate({ data: { bet } }, {
      onSuccess: async (result) => {
        await new Promise(resolve => setTimeout(resolve, 1000));

        for (let i = 0; i < REEL_COUNT; i++) {
          await reelControls[i].start({
            y: [-1000, 0],
            transition: { duration: 0.5, ease: "backOut" },
          });
          setReels(prev => {
            const next = [...prev];
            next[i] = result.symbols[i];
            return next;
          });
        }

        if (result.won > 0) {
          if (result.outcome === "jackpot") {
            confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 }, colors: ['#D4AF37', '#F3E5AB', '#ffffff'] });
          } else if (result.multiplier >= 10) {
            confetti({ particleCount: 100, spread: 50, origin: { y: 0.6 } });
          }
          toast({ title: result.label, description: `${result.won} TMT (${result.multiplier}x)` });
        }

        setHistory(prev => [result, ...prev].slice(0, 5));
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
        setSpinning(false);
      },
      onError: (err: any) => {
        reelControls.forEach(c => c.stop());
        setSpinning(false);
        toast({ title: t("error"), description: err.message, variant: "destructive" });
      },
    });
  };

  return (
    <Layout hideNav>
      <div className="p-4 flex flex-col items-center min-h-[calc(100vh-80px)] pb-24">
        <div className="w-full flex justify-start mb-6">
          <Link href="/games" className="text-muted-foreground hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4" /> {t("back_btn")}
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black italic gold-text-gradient uppercase tracking-tighter drop-shadow-sm">{t("game_slot_title")}</h1>
          <div className="h-1 w-24 bg-primary mx-auto mt-1 rounded-full opacity-50" />
        </div>

        <div className="relative w-full max-w-sm aspect-[4/3] bg-card border-8 border-primary/30 rounded-[2rem] gold-glow-strong shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_40px_rgba(212,175,55,0.2)] flex items-center justify-center p-4 overflow-hidden mb-8">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <div className="grid grid-cols-3 gap-3 w-full h-full relative z-10">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-background/80 rounded-xl border-2 border-primary/10 overflow-hidden relative">
                <motion.div
                  animate={reelControls[i]}
                  className="absolute inset-0 flex items-center justify-center text-5xl font-black"
                >
                  <span className={cn("drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]", reels[i] === "7" ? "text-red-500" : "gold-text-gradient")}>
                    {reels[i]}
                  </span>
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <BetSelector value={bet} onChange={setBet} min={config?.minBet ?? 1} max={user?.coins ?? 0} disabled={spinning} />

          <Button
            onClick={handleSpin}
            disabled={spinning || !user || user.coins < bet}
            className="w-full h-16 text-2xl gold-gradient text-black font-black uppercase italic tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {spinning ? t("spinning") : t("spin_btn")}
          </Button>

          {history.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">{t("recent_games")}</p>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {history.map((h, i) => (
                  <div key={i} className="flex-shrink-0 bg-card/50 border border-primary/10 p-2 rounded-lg flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {h.symbols.map((s: string, j: number) => <span key={j} className="text-xs font-bold text-primary">{s}</span>)}
                    </div>
                    <span className={cn("text-[10px] font-bold", h.won > 0 ? "text-emerald-500" : "text-muted-foreground")}>
                      {h.won > 0 ? `+${h.won}` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="paytable" className="border-primary/10">
              <AccordionTrigger className="text-xs font-bold uppercase tracking-widest text-primary/70 hover:text-primary transition-colors">{t("payout_table")}</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <PayRow label="7-7-7" value="150x" isGold />
                <PayRow label="★-★-★" value="30x" />
                <PayRow label="♦-♦-♦" value="12x" />
                <PayRow label="♥-♥-♥" value="6x" />
                <PayRow label="♣-♣-♣" value="3.5x" />
                <PayRow label="BAR-BAR-BAR" value="2.2x" />
                <PayRow label={t("any_two")} value="1.3x" />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </Layout>
  );
}

function PayRow({ label, value, isGold }: { label: string; value: string; isGold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[10px] font-bold">
      <span className={cn("uppercase tracking-wider", isGold ? "gold-text-gradient" : "text-muted-foreground")}>{label}</span>
      <span className={isGold ? "text-primary" : "text-white"}>{value}</span>
    </div>
  );
}
