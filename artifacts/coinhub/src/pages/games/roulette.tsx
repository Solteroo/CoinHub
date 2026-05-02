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

const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const ACCENT = "#f43f5e";

function getColor(n: number) {
  if (n === 0) return "green";
  return RED.has(n) ? "red" : "black";
}

const BET_OPTIONS = [
  { id: "red", label: "RED", color: "#ef4444", glow: "rgba(239,68,68,0.4)", multiplier: "2×" },
  { id: "black", label: "BLACK", color: "#6b7280", glow: "rgba(107,114,128,0.4)", multiplier: "2×" },
  { id: "zero", label: "ZERO", color: "#22c55e", glow: "rgba(34,197,94,0.4)", multiplier: "14×" },
] as const;

export default function RouletteGame() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const [bet, setBet] = useState(10);
  const [betType, setBetType] = useState<"red" | "black" | "zero" | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  const handleSpin = async () => {
    if (!betType || spinning || !user || bet > user.coins) return;
    setSpinning(true);
    setResult(null);
    playClick();

    let ticks = 0;
    const interval = setInterval(() => {
      setDisplayNumber(Math.floor(Math.random() * 37));
      ticks++;
      if (ticks >= 20) clearInterval(interval);
    }, 100);

    try {
      const res = await fetch("/api/games/roulette", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet, betType }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error ?? t("error"), variant: "destructive" }); return; }
      clearInterval(interval);
      setDisplayNumber(data.number);
      setResult(data);
      if (data.netChange > 0) {
        playWin();
        confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 }, colors: ["#f43f5e", "#fb7185"] });
      } else {
        playLose();
      }
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
    } catch {
      toast({ title: t("error"), variant: "destructive" });
    } finally {
      setSpinning(false);
    }
  };

  const numColor = displayNumber === null ? null : getColor(displayNumber);

  return (
    <GameLayout title={t("game_roulette_title")} emoji="🎯" accentColor={ACCENT}>
      <div className="flex flex-col gap-5 px-4 pt-5">

        {/* Roulette wheel visual */}
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={spinning ? { rotate: 720 * 3 } : {}}
            transition={spinning ? { duration: 2.5, ease: [0.2, 0, 0.1, 1] } : { duration: 0 }}
            className="relative w-44 h-44"
          >
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-white/10"
              style={{ boxShadow: `0 0 40px ${ACCENT}30, inset 0 0 40px rgba(0,0,0,0.5)` }} />

            {/* Colored segments preview */}
            <div className="absolute inset-2 rounded-full overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {Array.from({ length: 37 }, (_, i) => {
                  const n = i;
                  const angle = (i * 360) / 37;
                  const rad = (angle * Math.PI) / 180;
                  const rad2 = ((angle + 360/37) * Math.PI) / 180;
                  const x1 = 50 + 48 * Math.cos(rad - Math.PI/2);
                  const y1 = 50 + 48 * Math.sin(rad - Math.PI/2);
                  const x2 = 50 + 48 * Math.cos(rad2 - Math.PI/2);
                  const y2 = 50 + 48 * Math.sin(rad2 - Math.PI/2);
                  const c = getColor(n);
                  return (
                    <path
                      key={i}
                      d={`M 50 50 L ${x1} ${y1} A 48 48 0 0 1 ${x2} ${y2} Z`}
                      fill={c === "red" ? "#991b1b" : c === "green" ? "#166534" : "#1f2937"}
                      stroke="rgba(0,0,0,0.5)"
                      strokeWidth="0.5"
                    />
                  );
                })}
                <circle cx="50" cy="50" r="18" fill="#06060f" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              </svg>
            </div>

            {/* Center number */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                key={displayNumber}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-xl"
                style={{
                  background: numColor === "red" ? "#dc2626"
                    : numColor === "green" ? "#16a34a"
                    : numColor === "black" ? "#374151"
                    : "#1a1a2e",
                  boxShadow: numColor === "red" ? "0 0 20px rgba(220,38,38,0.5)"
                    : numColor === "green" ? "0 0 20px rgba(22,163,74,0.5)"
                    : undefined,
                }}
              >
                {displayNumber !== null ? displayNumber : "?"}
              </motion.div>
            </div>

            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-0 h-0"
              style={{ borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "14px solid white", filter: "drop-shadow(0 0 4px rgba(255,255,255,0.8))" }} />
          </motion.div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className={cn(
                  "px-8 py-3 rounded-2xl font-black text-lg uppercase tracking-wider border",
                  result.netChange > 0
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-red-500/20 text-red-400 border-red-500/40",
                )}
              >
                {result.netChange > 0 ? `+${fmtCoins(result.netChange)}` : fmtCoins(result.netChange)} {COIN}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bet type selection */}
        <div className="grid grid-cols-3 gap-2">
          {BET_OPTIONS.map(({ id, label, color, glow, multiplier }) => (
            <button
              key={id}
              onClick={() => { setBetType(id); playClick(); }}
              className="h-16 rounded-2xl flex flex-col items-center justify-center gap-1 font-black text-xs uppercase tracking-tight transition-all active:scale-[0.97] border-2"
              style={{
                background: betType === id ? `${color}25` : "rgba(255,255,255,0.03)",
                borderColor: betType === id ? color : "rgba(255,255,255,0.08)",
                color: betType === id ? color : "rgba(255,255,255,0.5)",
                boxShadow: betType === id ? `0 0 20px ${glow}` : undefined,
              }}
            >
              <div className="w-4 h-4 rounded-full" style={{ background: color }} />
              <span>{label}</span>
              <span className="text-[9px] opacity-60">{multiplier}</span>
            </button>
          ))}
        </div>

        {/* Number grid (mini) */}
        <div className="w-full overflow-hidden rounded-xl border border-white/5" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="grid" style={{ gridTemplateColumns: "repeat(13, 1fr)", gap: "1px" }}>
            {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => (
              <div
                key={n}
                className={cn("aspect-square flex items-center justify-center text-[8px] font-bold transition-all",
                  result?.number === n && "ring-1 ring-white scale-110 z-10"
                )}
                style={{ background: RED.has(n) ? "rgba(153,27,27,0.8)" : "rgba(31,41,55,0.8)" }}
              >
                {n}
              </div>
            ))}
            <div className={cn("aspect-square flex items-center justify-center text-[8px] font-bold col-span-1",
              result?.number === 0 && "ring-1 ring-white"
            )} style={{ background: "rgba(22,101,52,0.8)" }}>0</div>
          </div>
        </div>

        {/* Bet selector */}
        <BetSelector value={bet} onChange={setBet} min={5} max={Math.min(10000, user?.coins ?? 10000)} />

        {/* Spin button */}
        <button
          onClick={handleSpin}
          disabled={spinning || !betType || !user || bet > (user?.coins ?? 0)}
          className="w-full h-16 rounded-2xl font-black text-base uppercase tracking-widest disabled:opacity-40 active:scale-[0.98] transition-all"
          style={{
            background: !spinning && betType ? `linear-gradient(135deg, ${ACCENT}, #be123c)` : "rgba(255,255,255,0.07)",
            boxShadow: !spinning && betType ? `0 0 30px ${ACCENT}50` : undefined,
            color: !spinning && betType ? "#fff" : "rgba(255,255,255,0.3)",
          }}
        >
          {spinning ? t("roulette_spinning") : t("roulette_spin_btn")}
        </button>
      </div>
    </GameLayout>
  );
}
