import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { Gamepad2, Percent } from "lucide-react";
import { GAME_META, type GameMeta } from "@/lib/game-data";
import { playClick } from "@/lib/sounds";
import { useLocation } from "wouter";

export default function GamesHub() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();

  const games = GAME_META.map((g) => ({
    ...g,
    title: t(g.titleKey),
    desc: t(g.descKey),
    badge: t(g.badgeKey),
  }));

  return (
    <Layout>
      <div className="pb-28">
        <div className="relative overflow-hidden hero-grid px-4 pt-5 pb-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[60px] pointer-events-none float-orb" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-500/10 rounded-full blur-[50px] pointer-events-none float-orb-2" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-lg shrink-0">
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

        <div className="px-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            {games.map((game, i) => (
              <GameCard
                key={game.href}
                game={game}
                index={i}
                onOpen={() => { playClick(); setLocation(game.href); }}
              />
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
  onOpen,
}: {
  game: GameMeta & { title: string; desc: string; badge: string };
  index: number;
  onOpen: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileTap={{ scale: 0.95 }}
      onClick={onOpen}
      className={cn(
        "relative overflow-hidden bg-gradient-to-br border rounded-2xl cursor-pointer transition-all flex flex-col group",
        game.gradient,
        game.border,
        game.glow,
      )}
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}
    >
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className={cn("text-4xl leading-none drop-shadow-lg select-none w-fit", game.animClass)}>
          {game.emoji}
        </div>
        <div>
          <h3 className="font-black text-sm text-white uppercase tracking-tight italic leading-tight">
            {game.title}
          </h3>
          <span className={cn("inline-block mt-1 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider", game.badgeClass)}>
            {game.badge}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-auto pt-1">
          <Percent className="w-2.5 h-2.5 text-muted-foreground" />
          <span className="text-[9px] font-bold text-muted-foreground">RTP {game.rtp}</span>
          <span className="text-[9px] text-muted-foreground/40 mx-0.5">·</span>
          <span className="text-[9px] font-bold text-muted-foreground">Max {game.maxWin}</span>
        </div>
      </div>

      <div className="px-3 py-2.5 border-t border-white/5 flex items-center justify-between bg-black/20">
        <span className={cn("text-[10px] font-black uppercase tracking-widest", game.accentText)}>
          PLAY
        </span>
        <div className="w-6 h-6 rounded-lg gold-gradient flex items-center justify-center shadow">
          <span className="text-black text-[11px] font-black">▶</span>
        </div>
      </div>

      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none transition-opacity duration-300" />
    </motion.div>
  );
}
