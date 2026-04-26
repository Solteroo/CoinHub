import { Layout } from "@/components/layout/Layout";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayTap, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Logo } from "@/components/Logo";

export default function TapGame() {
  const [taps, setTaps] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [particles, setParticles] = useState<{id: number, x: number, y: number}[]>([]);
  const particleIdRef = useRef(0);
  
  const playTap = usePlayTap();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Timer logic
  useEffect(() => {
    if (!playing || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(l => l - 1), 1000);
    return () => clearInterval(t);
  }, [playing, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && playing) {
      submitTaps();
    }
  }, [timeLeft, playing]);

  const handleTap = (e: React.MouseEvent) => {
    if (timeLeft <= 0) return;
    if (!playing) setPlaying(true);
    
    if (taps < 200) {
      setTaps(t => t + 1);
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const id = particleIdRef.current++;
      setParticles(p => [...p, { id, x, y }]);
      
      setTimeout(() => {
        setParticles(p => p.filter(part => part.id !== id));
      }, 1000);
    }
  };

  const submitTaps = () => {
    if (taps === 0) {
      setPlaying(false);
      setTimeLeft(10);
      return;
    }
    
    setPlaying(false);
    
    playTap.mutate({ data: { taps } }, {
      onSuccess: (res) => {
        toast({ title: "Berekella!", description: `Siz ${res.won} teňňe gazandyňyz!` });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
        setTaps(0);
        setTimeLeft(10);
      },
      onError: (err: any) => {
        toast({ title: "Ýalňyşlyk", description: err.message, variant: "destructive" });
        setTaps(0);
        setTimeLeft(10);
      }
    });
  };

  return (
    <Layout hideNav>
      <div className="p-4 flex flex-col items-center min-h-[calc(100vh-80px)]">
        <div className="w-full flex justify-between items-center mb-8">
          <Link href="/games" className="text-muted-foreground hover:text-white flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Yza gaýt
          </Link>
          <div className="text-xl font-mono text-primary font-bold bg-primary/10 px-4 py-1 rounded-full">
            00:{timeLeft.toString().padStart(2, '0')}
          </div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2 tabular-nums">{taps}</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest">Basmaklar</p>
        </div>

        <div className="flex-1 flex items-center justify-center w-full">
          <motion.div
            whileTap={timeLeft > 0 ? { scale: 0.9 } : {}}
            onClick={handleTap}
            className="relative w-64 h-64 rounded-full flex items-center justify-center select-none touch-none"
          >
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative z-10 w-48 h-48 bg-card border-4 border-primary rounded-full flex items-center justify-center gold-glow-strong shadow-[inset_0_0_20px_rgba(212,175,55,0.5)]">
               <Logo className="w-24 h-24" />
            </div>

            <AnimatePresence>
              {particles.map(p => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 1, y: p.y, x: p.x, scale: 0.5 }}
                  animate={{ opacity: 0, y: p.y - 100, scale: 1.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute text-primary font-bold text-2xl z-50 pointer-events-none drop-shadow-[0_0_5px_rgba(212,175,55,1)]"
                  style={{ left: 0, top: 0 }}
                >
                  +1
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

        {playing && (
          <Button 
            onClick={submitTaps} 
            disabled={playTap.isPending}
            variant="outline"
            className="mt-8 border-destructive text-destructive hover:bg-destructive hover:text-white"
          >
            Sakla we Al
          </Button>
        )}
      </div>
    </Layout>
  );
}
