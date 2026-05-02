import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { fmtCoins } from "@/lib/utils";
import { COIN } from "@/lib/coin";

interface ResultOverlayProps {
  show: boolean;
  won: boolean;
  amount: number;
  label?: string;
  multiplier?: number;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export function ResultOverlay({
  show,
  won,
  amount,
  label,
  multiplier,
  onDismiss,
  autoDismissMs = 2600,
}: ResultOverlayProps) {
  useEffect(() => {
    if (!show) return;
    const id = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(id);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onDismiss}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
        >
          <motion.div
            initial={{ scale: 0.55, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 1.06, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.04 }}
            onClick={e => e.stopPropagation()}
            className="flex flex-col items-center gap-4 px-10 py-9 rounded-3xl border text-center mx-6"
            style={{
              background: won
                ? "linear-gradient(160deg, rgba(16,185,129,0.15) 0%, rgba(6,6,15,0.98) 60%)"
                : "linear-gradient(160deg, rgba(239,68,68,0.14) 0%, rgba(6,6,15,0.98) 60%)",
              borderColor: won ? "rgba(52,211,153,0.38)" : "rgba(239,68,68,0.32)",
              boxShadow: won
                ? "0 0 80px rgba(52,211,153,0.28), 0 0 160px rgba(52,211,153,0.09)"
                : "0 0 60px rgba(239,68,68,0.22)",
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 16, delay: 0.12 }}
              className="text-7xl"
            >
              {won ? "🏆" : "💸"}
            </motion.div>

            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-black uppercase tracking-wider"
              style={{
                color: won ? "#34d399" : "#f87171",
                textShadow: won
                  ? "0 0 30px rgba(52,211,153,0.7)"
                  : "0 0 30px rgba(248,113,113,0.6)",
              }}
            >
              {won ? "WIN!" : "LOSS"}
            </motion.p>

            {label && (
              <motion.p
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.26 }}
                className="text-sm font-bold uppercase tracking-widest -mt-2"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {label}
              </motion.p>
            )}

            {multiplier && multiplier > 1 && (
              <motion.p
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.28, type: "spring", stiffness: 260 }}
                className="text-3xl font-black tabular-nums"
                style={{ color: "#D4AF37", textShadow: "0 0 20px rgba(212,175,55,0.5)" }}
              >
                {multiplier}×
              </motion.p>
            )}

            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 260 }}
              className="text-5xl font-black tabular-nums flex items-baseline gap-2"
              style={{ color: won ? "#34d399" : "#f87171" }}
            >
              <span>{won ? "+" : "-"}{fmtCoins(amount)}</span>
              <span className="text-2xl opacity-60">{COIN}</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="text-xs font-bold uppercase tracking-[0.18em] mt-1"
              style={{ color: "rgba(255,255,255,0.28)" }}
            >
              TAP TO CONTINUE
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
