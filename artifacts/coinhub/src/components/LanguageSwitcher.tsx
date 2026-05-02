import { LANGS, type Lang } from "@/i18n/translations";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  /** compact: tiny pills for drawer */
  compact?: boolean;
  /** navbar: horizontal bar for header strip */
  navbar?: boolean;
}

export function LanguageSwitcher({ className, compact = false, navbar = false }: Props) {
  const { lang, setLang } = useI18n();

  if (navbar) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {LANGS.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code as Lang)}
            className={cn(
              "relative h-7 px-2.5 rounded-lg font-black uppercase tracking-widest transition-all active:scale-95 text-[10px]",
              lang === l.code
                ? "gold-gradient text-black shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                : "text-muted-foreground hover:text-white bg-transparent border border-white/10 hover:border-white/20",
            )}
            aria-label={l.label}
          >
            {lang === l.code && (
              <span className="absolute inset-0 rounded-lg bg-primary/20 blur-sm pointer-events-none" />
            )}
            <span className="relative z-10">{l.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code as Lang)}
          className={cn(
            "rounded-lg font-black uppercase tracking-wider transition-all active:scale-95",
            compact ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-1",
            lang === l.code
              ? "bg-primary text-black shadow-[0_0_8px_rgba(212,175,55,0.4)]"
              : "text-muted-foreground hover:text-white hover:bg-white/5 border border-white/10",
          )}
          aria-label={l.label}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
