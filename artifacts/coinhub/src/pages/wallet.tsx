import { Layout } from "@/components/layout/Layout";
import { useGetMe, getGetMeQueryKey, useGetMyTransactions, getGetMyTransactionsQueryKey } from "@workspace/api-client-react";
import { CoinCounter } from "@/components/ui/coin-counter";
import { fmtCoins, fmtDate, cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, Filter } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
      <div className="p-4 space-y-6">
        
        <div className="bg-card border border-primary/20 rounded-3xl p-8 text-center relative overflow-hidden gold-glow shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full pointer-events-none" />
          <p className="text-sm text-primary/80 uppercase tracking-widest font-medium mb-3 relative z-10">Jemi Balans</p>
          <div className="flex items-center justify-center gap-2 relative z-10">
            <CoinCounter value={user?.coins || 0} className="text-5xl font-bold gold-text-gradient" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Amal taryhy</h2>
            <div className="flex bg-card rounded-lg p-1 border border-primary/10">
              <button 
                onClick={() => setFilter("all")} 
                className={cn("px-3 py-1 text-xs rounded-md font-medium transition-colors", filter==="all" ? "bg-primary text-black" : "text-muted-foreground")}
              >Ähli</button>
              <button 
                onClick={() => setFilter("in")} 
                className={cn("px-3 py-1 text-xs rounded-md font-medium transition-colors", filter==="in" ? "bg-primary text-black" : "text-muted-foreground")}
              >Giren</button>
              <button 
                onClick={() => setFilter("out")} 
                className={cn("px-3 py-1 text-xs rounded-md font-medium transition-colors", filter==="out" ? "bg-primary text-black" : "text-muted-foreground")}
              >Çykan</button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredTxs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-primary/20 rounded-2xl">
                Hiç hili amal ýok
              </div>
            ) : (
              filteredTxs.map(tx => (
                <div key={tx.id} className="bg-card/50 border border-primary/10 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      tx.amount > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                    )}>
                      {tx.amount > 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-white capitalize">{tx.reason}</p>
                      <p className="text-[10px] text-muted-foreground">{fmtDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-bold tabular-nums",
                    tx.amount > 0 ? "text-emerald-500" : "text-white"
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
