import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetMe,
  getGetMeQueryKey,
  useSearchUsers,
  useLogoutUser,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, Search, ChevronLeft, X, Settings, Newspaper, Users, Bell, HelpCircle, Info, LogOut, ShieldCheck, Coins, Globe, Star } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";
import { OwnerBadge } from "@/components/OwnerBadge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { fmtCoins, cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useDebounce } from "@/hooks/use-debounce";

export function TopHeader() {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const dq = useDebounce(q, 300);
  const { data: results = [] } = useSearchUsers({ q: dq }, { query: { enabled: dq.length >= 2, queryKey: ["searchUsers", dq] } });
  const logout = useLogoutUser();
  const qc = useQueryClient();
  const { t } = useI18n();

  const showBack = location !== "/home" && location !== "/";

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        qc.clear();
        setDrawerOpen(false);
        setLocation("/");
      },
    });
  };

  const goAndClose = (href: string) => {
    setDrawerOpen(false);
    setLocation(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-primary/10">
      <div className="max-w-md mx-auto h-14 px-3 flex items-center gap-2">
        {showBack ? (
          <button
            onClick={() => setLocation("/home")}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary active:scale-95"
            aria-label={t("back")}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <button
                className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary relative active:scale-95"
                aria-label="Меню"
              >
                <Menu className="w-5 h-5" />
                {(user?.unreadNotifications ?? 0) + (user?.unreadDms ?? 0) > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-background border-primary/20 p-0">
              <SheetHeader className="p-5 border-b border-primary/10">
                <SheetTitle className="text-left">
                  {user ? (
                    <Link href="/profile">
                      <button onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 w-full">
                        <Avatar username={user.username} color={user.avatarColor} size="md" />
                        <div className="text-left flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-white truncate">{user.username}</span>
                            {user.isAdmin && <OwnerBadge size="xs" />}
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">#{user.publicId}</span>
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
              <nav className="p-3 space-y-1">
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
                {/* Language switcher in drawer */}
                <div className="px-3 py-2 flex items-center gap-3">
                  <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                  <LanguageSwitcher compact />
                </div>
                <div className="border-t border-primary/10 my-2" />
                <DrawerItem icon={LogOut} label={t("logout")} onClick={handleLogout} destructive />
              </nav>
            </SheetContent>
          </Sheet>
        )}

        <Link href="/home" className="flex items-center gap-1.5">
          <Logo className="w-7 h-7" />
          <span className="font-black text-base tracking-tight gold-text-gradient hidden xs:inline">CoinHub</span>
        </Link>

        <div className="flex-1" />

        <button
          onClick={() => setSearchOpen((v) => !v)}
          className={cn("w-9 h-9 rounded-lg flex items-center justify-center active:scale-95", searchOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary")}
          aria-label={t("search_label")}
        >
          {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
        </button>

        {user && (
          <Link href="/wallet">
            <div className="flex items-center gap-1 bg-card border border-primary/20 px-2.5 py-1.5 rounded-full gold-glow active:scale-95">
              {/* Real coin indicator */}
              {(user.realCoins ?? 0) > 0 && (
                <>
                  <Coins className="w-3 h-3 text-yellow-400" />
                  <span className="font-black text-yellow-400 text-xs tabular-nums">{fmtCoins(user.realCoins ?? 0)}</span>
                  <span className="text-muted-foreground/40 text-[9px] font-bold">|</span>
                </>
              )}
              {/* Bonus coin indicator */}
              <Star className="w-3 h-3 text-primary" />
              <span className="font-black text-primary text-xs tabular-nums">{fmtCoins(user.bonusCoins ?? user.coins)}</span>
              <span className="text-[9px] font-bold text-primary/70 tracking-widest">TMT</span>
            </div>
          </Link>
        )}
      </div>

      {searchOpen && (
        <div className="border-t border-primary/10 px-3 py-2 bg-background/95">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search_ph")}
            className="w-full bg-card border border-primary/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {dq.length >= 2 && (
            <div className="mt-2 max-h-72 overflow-y-auto space-y-1">
              {results.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">{t("search_no_results")}</p>
              )}
              {results.map((u) => (
                <Link key={u.id} href={`/u/${u.publicId}`}>
                  <button
                    onClick={() => { setSearchOpen(false); setQ(""); }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-card text-left active:scale-[0.99]"
                  >
                    <Avatar username={u.username} color={u.avatarColor} size="sm" />
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

function DrawerItem({ icon: Icon, label, onClick, badge, highlight, destructive }: { icon: any; label: string; onClick: () => void; badge?: number; highlight?: boolean; destructive?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider active:scale-[0.99] transition-all",
        destructive ? "text-destructive hover:bg-destructive/10" :
        highlight ? "text-primary bg-primary/10 hover:bg-primary/15" :
        "text-white/90 hover:bg-card hover:text-primary",
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="flex-1 text-left">{label}</span>
      {badge ? <span className="bg-destructive text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-5 text-center">{badge}</span> : null}
    </button>
  );
}
