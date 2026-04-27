import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useAdminStats,
  getAdminStatsQueryKey,
  useAdminListUsers,
  getAdminListUsersQueryKey,
  useGetChatMessages,
  getGetChatMessagesQueryKey,
  useAdminDeleteChatMessage,
  useAdminBanChat,
  useGetNews,
  getGetNewsQueryKey,
  useAdminCreateNews,
  useAdminDeleteNews,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { fmtCoins, fmtDate } from "@/lib/utils";
import {
  Users,
  Coins,
  ArrowRightLeft,
  PlusCircle,
  Search,
  ChevronRight,
  Trash2,
  ShieldOff,
  Newspaper,
  MessageSquare,
  LayoutDashboard,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "stats", label: "Statistika", icon: LayoutDashboard },
  { id: "users", label: "Ulanyjylar", icon: Users },
  { id: "chat", label: "Çat dolandyryşy", icon: MessageSquare },
  { id: "news", label: "Tazelikler", icon: Newspaper },
] as const;
type TabId = typeof TABS[number]["id"];

export default function AdminDashboard() {
  const [tab, setTab] = useState<TabId>("stats");
  const { data: stats } = useAdminStats({ query: { queryKey: getAdminStatsQueryKey() } });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-1 bg-[#0a0a0f] border border-destructive/20 rounded-2xl p-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 min-w-fit px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-tight flex items-center justify-center gap-2 transition-all",
                tab === t.id ? "bg-destructive text-white" : "text-muted-foreground hover:text-white",
              )}
            >
              <t.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {tab === "stats" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Jemi Ulanyjylar" value={stats?.totalUsers?.toString()} icon={Users} />
            <StatCard title="Aýlanyşykdaky TMT" value={fmtCoins(stats?.totalCoinsInCirculation)} icon={Coins} />
            <StatCard title="Jemi Amallar" value={stats?.totalTransactions?.toString()} icon={ArrowRightLeft} />
            <StatCard title="Şu gün goşulan" value={fmtCoins(stats?.coinsAddedToday)} icon={PlusCircle} color="text-emerald-500" />
          </div>
        )}

        {tab === "users" && <UsersTab />}
        {tab === "chat" && <ChatModerationTab />}
        {tab === "news" && <NewsTab />}
      </div>
    </AdminLayout>
  );
}

function UsersTab() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { data: users = [] } = useAdminListUsers(
    { search: debouncedSearch || undefined },
    { query: { queryKey: getAdminListUsersQueryKey({ search: debouncedSearch }) } },
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold text-white">Ulanyjylar</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ID ýa-da ady..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                <th className="px-6 py-4 font-medium text-right">Balans (TMT)</th>
                <th className="px-6 py-4 font-medium text-right">Sene</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-destructive/10">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-destructive/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">
                    <span className="flex items-center gap-2">
                      {u.username}
                      {u.isAdmin && <span className="text-[9px] font-black bg-primary text-black px-1.5 py-0.5 rounded uppercase">OWNER</span>}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-muted-foreground">{u.publicId}</td>
                  <td className="px-6 py-4 text-right font-bold text-primary tabular-nums">{fmtCoins(u.coins)}</td>
                  <td className="px-6 py-4 text-right text-muted-foreground">{fmtDate(u.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/users/${u.id}`} className="inline-flex items-center justify-center p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20">
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
  );
}

function ChatModerationTab() {
  const { data: messages = [] } = useGetChatMessages(
    { limit: 100 },
    { query: { refetchInterval: 5000, queryKey: getGetChatMessagesQueryKey({ limit: 100 }) } },
  );
  const del = useAdminDeleteChatMessage();
  const ban = useAdminBanChat();
  const qc = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    del.mutate({ messageId: id }, {
      onSuccess: () => {
        toast({ title: "Habar pozuldy" });
        qc.invalidateQueries({ queryKey: getGetChatMessagesQueryKey({ limit: 100 }) });
      },
    });
  };

  const handleBan = (userId: string, minutes: number) => {
    ban.mutate({ userId, data: { minutes } }, {
      onSuccess: () => {
        toast({ title: `${minutes} minut gadagan edildi` });
      },
      onError: (err: any) => toast({ title: "Ýalňyşlyk", description: err?.message ?? "", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-white">Çat dolandyryşy</h2>
      <p className="text-xs text-muted-foreground">Soňky 100 habar. Düzgün bozany pozuň ýa-da gadagan ediň.</p>

      <div className="space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="bg-[#0a0a0f] border border-destructive/20 rounded-xl p-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-white">{m.username}</span>
                <span className="text-[10px] font-mono text-muted-foreground">#{m.publicId}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{fmtDate(m.createdAt)}</span>
              </div>
              <p className="text-sm text-white/80 break-words">{m.message}</p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                onClick={() => handleDelete(m.id)}
                className="px-2 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center gap-1 text-xs font-bold"
              >
                <Trash2 className="w-3 h-3" />
                Poz
              </button>
              <select
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (v > 0) handleBan(m.userId, v);
                  e.currentTarget.value = "";
                }}
                className="px-2 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-bold cursor-pointer border-0 focus:outline-none"
                defaultValue=""
              >
                <option value="" disabled>Ban</option>
                <option value="5">5 min</option>
                <option value="30">30 min</option>
                <option value="60">1 sg</option>
                <option value="1440">1 gün</option>
                <option value="10080">1 hepde</option>
              </select>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">Habarlar ýok</div>
        )}
      </div>
    </div>
  );
}

function NewsTab() {
  const { data: news = [] } = useGetNews({ query: { queryKey: getGetNewsQueryKey() } });
  const create = useAdminCreateNews();
  const del = useAdminDeleteNews();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    create.mutate({ data: { title: title.trim(), body: body.trim() } }, {
      onSuccess: () => {
        toast({ title: "Tazelik döredildi" });
        setTitle("");
        setBody("");
        qc.invalidateQueries({ queryKey: getGetNewsQueryKey() });
      },
    });
  };

  const remove = (id: string) => {
    del.mutate({ newsId: id }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetNewsQueryKey() }),
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Tazelikler</h2>

      <form onSubmit={submit} className="bg-[#0a0a0f] border border-destructive/20 rounded-2xl p-5 space-y-3">
        <p className="text-sm font-bold text-white">Täze tazelik döret</p>
        <Input
          placeholder="Sözbaşy"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-background border-destructive/20"
        />
        <textarea
          placeholder="Mazmuny"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full bg-background border border-destructive/20 rounded-md px-3 py-2 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-destructive resize-none"
        />
        <Button
          type="submit"
          disabled={create.isPending || !title.trim() || !body.trim()}
          className="bg-destructive hover:bg-destructive/90 text-white"
        >
          Çap et
        </Button>
      </form>

      <div className="space-y-2">
        {news.map((n) => (
          <div key={n.id} className="bg-[#0a0a0f] border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">{n.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 whitespace-pre-wrap">{n.body}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{fmtDate(n.createdAt)}</p>
            </div>
            <button
              onClick={() => remove(n.id)}
              className="px-2 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center gap-1 text-xs font-bold shrink-0"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        {news.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">Tazelik ýok</div>
        )}
      </div>
    </div>
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
