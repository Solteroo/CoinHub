import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMe, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ChevronLeft, ArrowUp, ArrowDown } from "lucide-react";
import { BetSelector } from "@/components/BetSelector";
import { cn, fmtCoins } from "@/lib/utils";
import { CoinIcon } from "@/components/CoinIcon";
import confetti from "canvas-confetti";
import { useI18n } from "@/i18n";

const CARD_NAMES = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = ["♠", "♥", "♦", "♣"];

function CardDisplay({ card, suit, flipped }: { card: number | null; suit: string; flipped: boolean }) {
  const isRed = suit === "♥" || suit === "♦";
  return (
    <motion.div
      animate={flipped ? { rotateY: 0 } : { rotateY: 90 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "w-28 h-40 rounded-2xl border-2 flex flex-col items-center justify-center shadow-xl",
        card !== null ? "bg-white text-black border-gray-200" : "bg-card border-primary/20",
      )}
    >
      {card !== null ? (
        <div className={cn("text-center", isRed ? "text-red-600" : "text-gray-900")}>
          <div className="text-4xl font-black">{CARD_NAMES[card]}</div>
          <div className="text-2xl">{suit}</div>
        </div>
      ) : (
        <div className="text-primary/30 text-5xl">?</div>
      )}
    </motion.div>
  );
}

export default function HiLoGame() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const [bet, setBet] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [suit] = useState(() => SUITS[Math.floor(Math.random() * 4)] ?? "♠");
  const [flipped, setFlipped] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  const handlePlay = async (choice: "high" | "low") => {
    if (loading || !user || bet > user.coins) return;
    setLoading(true);
    setResult(null);
    setFlipped(false);

    try {
      const res = await fetch("/api/games/hilo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet, choice }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error ?? t("error"), variant: "destructive" }); return; }
      await new Promise((r) => setTimeout(r, 200));
      setFlipped(true);
      await new Promise((r) => setTimeout(r, 300));
      setResult(data);
      if (data.netChange > 0) confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
    } catch {
      toast({ title: t("error"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setFlipped(false); };

  return (
    <Layout>
      <div className="p-4 space-y-5 pb-24">
        <div className="flex items-center gap-3">
          <Link href="/games">
            <button className="w-9 h-9 rounded-xl bg-card border border-primary/15 flex items-center justify-center text-muted-foreground hover:text-primary active:scale-95">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-xl font-black italic gold-text-gradient uppercase tracking-tighter">{t("game_hilo_title")}</h1>
        </div>

        <div className="bg-card/50 border border-primary/10 rounded-2xl p-4 text-xs text-muted-foreground">
          <p className="font-bold text-white mb-1 uppercase tracking-widest text-[10px]">{t("how_to_play")}</p>
          <p><span className="text-primary font-bold">HI</span> (8-K) / <span className="text-blue-400 font-bold">LO</span> (A-6). {t("win_multiplier")}</p>
        </div>

        <div className="flex flex-col items-center gap-4 py-4">
          <CardDisplay card={result?.card ?? null} suit={suit} flipped={flipped} />

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={cn(
                  "px-6 py-2 rounded-xl font-black text-sm uppercase tracking-wider",
                  result.netChange > 0 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-destructive/20 text-destructive border border-destructive/30",
                )}
              >
                {CARD_NAMES[result.card]} · {result.netChange > 0 ? `+${fmtCoins(result.netChange)}` : fmtCoins(result.netChange)} TMT
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar">
          {CARD_NAMES.slice(1).map((name, i) => {
            const val = i + 1;
            const isHigh = val >= 8;
            const isLow = val <= 6;
            return (
              <div key={name} className={cn(
                "w-8 h-9 rounded flex flex-col items-center justify-center text-[10px] font-black shrink-0",
                isHigh ? "bg-primary/20 text-primary border border-primary/30" :
                isLow ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                "bg-card text-muted-foreground border border-white/10",
              )}>
                {name}
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 text-[10px] font-bold">
          <span className="text-blue-400">■ LO (A-6)</span>
          <span className="text-muted-foreground">■ 7 = 0</span>
          <span className="text-primary">■ HI (8-K)</span>
        </div>

        <BetSelector value={bet} onChange={setBet} min={5} max={Math.min(10000, user?.coins ?? 10000)} />

        {!result ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handlePlay("high")}
              disabled={loading || !user || bet > (user?.coins ?? 0)}
              className="h-14 rounded-2xl bg-primary/20 border-2 border-primary text-primary font-black text-sm uppercase tracking-tight flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              <ArrowUp className="w-5 h-5" />
              HI (8-K)
            </button>
            <button
              onClick={() => handlePlay("low")}
              disabled={loading || !user || bet > (user?.coins ?? 0)}
              className="h-14 rounded-2xl bg-blue-500/20 border-2 border-blue-500 text-blue-400 font-black text-sm uppercase tracking-tight flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              <ArrowDown className="w-5 h-5" />
              LO (A-6)
            </button>
          </div>
        ) : (
          <button
            onClick={reset}
            className="w-full h-14 rounded-2xl gold-gradient text-black font-black text-base uppercase tracking-widest active:scale-[0.99]"
          >
            {t("play_again")}
          </button>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span className="flex items-center gap-1">{t("balance_label")}: <CoinIcon size="xs" /><span className="font-bold text-white">{fmtCoins(user?.coins)}</span></span>
          <span>{t("win_multiplier")}</span>
        </div>
      </div>
    </Layout>
  );
}
