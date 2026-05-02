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
import { VipLevelBar } from "@/components/VipLevelBar";
import { fmtCoins, fmtDateShort, cn } from "@/lib/utils";
import { COIN } from "@/lib/coin";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  MessageCircle,
  Coins,
  Star,
  TrendingUp,
  TrendingDown,
  Wallet as WalletIcon,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
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

  const totalIn = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = Math.abs(transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));

  return (
    <Layout>
      <div className="pb-24">
        {/* Hero Balance Section */}
        <div className="relative overflow-hidden hero-grid px-4 pt-5 pb-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/15 rounded-full blur-[70px] pointer-events-none float-orb" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-blue-500/8 rounded-full blur-[50px] pointer-events-none float-orb-2" />

          <div className="relative z-10 space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center shadow">
                  <WalletIcon className="w-5 h-5 text-black" />
                </div>
                <h1 className="text-xl font-black italic gold-text-gradient uppercase tracking-tight">{t("wallet")}</h1>
              </div>
              {user && <VipLevelBar coins={user.coins} compact />}
            </div>

            {/* Main balance */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black mb-1">{t("total_balance")}</p>
              <div className="flex items-baseline justify-center gap-2">
                <CoinCounter value={totalCoins} className="text-5xl font-black gold-text-gradient drop-shadow-[0_0_18px_rgba(212,175,55,0.5)]" />
                <span className="text-xl font-black gold-text-gradient">{COIN}</span>
              </div>
            </motion.div>

            {/* Real / Bonus cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/30 rounded-2xl p-3.5 border border-yellow-500/25 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-2">
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400">{t("real")}</span>
                </div>
                <p className="text-2xl font-black text-yellow-400 tabular-nums">{fmtCoins(realCoins)}</p>
                <p className="text-[9px] text-yellow-400/55 font-bold uppercase tracking-wider mt-0.5">{t("given_by_owner")}</p>
              </div>
              <div className="bg-black/30 rounded-2xl p-3.5 border border-primary/25 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-2">
                  <Star className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary">{t("bonus")}</span>
                </div>
                <p className="text-2xl font-black text-primary tabular-nums">{fmtCoins(bonusCoins)}</p>
                <p className="text-[9px] text-primary/55 font-bold uppercase tracking-wider mt-0.5">{t("bonus_3day_demo")}</p>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={goAdmin}
                className="w-full h-12 rounded-2xl gold-gradient text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 neon-pulse shadow-[0_0_15px_rgba(212,175,55,0.35)]"
              >
                <ArrowDownLeft className="w-4 h-4" />
                {t("deposit_btn")}
              </motion.button>
              <Link href="/transfer">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="w-full h-12 rounded-2xl bg-card border border-primary/40 text-primary font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  {t("transfer_btn")}
                </motion.button>
              </Link>
            </div>
          </div>
        </div>

        <div className="px-4 space-y-4 pt-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">{t("tx_in")}</p>
                <p className="text-sm font-black text-emerald-400 tabular-nums">+{fmtCoins(totalIn)}</p>
              </div>
            </div>
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-destructive/20 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">{t("tx_out")}</p>
                <p className="text-sm font-black text-white/80 tabular-nums">−{fmtCoins(totalOut)}</p>
              </div>
            </div>
          </div>

          {/* Support banner */}
          <motion.button
            whileTap={{ scale: 0.99 }}
            onClick={goAdmin}
            className="w-full bg-gradient-to-r from-primary/15 via-card to-primary/15 border border-primary/30 rounded-2xl p-4 flex items-center gap-3 gold-glow"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-black text-white text-sm uppercase tracking-tight">{t("low_balance")}</p>
              <p className="text-[11px] text-muted-foreground">{t("low_balance_desc")}</p>
            </div>
          </motion.button>

          {/* Transaction History */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-black italic text-white uppercase tracking-tight">{t("tx_history")}</h2>
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
                filteredTxs.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="bg-card/50 border border-primary/5 rounded-2xl p-3.5 flex items-center justify-between"
                  >
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
                      {tx.amount > 0 ? "+" : ""}{fmtCoins(tx.amount)} <span className="text-[9px] opacity-60">{COIN}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function translateReason(source: string, t: (k: any) => string) {
  const map: Record<string, any> = {
    game_slot: "tx_game_slot", game_spin: "tx_game_spin", game_luckybox: "tx_game_luckybox",
    game_crash: "tx_game_crash", game_dice: "tx_game_dice", game_roulette: "tx_game_roulette",
    game_plinko: "tx_game_plinko", game_mines: "tx_game_mines", admin_add: "tx_admin_add",
    admin_remove: "tx_admin_remove", bonus: "tx_bonus", transfer_in: "tx_transfer_in",
    transfer_out: "tx_transfer_out", register_bonus: "tx_register_bonus",
  };
  return map[source] ? t(map[source]) : source;
}
