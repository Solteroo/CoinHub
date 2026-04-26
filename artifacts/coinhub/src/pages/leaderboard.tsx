import { Layout } from "@/components/layout/Layout";
import { useGetLeaderboard, getGetLeaderboardQueryKey, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { fmtCoins, cn } from "@/lib/utils";
import { Trophy, Medal } from "lucide-react";

export default function Leaderboard() {
  const { data: leaderboard = [] } = useGetLeaderboard({ query: { queryKey: getGetLeaderboardQueryKey() } });
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });

  return (
    <Layout>
      <div className="p-4 space-y-6">
        <div className="text-center mb-6 pt-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 gold-glow">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold gold-text-gradient">Lider tagtasy</h1>
          <p className="text-sm text-muted-foreground mt-1">Iň köp teňňesi bolan oýunçylar</p>
        </div>

        <div className="space-y-2">
          {leaderboard.map((entry, idx) => {
            const isMe = entry.publicId === user?.publicId;
            return (
              <div 
                key={entry.publicId} 
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all",
                  isMe ? "bg-primary/10 border-primary gold-glow" : "bg-card/50 border-primary/10",
                  idx < 3 ? "p-5" : ""
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    idx === 0 ? "bg-[#FFD700] text-black" : 
                    idx === 1 ? "bg-[#C0C0C0] text-black" : 
                    idx === 2 ? "bg-[#CD7F32] text-black" : 
                    "bg-background/50 text-muted-foreground"
                  )}>
                    {idx < 3 ? <Medal className="w-4 h-4" /> : entry.rank}
                  </div>
                  <div>
                    <p className={cn("font-bold", isMe ? "text-primary" : "text-white")}>
                      {entry.username} {isMe && "(Siz)"}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{entry.publicId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary tabular-nums">{fmtCoins(entry.coins)}</p>
                </div>
              </div>
            );
          })}

          {leaderboard.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-primary/20 rounded-2xl">
              Sanaw boş
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
