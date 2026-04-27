import { Layout } from "@/components/layout/Layout";
import { useGetDmThreads, getGetDmThreadsQueryKey } from "@workspace/api-client-react";
import { Avatar } from "@/components/Avatar";
import { OwnerBadge } from "@/components/OwnerBadge";
import { Link } from "wouter";
import { MessageCircle } from "lucide-react";
import { fmtDateShort } from "@/lib/utils";

export default function DmList() {
  const { data: threads = [] } = useGetDmThreads({
    query: { queryKey: getGetDmThreadsQueryKey(), refetchInterval: 5000 },
  });

  return (
    <Layout>
      <div className="p-4 space-y-6 pb-24">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-black italic gold-text-gradient uppercase tracking-tighter">Habarlaşmak</h1>
          <Link href="/friends" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">Dostlar</Link>
        </header>

        {threads.length === 0 ? (
          <div className="bg-card/40 border border-dashed border-primary/15 rounded-3xl p-10 flex flex-col items-center gap-3 text-center">
            <MessageCircle className="w-10 h-10 text-muted-foreground" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Häzir ýazyşma ýok</p>
            <Link href="/friends" className="text-xs font-bold text-primary mt-2 underline">Dost goş</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((t) => (
              <Link key={t.user.id} href={`/dm/${t.user.id}`}>
                <div className="bg-card border border-primary/15 rounded-2xl p-3 flex items-center gap-3 active:scale-[0.99] transition-all">
                  <Avatar username={t.user.username} color={t.user.avatarColor} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-white truncate">{t.user.username}</p>
                      {t.user.isAdmin && <OwnerBadge size="xs" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{t.lastMessage}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{fmtDateShort(t.lastAt)}</span>
                    {t.unread > 0 && (
                      <span className="bg-primary text-black text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-5 text-center">{t.unread}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
