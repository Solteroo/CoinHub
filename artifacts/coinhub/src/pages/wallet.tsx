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
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, MessageCircle, AlertCircle, Coins, Star } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/i18n";

export default function Wallet() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: transactions = [] } = useGetMyTransactions({ query: { queryKey: getGetMyTransactionsQueryKey() } });
  const { data: owner } = useGetAdminOwner({ query: { queryKey: getGetAdminOwnerQueryKey() } });
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");
  const { t } = useI18n();

  const filteredTxs = transactions.filter((tx) => {
    if (filter === "in") return tx.amount > 0;
    if (filter === "out") return tx.amount < 0;
    return true;
  });

  const goAdmin = () => {
    if (owner) setLocation(`/dm/${owner.id}`);
  };

  const bonusCoins = user?.bonusCoins ?? 0;
  const realCoins = user?.realCoins ?? 0;
  const totalCoins = user?.coins ?? 0;

  return (
    <Layout>
      <div className="p-4 space-y-5 pb-24">
        {/* Total Balance Card */}
        <div className="bg-card border border-primary/20 rounded-3xl p-6 text-center relative overflow-hidden gold-glow shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full pointer-events-none" />
          <p className="text-[10px] text-primary/80 uppercase tracking-[0.25em] font-black mb-2 relative z-10">{t("total_balance")}</p>
          <div className="flex items-baseline gap-2 justify-center relative z-10">
            <CoinCounter value={totalCoins} className="text-5xl font-black gold-text-gradient" />
            <span className="text-xl font-black gold-text-gradient">TMT</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 relative z-10">
            <div className="bg-background/60 rounded-2xl p-3 border border-yellow-500/30">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400">{t("real")}</span>
              </div>
              <p className="text-2xl font-black text-yellow-400 tabular-nums">{fmtCoins(realCoins)}</p>
              <p className="text-[9px] text-yellow-400/60 font-bold uppercase tracking-wider mt-0.5">{t("given_by_owner")}</p>
            </div>
            <div className="bg-background/60 rounded-2xl p-3 border border-primary/30">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Star className="w-3.5 h-3.5 text-primary" />
                <span className="text-[9px] font-black uppercase tracking-widest text-primary">{t("bonus")}</span>
              </div>
              <p className="text-2xl font-black text-primary tabular-nums">{fmtCoins(bonusCoins)}</p>
              <p className="text-[9px] text-primary/60 font-bold uppercase tracking-wider mt-0.5">{t("bonus_3day_demo")}</p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/transfer">
            <button className="w-full h-14 rounded-2xl gold-gradient text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-[0.98]">
              <ArrowRightLeft className="w-4 h-4" />
              {t("transfer_btn")}
            </button>
          </Link>
          <button onClick={goAdmin} className="w-full h-14 rounded-2xl bg-card border border-primary/30 text-primary font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-primary/10">
            <MessageCircle className="w-4 h-4" />
            {t("owner_label")}
          </button>
        </div>

        {/* Real coins info banner */}
        <div className="bg-gradient-to-r from-yellow-500/10 via-card to-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-black text-yellow-400 text-sm uppercase tracking-tight">{t("real_coin_title")}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{t("real_coin_desc")}</p>
          </div>
        </div>

        {/* Support banner */}
        <button onClick={goAdmin} className="w-full bg-gradient-to-r from-primary/15 via-card to-primary/15 border border-primary/40 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.99] gold-glow">
          <div className="w-10 h-10 rounded-xl bg-primary text-black flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-black text-white text-sm uppercase tracking-tight">{t("low_balance")}</p>
            <p className="text-[11px] text-muted-foreground">{t("low_balance_desc")}</p>
          </div>
        </button>

        {/* Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-base font-black italic text-white uppercase tracking-tight">{t("tx_history")}</h2>
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
                  {f === "all" ? t("tx_all") : f === "in" ? t("tx_in") : t("tx_out")}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filteredTxs.length === 0 ? (
              <div className="text-center py-12 text-xs font-bold uppercase tracking-widest text-muted-foreground border border-dashed border-primary/10 rounded-3xl">
                {t("no_txs_msg")}
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
                      <p className="font-bold text-sm text-white">{translateReason(tx.source, t)}</p>
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

function translateReason(source: string, t: (k: any) => string) {
  const map: Record<string, any> = {
    game_slot: "tx_game_slot",
    game_spin: "tx_game_spin",
    game_luckybox: "tx_game_luckybox",
    game_crash: "tx_game_crash",
    game_dice: "tx_game_dice",
    game_roulette: "tx_game_roulette",
    game_plinko: "tx_game_plinko",
    game_mines: "tx_game_mines",
    admin_add: "tx_admin_add",
    admin_remove: "tx_admin_remove",
    bonus: "tx_bonus",
    transfer_in: "tx_transfer_in",
    transfer_out: "tx_transfer_out",
    register_bonus: "tx_register_bonus",
  };
  return map[source] ? t(map[source]) : source;
}
