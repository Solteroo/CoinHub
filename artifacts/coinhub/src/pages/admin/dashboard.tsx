import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminStats, getAdminStatsQueryKey, useAdminListUsers, getAdminListUsersQueryKey } from "@workspace/api-client-react";
import { fmtCoins, fmtDate } from "@/lib/utils";
import { Users, Coins, ArrowRightLeft, PlusCircle, Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: stats } = useAdminStats({ query: { queryKey: getAdminStatsQueryKey() } });
  
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  
  const { data: users = [] } = useAdminListUsers(
    { search: debouncedSearch || undefined }, 
    { query: { queryKey: getAdminListUsersQueryKey({ search: debouncedSearch }) } }
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white mb-4">Statistika</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Jemi Ulanyjylar" value={stats?.totalUsers.toString()} icon={Users} />
          <StatCard title="Aýlanyşykdaky Teňňe" value={fmtCoins(stats?.totalCoinsInCirculation)} icon={Coins} />
          <StatCard title="Jemi Amallar" value={stats?.totalTransactions.toString()} icon={ArrowRightLeft} />
          <StatCard title="Şu gün goşulan" value={fmtCoins(stats?.coinsAddedToday)} icon={PlusCircle} color="text-emerald-500" />
        </div>

        <div className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-white">Ulanyjylar</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="ID ýa-da ady boýunça gözle..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-[#0a0a0f] border-destructive/20 focus-visible:ring-destructive"
              />
            </div>
          </div>

          <div className="bg-[#0a0a0f] border border-destructive/20 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-destructive/5 border-b border-destructive/10">
                  <tr>
                    <th className="px-6 py-4 font-medium">Ulanyjy</th>
                    <th className="px-6 py-4 font-medium">ID</th>
                    <th className="px-6 py-4 font-medium text-right">Balans</th>
                    <th className="px-6 py-4 font-medium text-right">Sene</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-destructive/10">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-destructive/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{user.username}</td>
                      <td className="px-6 py-4 font-mono text-muted-foreground">{user.publicId}</td>
                      <td className="px-6 py-4 text-right font-bold text-primary tabular-nums">{fmtCoins(user.coins)}</td>
                      <td className="px-6 py-4 text-right text-muted-foreground">{fmtDate(user.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/users/${user.id}`} className="inline-flex items-center justify-center p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        Ulanyjy tapylmady
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, value, icon: Icon, color = "text-white" }: any) {
  return (
    <div className="bg-[#0a0a0f] border border-destructive/20 rounded-2xl p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className={`text-3xl font-bold tabular-nums relative z-10 ${color}`}>{value || "0"}</p>
    </div>
  );
}
