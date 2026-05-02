import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMe, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { BetSelector } from "@/components/BetSelector";
import { cn, fmtCoins } from "@/lib/utils";
import { CoinIcon } from "@/components/CoinIcon";
import confetti from "canvas-confetti";
import { useI18n } from "@/i18n";

const PAYOUTS = {
  low:    [1.5, 1.2, 1.0, 0.8, 0.5, 0.8, 1.0, 1.2, 1.5],
  medium: [3.0, 1.8, 1.2, 0.6, 0.2, 0.6, 1.2, 1.8, 3.0],
  high:   [16,  5.0, 2.0, 0.8, 0.0, 0.8, 2.0, 5.0, 16 ],
};

const BUCKET_COLORS = {
  low:    ["#D4AF37","#a07d1f","#665216","#3a3a4f","#2a2a3a","#3a3a4f","#665216","#a07d1f","#D4AF37"],
  medium: ["#ff3b3b","#D4AF37","#a07d1f","#665216","#1a1a24","#665216","#a07d1f","#D4AF37","#ff3b3b"],
  high:   ["#ff3b3b","#ff6b3b","#D4AF37","#665216","#1a1a24","#665216","#D4AF37","#ff6b3b","#ff3b3b"],
};

export default function PlinkoGame() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const [bet, setBet] = useState(10);
  const [risk, setRisk] = useState<"low" | "medium" | "high">("medium");
  const [dropping, setDropping] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [ballPath, setBallPath] = useState<number[]>([]);
  const [ballRow, setBallRow] = useState(-1);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  const handleDrop = async () => {
    if (dropping || !user || bet > user.coins) return;
    setDropping(true);
    setResult(null);
    setBallPath([]);
    setBallRow(-1);

    try {
      const res = await fetch("/api/games/plinko", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet, risk }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error ?? t("error"), variant: "destructive" }); setDropping(false); return; }

      const path = data.path as number[];
      for (let row = 0; row < path.length; row++) {
        await new Promise((r) => setTimeout(r, 150));
        setBallRow(row);
        setBallPath(path.slice(0, row + 1));
      }
      await new Promise((r) => setTimeout(r, 300));
      setResult(data);
      if (data.netChange > 0) confetti({ particleCount: 60, spread: 45, origin: { y: 0.7 } });
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
    } catch {
      toast({ title: t("error"), variant: "destructive" });
    } finally {
      setDropping(false);
    }
  };

  const getBallX = () => {
    if (ballPath.length === 0) return 50;
    const pos = ballPath.reduce((acc, dir) => acc + dir, 0);
    return (pos / 8) * 100;
  };

  const payouts = PAYOUTS[risk];
  const colors = BUCKET_COLORS[risk];

  return (
    <Layout>
      <div className="p-4 space-y-5 pb-24">
        <div className="flex items-center gap-3">
          <Link href="/games">
            <button className="w-9 h-9 rounded-xl bg-card border border-primary/15 flex items-center justify-center text-muted-foreground hover:text-primary active:scale-95">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-xl font-black italic gold-text-gradient uppercase tracking-tighter">{t("game_plinko_title")}</h1>
        </div>

        <div className="bg-card/50 border border-primary/10 rounded-2xl p-4 text-xs text-muted-foreground">
          <p className="font-bold text-white mb-1 uppercase tracking-widest text-[10px]">{t("how_to_play")}</p>
          <p>{t("drop_ball")} → 8 rows → 9 buckets</p>
        </div>

        <div className="bg-card border border-primary/20 rounded-3xl p-4 relative overflow-hidden gold-glow">
          <div className="relative h-52">
            {Array.from({ length: 8 }, (_, row) => (
              <div key={row} className="absolute w-full flex justify-center" style={{ top: `${(row / 8) * 100}%` }}>
                {Array.from({ length: row + 2 }, (_, col) => (
                  <div key={col} className="w-2 h-2 rounded-full bg-primary/40 mx-1.5" />
                ))}
              </div>
            ))}

            <AnimatePresence>
              {dropping && (
                <motion.div
                  className="absolute w-4 h-4 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10"
                  style={{ left: "calc(50% - 8px)", top: 0 }}
                  animate={{ left: `calc(${getBallX()}% - 8px)`, top: `${Math.min(ballRow / 8 * 100, 88)}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="grid mt-2" style={{ gridTemplateColumns: `repeat(${payouts.length}, 1fr)`, gap: "2px" }}>
            {payouts.map((p, i) => (
              <div
                key={i}
                className={cn("h-8 rounded-md flex items-center justify-center text-[10px] font-black transition-all", result?.bucket === i && "ring-2 ring-white scale-110")}
                style={{ backgroundColor: colors[i] + "40", borderColor: colors[i], borderWidth: 1 }}
              >
                <span style={{ color: colors[i] }}>{p}×</span>
              </div>
            ))}
          </div>
        </div>

        {result && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "text-center p-3 rounded-2xl font-black text-sm uppercase tracking-wider",
              result.netChange > 0 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-destructive/20 text-destructive border border-destructive/30",
            )}
          >
            {result.multiplier}× · {result.netChange > 0 ? "+" : ""}{fmtCoins(result.netChange)} TMT
          </motion.div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {(["low", "medium", "high"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRisk(r)}
              className={cn(
                "h-11 rounded-xl border-2 font-black text-xs uppercase tracking-tight transition-all",
                risk === r ? "bg-primary/20 border-primary text-primary" : "bg-card border-primary/15 text-muted-foreground",
              )}
            >
              {r === "low" ? t("risk_low") : r === "medium" ? t("risk_medium") : t("risk_high")}
            </button>
          ))}
        </div>

        <BetSelector value={bet} onChange={setBet} min={5} max={Math.min(10000, user?.coins ?? 10000)} />

        <button
          onClick={handleDrop}
          disabled={dropping || !user || bet > (user?.coins ?? 0)}
          className="w-full h-14 rounded-2xl gold-gradient text-black font-black text-base uppercase tracking-widest disabled:opacity-50 active:scale-[0.99] shadow-[0_0_20px_rgba(212,175,55,0.3)]"
        >
          {dropping ? t("dropping") : t("drop_ball")}
        </button>

        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span className="flex items-center gap-1">{t("balance_label")}: <CoinIcon size="xs" /><span className="font-bold text-white">{fmtCoins(user?.coins)}</span></span>
          <span>{t("max_label")}: ×{risk === "high" ? 16 : risk === "medium" ? 3.0 : 1.5}</span>
        </div>
      </div>
    </Layout>
  );
}
