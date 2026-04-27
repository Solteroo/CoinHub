import { Layout } from "@/components/layout/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const ITEMS: Array<{ q: string; a: string }> = [
  { q: "Nähili oýnamaly?", a: "Slot, Çarh, Bagt gutusy we Bagt uçuşy oýunlary bar. Her oýunyň öz girişinde 'Nähili oýnamaly?' düwmesi bilen düşündiriş açylýar. Stawkany saýlaň, oýna başlaň, utgaňyzy alyň." },
  { q: "TMT nädip almaly?", a: "Hasap döredeniňizde 200 TMT mugt berilýär. Her 3 günden bonus alyp bilersiňiz. Goşmaça TMT almak üçin Gapjyk → 'Admin bilen habarlaş' düwmesine basyň, ID-ňizi aýdyň." },
  { q: "Pul yzyna alyp bolarmy?", a: "TMT diňe oýun üçin niýetlenen wirtual teňňedir. Hakyky pula çalşyrylmaýar. Oýun-güýmenje üçin niýetlenen." },
  { q: "Çatda nähili özüni alyp barmaly?", a: "Hormat goýuň. Spam, kemsitme, jedeller bolmasyn. Düzgüni bozanlar admin tarapyndan gadagan edilýär. Maslahat: Türkmençe ýazyň, gysga we düşnükli boluň." },
  { q: "Bonus haçan gelýär?", a: "Her 3 günden bonus düwmesi açylýar. Baş sahypada 'Bonus taýýar' kartoçkasy görner. Bir basmak bilen 50 TMT alyp bilersiňiz." },
  { q: "Dost nädip goşmaly?", a: "Profile → Dostlar → ýokarda dostuň 8-belgili ID-sini ýazyň → 'Sorag iber'. Ýa-da liderlerden / çatdan ulanyjy ady ustüne basyp profiline gidip 'Dost goş' düwmesine basyň." },
  { q: "Şahsy ýazyşmak näme?", a: "Profil → Habarlaşmak. Islendik ulanyjy bilen jübüt-jübüt ýazyşyp bilersiňiz. Habarlar diňe iki tarapa görünýär." },
  { q: "TMT-ny dostlaryma nädip geçirmeli?", a: "Gapjyk → 'TMT geçir'. Alyjynyň 8-belgili ID-sini we möçberi ýazyň. Geçirim derrew bolýar." },
  { q: "Açar sözümi unutdym näme etmeli?", a: "Häzirlikçe Email arkaly parol dikeltmek setir taýýarlanýar. Profile → Sazlamalar → Email goşuň. Soň admin bilen habarlaşyň." },
];

export default function FAQ() {
  return (
    <Layout>
      <div className="p-4 space-y-6 pb-24">
        <header>
          <h1 className="text-2xl font-black italic gold-text-gradient uppercase tracking-tighter">Sorag-Jogap</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Köp soralýan soraglar</p>
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
