import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { Link, useLocation } from "wouter";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import {
  useGetMe, getGetMeQueryKey,
  useGetMyTransactions, getGetMyTransactionsQueryKey,
  useClaimBonus,
  useGetNews, getGetNewsQueryKey,
  useGetAdminOwner, getGetAdminOwnerQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CoinCounter } from "@/components/ui/coin-counter";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";
import { VipLevelBar } from "@/components/VipLevelBar";
import { GamePreviewModal, type GameModalInfo } from "@/components/GamePreviewModal";
import { GAME_META } from "@/lib/game-data";
import { playClick, playWin } from "@/lib/sounds";
import {
  ChevronRight, MessageCircle, ArrowUpRight, ArrowDownLeft,
  Trophy, Gift, Newspaper, Loader2, ArrowRightLeft, Zap, Gamepad2, Rocket,
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
  const { data: transactions = [] } = useGetMyTransactions({ query: { queryKey: getGetMyTransactionsQueryKey(), enabled: !!user } });
  const { data: news = [] } = useGetNews({ query: { queryKey: getGetNewsQueryKey(), enabled: !!user } });
  const { data: owner } = useGetAdminOwner({ query: { queryKey: getGetAdminOwnerQueryKey(), enabled: !!user } });
  const claimBonus = useClaimBonus();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedGame, setSelectedGame] = useState<GameModalInfo | null>(null);

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

  const handleClaimBonus = () => {
    claimBonus.mutate(undefined, {
      onSuccess: (res: any) => {
        playWin();
        toast({ title: t("bonus_claimed"), description: `+${res.amount ?? 50} Bonus TMT` });
        qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
        qc.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: t("bonus_not_ready"), description: err?.message ?? "", variant: "destructive" });
      },
    });
  };

  const goAdmin = () => { if (owner) setLocation(`/dm/${owner.id}`); };

  const openGame = (meta: typeof GAME_META[number]) => {
    playClick();
    setSelectedGame({
      title: t(meta.titleKey),
      desc: t(meta.descKey),
      href: meta.href,
      emoji: meta.emoji,
      badge: t(meta.badgeKey),
      badgeClass: meta.badgeClass,
      gradient: meta.gradient,
      rtp: meta.rtp,
      maxWin: meta.maxWin,
      volatility: meta.volatility,
      accentText: meta.accentText,
    });
  };

  // Featured game = Crash
  const featuredMeta = GAME_META.find((g) => g.href === "/games/crash")!;

  return (
    <Layout>
      <div className="pb-24">
        <PwaInstallBanner />

        {/* ── HERO SECTION ──────────────────────── */}
        <div className="relative overflow-hidden hero-grid">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/12 rounded-full blur-[80px] pointer-events-none float-orb" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500/8 rounded-full blur-[60px] pointer-events-none float-orb-2" />
          <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-primary/6 rounded-full blur-[70px] pointer-events-none float-orb-3" />

          <div className="relative z-10 px-4 pt-4 pb-5 space-y-4">
            {/* Welcome + VIP */}
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                {t("welcome")}, <span className="text-white">{user.username}</span>
              </p>
              <VipLevelBar coins={user.coins} compact />
            </div>

            {/* Featured Game Banner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => openGame(featuredMeta)}
              className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/70 via-red-900/40 to-card cursor-pointer active:scale-[0.99] transition-all"
              style={{ boxShadow: "0 0 30px rgba(239,68,68,0.15)" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-red-900/20 pointer-events-none" />
              <div className="relative z-10 p-4 flex items-center gap-4">
                <div className="text-5xl anim-float select-none drop-shadow-xl">🚀</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/25 text-red-300 border border-red-500/30 font-black uppercase tracking-wider">
                      {t("badge_hot")} · FEATURED
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white uppercase italic tracking-tight leading-none">
                    {t("game_crash_title")}
                  </h3>
                  <p className="text-[11px] text-white/60 mt-0.5 line-clamp-1">{t("game_crash_desc")}</p>
                </div>
                <div className="shrink-0">
                  <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shadow-lg neon-pulse">
                    <Rocket className="w-5 h-5 text-black" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Big Balance */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="text-center py-1"
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black mb-1">{t("your_balance")}</p>
              <div className="flex items-baseline justify-center gap-2">
                <CoinCounter value={user.coins} className="text-5xl font-black gold-text-gradient drop-shadow-[0_0_20px_rgba(212,175,55,0.5)]" />
                <span className="text-xl font-black gold-text-gradient">TMT</span>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button whileTap={{ scale: 0.97 }} onClick={goAdmin}
                className="w-full h-12 rounded-2xl gold-gradient text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 neon-pulse shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                <ArrowDownLeft className="w-4 h-4" />
                {t("deposit_btn")}
              </motion.button>
              <Link href="/transfer">
                <motion.button whileTap={{ scale: 0.97 }}
                  className="w-full h-12 rounded-2xl bg-card border border-primary/40 text-primary font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors">
                  <ArrowRightLeft className="w-4 h-4" />
                  {t("transfer_btn")}
                </motion.button>
              </Link>
            </div>

            {/* Jackpot Counter */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-black/40 border border-primary/20 rounded-2xl p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t("jackpot_pool")}</p>
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
              <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center shrink-0">
                <ChevronRight className="w-4 h-4 text-black" />
              </div>
            </motion.button>
          )}

          {/* Live Feed */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Zap className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">{t("live_feed_title")}</h2>
            </div>
            <LiveActivityFeed />
          </div>

          {/* Quick Games Grid */}
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

            <div className="grid grid-cols-3 gap-2">
              {GAME_META.slice(0, 6).map((meta) => (
                <QuickGameCard
                  key={meta.href}
                  emoji={meta.emoji}
                  title={t(meta.titleKey)}
                  badge={t(meta.badgeKey)}
                  badgeClass={meta.badgeClass}
                  gradient={meta.gradient}
                  border={meta.border}
                  animClass={meta.animClass}
                  onOpen={() => openGame(meta)}
                />
              ))}
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
                    <span className="text-[9px] font-bold uppercase text-muted-foreground">{fmtDateShort(latestNews[0].createdAt)}</span>
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
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center",
                        tx.amount > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive")}>
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

      <GamePreviewModal game={selectedGame} onClose={() => setSelectedGame(null)} />
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

function QuickGameCard({ emoji, title, badge, badgeClass, gradient, border, animClass, onOpen }: {
  emoji: string; title: string; badge: string; badgeClass: string;
  gradient: string; border: string; animClass: string; onOpen: () => void;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.94 }}
      onClick={onOpen}
      className={cn(
        "relative overflow-hidden bg-gradient-to-br border rounded-2xl p-3 flex flex-col gap-2 cursor-pointer group transition-all",
        gradient, border,
      )}
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}
    >
      <div className={cn("text-2xl leading-none select-none", animClass)}>{emoji}</div>
      <div>
        <h3 className="text-[11px] font-black text-white uppercase tracking-tight leading-tight line-clamp-1">{title}</h3>
        <span className={cn("inline-block mt-0.5 text-[7px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider", badgeClass)}>
          {badge}
        </span>
      </div>
      <div className="flex justify-end">
        <div className="w-5 h-5 rounded-md gold-gradient flex items-center justify-center">
          <span className="text-black text-[9px] font-black">▶</span>
        </div>
      </div>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none transition-opacity" />
    </motion.div>
  );
}
