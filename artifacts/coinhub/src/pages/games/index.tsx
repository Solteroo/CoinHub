import { Layout } from "@/components/layout/Layout";
import { Link } from "wouter";
import { ChevronRight, LayoutGrid, Disc, Package, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function GamesHub() {
  return (
    <Layout>
      <div className="p-4 space-y-6 pb-24">
        <header className="pt-4">
          <h1 className="text-3xl font-black italic gold-text-gradient uppercase tracking-tighter">Oýunlar</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">Uly utuşlar garaşýar</p>
        </header>
        
        <div className="space-y-4">
          <GameCard 
            title="Slot Maşyn" 
            description="3 reel, klassiki kazino duýgusy. 777 uly jekpot!" 
            href="/games/slot" 
            className="from-purple-900/20 to-card border-purple-500/20"
            badge="Premium"
            badgeClass="bg-purple-500/20 text-purple-300"
            icon={LayoutGrid}
          />
          
          <GameCard 
            title="Bagt Çarhy" 
            description="Çarhy aýlaň we 100x çenli multipliýator gazanyň." 
            href="/games/spin" 
            className="from-blue-900/20 to-card border-blue-500/20"
            badge="Meşhur"
            badgeClass="bg-blue-500/20 text-blue-300"
            icon={Disc}
          />
          
          <GameCard 
            title="Bagt Gutusy" 
            description="9 sandykdan birini saýlaň. Içinde näme bar?" 
            href="/games/luckybox" 
            className="from-amber-900/20 to-card border-amber-500/20"
            badge="Täze"
            badgeClass="bg-amber-500/20 text-amber-300"
            icon={Package}
          />

          <GameCard 
            title="Bagt Uçuşy" 
            description="Raketa näçe uçarka? Nagtlaşdyryp ýetişiň!" 
            href="/games/crash" 
            className="from-red-900/20 to-card border-red-500/20"
            badge="Gyzgyn"
            badgeClass="bg-red-500/20 text-red-300"
            icon={Rocket}
          />
        </div>

        <div className="bg-card/30 border border-primary/10 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white uppercase mb-4 tracking-widest">Utuş tablisasy</h3>
          <div className="space-y-3">
            <PayRow label="JEKPOT (777)" value="150x" isGold />
            <PayRow label="Ýyldyzlar" value="30x" />
            <PayRow label="Gabyklar" value="12x" />
            <PayRow label="Serediler" value="6x" />
            <PayRow label="Güller" value="3.5x" />
            <PayRow label="BAR" value="2.2x" />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function PayRow({ label, value, isGold }: { label: string, value: string, isGold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs font-bold">
      <span className={cn("uppercase tracking-wider", isGold ? "gold-text-gradient" : "text-muted-foreground")}>{label}</span>
      <span className={isGold ? "text-primary" : "text-white"}>{value}</span>
    </div>
  );
}

function GameCard({ title, description, href, className, badge, badgeClass, icon: Icon }: any) {
  return (
    <Link href={href}>
      <motion.div 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn("bg-gradient-to-br border rounded-3xl p-6 flex items-center justify-between group active:scale-95 cursor-pointer gold-glow relative overflow-hidden", className)}
      >
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
             {Icon && <Icon className="w-5 h-5 text-primary/70" />}
             <h3 className="font-black text-xl text-white uppercase tracking-tighter italic">{title}</h3>
             {badge && <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase", badgeClass)}>{badge}</span>}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">{description}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all">
          <ChevronRight className="w-6 h-6 text-primary" />
        </div>
      </motion.div>
    </Link>
  );
}
