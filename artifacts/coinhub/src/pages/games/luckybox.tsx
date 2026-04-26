import { Layout } from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayLuckyBox, useGetGamesConfig, useGetMe, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, Coins } from "lucide-react";
import { Link } from "wouter";
import { BetSelector } from "@/components/BetSelector";
import { Button } from "@/components/ui/button";
import { RarityBadge } from "@/components/RarityBadge";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

export default function LuckyBoxGame() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: config } = useGetGamesConfig();
  const [bet, setBet] = useState(10);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<any>(null);
  
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
    
    playBox.mutate({ data: { bet, pickIndex: index } }, {
      onSuccess: (res) => {
        setResult(res);
        if (res.won > 0) {
          if (res.multiplier >= 10) {
            confetti({
              particleCount: 100,
              spread: 60,
              origin: { y: 0.6 }
            });
          }
          toast({
            title: res.label,
            description: `${res.won} teňňe gazandyňyz!`,
          });
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
        toast({ title: "Ýalňyşlyk", description: err.message, variant: "destructive" });
      }
    });
  };

  const reset = () => {
    if (playing) return;
    setPickedIndex(null);
    setResult(null);
  };

  return (
    <Layout hideNav>
      <div className="p-4 flex flex-col items-center min-h-[calc(100vh-80px)] pb-24">
        <div className="w-full flex justify-start mb-6">
          <Link href="/games" className="text-muted-foreground hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4" /> Yza gaýt
          </Link>
        </div>

        <h1 className="text-3xl font-black italic gold-text-gradient uppercase tracking-tighter mb-8 text-center">BAGT GUTUSY</h1>

        <div className="w-full max-w-sm mb-8">
           {pickedIndex === null ? (
             <BetSelector value={bet} onChange={setBet} min={config?.minBet ?? 1} max={user?.coins ?? 0} disabled={playing} />
           ) : (
             <div className="bg-card border border-primary/20 rounded-2xl p-4 text-center">
               <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Oýnalan goýum</p>
               <p className="text-xl font-bold text-primary">{bet}</p>
             </div>
           )}
        </div>

        <div className="text-center mb-6 h-6">
           {pickedIndex === null && (
             <p className="text-xs font-bold text-primary animate-pulse uppercase tracking-[0.2em]">GUTY SAÝLAŇ</p>
           )}
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-12">
          {Array.from({ length: 9 }).map((_, i) => {
            const isPicked = pickedIndex === i;
            const reveal = result?.boxes?.[i];
            const isRevealed = !!result;
            
            return (
              <div key={i} className="aspect-square relative">
                <AnimatePresence mode="wait">
                  {!isRevealed ? (
                    <motion.div
                      key="closed"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOpen(i)}
                      className={cn(
                        "w-full h-full rounded-2xl border-2 flex flex-col items-center justify-center bg-card gold-glow cursor-pointer transition-colors",
                        isPicked ? "border-primary" : "border-primary/20 hover:border-primary/40"
                      )}
                    >
                      <Lock className="w-8 h-8 text-primary/40" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="revealed"
                      initial={{ rotateY: 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      transition={{ delay: i * 0.07 }}
                      className={cn(
                        "w-full h-full rounded-2xl border-2 flex flex-col items-center justify-center bg-card overflow-hidden transition-all",
                        isPicked 
                          ? "border-primary bg-primary/10 scale-110 z-10 gold-glow-strong shadow-[0_0_20px_rgba(212,175,55,0.3)]" 
                          : "border-primary/10 opacity-60"
                      )}
                    >
                      {reveal && (
                        <>
                          <Coins className={cn("w-4 h-4 mb-1", reveal.multiplier > 0 ? "text-primary" : "text-muted-foreground")} />
                          <span className={cn(
                            "text-xl font-black italic tabular-nums",
                            reveal.multiplier > 0 ? "gold-text-gradient" : "text-muted-foreground"
                          )}>
                            {reveal.multiplier}x
                          </span>
                          {isPicked && <RarityBadge rarity={result.rarity} className="mt-1" />}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <AnimatePresence>
          {pickedIndex !== null && !playing && result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-sm"
            >
              <Button 
                onClick={reset}
                className="w-full h-14 bg-card border-2 border-primary/20 text-primary font-bold uppercase tracking-widest rounded-xl hover:bg-primary/10 transition-colors"
              >
                Täzeden oýna
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
