import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayLuckyBox, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Gift } from "lucide-react";
import { Link } from "wouter";

export default function LuckyBoxGame() {
  const [openedIndex, setOpenedIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const playBox = usePlayLuckyBox();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleOpen = (index: number) => {
    if (playing || openedIndex !== null) return;
    setPlaying(true);
    setOpenedIndex(index);
    
    playBox.mutate(undefined, {
      onSuccess: (res) => {
        setResult(res);
        toast({
          title: res.won > 0 ? "Berekella!" : "Gynansakda...",
          description: res.won > 0 ? `Siz ${res.won} teňňe gazandyňyz!` : "Şu gezek bagt ýok",
        });
        
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
        
        setTimeout(() => {
          setPlaying(false);
        }, 2000);
      },
      onError: (err: any) => {
        setPlaying(false);
        setOpenedIndex(null);
        toast({ title: "Ýalňyşlyk", description: err.message, variant: "destructive" });
      }
    });
  };

  const reset = () => {
    if (playing) return;
    setOpenedIndex(null);
    setResult(null);
  };

  return (
    <Layout hideNav>
      <div className="p-4 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full flex justify-start mb-8">
          <Link href="/games" className="text-muted-foreground hover:text-white flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Yza gaýt
          </Link>
        </div>

        <h1 className="text-3xl font-bold gold-text-gradient mb-12 text-center">Bagt gutusy</h1>

        <div className="grid grid-cols-2 gap-6 w-full max-w-xs mb-12">
          {[0, 1, 2, 3].map((i) => {
            const isOpened = openedIndex === i;
            const isOther = openedIndex !== null && !isOpened;
            
            return (
              <motion.div
                key={i}
                whileHover={openedIndex === null ? { scale: 1.05 } : {}}
                whileTap={openedIndex === null ? { scale: 0.95 } : {}}
                animate={isOpened ? { scale: 1.1, zIndex: 10 } : isOther ? { opacity: 0.5, scale: 0.9 } : {}}
                className={`aspect-square rounded-3xl cursor-pointer relative ${isOpened ? 'gold-glow-strong' : 'gold-glow'}`}
                onClick={() => handleOpen(i)}
              >
                <div className={`absolute inset-0 rounded-3xl border-2 transition-colors ${isOpened ? 'border-primary bg-primary/20' : 'border-primary/30 bg-card'} flex flex-col items-center justify-center overflow-hidden`}>
                  
                  <AnimatePresence mode="wait">
                    {!isOpened ? (
                      <motion.div
                        key="closed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                      >
                        <Gift className="w-16 h-16 text-primary" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="opened"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="flex flex-col items-center"
                      >
                        {result && (
                          <>
                            <span className="text-3xl font-bold gold-text-gradient mb-1 tabular-nums">
                              {result.won > 0 ? `+${result.won}` : "0"}
                            </span>
                            <span className="text-xs text-primary/80 uppercase tracking-widest">{result.rarity || "Bagt"}</span>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </motion.div>
            );
          })}
        </div>

        {openedIndex !== null && !playing && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={reset}
            className="text-primary hover:text-white transition-colors underline underline-offset-4"
          >
            Täzeden oýna
          </motion.button>
        )}
      </div>
    </Layout>
  );
}
