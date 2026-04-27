import { Layout } from "@/components/layout/Layout";
import { useGetMe, getGetMeQueryKey, useLogoutUser } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Avatar } from "@/components/Avatar";
import { OwnerBadge } from "@/components/OwnerBadge";
import { Copy, ChevronRight, LogOut, UserCog, Newspaper, Users, Bell, Crown, HelpCircle, Info, ShieldCheck } from "lucide-react";
import { fmtDateShort } from "@/lib/utils";

export default function Settings() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const [, setLocation] = useLocation();
  const logout = useLogoutUser();
  const qc = useQueryClient();
  const { toast } = useToast();

  if (!user) return null;

  const copyId = () => {
    navigator.clipboard.writeText(user.publicId);
    toast({ title: "ID nusgalandy" });
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        qc.clear();
        setLocation("/");
      },
    });
  };

  return (
    <Layout>
      <div className="p-4 space-y-6 pb-24">
        <h1 className="text-2xl font-black italic gold-text-gradient uppercase tracking-tighter">Sazlamalar</h1>

        <div className="bg-card border border-primary/20 rounded-3xl p-6 flex items-center gap-4">
          <Avatar username={user.username} color={user.avatarColor} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white truncate">{user.username}</h2>
              {user.isAdmin && <OwnerBadge />}
            </div>
            <button onClick={copyId} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mt-1">
              <span className="font-mono">#{user.publicId}</span>
              <Copy className="w-3 h-3" />
            </button>
            {user.email && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{user.email}</p>}
            <p className="text-[10px] text-muted-foreground mt-0.5">Agza boldy: {fmtDateShort(user.createdAt)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Row href="/edit-profile" icon={UserCog} label="Profili üýtget" desc="At, bio, reňk" />
          <Row href="/notifications" icon={Bell} label="Bildirişler" desc={user.unreadNotifications > 0 ? `${user.unreadNotifications} okalmadyk` : "Soňky habarlar"} badge={user.unreadNotifications > 0 ? user.unreadNotifications : undefined} />
          <Row href="/friends" icon={Users} label="Dostlar" desc="Sorag we ýazyşmalar" />
          <Row href="/news" icon={Newspaper} label="Tazelikler" desc="Habarlar we täzelenmeler" />
          <Row href="/vip" icon={Crown} label="VIP sargyt" desc="Goşmaça mümkinçilikler" />
          <Row href="/faq" icon={HelpCircle} label="Sorag-jogap" desc="Köp soralýan soraglar" />
          <Row href="/about" icon={Info} label="CoinHub hakda" desc="Önüm we kontakt" />
          {user.isAdmin && <Row href="/admin/dashboard" icon={ShieldCheck} label="Admin paneli" desc="Doly dolandyryş" highlight />}
        </div>

        <button
          onClick={handleLogout}
          className="w-full h-14 rounded-2xl border border-destructive/30 text-destructive flex items-center justify-center gap-2 font-black uppercase tracking-widest text-sm hover:bg-destructive/10 active:scale-[0.99] transition-all"
        >
          <LogOut className="w-4 h-4" />
          Çykmak
        </button>
      </div>
    </Layout>
  );
}

function Row({ href, icon: Icon, label, desc, badge, highlight }: { href: string; icon: any; label: string; desc?: string; badge?: number; highlight?: boolean }) {
  return (
    <Link href={href}>
      <div className={`bg-card border ${highlight ? "border-primary/40 gold-glow" : "border-primary/10"} rounded-2xl p-4 flex items-center gap-3 active:scale-[0.99] transition-all`}>
        <div className={`w-10 h-10 rounded-xl ${highlight ? "bg-primary text-black" : "bg-primary/10 text-primary"} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{label}</p>
          {desc && <p className="text-[11px] text-muted-foreground truncate">{desc}</p>}
        </div>
        {badge ? (
          <span className="bg-destructive text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-5 text-center">{badge}</span>
        ) : null}
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </Link>
  );
}
