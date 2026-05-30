import { GameLayout } from "@/components/layout/GameLayout";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  usePlayCrash, useGetMe, getGetMeQueryKey,
  getGetMyTransactionsQueryKey, getGetMyStatsQueryKey, getGetLeaderboardQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BetSelector } from "@/components/BetSelector";
import { ResultOverlay } from "@/components/games/ResultOverlay";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { useI18n } from "@/i18n";
import { playWin, playLose, playClick } from "@/lib/sounds";

const ACCENT = "#ef4444";
const SVG_W = 300;
const SVG_H = 170;

function buildCurve(progress: number): { line: string; fill: string; tip: [number, number] } {
  if (progress <= 0.001) {
    return { line: `M0,${SVG_H}`, fill: "", tip: [0, SVG_H] };
  }
  const steps = Math.max(6, Math.ceil(progress * 80));
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * progress;
    const x = t * SVG_W;
    const y = SVG_H - Math.pow(t, 0.62) * SVG_H * 0.88;
    pts.push([x, y]);
  }
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1]!;
  const fill = `${line} L${last[0].toFixed(1)},${SVG_H} L0,${SVG_H}Z`;
  return { line, fill, tip: last };
}

type Status = "idle" | "running" | "crashed" | "cashed";

export default function CrashGame() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const [bet, setBet] = useState(10);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [playing, setPlaying] = useState(false);
  const [multiplier, setMultiplier] = useState(1.0);
  const [animProgress, setAnimProgress] = useState(0);
  const [history, setHistory] = useState<{ value: string; cashed: boolean }[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);

  const playCrash = usePlayCrash();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  const { line, fill, tip } = useMemo(() => buildCurve(animProgress), [animProgress]);

  const lineColor =
    status === "cashed" ? "#34d399" :
    status === "crashed" ? "#ef4444" :
    "#a855f7";

  const finalizeGame = (res: any) => {
    const chip = {
      value: res.cashedOut ? `${res.autoCashout.toFixed(2)}×` : `${res.crashAt.toFixed(2)}×`,
      cashed: res.cashedOut,
    };
    setHistory(prev => [chip, ...prev].slice(0, 8));
    setResult(res);
    if (res.cashedOut) {
      setStatus("cashed");
      setMultiplier(res.autoCashout);
      playWin();
      if (res.multiplier >= 5) confetti({ particleCount: 160, spread: 70, origin: { y: 0.5 }, colors: ["#34d399", "#a3e635"] });
    } else {
      setStatus("crashed");
      setMultiplier(res.crashAt);
      playLose();
    }
    setTimeout(() => {
      setShowResult(true);
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMyTransactionsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
    }, 500);
    setPlaying(false);
  };

  const handleStart = () => {
    if (playing || !user || bet > user.coins || bet < 10) return;
    setPlaying(true);
    setStatus("running");
    setMultiplier(1.0);
    setAnimProgress(0);
    setShowResult(false);
    setResult(null);
    playClick();

    playCrash.mutate({ data: { bet, autoCashout } }, {
      onSuccess: (res) => {
        const target = Math.min(res.crashAt, res.autoCashout);
        const DURATION_MS = 900 + Math.log(Math.max(1.01, target)) * 1700;
        const startTime = Date.now();
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const tRaw = Math.min(1, elapsed / DURATION_MS);
          setAnimProgress(tRaw);
          setMultiplier(1 + (target - 1) * Math.pow(tRaw, 0.65));
          if (tRaw < 1) requestAnimationFrame(animate);
          else finalizeGame(res);
        };
        requestAnimationFrame(animate);
      },
      onError: (err: any) => {
        setPlaying(false);
        setStatus("idle");
        toast({ title: t("error"), description: err.message, variant: "destructive" });
      },
    });
  };

  const adjustCashout = (delta: number) => {
    setAutoCashout(v => Math.round(Math.min(50, Math.max(1.1, v + delta)) * 100) / 100);
  };

  return (
    <GameLayout title={t("game_crash_title")} emoji="🚀" accentColor={ACCENT}>
      <div
        className="flex-1 flex flex-col gap-3"
        style={{ paddingTop: "12px", paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))" }}
      >
        {/* ── History chips ───────────────────────────────────────── */}
        <div className="shrink-0 flex gap-2 overflow-x-auto no-scrollbar px-4 min-h-[30px] items-center">
          <AnimatePresence initial={false}>
            {history.map((h, i) => (
              <motion.div
                key={`${i}-${h.value}`}
                initial={{ opacity: 0, scale: 0.7, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className="shrink-0 px-3 py-1 rounded-full text-[11px] font-black tabular-nums border"
                style={{
                  background: h.cashed ? "rgba(52,211,153,0.15)" : "rgba(239,68,68,0.15)",
                  borderColor: h.cashed ? "rgba(52,211,153,0.4)" : "rgba(239,68,68,0.4)",
                  color: h.cashed ? "#34d399" : "#f87171",
                }}
              >
                {h.value}
              </motion.div>
            ))}
            {history.length === 0 && (
              <span className="text-[11px] text-white/20 font-bold">—</span>
            )}
          </AnimatePresence>
        </div>

        {/* ── SVG Crash Chart ──────────────────────────────────────── */}
        <div
          className="relative mx-4 rounded-3xl overflow-hidden shrink-0"
          style={{
            height: "clamp(190px, 38vh, 270px)",
            background: "linear-gradient(180deg, #0e0520 0%, #130033 50%, #0a0015 100%)",
            border: `1.5px solid ${
              status === "crashed" ? "rgba(239,68,68,0.45)" :
              status === "cashed"  ? "rgba(52,211,153,0.45)" :
              "rgba(168,85,247,0.2)"
            }`,
            boxShadow: status === "running"
              ? "0 0 40px rgba(168,85,247,0.12)"
              : status === "cashed"
              ? "0 0 40px rgba(52,211,153,0.12)"
              : status === "crashed"
              ? "0 0 40px rgba(239,68,68,0.12)"
              : undefined,
          }}
        >
          {/* Subtle grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{
              backgroundImage: "linear-gradient(rgba(168,85,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,1) 1px, transparent 1px)",
              backgroundSize: "48px 36px",
            }}
          />

          {/* SVG curve */}
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="crashFillGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity="0.35" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="0.04" />
              </linearGradient>
              <filter id="glowFilter">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {animProgress > 0.01 && (
              <>
                {/* Fill under curve */}
                <path d={fill} fill="url(#crashFillGrad)" />
                {/* Curve line */}
                <path
                  d={line}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glowFilter)"
                />
                {/* Glow copy */}
                <path
                  d={line}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.6"
                />
                {/* Tip dot */}
                <circle cx={tip[0]} cy={tip[1]} r="7" fill="white" opacity="0.95"
                  style={{ filter: `drop-shadow(0 0 6px ${lineColor})` }} />
                <circle cx={tip[0]} cy={tip[1]} r="3.5" fill={lineColor} />
              </>
            )}
          </svg>

          {/* Center multiplier display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <motion.div
              key={status}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="text-center"
            >
              <div
                className={cn(
                  "font-black tabular-nums leading-none",
                  status === "idle" ? "text-white/10" : "text-white"
                )}
                style={{
                  fontSize: "clamp(52px, 14vw, 80px)",
                  textShadow:
                    status === "running" ? `0 0 40px ${lineColor}90, 0 0 80px ${lineColor}40` :
                    status === "cashed"  ? "0 0 40px rgba(52,211,153,0.7)" :
                    status === "crashed" ? "0 0 40px rgba(239,68,68,0.6)" : undefined,
                  color:
                    status === "cashed"  ? "#34d399" :
                    status === "crashed" ? "#f87171" :
                    status === "running" ? "#fff"    : "rgba(255,255,255,0.08)",
                }}
              >
                {multiplier.toFixed(2)}×
              </div>

              {status === "cashed" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-black uppercase tracking-widest text-emerald-400 mt-1"
                  style={{ textShadow: "0 0 20px rgba(52,211,153,0.7)" }}
                >
                  ✓ CASHED OUT
                </motion.div>
              )}
              {status === "crashed" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-black uppercase tracking-widest text-red-400 mt-1"
                  style={{ textShadow: "0 0 20px rgba(239,68,68,0.7)" }}
                >
                  💥 CRASHED
                </motion.div>
              )}
              {status === "idle" && (
                <div className="text-[11px] font-bold text-white/20 uppercase tracking-widest mt-2">
                  {t("start_btn")} →
                </div>
              )}
            </motion.div>
          </div>

          {/* Rocket flame when running */}
          {status === "running" && (
            <motion.div
              className="absolute"
              style={{
                left: `${(tip[0] / SVG_W) * 100}%`,
                top: `${(tip[1] / SVG_H) * 100}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 10,
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="text-2xl"
                style={{ filter: "drop-shadow(0 0 8px rgba(249,115,22,0.9))" }}
              >
                🚀
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* ── Controls ─────────────────────────────────────────────── */}
        <div className="shrink-0 px-4 flex flex-col gap-2.5">
          {/* Cashout At row */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">{t("auto_cashout")}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustCashout(-0.5)} disabled={playing}
                className="w-11 h-11 rounded-xl font-black text-xl border flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
              >
                −
              </button>
              <div
                className="flex-1 h-11 rounded-xl border flex items-center justify-center font-black text-base tabular-nums"
                style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(239,68,68,0.3)", color: "#fff" }}
              >
                {autoCashout.toFixed(2)}×
              </div>
              <button
                onClick={() => adjustCashout(0.5)} disabled={playing}
                className="w-11 h-11 rounded-xl font-black text-xl border flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
              >
                +
              </button>
            </div>
            {/* Quick cashout buttons */}
            <div className="flex gap-1.5 mt-1.5">
              {[1.5, 2.0, 3.0, 5.0, 10.0].map(val => (
                <button key={val} onClick={() => setAutoCashout(val)} disabled={playing}
                  className="flex-1 py-1 rounded-lg text-[10px] font-black border transition-all active:scale-95 disabled:opacity-30"
                  style={{
                    background: autoCashout === val ? `${ACCENT}20` : "rgba(255,255,255,0.04)",
                    borderColor: autoCashout === val ? `${ACCENT}60` : "rgba(255,255,255,0.08)",
                    color: autoCashout === val ? ACCENT : "rgba(255,255,255,0.45)",
                  }}>
                  {val}×
                </button>
              ))}
            </div>
          </div>

          {/* Bet selector */}
          <BetSelector value={bet} onChange={setBet} min={10} max={user?.coins ?? 0} disabled={playing} />

          {/* START button */}
          <button
            onClick={handleStart}
            disabled={playing || !user || (user?.coins ?? 0) < bet}
            className="w-full h-14 rounded-2xl font-black text-lg uppercase tracking-widest disabled:opacity-35 active:scale-[0.98] transition-all"
            style={{
              background: playing
                ? "rgba(255,255,255,0.07)"
                : "linear-gradient(135deg, #ef4444, #b91c1c)",
              boxShadow: playing ? undefined : `0 0 36px rgba(239,68,68,0.5), 0 0 80px rgba(239,68,68,0.18)`,
              color: playing ? "rgba(255,255,255,0.3)" : "#fff",
            }}
          >
            {playing
              ? <span className="flex items-center justify-center gap-2">
                  <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>🚀</motion.span>
                  {t("in_flight")}
                </span>
              : t("start_btn")}
          </button>
        </div>
      </div>

      <ResultOverlay
        show={showResult}
        won={result?.cashedOut ?? false}
        amount={Math.abs(result?.netChange ?? 0)}
        multiplier={result?.cashedOut ? result.autoCashout : result?.crashAt}
        onDismiss={() => { setShowResult(false); setStatus("idle"); setAnimProgress(0); setMultiplier(1.0); }}
      />
    </GameLayout>
  );
}
