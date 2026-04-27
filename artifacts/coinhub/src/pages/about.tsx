import { Layout } from "@/components/layout/Layout";
import { Logo } from "@/components/Logo";
import { Phone, MessageCircle, Shield, Sparkles } from "lucide-react";

export default function About() {
  return (
    <Layout>
      <div className="p-4 space-y-6 pb-24">
        <header className="flex flex-col items-center text-center pt-6">
          <Logo className="w-20 h-20 mb-4" />
          <h1 className="text-3xl font-black italic gold-text-gradient uppercase tracking-tighter">CoinHub</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">Wirtual TMT oýunlary</p>
          <p className="text-[10px] text-muted-foreground mt-1">v1.0.0</p>
        </header>

        <div className="bg-card border border-primary/20 rounded-3xl p-6 space-y-3">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">CoinHub barada</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            CoinHub — premium türkmen dilli wirtual kazino platformasy. Slot, Çarh, Bagt gutusy we
            Bagt uçuşy ýaly meşhur oýunlary jübüt jübüt oýunçylar bilen bäsleşip oýnaýyň.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Bu platforma diňe güýmenje üçin niýetlenen. TMT — wirtual teňňedir, hakyky pul däldir.
          </p>
        </div>

        <div className="bg-card border border-primary/20 rounded-3xl p-6 space-y-4">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Habarlaşmak</h2>

          <a href="tel:+99361403543" className="flex items-center justify-between bg-background/50 hover:bg-primary/5 border border-primary/15 p-4 rounded-2xl transition-all active:scale-[0.99]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Telefon</p>
                <p className="text-sm font-black text-white">+993 61 403 543</p>
              </div>
            </div>
          </a>

          <a href="tel:+918826816138" className="flex items-center justify-between bg-background/50 hover:bg-primary/5 border border-primary/15 p-4 rounded-2xl transition-all active:scale-[0.99]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">IMO</p>
                <p className="text-sm font-black text-white">+91 882 681 6138</p>
              </div>
            </div>
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card/50 border border-primary/15 rounded-2xl p-4 text-center">
            <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-white">Howpsuz</p>
          </div>
          <div className="bg-card/50 border border-primary/15 rounded-2xl p-4 text-center">
            <Sparkles className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-white">Premium</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
