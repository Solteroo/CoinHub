import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Link, useLocation } from "wouter";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import {
  useGetMe, getGetMeQueryKey,
  useClaimBonus,
  useGetAdminOwner, getGetAdminOwnerQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";
import { GAME_META, type GameMeta } from "@/lib/game-data";
import { playClick, playWin } from "@/lib/sounds";
import { Search, Gift, Loader2, ChevronRight, TrendingUp, Zap, MessageCircle } from "lucide-react";
import { COIN } from "@/lib/coin";
import { motion, AnimatePresence } from "framer-motion";
import { fmtCoins, cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

/* ─── Stake-style game artwork ─────────────────────────────────── */
const GAME_ART: Record<string, { bg: string; glow: string; badge?: string }> = {
  "/games/slot":     { bg: "linear-gradient(150deg,#1e0352,#5b21b6,#7c3aed,#4c1d95)", glow: "#7c3aed", badge: "HOT" },
  "/games/crash":    { bg: "linear-gradient(150deg,#4a0f0f,#991b1b,#dc2626,#b91c1c)", glow: "#ef4444", badge: "TOP" },
  "/games/spin":     { bg: "linear-gradient(150deg,#0c2a5e,#1d4ed8,#3b82f6,#1e40af)", glow: "#3b82f6" },
  "/games/luckybox": { bg: "linear-gradient(150deg,#4a2008,#b45309,#f59e0b,#d97706)", glow: "#f59e0b", badge: "NEW" },
  "/games/dice":     { bg: "linear-gradient(150deg,#022c22,#047857,#10b981,#065f46)", glow: "#10b981" },
  "/games/mines":    { bg: "linear-gradient(150deg,#431407,#c2410c,#f97316,#9a3412)", glow: "#f97316" },
  "/games/roulette": { bg: "linear-gradient(150deg,#4c0519,#be123c,#f43f5e,#9f1239)", glow: "#f43f5e", badge: "VIP" },
  "/games/plinko":   { bg: "linear-gradient(150deg,#083344,#0e7490,#06b6d4,#155e75)", glow: "#06b6d4" },
  "/games/hilo":     { bg: "linear-gradient(150deg,#422006,#a16207,#eab308,#713f12)", glow: "#eab308" },
};

/* ─── Simulated player counts ───────────────────────────────────── */
const BASE_COUNTS = [1028, 765, 333, 891, 447, 612, 234, 789, 156];

function useFluctuatingCount(base: number, interval = 3000) {
  const [count, setCount] = useState(base);
  useEffect(() => {
    const t = setInterval(() => setCount(c => Math.max(50, c + Math.floor(Math.random() * 14) - 6)), interval);
    return () => clearInterval(t);
  }, [base, interval]);
  return count;
}

/* ─── Hero Banner Card (Stake-style) ────────────────────────────── */
function HeroBannerCard({
  label, baseCount, href, gradient, emojis, interval,
}: { label: string; baseCount: number; href: string; gradient: string; emojis: { emoji: string; size: number; top: number; left: number; opacity: number; rotate?: number }[]; interval: number }) {
  const count = useFluctuatingCount(baseCount, interval);
  return (
    <Link href={href} className="flex-1 min-w-0">
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="relative overflow-hidden rounded-2xl cursor-pointer"
        style={{ height: 160, background: gradient }}
      >
        {/* Top light */}
        <div className="absolute inset-x-0 top-0 h-28 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 90% 60% at 50% -10%, rgba(255,255,255,0.18), transparent)" }} />

        {/* Scattered emojis */}
        {emojis.map((e, i) => (
          <span key={i} className="absolute select-none pointer-events-none leading-none"
            style={{ fontSize: e.size, top: `${e.top}%`, left: `${e.left}%`, opacity: e.opacity, transform: `rotate(${e.rotate ?? 0}deg)`, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))" }}>
            {e.emoji}
          </span>
        ))}

        {/* Bottom gradient + labels */}
        <div className="absolute bottom-0 inset-x-0 px-3 py-2.5"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)" }}>
          <p className="text-sm font-black text-white tracking-tight">{label}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-white/70">{count.toLocaleString("ru-RU")}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

/* ─── Portrait Game Card ────────────────────────────────────────── */
function GameCard({ meta, index, onClick }: { meta: GameMeta; index: number; onClick: () => void }) {
  const { t } = useI18n();
  const art = GAME_ART[meta.href] ?? { bg: "linear-gradient(150deg,#0f1923,#192839)", glow: "#D4AF37" };
  const baseCount = BASE_COUNTS[index % BASE_COUNTS.length] ?? 500;
  const count = useFluctuatingCount(baseCount, 2500 + index * 200);

  return (
    <motion.div
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className="shrink-0 cursor-pointer"
      style={{ width: 128 }}
    >
      <div className="relative overflow-hidden rounded-2xl" style={{ height: 178, background: art.bg }}>
        {/* Top light */}
        <div className="absolute inset-x-0 top-0 h-24 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 50% at 50% -15%, rgba(255,255,255,0.22), transparent)" }} />

        {/* Bottom shadow */}
        <div className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.80), transparent)" }} />

        {/* Game emoji — large, centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[62px] leading-none select-none drop-shadow-2xl"
            style={{ filter: `drop-shadow(0 0 24px ${art.glow}80)` }}>
            {meta.emoji}
          </span>
        </div>

        {/* Badge */}
        {art.badge && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-white"
            style={{ background: art.badge === "HOT" ? "#ef4444" : art.badge === "TOP" ? "#f97316" : art.badge === "NEW" ? "#10b981" : "#7c3aed" }}>
            {art.badge}
          </div>
        )}

        {/* Player count */}
        <div className="absolute bottom-2 left-2.5 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-bold text-white/75">{count.toLocaleString("ru-RU")}</span>
        </div>

        {/* Glow border on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ boxShadow: `inset 0 0 0 1.5px ${art.glow}60` }} />
      </div>

      <div className="mt-2 px-0.5">
        <p className="text-[11px] font-bold text-white line-clamp-1 leading-tight">{t(meta.titleKey)}</p>
        <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
          CoinHub
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Bonus Banner ──────────────────────────────────────────────── */
function BonusBanner({ onClaim, loading }: { onClaim: () => void; loading: boolean }) {
  const { t } = useI18n();
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-3 mb-3 overflow-hidden rounded-2xl cursor-pointer active:scale-[0.99] transition-all"
      onClick={onClaim}
      style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.08) 100%)", border: "1px solid rgba(212,175,55,0.4)", boxShadow: "0 0 24px rgba(212,175,55,0.2)" }}
    >
      <div className="flex items-center gap-3.5 px-4 py-3.5">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#F3E5AB,#D4AF37,#B8860B)" }}>
          {loading ? <Loader2 className="w-5 h-5 text-black animate-spin" /> : <Gift className="w-5 h-5 text-black" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm uppercase tracking-tight" style={{ color: "#D4AF37" }}>{t("bonus_ready")}</p>
          <p className="text-[11px] text-white/60 mt-0.5">{t("bonus_ready_tap")}</p>
        </div>
        <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#D4AF37" }} />
      </div>
    </motion.div>
  );
}

/* ─── Section Header ────────────────────────────────────────────── */
function SectionHeader({ icon, title, href, linkLabel }: { icon: React.ReactNode; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between px-3 mb-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-[13px] font-black text-white uppercase tracking-wide">{title}</h2>
      </div>
      {href && (
        <Link href={href}>
          <span className="text-[11px] font-bold flex items-center gap-0.5" style={{ color: "#D4AF37" }}>
            {linkLabel ?? "Все"} <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      )}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function Home() {
  const [, setLocation] = useLocation();
  const { t } = useI18n();
  const { data: user, isLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: owner } = useGetAdminOwner({ query: { queryKey: getGetAdminOwnerQueryKey(), enabled: !!user } });
  const claimBonus = useClaimBonus();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [gameSearch, setGameSearch] = useState("");

  useEffect(() => {
    if (!isLoading && !user) setLocation("/");
  }, [isLoading, user]);

  if (isLoading || !user) return null;

  const handleClaimBonus = () => {
    claimBonus.mutate(undefined, {
      onSuccess: (res: any) => {
        playWin();
        toast({ title: t("bonus_claimed"), description: `+${res.amount ?? 50} ${COIN}` });
        qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: t("bonus_not_ready"), description: err?.message ?? "", variant: "destructive" });
      },
    });
  };

  const filteredGames = gameSearch.trim()
    ? GAME_META.filter(g => t(g.titleKey).toLowerCase().includes(gameSearch.toLowerCase()))
    : GAME_META;

  return (
    <Layout>
      <PwaInstallBanner />

      <div className="pb-6">
        {/* Bonus banner */}
        {user.bonusReady && (
          <div className="pt-3">
            <BonusBanner onClaim={handleClaimBonus} loading={claimBonus.isPending} />
          </div>
        )}

        {/* ── Hero Banners ─────────────────────────────────────────── */}
        <div className={cn("flex gap-2.5 px-3", !user.bonusReady && "pt-3")}>
          <HeroBannerCard
            label={t("games")}
            baseCount={12840}
            href="/games"
            interval={2800}
            gradient="linear-gradient(150deg, #0c1e4a, #1a3a7c, #1d4ed8, #1e40af)"
            emojis={[
              { emoji: "🎲", size: 58, top: 10, left: 8, opacity: 0.95, rotate: -18 },
              { emoji: "♠️", size: 80, top: 18, left: 38, opacity: 0.9, rotate: 8 },
              { emoji: "🃏", size: 42, top: 12, left: 70, opacity: 0.75, rotate: 22 },
              { emoji: "🎰", size: 30, top: 50, left: 74, opacity: 0.5, rotate: -8 },
            ]}
          />
          <HeroBannerCard
            label={t("leaderboard")}
            baseCount={3240}
            href="/leaderboard"
            interval={3400}
            gradient="linear-gradient(150deg, #2a1000, #7c3400, #d97706, #b45309)"
            emojis={[
              { emoji: "🏆", size: 68, top: 8, left: 28, opacity: 0.95, rotate: 0 },
              { emoji: "👑", size: 38, top: 6, left: 68, opacity: 0.8, rotate: 15 },
              { emoji: "💰", size: 32, top: 46, left: 12, opacity: 0.65, rotate: -12 },
              { emoji: "⭐", size: 26, top: 50, left: 68, opacity: 0.5, rotate: 20 },
            ]}
          />
        </div>

        {/* ── Search Bar ──────────────────────────────────────────── */}
        <div className="px-3 mt-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "rgba(255,255,255,0.3)" }} />
            <input
              value={gameSearch}
              onChange={e => setGameSearch(e.target.value)}
              placeholder={t("search_games") || "Поиск игр..."}
              className="w-full h-11 rounded-xl pl-10 pr-4 text-sm font-bold text-white placeholder:font-normal focus:outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", backdropFilter: "blur(8px)" }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.45)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
            />
            <AnimatePresence>
              {gameSearch && (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setGameSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 text-lg font-bold">
                  ×
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Trending Games ──────────────────────────────────────── */}
        <div className="mt-5">
          <SectionHeader
            icon={<TrendingUp className="w-4 h-4" style={{ color: "#D4AF37" }} />}
            title={t("trending_games") || "Игры в тренде"}
            href="/games"
            linkLabel={t("see_all") || "Смотреть все"}
          />

          {filteredGames.length > 0 ? (
            <>
              <div className="overflow-x-auto no-scrollbar">
                <div className="flex gap-2.5 px-3 pb-1">
                  {filteredGames.map((meta, i) => (
                    <GameCard key={meta.href} meta={meta} index={i} onClick={() => { playClick(); setLocation(meta.href); }} />
                  ))}
                  {/* Load more card */}
                  <Link href="/games" className="shrink-0">
                    <div className="flex flex-col items-center justify-center rounded-2xl border cursor-pointer active:scale-[0.97] transition-all"
                      style={{ width: 128, height: 178, background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
                      <ChevronRight className="w-7 h-7 text-white/25" />
                      <p className="text-[10px] font-bold text-white/30 mt-2 uppercase tracking-wider">
                        {t("all_label") || "Все игры"}
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
              <div className="text-center mt-2.5">
                <Link href="/games">
                  <span className="text-[11px] font-black uppercase tracking-[0.15em]" style={{ color: "rgba(212,175,55,0.6)" }}>
                    {t("load_more") || "Загрузить больше"} ↓
                  </span>
                </Link>
              </div>
            </>
          ) : (
            <div className="mx-3 py-8 text-center rounded-2xl border border-dashed border-white/8">
              <p className="text-sm text-white/30 font-bold">{t("search_no_results")}</p>
            </div>
          )}
        </div>

        {/* ── Live Wins ───────────────────────────────────────────── */}
        <div className="mt-6">
          <SectionHeader
            icon={<Zap className="w-4 h-4" style={{ color: "#D4AF37" }} />}
            title={t("live_feed_title") || "Живые победы"}
          />
          <div className="px-3">
            <LiveActivityFeed />
          </div>
        </div>

        {/* ── Balance Summary Card ─────────────────────────────────── */}
        <div className="px-3 mt-5">
          <Link href="/wallet">
            <div className="relative overflow-hidden rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:scale-[0.99] transition-all"
              style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg,#F3E5AB,#D4AF37,#B8860B)" }}>
                <span className="text-xl">💰</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">{t("your_balance")}</p>
                <p className="text-2xl font-black tabular-nums leading-tight" style={{ color: "#D4AF37" }}>
                  {fmtCoins(user.coins)} <span className="text-base opacity-70">{COIN}</span>
                </p>
              </div>
              <ChevronRight className="w-5 h-5 shrink-0" style={{ color: "rgba(212,175,55,0.5)" }} />
              <div className="absolute inset-0 opacity-30 pointer-events-none"
                style={{ background: "radial-gradient(ellipse 80% 60% at 100% 50%, rgba(212,175,55,0.15), transparent)" }} />
            </div>
          </Link>
        </div>

        {/* ── Support ─────────────────────────────────────────────── */}
        <div className="px-3 mt-3">
          <button
            onClick={() => { if (owner) { playClick(); setLocation(`/dm/${owner.id}`); } }}
            className="w-full rounded-2xl p-4 flex items-center gap-3.5 active:scale-[0.99] transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(212,175,55,0.12)" }}>
              <MessageCircle className="w-5 h-5" style={{ color: "#D4AF37" }} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-white text-sm">{t("want_real_coins")}</p>
              <p className="text-[11px] text-white/40 uppercase tracking-wider mt-0.5">{t("contact_owner_direct")}</p>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: "rgba(212,175,55,0.4)" }} />
          </button>
        </div>
      </div>

    </Layout>
  );
}
