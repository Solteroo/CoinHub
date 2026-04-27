import { Layout } from "@/components/layout/Layout";
import {
  useGetLeaderboard,
  getGetLeaderboardQueryKey,
  useGetMe,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { Avatar } from "@/components/Avatar";
import { OwnerBadge } from "@/components/OwnerBadge";
import { fmtCoins, cn } from "@/lib/utils";
import { Trophy, Crown } from "lucide-react";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const { data: leaderboard = [] } = useGetLeaderboard({ query: { queryKey: getGetLeaderboardQueryKey() } });
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <Layout>
      <div className="p-4 space-y-6 pb-24">
        <div className="text-center pt-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-3 border-2 border-primary/30 gold-glow"
          >
            <Trophy className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-black italic gold-text-gradient uppercase tracking-tighter">Lider tagtasy</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Iň uly oýunçylar</p>
        </div>

        {/* Podium */}
        {top3.length > 0 && (
          <div className="grid grid-cols-3 items-end gap-2 mt-4 mb-4">
            {/* 2nd */}
            <PodiumSpot rank={2} entry={top3[1]} isMe={top3[1]?.publicId === user?.publicId} />
            {/* 1st (taller) */}
            <PodiumSpot rank={1} entry={top3[0]} isMe={top3[0]?.publicId === user?.publicId} primary />
            {/* 3rd */}
            <PodiumSpot rank={3} entry={top3[2]} isMe={top3[2]?.publicId === user?.publicId} />
          </div>
        )}

        {/* Rest */}
        <div className="space-y-2">
          {rest.map((entry, idx) => {
            const isMe = entry.publicId === user?.publicId;
            const rank = idx + 4;
            return (
              <Link key={entry.publicId} href={`/u/${entry.publicId}`}>
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl border transition-all active:scale-[0.99]",
                    isMe ? "bg-primary/10 border-primary/50 gold-glow" : "bg-card/50 border-primary/10",
                  )}
                >
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs bg-background text-muted-foreground tabular-nums">
                    {rank}
                  </span>
                  <Avatar username={entry.username} color={entry.avatarColor} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={cn("font-bold truncate", isMe ? "text-primary" : "text-white")}>{entry.username}</p>
                      {entry.isAdmin && <OwnerBadge size="xs" />}
                      {isMe && <span className="text-[8px] font-black bg-primary text-black px-1 py-0.5 rounded uppercase">SIZ</span>}
                    </div>
                    <p className="text-[9px] font-mono text-muted-foreground">#{entry.publicId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-primary tabular-nums text-sm">{fmtCoins(entry.coins)}</p>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest">TMT</p>
                  </div>
                </motion.div>
              </Link>
            );
          })}
          {leaderboard.length === 0 && (
            <div className="text-center py-16 text-xs font-bold uppercase tracking-widest text-muted-foreground border-2 border-dashed border-primary/10 rounded-2xl">
              Sanaw boş
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function PodiumSpot({ rank, entry, isMe, primary }: { rank: number; entry?: any; isMe?: boolean; primary?: boolean }) {
  if (!entry) return <div />;
  const heightCls = primary ? "h-32" : rank === 2 ? "h-24" : "h-20";
  const colorCls = primary ? "from-primary/40 to-primary/10 border-primary" : rank === 2 ? "from-slate-400/30 to-slate-400/5 border-slate-400/50" : "from-amber-700/30 to-amber-700/5 border-amber-700/60";
  const numColor = primary ? "bg-primary text-black" : rank === 2 ? "bg-slate-400 text-black" : "bg-amber-700 text-white";

  return (
    <Link href={`/u/${entry.publicId}`}>
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: rank * 0.1, type: "spring" }}
        className="flex flex-col items-center gap-2 active:scale-95"
      >
        <div className="relative">
          {primary && <Crown className="w-5 h-5 text-primary absolute -top-3 left-1/2 -translate-x-1/2" />}
          <Avatar username={entry.username} color={entry.avatarColor} size={primary ? "lg" : "md"} className={primary ? "ring-2 ring-primary" : ""} />
        </div>
        <div className="text-center w-full px-1">
          <p className={cn("font-black text-xs truncate", isMe ? "text-primary" : "text-white")}>{entry.username}</p>
          <p className="text-[10px] font-black text-primary tabular-nums">{fmtCoins(entry.coins)}</p>
        </div>
        <div className={cn("w-full rounded-t-xl border bg-gradient-to-t flex items-start justify-center pt-2", heightCls, colorCls)}>
          <span className={cn("w-7 h-7 rounded-full flex items-center justify-center font-black text-sm", numColor)}>
            {rank}
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
