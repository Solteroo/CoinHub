import { Layout } from "@/components/layout/Layout";
import { Link, useLocation } from "wouter";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import {
  useGetMe,
  getGetMeQueryKey,
  useGetMyTransactions,
  getGetMyTransactionsQueryKey,
  useClaimBonus,
  useGetNews,
  getGetNewsQueryKey,
  useGetAdminOwner,
  getGetAdminOwnerQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CoinCounter } from "@/components/ui/coin-counter";
import { ChevronRight, MessageCircle, ArrowUpRight, ArrowDownLeft, Trophy, Rocket, Disc, Package, LayoutGrid, Gift, Newspaper, Loader2, Coins, Star } from "lucide-react";
import { motion } from "framer-motion";
import { fmtCoins, fmtDateShort, cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

export default function Home() {
  const [, setLocation] = useLocation();
  const { t } = useI18n();
  const { data: user, isLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: transactions = [] } = useGetMyTransactions({
    query: { queryKey: getGetMyTransactionsQueryKey(), enabled: !!user },
  });
  const { data: news = [] } = useGetNews({ query: { queryKey: getGetNewsQueryKey(), enabled: !!user } });
  const { data: owner } = useGetAdminOwner({ query: { queryKey: getGetAdminOwnerQueryKey(), enabled: !!user } });
  const claimBonus = useClaimBonus();
  const qc = useQueryClient();
  const { toast } = useToast();

  if (isLoading) return null;
  if (!user) {
    setLocation("/");
    return null;
  }

  const recent = transactions.slice(0, 5);
  const latestNews = news.slice(0, 1);
  const bonusCoins = user.bonusCoins ?? 0;
  const realCoins = user.realCoins ?? 0;

  const handleClaimBonus = () => {
    claimBonus.mutate(undefined, {
      onSuccess: (res: any) => {
        toast({ title: t("bonus_claimed"), description: `+${res.amount ?? 50} Bonus TMT` });
        qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
        qc.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: t("bonus_not_ready"), description: err?.message ?? "", variant: "destructive" });
      },
    });
  };

  const goAdmin = () => {
    if (owner) setLocation(`/dm/${owner.id}`);
  };

  return (
    <Layout>
      <div className="p-4 space-y-5 pb-24">
        <PwaInstallBanner />

        {/* Balance Card */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card border border-primary/20 rounded-3xl p-6 text-center relative overflow-hidden gold-glow"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
          <p className="text-[10px] text-muted-foreground mb-1 relative z-10 font-bold uppercase tracking-widest">{t("your_balance")}</p>
          <div className="flex flex-col items-center justify-center relative z-10">
            <div className="flex items-baseline gap-2">
              <CoinCounter value={user.coins} className="text-5xl font-black gold-text-gradient drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
              <span className="text-lg font-black gold-text-gradient">TMT</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-bold text-white/80">{user.username}</span>
              <span className="opacity-40">|</span>
              <span className="font-mono">#{user.publicId}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 relative z-10">
            <div className="bg-background/50 rounded-xl px-3 py-2 border border-yellow-500/25 flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-[9px] font-bold text-yellow-400/80 uppercase tracking-widest">{t("real")}</p>
                <p className="text-sm font-black text-yellow-400 tabular-nums truncate">{fmtCoins(realCoins)}</p>
              </div>
            </div>
            <div className="bg-background/50 rounded-xl px-3 py-2 border border-primary/25 flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-primary shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-[9px] font-bold text-primary/80 uppercase tracking-widest">{t("bonus")}</p>
                <p className="text-sm font-black text-primary tabular-nums truncate">{fmtCoins(bonusCoins)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bonus Banner */}
        {user.bonusReady && (
          <motion.button
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={handleClaimBonus}
            disabled={claimBonus.isPending}
            className="w-full bg-gradient-to-r from-primary/30 via-primary/15 to-primary/30 border border-primary rounded-2xl p-4 flex items-center gap-3 active:scale-[0.99] gold-glow shadow-[0_0_25px_rgba(212,175,55,0.3)]"
          >
            <div className="w-12 h-12 rounded-xl bg-primary text-black flex items-center justify-center shrink-0">
              {claimBonus.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Gift className="w-6 h-6" />}
            </div>
            <div className="flex-1 text-left">
              <p className="font-black text-white uppercase text-sm tracking-tight">{t("bonus_ready")}</p>
              <p className="text-[11px] text-white/80">{t("bonus_ready_tap")}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-primary" />
          </motion.button>
        )}

        {/* Support Banner */}
        <motion.button
          initial={{ scale: 0.97, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05 }}
          onClick={goAdmin}
          className="w-full bg-card border border-primary/25 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.99] hover:border-primary/40 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-white text-sm">{t("want_real_coins")}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("contact_owner_direct")}</p>
          </div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{t("msg_label")}</span>
        </motion.button>

        {/* News Strip */}
        {latestNews.length > 0 && (
          <Link href="/news">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card/50 border border-primary/15 rounded-2xl p-4 flex items-start gap-3 active:scale-[0.99] transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Newspaper className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{t("news_latest_label")}</p>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{fmtDateShort(latestNews[0].createdAt)}</span>
                </div>
                <p className="text-sm font-bold text-white truncate">{latestNews[0].title}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{latestNews[0].body}</p>
              </div>
            </motion.div>
          </Link>
        )}

        {/* Game Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-black text-white uppercase tracking-wider">{t("games")}</h2>
            <Link href="/games" className="text-xs font-bold text-primary flex items-center gap-1 group">
              {t("all_label")} <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <GameHomeCard title="Slot" subtitle="777" href="/games/slot" className="bg-gradient-to-br from-purple-900/40 to-card border-purple-500/20" icon={LayoutGrid} iconColor="text-purple-400" />
            <GameHomeCard title="Çarh" subtitle="100x" href="/games/spin" className="bg-gradient-to-br from-blue-900/40 to-card border-blue-500/20" icon={Disc} iconColor="text-blue-400" />
            <GameHomeCard title="Gutu" subtitle="9 sandyk" href="/games/luckybox" className="bg-gradient-to-br from-amber-900/40 to-card border-amber-500/20" icon={Package} iconColor="text-amber-400" />
            <GameHomeCard title="Uçuş" subtitle="Crash" href="/games/crash" className="bg-gradient-to-br from-red-900/40 to-card border-red-500/20" icon={Rocket} iconColor="text-red-400" />
          </div>
        </div>

        {/* Leaderboard shortcut */}
        <Link href="/leaderboard">
          <motion.div whileTap={{ scale: 0.98 }} className="bg-card border border-primary/20 rounded-2xl p-4 flex items-center gap-4 gold-glow">
            <Trophy className="w-6 h-6 text-primary" />
            <div>
              <p className="text-xs font-black text-white uppercase tracking-tight">{t("leaderboard")}</p>
              <p className="text-[10px] text-muted-foreground uppercase">{t("best_players")}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-primary ml-auto" />
          </motion.div>
        </Link>

        {/* Recent Activity */}
        <div className="space-y-2">
          <h2 className="text-sm font-black text-white uppercase tracking-wider px-1">{t("recent_txs")}</h2>
          {recent.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-primary/10 rounded-2xl">
              {t("no_txs")}
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((tx) => (
                <div key={tx.id} className="bg-card/40 border border-primary/5 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      tx.amount > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive",
                    )}>
                      {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{translateReason(tx.source, t)}</p>
                      <p className="text-[10px] text-muted-foreground">{fmtDateShort(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className={cn("text-xs font-black tabular-nums", tx.amount > 0 ? "text-emerald-500" : "text-white/80")}>
                    {tx.amount > 0 ? "+" : ""}{fmtCoins(tx.amount)} <span className="text-[9px] opacity-60">TMT</span>
                  </div>
                </div>
              ))}
            </div>
          )}
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

function GameHomeCard({ title, subtitle, href, className, iconColor, icon: Icon }: { title: string; subtitle: string; href: string; className?: string; iconColor?: string; icon: any }) {
  return (
    <Link href={href}>
      <motion.div
        whileTap={{ scale: 0.97 }}
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
