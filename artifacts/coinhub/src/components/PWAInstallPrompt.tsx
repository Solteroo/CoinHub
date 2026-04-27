import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "coinhub_pwa_dismissed";

export function PWAInstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(STORAGE_KEY) === "1") return;

    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  };

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    const choice = await evt.userChoice;
    if (choice.outcome === "accepted" || choice.outcome === "dismissed") {
      dismiss();
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md"
        >
          <div className="bg-card border border-primary/40 rounded-2xl shadow-2xl gold-glow p-4 flex items-center gap-3 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <Logo className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-sm uppercase tracking-tight">CoinHub gurnamak</p>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                Telefonyňyza goşuň, has çalt giriň
              </p>
            </div>
            <button
              onClick={install}
              className="bg-primary text-black font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              GUR
            </button>
            <button
              onClick={dismiss}
              aria-label="Ýap"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
