import { Layout } from "@/components/layout/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useI18n } from "@/i18n";

export default function FAQ() {
  const { t } = useI18n();

  const ITEMS = [
    {
      q: t("faq_q1" as any) || "Nähili oýnamaly?",
      a: t("faq_a1" as any) || "Slot, Çarh, Bagt gutusy we Bagt uçuşy oýunlary bar. Her oýunyň öz girişinde 'Nähili oýnamaly?' düwmesi bilen düşündiriş açylýar. Stawkany saýlaň, oýna başlaň, utgaňyzy alyň.",
    },
    {
      q: t("faq_q2" as any) || "TMT nädip almaly?",
      a: t("faq_a2" as any) || "Hasap döredeniňizde bonus TMT berilýär. Her 3 günden bonus alyp bilersiňiz. Goşmaça TMT almak üçin Gapjyk → 'Owner bilen habarlaş' düwmesine basyň.",
    },
    {
      q: t("faq_q3" as any) || "Pul yzyna alyp bolarmy?",
      a: t("faq_a3" as any) || "TMT diňe oýun üçin niýetlenen wirtual teňňedir. Hakyky pula çalşyrylmaýar. Oýun-güýmenje üçin niýetlenen.",
    },
    {
      q: t("faq_q4" as any) || "Çatda nähili özüni alyp barmaly?",
      a: t("faq_a4" as any) || "Hormat goýuň. Spam, kemsitme, jedeller bolmasyn. Düzgüni bozanlar admin tarapyndan gadagan edilýär.",
    },
    {
      q: t("faq_q5" as any) || "Bonus haçan gelýär?",
      a: t("faq_a5" as any) || "Her 3 günden bonus düwmesi açylýar. Baş sahypada 'Bonus taýýar' kartoçkasy görner. Bir basmak bilen 50 TMT alyp bilersiňiz.",
    },
    {
      q: t("faq_q6" as any) || "Dost nädip goşmaly?",
      a: t("faq_a6" as any) || "Profil → Dostlar → dostuň 8-belgili ID-sini ýazyň → 'Sorag iber'.",
    },
    {
      q: t("faq_q7" as any) || "Şahsy ýazyşmak näme?",
      a: t("faq_a7" as any) || "Profil → Habarlaşmak. Islendik ulanyjy bilen jübüt-jübüt ýazyşyp bilersiňiz.",
    },
    {
      q: t("faq_q8" as any) || "TMT-ny dostlaryma nädip geçirmeli?",
      a: t("faq_a8" as any) || "Gapjyk → 'TMT geçir'. Alyjynyň 8-belgili ID-sini we möçberi ýazyň.",
    },
  ];

  return (
    <Layout>
      <div className="p-4 space-y-6 pb-24">
        <header>
          <h1 className="text-2xl font-black italic gold-text-gradient uppercase tracking-tighter">{t("faq")}</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{t("faq_desc")}</p>
        </header>

        <Accordion type="single" collapsible className="space-y-3">
          {ITEMS.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="bg-card border border-primary/15 rounded-2xl px-4 border-b-0">
              <AccordionTrigger className="text-sm font-bold text-white text-left hover:text-primary py-4">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Layout>
  );
}
