import { Layout } from "@/components/layout/Layout";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

export default function GamesHub() {
  const { t } = useI18n();

  const GAMES = [
    {
      title: t("game_slot_title"),
      desc: t("game_slot_desc"),
      href: "/games/slot",
      emoji: "🎰",
      badge: t("badge_jackpot"),
      badgeClass: "bg-purple-500/20 text-purple-300",
      glow: "from-purple-900/30 to-card border-purple-500/20",
    },
    {
      title: t("game_spin_title"),
      desc: t("game_spin_desc"),
      href: "/games/spin",
      emoji: "🎡",
      badge: t("badge_popular"),
      badgeClass: "bg-blue-500/20 text-blue-300",
      glow: "from-blue-900/30 to-card border-blue-500/20",
    },
    {
      title: t("game_luckybox_title"),
      desc: t("game_luckybox_desc"),
      href: "/games/luckybox",
      emoji: "📦",
      badge: t("badge_fun"),
      badgeClass: "bg-amber-500/20 text-amber-300",
      glow: "from-amber-900/30 to-card border-amber-500/20",
    },
    {
      title: t("game_crash_title"),
      desc: t("game_crash_desc"),
      href: "/games/crash",
      emoji: "🚀",
      badge: t("badge_hot"),
      badgeClass: "bg-red-500/20 text-red-300",
      glow: "from-red-900/30 to-card border-red-500/20",
    },
    {
      title: t("game_dice_title"),
      desc: t("game_dice_desc"),
      href: "/games/dice",
      emoji: "🎲",
      badge: t("badge_strategy"),
      badgeClass: "bg-emerald-500/20 text-emerald-300",
      glow: "from-emerald-900/30 to-card border-emerald-500/20",
    },
    {
      title: t("game_mines_title"),
      desc: t("game_mines_desc"),
      href: "/games/mines",
      emoji: "💣",
      badge: t("badge_tension"),
      badgeClass: "bg-orange-500/20 text-orange-300",
      glow: "from-orange-900/30 to-card border-orange-500/20",
    },
    {
      title: t("game_roulette_title"),
      desc: t("game_roulette_desc"),
      href: "/games/roulette",
      emoji: "🎰",
      badge: t("badge_classic"),
      badgeClass: "bg-rose-500/20 text-rose-300",
      glow: "from-rose-900/30 to-card border-rose-500/20",
    },
    {
      title: t("game_plinko_title"),
      desc: t("game_plinko_desc"),
      href: "/games/plinko",
      emoji: "🔵",
      badge: t("badge_new"),
      badgeClass: "bg-cyan-500/20 text-cyan-300",
      glow: "from-cyan-900/30 to-card border-cyan-500/20",
    },
    {
      title: t("game_hilo_title"),
      desc: t("game_hilo_desc"),
      href: "/games/hilo",
      emoji: "🃏",
      badge: t("badge_fast"),
      badgeClass: "bg-yellow-500/20 text-yellow-300",
      glow: "from-yellow-900/30 to-card border-yellow-500/20",
    },
  ];

  return (
    <Layout>
      <div className="p-4 space-y-5 pb-28">
        <header className="pt-2">
          <h1 className="text-3xl font-black italic gold-text-gradient uppercase tracking-tighter">{t("games")}</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">{t("games_subtitle")}</p>
        </header>

        <div className="grid grid-cols-1 gap-3">
          {GAMES.map((game, i) => (
            <GameCard key={game.href} game={game} index={i} />
          ))}
        </div>
      </div>
    </Layout>
  );
}

function GameCard({ game, index }: { game: { title: string; desc: string; href: string; emoji: string; badge: string; badgeClass: string; glow: string }; index: number }) {
  return (
    <Link href={game.href}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.3 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "bg-gradient-to-br border rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:scale-95 transition-all",
          game.glow,
        )}
      >
        <div className="w-14 h-14 rounded-2xl bg-black/30 flex items-center justify-center shrink-0 text-3xl">
          {game.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-base text-white uppercase tracking-tight italic leading-none">{game.title}</h3>
            <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0", game.badgeClass)}>
              {game.badge}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{game.desc}</p>
        </div>
        <div className="shrink-0 w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
          <span className="text-primary text-sm font-black">›</span>
        </div>
      </motion.div>
    </Link>
  );
}
