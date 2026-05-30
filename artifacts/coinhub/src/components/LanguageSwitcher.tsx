import { useState } from "react";
import { LANGS, type Lang } from "@/i18n/translations";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { Globe, Check, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { motion } from "framer-motion";

const FLAG: Record<string, string> = {
  ru: "🇷🇺",
  en: "🇬🇧",
  tm: "🇹🇲",
  uz: "🇺🇿",
};

const LANG_FULL: Record<string, string> = {
  ru: "Русский",
  en: "English",
  tm: "Türkmençe",
  uz: "O'zbek",
};

interface Props {
  className?: string;
  compact?: boolean;
}

export function LanguageSwitcher({ className, compact = false }: Props) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2.5 rounded-xl transition-all active:scale-95 font-bold text-white/70 hover:text-white",
          compact
            ? "px-3 py-2.5 w-full text-sm hover:bg-card/60"
            : "px-3 py-2 border border-primary/15 bg-card/40 hover:bg-card hover:border-primary/30 text-sm",
          className,
        )}
      >
        <Globe className="w-4 h-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left text-sm font-bold uppercase tracking-wider">
          {t("language")}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-lg leading-none">{FLAG[lang]}</span>
          <span className="text-[10px] font-black text-primary uppercase">{lang.toUpperCase()}</span>
          {compact && <ChevronRight className="w-3.5 h-3.5 opacity-30" />}
        </div>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="bg-background border-primary/20 rounded-t-3xl pb-10">
          <SheetHeader className="pb-5 text-left">
            <SheetTitle className="gold-text-gradient flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5 text-primary" />
              {t("language")}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-2.5">
            {LANGS.map((l, i) => {
              const isActive = lang === l.code;
              return (
                <motion.button
                  key={l.code}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => { setLang(l.code as Lang); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98]",
                    isActive
                      ? "bg-primary/12 border-primary/50 shadow-[0_0_18px_rgba(212,175,55,0.15)]"
                      : "bg-card/50 border-white/8 hover:border-primary/25 hover:bg-card",
                  )}
                >
                  <span className="text-3xl leading-none shrink-0">{FLAG[l.code]}</span>
                  <div className="flex-1 text-left">
                    <p className={cn("font-black text-base leading-none mb-1", isActive ? "text-primary" : "text-white")}>
                      {LANG_FULL[l.code]}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">{l.label}</p>
                  </div>
                  {isActive && (
                    <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-black" strokeWidth={3} />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
