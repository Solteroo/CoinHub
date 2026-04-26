import { Layout } from "@/components/layout/Layout";
import { useGetMe, getGetMeQueryKey, useGetMyStats, getGetMyStatsQueryKey, useLogoutUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Copy, LogOut, Phone, MessageCircle, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { fmtCoins } from "@/lib/utils";

export default function Profile() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: stats } = useGetMyStats({ query: { queryKey: getGetMyStatsQueryKey() } });
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const logout = useLogoutUser();

  const handleCopyId = () => {
    if (user?.publicId) {
      navigator.clipboard.writeText(user.publicId);
      toast({ title: "Göçürildi", description: "ID göçürildi" });
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
      <div className="p-4 space-y-6">
        
        {/* Profile Card */}
        <div className="bg-card border border-primary/20 rounded-3xl p-6 text-center gold-glow">
          <div className="w-20 h-20 bg-primary/20 rounded-full mx-auto mb-4 border-2 border-primary flex items-center justify-center">
            <span className="text-3xl font-bold text-primary">{user?.username?.[0]?.toUpperCase()}</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">{user?.username}</h2>
          
          <div className="inline-flex items-center gap-2 bg-background/50 border border-primary/10 px-3 py-1.5 rounded-full mt-2 cursor-pointer active:scale-95" onClick={handleCopyId}>
            <span className="text-xs text-muted-foreground">ID:</span>
            <span className="text-sm font-mono text-primary font-medium">{user?.publicId}</span>
            <Copy className="w-3.5 h-3.5 text-primary" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Jemi Gazanylan" value={fmtCoins(stats?.totalEarned)} />
          <StatCard label="Jemi Çykarylan" value={fmtCoins(stats?.totalSpent)} />
          <StatCard label="Oýnalan Oýunlar" value={stats?.gamesPlayed?.toString()} />
          <StatCard label="Reýting" value={stats?.rank ? `#${stats.rank}` : "-"} />
        </div>

        {/* VIP Top Up Section */}
        <div className="bg-gradient-to-b from-[#1a1a24] to-[#0a0a0f] border border-primary/30 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 text-primary/10 rotate-12">
            <Crown className="w-32 h-32" />
          </div>
          
          <h3 className="font-bold text-lg gold-text-gradient mb-2 relative z-10">VIP Sargyt</h3>
          <p className="text-sm text-muted-foreground mb-6 relative z-10">Teňňe satyn almak ýa-da çykarmak üçin admin bilen habarlaşyň.</p>
          
          <div className="space-y-3 relative z-10">
            <a href="tel:+99361403543" className="flex items-center justify-between bg-background/80 hover:bg-primary/10 border border-primary/20 p-4 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <span className="font-medium">Telefon</span>
              </div>
              <span className="text-sm font-mono">+993 61 403 543</span>
            </a>
            
            <a href="imo://+918826816138" className="flex items-center justify-between bg-background/80 hover:bg-primary/10 border border-primary/20 p-4 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-primary" />
                <span className="font-medium">IMO</span>
              </div>
              <span className="text-sm font-mono">+91 882 681 6138</span>
            </a>
          </div>
        </div>

        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive h-12 rounded-xl"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Çykmak
        </Button>
        
        {user?.isAdmin && (
          <Button
            variant="outline"
            onClick={() => setLocation("/admin/dashboard")}
            className="w-full border-primary text-primary hover:bg-primary hover:text-black h-12 rounded-xl"
          >
            Admin Paneli
          </Button>
        )}
      </div>
    </Layout>
  );
}

function StatCard({ label, value }: { label: string, value?: string }) {
  return (
    <div className="bg-card border border-primary/10 rounded-2xl p-4 flex flex-col items-center justify-center">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</span>
      <span className="text-xl font-bold text-white">{value || "0"}</span>
    </div>
  );
}
