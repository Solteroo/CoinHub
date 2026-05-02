import { GameLayout } from "@/components/layout/GameLayout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMe, getGetMeQueryKey, getGetMyTransactionsQueryKey, getGetMyStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BetSelector } from "@/components/BetSelector";
import { cn, fmtCoins } from "@/lib/utils";
import { COIN } from "@/lib/coin";
import confetti from "canvas-confetti";
import { useI18n } from "@/i18n";
import { playWin, playLose, playClick } from "@/lib/sounds";

const PAYOUTS = {
  low:    [1.5, 1.2, 1.0, 0.8, 0.5, 0.8, 1.0, 1.2, 1.5],
  medium: [3.0, 1.8, 1.2, 0.6, 0.2, 0.6, 1.2, 1.8, 3.0],
  high:   [16,  5.0, 2.0, 0.8, 0.0, 0.8, 2.0, 5.0, 16 ],
};

const BUCKET_COLORS = {
  low:    ["#D4AF37","#a07d1f","#665216","#3a3a4f","#2a2a3a","#3a3a4f","#665216","#a07d1f","#D4AF37"],
  medium: ["#ef4444","#D4AF37","#a07d1f","#665216","#1a1a24","#665216","#a07d1f","#D4AF37","#ef4444"],
  high:   ["#ef4444","#f97316","#D4AF37","#665216","#1a1a24","#665216","#D4AF37","#f97316","#ef4444"],
};

const ROWS = 8;
const ACCENT = "#06b6d4";

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
    playClick();

    try {
      const res = await fetch("/api/games/plinko", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet, risk }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error ?? t("error"), variant: "destructive" }); setDropping(false); return; }

      setBallPath(data.path ?? []);

      let row = 0;
      const interval = setInterval(() => {
        setBallRow(row);
        row++;
        if (row > ROWS) {
          clearInterval(interval);
          setResult(data);
          setDropping(false);
          if (data.netChange > 0) {
            playWin();
            if (data.multiplier >= 5) confetti({ particleCount: 120, spread: 60, origin: { y: 0.6 }, colors: [ACCENT, "#67e8f9"] });
          } else {
            playLose();
          }
          qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
          qc.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
        }
      }, 150);
    } catch {
      toast({ title: t("error"), variant: "destructive" });
      setDropping(false);
    }
  };

  const payouts = PAYOUTS[risk];
  const colors = BUCKET_COLORS[risk];

  const getBallXPercent = () => {
    if (ballRow < 0 || ballPath.length === 0) return 50;
    const pathSlice = ballPath.slice(0, ballRow + 1);
    const offset = pathSlice.reduce((acc, dir) => acc + (dir === 1 ? 1 : -1), 0);
    return 50 + offset * (40 / ROWS);
  };

  const dropBtn = (
    <button
      onClick={handleDrop}
      disabled={dropping || !user || bet > (user?.coins ?? 0)}
      className="w-full h-16 rounded-2xl font-black text-base uppercase tracking-widest disabled:opacity-40 active:scale-[0.98] transition-all"
      style={{
        background: !dropping ? `linear-gradient(135deg, ${ACCENT}, #0891b2)` : "rgba(255,255,255,0.07)",
        boxShadow: !dropping ? `0 0 30px ${ACCENT}50` : undefined,
        color: !dropping ? "#000" : "rgba(255,255,255,0.3)",
      }}
    >
      {dropping ? t("dropping") : t("drop_ball")}
    </button>
  );

  return (
    <GameLayout title={t("game_plinko_title")} emoji="⬇️" accentColor={ACCENT} bottomAction={dropBtn}>
      <div className="flex flex-col gap-4 px-4 pt-4 pb-4">

        <div
          className="w-full rounded-3xl border overflow-hidden relative"
          style={{
            height: "220px",
            background: "linear-gradient(180deg, #030812 0%, #060f1a 100%)",
            borderColor: `${ACCENT}30`,
          }}
        >
          {Array.from({ length: ROWS }, (_, row) => (
            <div
              key={row}
              className="absolute w-full flex justify-center"
              style={{ top: `${(row + 1) * (75 / (ROWS + 1))}%` }}
            >
              {Array.from({ length: row + 2 }, (_, col) => {
                const spacing = 100 / (row + 3);
                const leftPct = (col + 1) * spacing;
                return (
                  <div
                    key={col}
                    className="absolute w-2.5 h-2.5 rounded-full"
                    style={{
                      left: `${leftPct}%`,
                      transform: "translateX(-50%)",
                      background: ACCENT,
                      boxShadow: `0 0 6px ${ACCENT}80`,
                      opacity: 0.6,
                    }}
                  />
                );
              })}
            </div>
          ))}

          <AnimatePresence>
            {dropping && (
              <motion.div
                className="absolute w-5 h-5 rounded-full z-10"
                style={{
                  left: `${getBallXPercent()}%`,
                  top: `${Math.min(ballRow / ROWS * 78 + 5, 78)}%`,
                  transform: "translate(-50%, -50%)",
                  background: "white",
                  boxShadow: "0 0 12px rgba(255,255,255,0.9)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </AnimatePresence>

          <div className="grid absolute bottom-0 left-0 right-0 px-2 pb-3" style={{ gridTemplateColumns: `repeat(${payouts.length}, 1fr)`, gap: "3px" }}>
            {payouts.map((p, i) => (
              <motion.div
                key={i}
                animate={result?.bucket === i ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.4 }}
                className="h-9 rounded-lg flex items-center justify-center text-[11px] font-black border"
                style={{
                  background: `${colors[i]}20`,
                  borderColor: `${colors[i]}60`,
                  color: colors[i],
                  boxShadow: result?.bucket === i ? `0 0 15px ${colors[i]}60` : undefined,
                }}
              >
                {p}×
              </motion.div>
            ))}
          </div>
        </div>

        {result && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "text-center p-4 rounded-2xl font-black text-lg uppercase tracking-wider border",
              result.netChange > 0
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                : "bg-red-500/20 text-red-400 border-red-500/40",
            )}
          >
            {result.multiplier}× · {result.netChange > 0 ? "+" : ""}{fmtCoins(result.netChange)} {COIN}
          </motion.div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {(["low", "medium", "high"] as const).map((r) => (
            <button
              key={r}
              onClick={() => { setRisk(r); playClick(); }}
              className="h-11 rounded-xl font-black text-xs uppercase tracking-tight transition-all active:scale-95 border-2"
              style={{
                background: risk === r ? `${ACCENT}20` : "rgba(255,255,255,0.03)",
                borderColor: risk === r ? ACCENT : "rgba(255,255,255,0.08)",
                color: risk === r ? ACCENT : "rgba(255,255,255,0.5)",
                boxShadow: risk === r ? `0 0 15px ${ACCENT}30` : undefined,
              }}
            >
              {r === "low" ? t("risk_low") : r === "medium" ? t("risk_medium") : t("risk_high")}
            </button>
          ))}
        </div>

        <BetSelector value={bet} onChange={setBet} min={5} max={Math.min(10000, user?.coins ?? 10000)} />
      </div>
    </GameLayout>
  );
}
