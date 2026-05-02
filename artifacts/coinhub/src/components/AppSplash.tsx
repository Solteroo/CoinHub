import { useEffect } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

interface AppSplashProps {
  onDone: () => void;
}

export function AppSplash({ onDone }: AppSplashProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#06060f" }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 45% at 50% 50%, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.05) 40%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ scale: 0.3, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: "spring", stiffness: 180, damping: 18 }}
        className="flex flex-col items-center gap-8"
      >
        <motion.div
          animate={{ filter: ["drop-shadow(0 0 12px rgba(212,175,55,0.3))", "drop-shadow(0 0 32px rgba(212,175,55,0.7))", "drop-shadow(0 0 12px rgba(212,175,55,0.3))"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Logo className="w-28 h-28" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-center"
        >
          <h1
            className="text-5xl font-black tracking-[-0.02em]"
            style={{
              background: "linear-gradient(135deg, #F3E5AB 0%, #D4AF37 50%, #B8860B 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            COIN HUB
          </h1>
          <p className="text-[11px] font-bold tracking-[0.35em] text-white/30 uppercase mt-2">
            VIRTUAL COINS PLATFORM
          </p>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.7, duration: 1.2 }}
        className="absolute bottom-20 w-32 h-0.5 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #D4AF37, #F3E5AB)" }}
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ delay: 0.9, duration: 1.2, ease: "easeInOut" }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="absolute bottom-10 flex gap-2.5 items-center"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#D4AF37" }}
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.7, 1.3, 0.7] }}
            transition={{ duration: 1.0, repeat: Infinity, delay: i * 0.22, ease: "easeInOut" }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
