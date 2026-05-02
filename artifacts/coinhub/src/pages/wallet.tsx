import { Layout } from "@/components/layout/Layout";
import { Link, useLocation } from "wouter";
import {
  useGetMe,
  getGetMeQueryKey,
  useGetMyTransactions,
  getGetMyTransactionsQueryKey,
  useGetAdminOwner,
  getGetAdminOwnerQueryKey,
} from "@workspace/api-client-react";
import { CoinCounter } from "@/components/ui/coin-counter";
import { fmtCoins, fmtDateShort, cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, MessageCircle, Crown, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function Wallet() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: transactions = [] } = useGetMyTransactions({ query: { queryKey: getGetMyTransactionsQueryKey() } });
  const { data: owner } = useGetAdminOwner({ query: { queryKey: getGetAdminOwnerQueryKey() } });
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");

  const filteredTxs = transactions.filter((t) => {
    if (filter === "in") return t.amount > 0;
    if (filter === "out") return t.amount < 0;
    return true;
  });

  const goAdmin = () => {
    if (owner) setLocation(`/dm/${owner.id}`);
    else setLocation("/vip");
  };

  return (
    <Layout>
      <div className="p-4 space-y-5 pb-24">
        {/* Balance card */}
        <div className="bg-card border border-primary/20 rounded-3xl p-7 text-center relative overflow-hidden gold-glow shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full pointer-events-none" />
          <p className="text-[10px] text-primary/80 uppercase tracking-[0.25em] font-black mb-2 relative z-10">Jemi balans</p>
          <div className="flex items-baseline gap-2 justify-center relative z-10">
            <CoinCounter value={user?.coins || 0} className="text-5xl font-black gold-text-gradient" />
            <span className="text-xl font-black gold-text-gradient">TMT</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/transfer">
            <button className="w-full h-14 rounded-2xl gold-gradient text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-[0.98]">
              <ArrowRightLeft className="w-4 h-4" />
              TMT geçir
            </button>
          </Link>
          <button onClick={goAdmin} className="w-full h-14 rounded-2xl bg-card border border-primary/30 text-primary font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-primary/10">
            <MessageCircle className="w-4 h-4" />
            Admin
          </button>
        </div>

        {/* Tennaniz azaldymy banner */}
        <button onClick={goAdmin} className="w-full bg-gradient-to-r from-primary/15 via-card to-primary/15 border border-primary/40 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.99] gold-glow">
          <div className="w-10 h-10 rounded-xl bg-primary text-black flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-black text-white text-sm uppercase tracking-tight">Teňňäňiz azaldymy?</p>
            <p className="text-[11px] text-muted-foreground">Admin bilen göni habarlaşyň, çözeris</p>
          </div>
        </button>

        {/* VIP card */}
        <Link href="/vip">
          <div className="bg-card border border-primary/30 rounded-2xl p-5 flex items-center gap-4 active:scale-[0.99] gold-glow relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Crown className="w-24 h-24 text-primary" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary text-black flex items-center justify-center shrink-0 shadow-lg">
              <Crown className="w-6 h-6" />
            </div>
            <div className="flex-1 relative">
              <p className="font-black text-white text-sm uppercase tracking-tight">VIP sargyt</p>
              <p className="text-[11px] text-muted-foreground">Premium mümkinçilikler we goşmaça TMT</p>
            </div>
          </div>
        </Link>

        {/* Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-base font-black italic text-white uppercase tracking-tight">Amal taryhy</h2>
            <div className="flex bg-card rounded-xl p-1 border border-primary/10">
              {(["all", "in", "out"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1.5 text-[10px] rounded-lg font-bold uppercase tracking-wider transition-all",
                    filter === f ? "bg-primary text-black shadow-lg" : "text-muted-foreground",
                  )}
                >
                  {f === "all" ? "Ähli" : f === "in" ? "Giren" : "Çykan"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filteredTxs.length === 0 ? (
              <div className="text-center py-12 text-xs font-bold uppercase tracking-widest text-muted-foreground border border-dashed border-primary/10 rounded-3xl">
                Hiç hili amal ýok
              </div>
            ) : (
              filteredTxs.map((tx) => (
                <div key={tx.id} className="bg-card/40 border border-primary/5 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center",
                      tx.amount > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive",
                    )}>
                      {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{translateReason(tx.source)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{fmtDateShort(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-black text-sm tabular-nums",
                    tx.amount > 0 ? "text-emerald-500" : "text-white/80",
                  )}>
                    {tx.amount > 0 ? "+" : ""}{fmtCoins(tx.amount)} <span className="text-[9px] opacity-60">TMT</span>
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
    bonus: "Günlük bonus",
    transfer_in: "TMT geldi",
    transfer_out: "TMT iberildi",
    register_bonus: "Hoşgeldiň bonus",
  };
  return map[source] || source;
}
