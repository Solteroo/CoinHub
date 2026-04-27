import { Layout } from "@/components/layout/Layout";
import {
  useGetMe,
  getGetMeQueryKey,
  useGetMyStats,
  getGetMyStatsQueryKey,
  useLogoutUser,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar } from "@/components/Avatar";
import { OwnerBadge } from "@/components/OwnerBadge";
import { Button } from "@/components/ui/button";
import {
  Copy,
  LogOut,
  UserCog,
  Settings as SettingsIcon,
  Bell,
  Users,
  MessageCircle,
  ShieldCheck,
  Trophy,
  Gamepad2,
  Coins,
  ArrowRightLeft,
  Crown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { fmtCoins } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Profile() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: stats } = useGetMyStats({ query: { queryKey: getGetMyStatsQueryKey() } });
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const logout = useLogoutUser();
  const qc = useQueryClient();

  if (!user) return null;

  const handleCopyId = () => {
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
      <div className="p-4 space-y-5 pb-24">
        {/* Profile Header */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card border border-primary/20 rounded-3xl p-6 text-center gold-glow relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <Avatar username={user.username} color={user.avatarColor} size="xl" className="mx-auto mb-3" />

          <div className="flex items-center justify-center gap-2 mt-2">
            <h2 className="text-xl font-black text-white">{user.username}</h2>
            {user.isAdmin && <OwnerBadge size="md" />}
          </div>

          <button
            onClick={handleCopyId}
            className="inline-flex items-center gap-2 bg-background/60 border border-primary/20 px-4 py-2 rounded-xl mt-3 active:scale-95 hover:border-primary/50 transition-all"
          >
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ID</span>
            <span className="text-sm font-black text-primary tracking-widest">#{user.publicId}</span>
            <Copy className="w-3.5 h-3.5 text-primary" />
          </button>

          {user.bio && (
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed max-w-xs mx-auto">{user.bio}</p>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard icon={Trophy} label="Reýting" value={stats?.rank ? `#${stats.rank}` : "—"} />
          <StatCard icon={Coins} label="Balans" value={fmtCoins(user.coins)} suffix="TMT" />
          <StatCard icon={Gamepad2} label="Oýun" value={stats?.gamesPlayed?.toString() ?? "0"} />
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-3">
          <ActionTile href="/edit-profile" icon={UserCog} label="Profili üýtget" />
          <ActionTile href="/notifications" icon={Bell} label="Bildirişler" badge={user.unreadNotifications} />
          <ActionTile href="/dm" icon={MessageCircle} label="Habarlaşmak" badge={user.unreadDms} />
          <ActionTile href="/friends" icon={Users} label="Dostlar" />
          <ActionTile href="/transfer" icon={ArrowRightLeft} label="TMT geçir" />
          <ActionTile href="/vip" icon={Crown} label="VIP sargyt" highlight />
          <ActionTile href="/settings" icon={SettingsIcon} label="Sazlamalar" />
          {user.isAdmin && <ActionTile href="/admin/dashboard" icon={ShieldCheck} label="Admin" highlight />}
        </div>

        <div className="pt-2">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full text-destructive/80 hover:text-destructive hover:bg-destructive/10 h-12 rounded-2xl font-black uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Çykmak
          </Button>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value, suffix }: { icon: any; label: string; value: string; suffix?: string }) {
  return (
    <div className="bg-card border border-primary/10 rounded-2xl p-3 flex flex-col items-center text-center gap-1">
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{label}</span>
      <span className="text-sm font-black text-white tabular-nums">{value}</span>
      {suffix && <span className="text-[8px] text-primary uppercase font-bold tracking-widest">{suffix}</span>}
    </div>
  );
}

function ActionTile({ href, icon: Icon, label, badge, highlight }: { href: string; icon: any; label: string; badge?: number; highlight?: boolean }) {
  return (
    <Link href={href}>
      <div className={`bg-card border ${highlight ? "border-primary/40 gold-glow" : "border-primary/10"} rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-[0.97] transition-all relative`}>
        <div className={`w-10 h-10 rounded-xl ${highlight ? "bg-primary text-black" : "bg-primary/10 text-primary"} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[11px] font-black uppercase tracking-tight text-white text-center">{label}</span>
        {badge && badge > 0 ? (
          <span className="absolute top-2 right-2 bg-destructive text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-4 text-center">{badge}</span>
        ) : null}
      </div>
    </Link>
  );
}
