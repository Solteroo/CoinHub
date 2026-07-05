import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetMe, getGetMeQueryKey,
  useSearchUsers,
  useLogoutUser,
  useGetAdminOwner, getGetAdminOwnerQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Menu, Search, ChevronRight, X,
  Settings, Newspaper, Users, Bell, HelpCircle, Info,
  LogOut, ShieldCheck, Plus, Send, Loader2,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";
import { OwnerBadge } from "@/components/OwnerBadge";
import { VipLevelBar } from "@/components/VipLevelBar";
import { getVipLevel } from "@/lib/vip-level";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { fmtCoins, cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useDebounce } from "@/hooks/use-debounce";
import { playClick } from "@/lib/sounds";
import { useToast } from "@/hooks/use-toast";
import { COIN } from "@/lib/coin";

export function TopHeader() {
  const [, setLocation] = useLocation();
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: owner } = useGetAdminOwner({ query: { queryKey: getGetAdminOwnerQueryKey(), enabled: !!user, staleTime: 10 * 60_000 } });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositMsg, setDepositMsg] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [q, setQ] = useState("");
  const dq = useDebounce(q, 300);
  const { data: results = [] } = useSearchUsers({ q: dq }, { query: { enabled: dq.length >= 2, queryKey: ["searchUsers", dq] } });
  const logout = useLogoutUser();
  const qc = useQueryClient();
  const { t } = useI18n();
  const { toast } = useToast();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => { qc.clear(); setDrawerOpen(false); setLocation("/"); },
    });
  };

  const goAndClose = (href: string) => { playClick(); setDrawerOpen(false); setLocation(href); };

  const vipInfo = user ? getVipLevel(user.coins) : null;

  const handleDeposit = async () => {
    if (!owner) return;
    setSending(true);
    const text = [
      depositAmount ? `${t("deposit_btn")}: ${depositAmount} ${COIN}` : t("deposit_btn"),
      depositMsg,
    ].filter(Boolean).join("\n");
    try {
      await fetch(`/api/dm/${owner.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        credentials: "include",
      });
      toast({ title: t("deposit_sent") });
      setDepositOpen(false);
      setDepositMsg("");
      setDepositAmount("");
      setLocation(`/dm/${owner.id}`);
    } catch {
      toast({ title: t("error"), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-2xl border-b border-primary/10">
      {/* ── Single main row ── */}
      <div className="max-w-md mx-auto h-12 px-2 flex items-center gap-1">

        {/* Left: Always hamburger menu — no back button */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <button className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary relative active:scale-95 shrink-0">
              <Menu className="w-5 h-5" />
              {(user?.unreadNotifications ?? 0) + (user?.unreadDms ?? 0) > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive ring-2 ring-background" />
              )}
            </button>
          </SheetTrigger>

          <SheetContent side="left" className="w-[280px] bg-background border-primary/20 p-0">
            <SheetHeader className="p-4 border-b border-primary/10 bg-card/30">
              <SheetTitle className="text-left">
                {user ? (
                  <Link href="/profile">
                    <button onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 w-full">
                      <Avatar username={user.username} color={user.avatarColor} emoji={user.avatarEmoji} size="md" />
                      <div className="text-left flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm font-bold text-white truncate">{user.username}</span>
                          {user.isAdmin && <OwnerBadge size="xs" />}
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">#{user.publicId}</span>
                        <div className="mt-1.5"><VipLevelBar coins={user.coins} compact /></div>
                      </div>
                    </button>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2">
                    <Logo className="w-7 h-7" />
                    <span className="font-bold gold-text-gradient">CoinHub</span>
                  </div>
                )}
              </SheetTitle>
            </SheetHeader>
            <nav className="p-3 space-y-0.5">
              <DrawerItem icon={Settings} label={t("settings")} onClick={() => goAndClose("/settings")} />
              <DrawerItem icon={Bell} label={t("notifications")} onClick={() => goAndClose("/notifications")} badge={user?.unreadNotifications} />
              <DrawerItem icon={Users} label={t("friends")} onClick={() => goAndClose("/friends")} />
              <DrawerItem icon={Newspaper} label={t("news")} onClick={() => goAndClose("/news")} />
              <DrawerItem icon={HelpCircle} label={t("faq")} onClick={() => goAndClose("/faq")} />
              <DrawerItem icon={Info} label={t("about")} onClick={() => goAndClose("/about")} />
              {user?.isAdmin && (
                <DrawerItem icon={ShieldCheck} label={t("owner_panel")} onClick={() => goAndClose("/admin/dashboard")} highlight />
              )}
              <div className="border-t border-primary/10 my-2" />
              {/* Language selector — opens beautiful bottom sheet */}
              <LanguageSwitcher compact className="w-full" />
              <div className="border-t border-primary/10 my-2" />
              <DrawerItem icon={LogOut} label={t("logout")} onClick={handleLogout} destructive />
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        {!searchOpen && (
          <Link href="/home" className="flex items-center gap-1 shrink-0 mr-1">
            <Logo className="w-6 h-6" />
            <span className="font-black text-xs tracking-tight gold-text-gradient hidden xs:block">CoinHub</span>
          </Link>
        )}

        <div className="flex-1" />

        {/* Search */}
        <button
          onClick={() => setSearchOpen((v) => !v)}
          className={cn("w-8 h-8 rounded-lg flex items-center justify-center active:scale-95 shrink-0",
            searchOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary")}
        >
          {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
        </button>

        {/* Deposit button */}
        {user && !searchOpen && (
          <Sheet open={depositOpen} onOpenChange={setDepositOpen}>
            <SheetTrigger asChild>
              <button
                className="h-7 px-2 rounded-lg bg-primary/15 border border-primary/30 flex items-center gap-1 text-primary hover:bg-primary/25 active:scale-95 transition-all shrink-0"
              >
                <Plus className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">{t("deposit_btn")}</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-background border-primary/20 rounded-t-3xl pb-8">
              <SheetHeader className="pb-4">
                <SheetTitle className="gold-text-gradient text-left">{t("deposit_title")}</SheetTitle>
                <p className="text-xs text-muted-foreground text-left">{t("deposit_hint")}</p>
              </SheetHeader>
              <div className="space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-black pointer-events-none">{COIN}</span>
                  <input
                    type="number"
                    min={1}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder={t("deposit_amount_ph")}
                    className="w-full bg-card border border-primary/20 rounded-xl h-11 pl-8 pr-4 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <textarea
                  value={depositMsg}
                  onChange={(e) => setDepositMsg(e.target.value.slice(0, 200))}
                  placeholder={t("deposit_msg_ph")}
                  rows={3}
                  className="w-full bg-card border border-primary/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
                <button
                  onClick={handleDeposit}
                  disabled={sending || !owner}
                  className="w-full h-12 rounded-xl gold-gradient text-black font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {t("deposit_send")}
                </button>
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Profile avatar */}
        {user && !searchOpen && (
          <Link href="/profile">
            <div className="relative active:scale-95 shrink-0">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-black ring-2 ring-offset-1 ring-offset-background cursor-pointer overflow-hidden",
                  vipInfo?.tier === "vip"    ? "ring-yellow-400" :
                  vipInfo?.tier === "gold"   ? "ring-yellow-600" :
                  vipInfo?.tier === "silver" ? "ring-slate-400"  :
                  "ring-amber-700",
                )}
                style={{ background: user.avatarColor ?? "#D4AF37" }}
              >
                {user.avatarEmoji ? (
                  <span className="text-base leading-none">{user.avatarEmoji}</span>
                ) : (
                  <span className="text-white">{user.username[0]?.toUpperCase() ?? "?"}</span>
                )}
              </div>
              {(user.unreadNotifications ?? 0) + (user.unreadDms ?? 0) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-destructive ring-2 ring-background text-[7px] font-black text-white flex items-center justify-center">
                  {Math.min((user.unreadNotifications ?? 0) + (user.unreadDms ?? 0), 9)}
                </span>
              )}
              {vipInfo?.tier === "vip" && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] leading-none">👑</span>
              )}
            </div>
          </Link>
        )}
      </div>

      {/* ── Balance bar ── */}
      {user && !searchOpen && (
        <Link href="/wallet">
          <div className="max-w-md mx-auto px-3 py-1 border-t border-primary/5 flex items-center justify-between bg-black/20 cursor-pointer hover:bg-black/30 transition-colors">
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">{t("your_balance")}</span>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-primary text-sm tabular-nums">{fmtCoins(user.coins)}</span>
              <span className="text-[9px] font-black text-primary/80">{COIN}</span>
              <ChevronRight className="w-3 h-3 text-primary/50" />
            </div>
          </div>
        </Link>
      )}

      {/* ── Search panel ── */}
      {searchOpen && (
        <div className="border-t border-primary/10 px-3 py-2 bg-background/98">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search_ph")}
            className="w-full bg-card border border-primary/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {dq.length >= 2 && (
            <div className="mt-2 max-h-60 overflow-y-auto space-y-1">
              {results.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">{t("search_no_results")}</p>
              )}
              {results.map((u) => (
                <Link key={u.id} href={`/u/${u.publicId}`}>
                  <button
                    onClick={() => { setSearchOpen(false); setQ(""); }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-card text-left active:scale-[0.99]"
                  >
                    <Avatar username={u.username} color={u.avatarColor} emoji={(u as any).avatarEmoji} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-white truncate">{u.username}</p>
                        {u.isAdmin && <OwnerBadge size="xs" />}
                      </div>
                      <p className="text-[10px] font-mono text-muted-foreground">#{u.publicId}</p>
                    </div>
                  </button>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function DrawerItem({ icon: Icon, label, onClick, badge, highlight, destructive }: {
  icon: any; label: string; onClick: () => void; badge?: number; highlight?: boolean; destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider active:scale-[0.99] transition-all",
        destructive ? "text-destructive hover:bg-destructive/10" :
        highlight   ? "text-primary bg-primary/10 hover:bg-primary/15" :
        "text-white/90 hover:bg-card hover:text-primary",
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {badge ? (
        <span className="bg-destructive text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-5 text-center">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
