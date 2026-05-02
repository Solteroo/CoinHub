import { useEffect, useState } from "react";
import { X, Download, Share, PlusSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "coinhub_pwa_dismissed_v2";
const DELAY_MS = 3000;

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;
}

export function PWAInstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosMode, setIosMode] = useState(false);
  const [iosStep, setIosStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isInStandaloneMode()) return;
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    if (localStorage.getItem(STORAGE_KEY) === "1") return;

    const ios = isIOS();

    if (ios) {
      const timer = setTimeout(() => {
        setIosMode(true);
        setShow(true);
      }, DELAY_MS);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), DELAY_MS);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = (permanent = false) => {
    if (permanent) localStorage.setItem(STORAGE_KEY, "1");
    else sessionStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  };

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    const choice = await evt.userChoice;
    if (choice.outcome === "accepted" || choice.outcome === "dismissed") {
      dismiss(true);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="fixed bottom-[76px] left-3 right-3 z-[100] max-w-md mx-auto"
        >
          {iosMode ? (
            /* iOS manual instructions */
            <div
              className="rounded-2xl overflow-hidden shadow-2xl border border-primary/40"
              style={{ background: "rgba(14,14,24,0.97)", backdropFilter: "blur(20px)" }}
            >
              {/* Steps indicator */}
              <div className="flex border-b border-white/5">
                {[0, 1].map((i) => (
                  <button
                    key={i}
                    onClick={() => setIosStep(i)}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${iosStep === i ? "text-primary border-b-2 border-primary -mb-[1px]" : "text-white/30"}`}
                  >
                    {i === 0 ? "Шаг 1" : "Шаг 2"}
                  </button>
                ))}
              </div>

              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Logo */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-primary/30"
                    style={{ background: "rgba(212,175,55,0.1)" }}
                  >
                    <Logo className="w-9 h-9" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-base leading-tight">CoinHub</p>
                    <p className="text-[11px] text-primary font-bold uppercase tracking-wider mt-0.5">
                      {iosStep === 0 ? "Нажмите «Поделиться»" : "Нажмите «На экран Домой»"}
                    </p>
                  </div>
                </div>

                {/* Instruction */}
                <div
                  className="mt-4 rounded-xl p-3.5 border border-primary/20 flex items-center gap-3"
                  style={{ background: "rgba(212,175,55,0.07)" }}
                >
                  {iosStep === 0 ? (
                    <>
                      <Share className="w-8 h-8 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-white">Кнопка Share</p>
                        <p className="text-[11px] text-white/50 mt-0.5">Внизу Safari нажмите 📤 иконку</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <PlusSquare className="w-8 h-8 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-white">«На экран Домой»</p>
                        <p className="text-[11px] text-white/50 mt-0.5">Прокрутите вниз и нажмите «Добавить»</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex gap-2 mt-3">
                  {iosStep === 0 ? (
                    <button
                      onClick={() => setIosStep(1)}
                      className="flex-1 h-10 rounded-xl font-black text-sm text-black active:scale-95 transition-all"
                      style={{ background: "linear-gradient(135deg, #D4AF37, #b8942b)" }}
                    >
                      Далее →
                    </button>
                  ) : (
                    <button
                      onClick={() => dismiss(true)}
                      className="flex-1 h-10 rounded-xl font-black text-sm text-black active:scale-95 transition-all"
                      style={{ background: "linear-gradient(135deg, #D4AF37, #b8942b)" }}
                    >
                      Готово ✓
                    </button>
                  )}
                  <button
                    onClick={() => dismiss(false)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white/40 hover:text-white border border-white/10 bg-white/5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Android / Chrome normal prompt */
            <div
              className="rounded-2xl overflow-hidden shadow-2xl border border-primary/40"
              style={{ background: "rgba(14,14,24,0.97)", backdropFilter: "blur(20px)" }}
            >
              <div className="flex items-center gap-3 p-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-primary/30"
                  style={{ background: "rgba(212,175,55,0.1)" }}
                >
                  <Logo className="w-9 h-9" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white text-base">CoinHub</p>
                  <p className="text-[11px] text-white/50 mt-0.5 leading-tight">
                    Установите приложение — быстрый доступ без браузера
                  </p>
                </div>
                <button
                  onClick={() => dismiss(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 shrink-0 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2 px-4 pb-4">
                <button
                  onClick={install}
                  className="flex-1 h-11 rounded-xl font-black text-sm text-black flex items-center justify-center gap-2 active:scale-95 transition-all"
                  style={{ background: "linear-gradient(135deg, #D4AF37, #b8942b)", boxShadow: "0 0 20px rgba(212,175,55,0.3)" }}
                >
                  <Download className="w-4 h-4" />
                  Установить
                </button>
                <button
                  onClick={() => dismiss(true)}
                  className="h-11 px-4 rounded-xl text-sm font-bold text-white/40 hover:text-white border border-white/10 bg-white/5 transition-colors"
                >
                  Нет
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
