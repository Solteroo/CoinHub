import { useState, useEffect, useRef } from "react";
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
import { LiveActivityFeed } from "@/components/LiveActivityFeed";
import { VipLevelBar } from "@/components/VipLevelBar";
import {
  ChevronRight,
  MessageCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Trophy,
  Rocket,
  Disc,
  Package,
  LayoutGrid,
  Gift,
  Newspaper,
  Loader2,
  Coins,
  Star,
  ArrowRightLeft,
  Zap,
  Gamepad2,
} from "lucide-react";
import { motion } from "framer-motion";
import { fmtCoins, fmtDateShort, cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

function JackpotCounter() {
  const [value, setValue] = useState(() => 840_000 + Math.floor(Math.random() * 60_000));
  useEffect(() => {
    const t = setInterval(() => setValue((v) => v + Math.floor(Math.random() * 18) + 4), 1100);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="shimmer-text text-2xl font-black tabular-nums tracking-tight">
      {fmtCoins(value)} TMT
    </span>
  );
}

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

  const redirected = useRef(false);
  useEffect(() => {
    if (!isLoading && !user && !redirected.current) {
      redirected.current = true;
      setLocation("/");
    }
  }, [isLoading, user, setLocation]);

  if (isLoading || !user) return null;

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
      <div className="pb-24">
        <PwaInstallBanner />

        {/* ── HERO SECTION ───────────────────────── */}
        <div className="relative overflow-hidden hero-grid">
          {/* Animated background orbs */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/15 rounded-full blur-[80px] pointer-events-none float-orb" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none float-orb-2" />
          <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-primary/8 rounded-full blur-[70px] pointer-events-none float-orb-3" />

          <div className="relative z-10 px-4 pt-5 pb-6 space-y-4">
            {/* Welcome + VIP */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  {t("welcome")}, <span className="text-white">{user.username}</span>
                </p>
              </div>
              <VipLevelBar coins={user.coins} compact />
            </div>

            {/* Big Balance */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-center py-2"
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black mb-1">
                {t("your_balance")}
              </p>
              <div className="flex items-baseline justify-center gap-2">
                <CoinCounter
                  value={user.coins}
                  className="text-6xl font-black gold-text-gradient drop-shadow-[0_0_20px_rgba(212,175,55,0.5)]"
                />
                <span className="text-2xl font-black gold-text-gradient">TMT</span>
              </div>

              <div className="flex items-center justify-center gap-3 mt-3">
                <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full border border-yellow-500/20">
                  <Coins className="w-3 h-3 text-yellow-400" />
                  <span className="text-[10px] font-black text-yellow-400">{fmtCoins(realCoins)}</span>
                  <span className="text-[9px] text-yellow-400/60 uppercase">Real</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full border border-primary/20">
                  <Star className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-black text-primary">{fmtCoins(bonusCoins)}</span>
                  <span className="text-[9px] text-primary/60 uppercase">Bonus</span>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={goAdmin}
                className="w-full h-12 rounded-2xl gold-gradient text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 neon-pulse shadow-[0_0_20px_rgba(212,175,55,0.4)]"
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

            {/* Jackpot Counter */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-black/40 border border-primary/20 rounded-2xl p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                    {t("jackpot_pool")}
                  </p>
                  <JackpotCounter />
                </div>
              </div>
              <Link href="/leaderboard">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-primary" />
                </div>
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="px-4 space-y-5 pt-4">
          {/* Bonus Banner */}
          {user.bonusReady && (
            <motion.button
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={handleClaimBonus}
              disabled={claimBonus.isPending}
              className="w-full bg-gradient-to-r from-primary/30 via-primary/15 to-primary/30 border border-primary rounded-2xl p-4 flex items-center gap-3 active:scale-[0.99] gold-glow-strong shadow-[0_0_30px_rgba(212,175,55,0.35)]"
            >
              <div className="w-12 h-12 rounded-xl bg-primary text-black flex items-center justify-center shrink-0">
                {claimBonus.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Gift className="w-6 h-6" />}
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-white uppercase text-sm tracking-tight">{t("bonus_ready")}</p>
                <p className="text-[11px] text-white/80">{t("bonus_ready_tap")}</p>
              </div>
              <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-black" />
              </div>
            </motion.button>
          )}

          {/* Live Activity Feed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-black text-white uppercase tracking-wider">{t("live_feed_title")}</h2>
              </div>
            </div>
            <LiveActivityFeed />
          </div>

          {/* Games Quick Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-primary" />
                <h2 className="text-base font-black text-white uppercase tracking-wider">{t("games")}</h2>
              </div>
              <Link href="/games" className="text-xs font-bold text-primary flex items-center gap-1 group">
                {t("all_label")} <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <GameCard title={t("game_slot_title")} subtitle="777 · " badge={t("badge_jackpot")} href="/games/slot" emoji="🎰" gradient="from-purple-900/50 to-purple-800/20" border="border-purple-500/30" badgeCls="bg-purple-500/20 text-purple-300" />
              <GameCard title={t("game_crash_title")} subtitle="Crash · " badge={t("badge_hot")} href="/games/crash" emoji="🚀" gradient="from-red-900/50 to-red-800/20" border="border-red-500/30" badgeCls="bg-red-500/20 text-red-300" />
              <GameCard title={t("game_spin_title")} subtitle="100× · " badge={t("badge_popular")} href="/games/spin" emoji="🎡" gradient="from-blue-900/50 to-blue-800/20" border="border-blue-500/30" badgeCls="bg-blue-500/20 text-blue-300" />
              <GameCard title={t("game_plinko_title")} subtitle="Plinko · " badge={t("badge_new")} href="/games/plinko" emoji="🔵" gradient="from-cyan-900/50 to-cyan-800/20" border="border-cyan-500/30" badgeCls="bg-cyan-500/20 text-cyan-300" />
              <GameCard title={t("game_dice_title")} subtitle="Hi/Lo · " badge={t("badge_strategy")} href="/games/dice" emoji="🎲" gradient="from-emerald-900/50 to-emerald-800/20" border="border-emerald-500/30" badgeCls="bg-emerald-500/20 text-emerald-300" />
              <GameCard title={t("game_hilo_title")} subtitle="×1.85 · " badge={t("badge_fast")} href="/games/hilo" emoji="🃏" gradient="from-yellow-900/50 to-yellow-800/20" border="border-yellow-500/30" badgeCls="bg-yellow-500/20 text-yellow-300" />
            </div>
          </div>

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

          {/* Support Banner */}
          <motion.button
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
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

function GameCard({
  title, subtitle, badge, href, emoji, gradient, border, badgeCls,
}: { title: string; subtitle: string; badge: string; href: string; emoji: string; gradient: string; border: string; badgeCls: string }) {
  return (
    <Link href={href}>
      <motion.div
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
        className={cn(
          "relative overflow-hidden bg-gradient-to-br border rounded-2xl p-4 flex flex-col gap-2 cursor-pointer group transition-all",
          gradient, border,
        )}
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-start justify-between">
          <div className="text-3xl leading-none">{emoji}</div>
          <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wide shrink-0", badgeCls)}>
            {badge}
          </span>
        </div>
        <div>
          <h3 className="text-[13px] font-black text-white uppercase tracking-tight leading-none">{title}</h3>
          <p className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-widest">{subtitle}</p>
        </div>
        <div className="flex items-center justify-end mt-1">
          <div className="w-7 h-7 rounded-lg gold-gradient flex items-center justify-center shadow-md">
            <span className="text-black text-sm font-black leading-none">▶</span>
          </div>
        </div>
        {/* Shine overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-tr from-transparent via-white/3 to-transparent" />
      </motion.div>
    </Link>
  );
}
