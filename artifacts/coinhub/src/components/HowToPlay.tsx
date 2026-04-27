import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function HowToPlay({ steps }: { steps: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card/50 border border-primary/15 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left active:bg-card transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-white">Nähili oýnamaly?</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-primary transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ol className="px-5 pb-4 space-y-2 text-xs text-muted-foreground leading-relaxed list-decimal list-inside">
              {steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
