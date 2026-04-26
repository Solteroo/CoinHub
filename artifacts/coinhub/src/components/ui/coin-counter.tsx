import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { fmtCoins } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CoinCounterProps {
  value: number;
  className?: string;
}

export function CoinCounter({ value, className }: CoinCounterProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(fmtCoins(Math.round(latest)));
      }
    });
    return controls.stop;
  }, [value, count]);

  return (
    <motion.span className={cn("tabular-nums", className)}>
      {displayValue}
    </motion.span>
  );
}
