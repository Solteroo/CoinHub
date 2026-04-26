import { Layout } from "@/components/layout/Layout";
import { Link } from "wouter";
import { Gamepad2, Gift, MousePointerClick, ChevronRight } from "lucide-react";

export default function GamesHub() {
  return (
    <Layout>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold gold-text-gradient mb-6">Oýunlar</h1>
        
        <GameCard 
          title="Pökgi" 
          description="Çarhy aýlaň we baýrak gazanyň" 
          href="/games/spin" 
          icon={Gamepad2}
        />
        
        <GameCard 
          title="Bagt gutusy" 
          description="Syrly gutularyň birini saýlaň" 
          href="/games/luckybox" 
          icon={Gift}
        />
        
        <GameCard 
          title="Basmak oýny" 
          description="Tiz basyp teňňe ýygnaň" 
          href="/games/tap" 
          icon={MousePointerClick}
        />
      </div>
    </Layout>
  );
}

function GameCard({ title, description, href, icon: Icon }: any) {
  return (
    <Link href={href}>
      <div className="bg-card border border-primary/20 hover:border-primary/50 transition-all rounded-3xl p-5 flex items-center justify-between group active:scale-95 cursor-pointer gold-glow">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <ChevronRight className="text-primary/50 group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
}
