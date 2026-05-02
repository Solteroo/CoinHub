import { Layout } from "@/components/layout/Layout";
import { useGetDmThreads, getGetDmThreadsQueryKey } from "@workspace/api-client-react";
import { Avatar } from "@/components/Avatar";
import { OwnerBadge } from "@/components/OwnerBadge";
import { Link } from "wouter";
import { MessageCircle } from "lucide-react";
import { fmtDateShort } from "@/lib/utils";
import { useI18n } from "@/i18n";

export default function DmList() {
  const { data: threads = [] } = useGetDmThreads({
    query: { queryKey: getGetDmThreadsQueryKey(), refetchInterval: 5000 },
  });
  const { t } = useI18n();

  return (
    <Layout>
      <div className="p-4 space-y-6 pb-24">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-black italic gold-text-gradient uppercase tracking-tighter">{t("dm_list")}</h1>
          <Link href="/friends" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">{t("friends")}</Link>
        </header>

        {threads.length === 0 ? (
          <div className="bg-card/40 border border-dashed border-primary/15 rounded-3xl p-10 flex flex-col items-center gap-3 text-center">
            <MessageCircle className="w-10 h-10 text-muted-foreground" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("dm_no_conv")}</p>
            <Link href="/friends" className="text-xs font-bold text-primary mt-2 underline">{t("add_friend")}</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => (
              <Link key={thread.user.id} href={`/dm/${thread.user.id}`}>
                <div className="bg-card border border-primary/15 rounded-2xl p-3 flex items-center gap-3 active:scale-[0.99] transition-all">
                  <Avatar username={thread.user.username} color={thread.user.avatarColor} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-white truncate">{thread.user.username}</p>
                      {thread.user.isAdmin && <OwnerBadge size="xs" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{thread.lastMessage}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{fmtDateShort(thread.lastAt)}</span>
                    {thread.unread > 0 && (
                      <span className="bg-primary text-black text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-5 text-center">{thread.unread}</span>
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
