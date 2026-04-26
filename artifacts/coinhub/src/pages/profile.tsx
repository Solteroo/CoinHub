import { Layout } from "@/components/layout/Layout";
import { useGetMe, getGetMeQueryKey, useGetMyStats, getGetMyStatsQueryKey, useLogoutUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Copy, LogOut, Phone, MessageCircle, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { fmtCoins } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Profile() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: stats } = useGetMyStats({ query: { queryKey: getGetMyStatsQueryKey() } });
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const logout = useLogoutUser();

  const handleCopyId = () => {
    if (user?.publicId) {
      navigator.clipboard.writeText(user.publicId);
      toast({ title: "ID nusgalandy", description: "Siziň ID belgiňiz göçürildi." });
    }
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setLocation("/");
      }
    });
  };

  return (
    <Layout>
      <div className="p-4 space-y-6 pb-24">
        
        {/* Profile Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card border border-primary/20 rounded-[2.5rem] p-8 text-center gold-glow relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full mx-auto mb-4 border-2 border-primary/30 flex items-center justify-center shadow-inner">
            <span className="text-4xl font-black italic gold-text-gradient">{user?.username?.[0]?.toUpperCase()}</span>
          </div>
          <h2 className="text-2xl font-black italic text-white mb-2 uppercase tracking-tighter">{user?.username}</h2>
          
          <div className="inline-flex items-center gap-3 bg-background/80 border border-primary/20 px-5 py-2.5 rounded-2xl mt-2 cursor-pointer active:scale-95 group transition-all hover:border-primary/50" onClick={handleCopyId}>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">ID:</span>
            <span className="text-sm font-black text-primary tracking-widest">{user?.publicId}</span>
            <Copy className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Gazanylan" value={fmtCoins(stats?.totalEarned)} />
          <StatCard label="Çykarylan" value={fmtCoins(stats?.totalSpent)} />
          <StatCard label="Oýunlar" value={stats?.gamesPlayed?.toString()} />
          <StatCard label="Reýting" value={stats?.rank ? `#${stats.rank}` : "-"} />
        </div>

        {/* VIP Top Up Section */}
        <div className="bg-gradient-to-br from-card via-card to-primary/5 border border-primary/30 rounded-[2rem] p-8 relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 text-primary/5 rotate-12 group-hover:scale-110 transition-transform duration-700">
            <Crown className="w-48 h-48" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
               <Crown className="w-5 h-5 text-primary" />
               <h3 className="font-black italic text-xl gold-text-gradient uppercase tracking-tighter">VIP SARGYYT</h3>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider leading-relaxed mb-8">
              Teňňe satyn almak üçin admin bilen habarlaşyň. ID-ňizi aýdyň.
            </p>
            
            <div className="space-y-4">
              <a href="tel:+99361403543" className="flex items-center justify-between bg-background/80 hover:bg-primary/10 border border-primary/20 p-5 rounded-2xl transition-all active:scale-[0.98] group/btn">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover/btn:bg-primary group-hover/btn:text-black transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <span className="font-black text-xs uppercase tracking-widest">Telefon</span>
                </div>
                <span className="text-sm font-black text-primary tracking-widest">+993 61 403 543</span>
              </a>
              
              <a href="tel:+918826816138" className="flex items-center justify-between bg-background/80 hover:bg-primary/10 border border-primary/20 p-5 rounded-2xl transition-all active:scale-[0.98] group/btn">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover/btn:bg-primary group-hover/btn:text-black transition-colors">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <span className="font-black text-xs uppercase tracking-widest">IMO</span>
                </div>
                <span className="text-sm font-black text-primary tracking-widest">+91 882 681 6138</span>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-4 space-y-4">
          {user?.isAdmin && (
            <Button
              variant="outline"
              onClick={() => setLocation("/admin/dashboard")}
              className="w-full border-primary/20 text-primary hover:bg-primary hover:text-black h-14 rounded-2xl font-black uppercase italic tracking-widest transition-all"
            >
              Admin Paneli
            </Button>
          )}

          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full text-destructive/60 hover:text-destructive hover:bg-destructive/5 h-14 rounded-2xl font-black uppercase italic tracking-widest transition-all"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Çykmak
          </Button>
        </div>
        
      </div>
    </Layout>
  );
}

function StatCard({ label, value }: { label: string, value?: string }) {
  return (
    <div className="bg-card border border-primary/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center group hover:border-primary/30 transition-colors">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 group-hover:text-primary transition-colors">{label}</span>
      <span className="text-xl font-black text-white italic tracking-tight">{value || "0"}</span>
    </div>
  );
}
