import { Layout } from "@/components/layout/Layout";
import { Link, useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey, useGetDailyBonusStatus, getGetDailyBonusStatusQueryKey, useClaimDailyBonus, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { CoinCounter } from "@/components/ui/coin-counter";
import { Gift, Gamepad2, Timer, ChevronRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey() }
  });
  
  if (isLoading) return null;
  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <Layout>
      <div className="p-4 space-y-6">
        
        {/* Balance Card */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card border border-primary/20 rounded-3xl p-6 text-center relative overflow-hidden gold-glow"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
          <p className="text-sm text-muted-foreground mb-2 relative z-10">Siziň Teňňäňiz</p>
          <div className="flex items-center justify-center gap-2 relative z-10">
            <CoinCounter value={user.coins} className="text-5xl font-bold gold-text-gradient drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
          </div>
        </motion.div>

        {/* Daily Bonus */}
        <DailyBonusCard />

        {/* Quick Games */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Oýunlar</h2>
            <Link href="/games" className="text-sm text-primary hover:text-primary/80 flex items-center">
              Hemmesi <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <GameQuickCard href="/games/spin" title="Pökgi" icon={Gamepad2} />
            <GameQuickCard href="/games/luckybox" title="Bagt" icon={Gift} />
            <GameQuickCard href="/games/tap" title="Basmak" icon={Gamepad2} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function DailyBonusCard() {
  const { data: status } = useGetDailyBonusStatus({ query: { queryKey: getGetDailyBonusStatusQueryKey() } });
  const claim = useClaimDailyBonus();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!status || status.canClaim || !status.nextClaimAt) return;
    
    const updateTime = () => {
      const next = new Date(status.nextClaimAt!).getTime();
      const now = new Date().getTime();
      const diff = next - now;
      
      if (diff <= 0) {
        queryClient.invalidateQueries({ queryKey: getGetDailyBonusStatusQueryKey() });
        return;
      }
      
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    
    updateTime();
    const int = setInterval(updateTime, 1000);
    return () => clearInterval(int);
  }, [status, queryClient]);

  const handleClaim = () => {
    claim.mutate(undefined, {
      onSuccess: (res) => {
        toast({ title: "Üstünlikli", description: `Siz ${res.won} teňňe gazandyňyz!` });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDailyBonusStatusQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Ýalňyşlyk", description: err.message || "Täzeden synanyşyň", variant: "destructive" });
      }
    });
  };

  if (!status) return null;

  return (
    <motion.div 
      whileHover={{ scale: 0.98 }}
      className="bg-card border border-primary/10 rounded-2xl p-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Gift className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Günlük baýrak</h3>
          <p className="text-xs text-muted-foreground">
            {status.canClaim ? "Baýragyňyzy alyň!" : "Indiki baýrak:"}
          </p>
        </div>
      </div>
      
      {status.canClaim ? (
        <Button 
          onClick={handleClaim} 
          disabled={claim.isPending}
          className="gold-gradient text-black font-bold rounded-xl"
        >
          Almak
        </Button>
      ) : (
        <div className="flex items-center gap-1.5 text-primary/80 bg-primary/10 px-3 py-1.5 rounded-lg text-sm font-medium tabular-nums">
          <Timer className="w-4 h-4" />
          {timeLeft}
        </div>
      )}
    </motion.div>
  );
}

function GameQuickCard({ href, title, icon: Icon }: { href: string, title: string, icon: any }) {
  return (
    <Link href={href}>
      <div className="bg-card border border-primary/10 hover:border-primary/30 hover:bg-card/80 transition-colors rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer active:scale-95 group">
        <div className="w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className="text-xs font-medium text-center">{title}</span>
      </div>
    </Link>
  );
}
