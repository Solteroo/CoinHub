import { Layout } from "@/components/layout/Layout";
import { useGetMe, getGetMeQueryKey, useGetMyTransactions, getGetMyTransactionsQueryKey } from "@workspace/api-client-react";
import { CoinCounter } from "@/components/ui/coin-counter";
import { fmtCoins, fmtDate, cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useState } from "react";

export default function Wallet() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: transactions = [] } = useGetMyTransactions({ query: { queryKey: getGetMyTransactionsQueryKey() } });
  
  const [filter, setFilter] = useState<"all"|"in"|"out">("all");

  const filteredTxs = transactions.filter(t => {
    if (filter === "in") return t.amount > 0;
    if (filter === "out") return t.amount < 0;
    return true;
  });

  return (
    <Layout>
      <div className="p-4 space-y-6 pb-24">
        
        <div className="bg-card border border-primary/20 rounded-3xl p-8 text-center relative overflow-hidden gold-glow shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full pointer-events-none" />
          <p className="text-xs text-primary/80 uppercase tracking-[0.2em] font-bold mb-3 relative z-10">Jemi Balans</p>
          <div className="flex items-center justify-center gap-2 relative z-10">
            <CoinCounter value={user?.coins || 0} className="text-5xl font-bold gold-text-gradient" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-lg font-black italic text-white uppercase tracking-tight">Amal taryhy</h2>
            <div className="flex bg-card rounded-xl p-1 border border-primary/10">
              <button 
                onClick={() => setFilter("all")} 
                className={cn("px-4 py-1.5 text-[10px] rounded-lg font-bold uppercase tracking-wider transition-all", filter==="all" ? "bg-primary text-black shadow-lg" : "text-muted-foreground")}
              >Ähli</button>
              <button 
                onClick={() => setFilter("in")} 
                className={cn("px-4 py-1.5 text-[10px] rounded-lg font-bold uppercase tracking-wider transition-all", filter==="in" ? "bg-primary text-black shadow-lg" : "text-muted-foreground")}
              >Giren</button>
              <button 
                onClick={() => setFilter("out")} 
                className={cn("px-4 py-1.5 text-[10px] rounded-lg font-bold uppercase tracking-wider transition-all", filter==="out" ? "bg-primary text-black shadow-lg" : "text-muted-foreground")}
              >Çykan</button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredTxs.length === 0 ? (
              <div className="text-center py-12 text-xs font-bold uppercase tracking-widest text-muted-foreground border border-dashed border-primary/10 rounded-3xl">
                Hiç hili amal ýok
              </div>
            ) : (
              filteredTxs.map(tx => (
                <div key={tx.id} className="bg-card/40 border border-primary/5 rounded-2xl p-4 flex items-center justify-between group hover:bg-card/60 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                      tx.amount > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                    )}>
                      {tx.amount > 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{translateReason(tx.source)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{fmtDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-black text-sm tabular-nums tracking-tight",
                    tx.amount > 0 ? "text-emerald-500" : "text-white/80"
                  )}>
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
    admin_add: "Admin goşdy",
    admin_remove: "Admin aýyrdy",
  };
  return map[source] || source;
}
