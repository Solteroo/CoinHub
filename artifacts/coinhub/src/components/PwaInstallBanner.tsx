import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

const STORAGE_KEY = "coinhub_pwa_dismissed";

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-full bg-gradient-to-r from-primary/20 via-card to-primary/20 border border-primary/40 rounded-2xl p-4 flex items-center gap-3 gold-glow"
        >
          <div className="w-11 h-11 rounded-xl bg-primary text-black flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white uppercase tracking-tight">CoinHub-y guruň</p>
            <p className="text-[11px] text-white/70 mt-0.5">Telefona guruň — has çalt açylýar</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 rounded-lg gold-gradient text-black text-[11px] font-black uppercase tracking-wider active:scale-95"
            >
              Gur
            </button>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 rounded-lg bg-white/5 text-muted-foreground flex items-center justify-center hover:text-white active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
