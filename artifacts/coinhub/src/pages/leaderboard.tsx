import { Layout } from "@/components/layout/Layout";
import { useGetLeaderboard, getGetLeaderboardQueryKey, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { fmtCoins, cn } from "@/lib/utils";
import { Trophy, Medal } from "lucide-react";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const { data: leaderboard = [] } = useGetLeaderboard({ query: { queryKey: getGetLeaderboardQueryKey() } });
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });

  return (
    <Layout>
      <div className="p-4 space-y-6 pb-24">
        <div className="text-center mb-8 pt-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6 border-2 border-primary/20 gold-glow shadow-[0_0_30px_rgba(212,175,55,0.2)]"
          >
            <Trophy className="w-10 h-10 text-primary drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
          </motion.div>
          <h1 className="text-3xl font-black italic gold-text-gradient uppercase tracking-tighter">LIDER TAGTASY</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2">Iň uly oýunçylar sanawy</p>
        </div>

        <div className="space-y-3">
          {leaderboard.map((entry, idx) => {
            const isMe = entry.publicId === user?.publicId;
            return (
              <motion.div 
                key={entry.publicId} 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "flex items-center justify-between p-5 rounded-2xl border transition-all duration-300",
                  isMe ? "bg-primary/10 border-primary gold-glow scale-[1.02] z-10" : "bg-card/40 border-primary/5",
                  idx === 0 ? "p-6 border-primary/40 bg-gradient-to-r from-primary/10 to-transparent" : ""
                )}
              >
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-transform",
                    idx === 0 ? "bg-primary text-black scale-110 shadow-lg" : 
                    idx === 1 ? "bg-slate-400 text-black" : 
                    idx === 2 ? "bg-amber-700 text-black" : 
                    "bg-background/80 text-muted-foreground"
                  )}>
                    {idx < 3 ? <Medal className="w-6 h-6" /> : entry.rank}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <p className={cn("font-black uppercase italic tracking-tight", isMe ? "text-primary" : "text-white")}>
                         {entry.username}
                       </p>
                       {isMe && <span className="text-[8px] font-black bg-primary text-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Siz</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-black tracking-widest mt-0.5 opacity-60">#ID {entry.publicId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary tabular-nums tracking-tighter text-lg">{fmtCoins(entry.coins)}</p>
                </div>
              </motion.div>
            );
          })}

          {leaderboard.length === 0 && (
            <div className="text-center py-16 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-2 border-dashed border-primary/10 rounded-[2rem]">
              Sanaw boş
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
