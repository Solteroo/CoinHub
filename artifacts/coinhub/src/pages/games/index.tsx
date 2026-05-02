import { Layout } from "@/components/layout/Layout";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { Gamepad2 } from "lucide-react";

export default function GamesHub() {
  const { t } = useI18n();

  const GAMES = [
    {
      title: t("game_slot_title"),
      desc: t("game_slot_desc"),
      href: "/games/slot",
      emoji: "🎰",
      badge: t("badge_jackpot"),
      badgeClass: "bg-purple-500/25 text-purple-300 border border-purple-500/30",
      gradient: "from-purple-950/60 via-purple-900/30 to-card",
      border: "border-purple-500/25 hover:border-purple-500/50",
      glow: "hover:shadow-[0_0_25px_rgba(168,85,247,0.2)]",
      accent: "bg-purple-500/15 text-purple-300",
    },
    {
      title: t("game_spin_title"),
      desc: t("game_spin_desc"),
      href: "/games/spin",
      emoji: "🎡",
      badge: t("badge_popular"),
      badgeClass: "bg-blue-500/25 text-blue-300 border border-blue-500/30",
      gradient: "from-blue-950/60 via-blue-900/30 to-card",
      border: "border-blue-500/25 hover:border-blue-500/50",
      glow: "hover:shadow-[0_0_25px_rgba(59,130,246,0.2)]",
      accent: "bg-blue-500/15 text-blue-300",
    },
    {
      title: t("game_luckybox_title"),
      desc: t("game_luckybox_desc"),
      href: "/games/luckybox",
      emoji: "📦",
      badge: t("badge_fun"),
      badgeClass: "bg-amber-500/25 text-amber-300 border border-amber-500/30",
      gradient: "from-amber-950/60 via-amber-900/30 to-card",
      border: "border-amber-500/25 hover:border-amber-500/50",
      glow: "hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]",
      accent: "bg-amber-500/15 text-amber-300",
    },
    {
      title: t("game_crash_title"),
      desc: t("game_crash_desc"),
      href: "/games/crash",
      emoji: "🚀",
      badge: t("badge_hot"),
      badgeClass: "bg-red-500/25 text-red-300 border border-red-500/30",
      gradient: "from-red-950/60 via-red-900/30 to-card",
      border: "border-red-500/25 hover:border-red-500/50",
      glow: "hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]",
      accent: "bg-red-500/15 text-red-300",
    },
    {
      title: t("game_dice_title"),
      desc: t("game_dice_desc"),
      href: "/games/dice",
      emoji: "🎲",
      badge: t("badge_strategy"),
      badgeClass: "bg-emerald-500/25 text-emerald-300 border border-emerald-500/30",
      gradient: "from-emerald-950/60 via-emerald-900/30 to-card",
      border: "border-emerald-500/25 hover:border-emerald-500/50",
      glow: "hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]",
      accent: "bg-emerald-500/15 text-emerald-300",
    },
    {
      title: t("game_mines_title"),
      desc: t("game_mines_desc"),
      href: "/games/mines",
      emoji: "💣",
      badge: t("badge_tension"),
      badgeClass: "bg-orange-500/25 text-orange-300 border border-orange-500/30",
      gradient: "from-orange-950/60 via-orange-900/30 to-card",
      border: "border-orange-500/25 hover:border-orange-500/50",
      glow: "hover:shadow-[0_0_25px_rgba(249,115,22,0.2)]",
      accent: "bg-orange-500/15 text-orange-300",
    },
    {
      title: t("game_roulette_title"),
      desc: t("game_roulette_desc"),
      href: "/games/roulette",
      emoji: "🎯",
      badge: t("badge_classic"),
      badgeClass: "bg-rose-500/25 text-rose-300 border border-rose-500/30",
      gradient: "from-rose-950/60 via-rose-900/30 to-card",
      border: "border-rose-500/25 hover:border-rose-500/50",
      glow: "hover:shadow-[0_0_25px_rgba(244,63,94,0.2)]",
      accent: "bg-rose-500/15 text-rose-300",
    },
    {
      title: t("game_plinko_title"),
      desc: t("game_plinko_desc"),
      href: "/games/plinko",
      emoji: "🔵",
      badge: t("badge_new"),
      badgeClass: "bg-cyan-500/25 text-cyan-300 border border-cyan-500/30",
      gradient: "from-cyan-950/60 via-cyan-900/30 to-card",
      border: "border-cyan-500/25 hover:border-cyan-500/50",
      glow: "hover:shadow-[0_0_25px_rgba(6,182,212,0.2)]",
      accent: "bg-cyan-500/15 text-cyan-300",
    },
    {
      title: t("game_hilo_title"),
      desc: t("game_hilo_desc"),
      href: "/games/hilo",
      emoji: "🃏",
      badge: t("badge_fast"),
      badgeClass: "bg-yellow-500/25 text-yellow-300 border border-yellow-500/30",
      gradient: "from-yellow-950/60 via-yellow-900/30 to-card",
      border: "border-yellow-500/25 hover:border-yellow-500/50",
      glow: "hover:shadow-[0_0_25px_rgba(234,179,8,0.2)]",
      accent: "bg-yellow-500/15 text-yellow-300",
    },
  ];

  return (
    <Layout>
      <div className="pb-28">
        {/* Games Header with animated bg */}
        <div className="relative overflow-hidden hero-grid px-4 pt-5 pb-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[60px] pointer-events-none float-orb" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-500/10 rounded-full blur-[50px] pointer-events-none float-orb-2" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-lg">
              <Gamepad2 className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-black italic gold-text-gradient uppercase tracking-tighter leading-none">
                {t("games")}
              </h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-0.5">
                {t("games_subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Games Grid — 2 columns */}
        <div className="px-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            {GAMES.map((game, i) => (
              <GameCard key={game.href} game={game} index={i} />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function GameCard({
  game,
  index,
}: {
  game: {
    title: string;
    desc: string;
    href: string;
    emoji: string;
    badge: string;
    badgeClass: string;
    gradient: string;
    border: string;
    glow: string;
    accent: string;
  };
  index: number;
}) {
  return (
    <Link href={game.href}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02, y: -2 }}
        className={cn(
          "relative overflow-hidden bg-gradient-to-br border rounded-2xl cursor-pointer transition-all flex flex-col",
          game.gradient,
          game.border,
          game.glow,
        )}
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}
      >
        {/* Top section */}
        <div className="p-4 flex-1 flex flex-col gap-2">
          {/* Emoji */}
          <div className="text-4xl leading-none drop-shadow-lg">{game.emoji}</div>

          {/* Title + badge */}
          <div>
            <h3 className="font-black text-sm text-white uppercase tracking-tight italic leading-tight">
              {game.title}
            </h3>
            <span className={cn("inline-block mt-1 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider", game.badgeClass)}>
              {game.badge}
            </span>
          </div>

          {/* Desc */}
          <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2 flex-1">{game.desc}</p>
        </div>

        {/* Play button bar */}
        <div className={cn("px-3 py-2.5 border-t border-white/5 flex items-center justify-between", game.accent.replace("text-", "bg-").replace("300", "500/10"))}>
          <span className={cn("text-[10px] font-black uppercase tracking-widest", game.accent.split(" ")[1])}>
            PLAY
          </span>
          <div className="w-6 h-6 rounded-lg gold-gradient flex items-center justify-center">
            <span className="text-black text-[11px] font-black">▶</span>
          </div>
        </div>

        {/* Shine overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none transition-opacity" />
      </motion.div>
    </Link>
  );
}
