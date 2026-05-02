import { Layout } from "@/components/layout/Layout";
import { Logo } from "@/components/Logo";
import { Shield, Sparkles, Gamepad2, Crown, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { useI18n } from "@/i18n";

export default function About() {
  const { t } = useI18n();

  return (
    <Layout>
      <div className="p-4 space-y-6 pb-24">
        <header className="flex flex-col items-center text-center pt-6">
          <Logo className="w-20 h-20 mb-4" />
          <h1 className="text-3xl font-black italic gold-text-gradient uppercase tracking-tighter">CoinHub</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">{t("tagline")}</p>
          <p className="text-[10px] text-muted-foreground mt-1">v2.0.0</p>
        </header>

        <div className="bg-card border border-primary/20 rounded-3xl p-6 space-y-3">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">{t("about_content_title")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("about_platform_desc")}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("about_tmt_note")}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card/50 border border-primary/15 rounded-2xl p-5 text-center">
            <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-black text-white uppercase tracking-tight">{t("about_secure")}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{t("about_secure_desc")}</p>
          </div>
          <div className="bg-card/50 border border-primary/15 rounded-2xl p-5 text-center">
            <Sparkles className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-black text-white uppercase tracking-tight">{t("about_premium")}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{t("about_premium_desc")}</p>
          </div>
          <div className="bg-card/50 border border-primary/15 rounded-2xl p-5 text-center">
            <Gamepad2 className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-black text-white uppercase tracking-tight">{t("about_games_count")}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{t("about_games_desc")}</p>
          </div>
          <div className="bg-card/50 border border-primary/15 rounded-2xl p-5 text-center">
            <Crown className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-black text-white uppercase tracking-tight">{t("about_vip")}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{t("about_vip_desc")}</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary/15 via-card to-primary/15 border border-primary/30 rounded-2xl p-5 text-center gold-glow">
          <MessageCircle className="w-8 h-8 text-primary mx-auto mb-3" />
          <h2 className="text-sm font-black text-white uppercase tracking-tight mb-2">{t("need_help")}</h2>
          <p className="text-xs text-muted-foreground mb-4">{t("about_contact_desc")}</p>
          <Link href="/dm">
            <button className="gold-gradient text-black font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl active:scale-95">
              {t("contact_admin")}
            </button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
