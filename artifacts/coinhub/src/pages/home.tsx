import { Layout } from "@/components/layout/Layout";
import { Link, useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey, useGetMyTransactions, getGetMyTransactionsQueryKey } from "@workspace/api-client-react";
import { CoinCounter } from "@/components/ui/coin-counter";
import { ChevronRight, MessageCircle, ArrowUpRight, ArrowDownLeft, Trophy, Rocket, Disc, Package, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import { fmtCoins, fmtDate, cn } from "@/lib/utils";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey() }
  });

  const { data: transactions = [] } = useGetMyTransactions({
    query: { queryKey: getGetMyTransactionsQueryKey(), enabled: !!user },
  });

  if (isLoading) return null;
  if (!user) {
    setLocation("/");
    return null;
  }

  const recentTransactions = transactions.slice(0, 5);

  return (
    <Layout>
      <div className="p-4 space-y-6 pb-24">
        
        {/* Balance Card */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card border border-primary/20 rounded-3xl p-6 text-center relative overflow-hidden gold-glow"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
          <p className="text-sm text-muted-foreground mb-1 relative z-10 font-medium uppercase tracking-widest">Balansyňyz</p>
          <div className="flex flex-col items-center justify-center relative z-10">
            <CoinCounter value={user.coins} className="text-5xl font-bold gold-text-gradient drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-bold text-white/80">{user.username}</span>
              <span className="opacity-40">|</span>
              <span className="font-mono">ID: {user.publicId}</span>
            </div>
          </div>
        </motion.div>

        {/* Support Banner */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between group"
        >
          <div>
            <h3 className="text-sm font-bold text-white">Teňňäňiz azalýar?</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Admin bilen habarlaşyp teňňe alyň</p>
          </div>
          <Link href="/profile">
            <button className="bg-primary text-black text-[10px] font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity active:scale-95">
              HABARLAŞMAK <MessageCircle className="w-3 h-3" />
            </button>
          </Link>
        </motion.div>

        {/* Game Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Oýunlar</h2>
            <Link href="/games" className="text-xs font-bold text-primary flex items-center gap-1 group">
              HEMMESI <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
             <GameHomeCard 
              title="Slot" 
              subtitle="777" 
              href="/games/slot" 
              className="bg-gradient-to-br from-purple-900/40 to-card border-purple-500/20"
              icon={LayoutGrid}
              iconColor="text-purple-400"
            />
            <GameHomeCard 
              title="Çarh" 
              subtitle="100x" 
              href="/games/spin" 
              className="bg-gradient-to-br from-blue-900/40 to-card border-blue-500/20"
              icon={Disc}
              iconColor="text-blue-400"
            />
            <GameHomeCard 
              title="Gutu" 
              subtitle="9 sandyk" 
              href="/games/luckybox" 
              className="bg-gradient-to-br from-amber-900/40 to-card border-amber-500/20"
              icon={Package}
              iconColor="text-amber-400"
            />
            <GameHomeCard 
              title="Uçuş" 
              subtitle="Crash" 
              href="/games/crash" 
              className="bg-gradient-to-br from-red-900/40 to-card border-red-500/20"
              icon={Rocket}
              iconColor="text-red-400"
            />
          </div>
        </div>

        {/* Leaderboard Link */}
        <Link href="/leaderboard">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-card border border-primary/20 rounded-2xl p-4 flex items-center justify-between gold-glow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase">Liderler tagtasy</h3>
                <p className="text-[10px] text-muted-foreground uppercase">Iň gowy oýunçylar</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-primary/50" />
          </motion.div>
        </Link>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider px-1">Soňky amallar</h2>
          <div className="space-y-2">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-primary/10 rounded-2xl">
                Amallar ýok
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="bg-card/40 border border-primary/5 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      tx.amount > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                    )}>
                      {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{translateReason(tx.source)}</p>
                      <p className="text-[10px] text-muted-foreground">{fmtDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className={cn("text-xs font-bold tabular-nums", tx.amount > 0 ? "text-emerald-500" : "text-white/80")}>
                    {tx.amount > 0 ? "+" : ""}{fmtCoins(tx.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function translateReason(source: string) {
  const map: Record<string, string> = {
    game_slot: "Slot maşyn",
    game_spin: "Bagt çarhy",
    game_luckybox: "Bagt gutusy",
    game_crash: "Bagt uçuşy",
    admin_add: "Admin goşdy",
    admin_remove: "Admin aýyrdy",
  };
  return map[source] || source;
}

function GameHomeCard({ title, subtitle, href, className, iconColor, icon: Icon }: { title: string, subtitle: string, href: string, className?: string, iconColor?: string, icon: any }) {
  return (
    <Link href={href}>
      <motion.div 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn("p-4 rounded-2xl border flex flex-col gap-3 cursor-pointer gold-glow transition-all", className)}
      >
        <div className={cn("w-10 h-10 rounded-xl bg-background/50 flex items-center justify-center", iconColor)}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-tighter italic">{title}</h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{subtitle}</p>
        </div>
      </motion.div>
    </Link>
  );
}
