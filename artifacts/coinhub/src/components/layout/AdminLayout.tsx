import { Link, useLocation } from "wouter";
import { useAdminMe, getAdminMeQueryKey, useAdminLogout } from "@workspace/api-client-react";
import { Users, LayoutDashboard, ListOrdered, LogOut, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ADMIN_NAV = [
  { path: "/admin/dashboard", label: "Statistika", icon: LayoutDashboard },
  { path: "/admin/transactions", label: "Amallar", icon: ListOrdered },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: admin } = useAdminMe({ query: { queryKey: getAdminMeQueryKey() } });
  const logout = useAdminLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => setLocation("/admin")
    });
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#050508] flex justify-center text-foreground font-sans">
      <div className="w-full max-w-4xl relative min-h-screen bg-[#0a0a0f] shadow-2xl flex flex-col border-x border-destructive/20">
        
        <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-destructive/20">
          <div className="flex items-center justify-between h-14 px-6">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-destructive" />
              <span className="font-bold text-lg tracking-tight text-white">CoinHub <span className="text-destructive">ADMIN</span></span>
            </div>
            
            <div className="flex items-center gap-6">
              <nav className="flex items-center gap-4 hidden sm:flex">
                {ADMIN_NAV.map(item => (
                  <Link key={item.path} href={item.path} className={cn("text-sm font-medium transition-colors hover:text-white", location.startsWith(item.path) ? "text-destructive" : "text-muted-foreground")}>
                    {item.label}
                  </Link>
                ))}
              </nav>
              {admin && (
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <LogOut className="w-4 h-4 mr-2" />
                  Çykmak
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
