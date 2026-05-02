import { Layout } from "@/components/layout/Layout";
import { Logo } from "@/components/Logo";
import { Shield, Sparkles, Gamepad2, Crown, MessageCircle } from "lucide-react";
import { Link } from "wouter";

export default function About() {
  return (
    <Layout>
      <div className="p-4 space-y-6 pb-24">
        <header className="flex flex-col items-center text-center pt-6">
          <Logo className="w-20 h-20 mb-4" />
          <h1 className="text-3xl font-black italic gold-text-gradient uppercase tracking-tighter">CoinHub</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">Premium Kazino Platformasy</p>
          <p className="text-[10px] text-muted-foreground mt-1">v2.0.0</p>
        </header>

        <div className="bg-card border border-primary/20 rounded-3xl p-6 space-y-3">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">CoinHub barada</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            CoinHub — premium wirtual kazino platformasy. 9 dürli oýun bilen iň gowy kazino
            tejribäni başdan geçiriň. Slot, Ruletka, Plinko, Hi-Lo, Zar we başga-da köp oýunlar.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            TMT — wirtual teňňedir, hakyky pul däldir. Bu platforma diňe güýmenje üçin niýetlenen.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card/50 border border-primary/15 rounded-2xl p-5 text-center">
            <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-black text-white uppercase tracking-tight">Howpsuz</p>
            <p className="text-[10px] text-muted-foreground mt-1">Maglumatlar goragly</p>
          </div>
          <div className="bg-card/50 border border-primary/15 rounded-2xl p-5 text-center">
            <Sparkles className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-black text-white uppercase tracking-tight">Premium</p>
            <p className="text-[10px] text-muted-foreground mt-1">HD oýun grafika</p>
          </div>
          <div className="bg-card/50 border border-primary/15 rounded-2xl p-5 text-center">
            <Gamepad2 className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-black text-white uppercase tracking-tight">9 Oýun</p>
            <p className="text-[10px] text-muted-foreground mt-1">Köp sanly oýunlar</p>
          </div>
          <div className="bg-card/50 border border-primary/15 rounded-2xl p-5 text-center">
            <Crown className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-black text-white uppercase tracking-tight">VIP</p>
            <p className="text-[10px] text-muted-foreground mt-1">Premium mümkinçilikler</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary/15 via-card to-primary/15 border border-primary/30 rounded-2xl p-5 text-center gold-glow">
          <MessageCircle className="w-8 h-8 text-primary mx-auto mb-3" />
          <h2 className="text-sm font-black text-white uppercase tracking-tight mb-2">Kömek gerekmi?</h2>
          <p className="text-xs text-muted-foreground mb-4">Admin bilen göni habarlaşyň. Ähli soraglarynyz üçin biz taýýar.</p>
          <Link href="/dm">
            <button className="gold-gradient text-black font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl active:scale-95">
              Admin bilen habarlaş
            </button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
