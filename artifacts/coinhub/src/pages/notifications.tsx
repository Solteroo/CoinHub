import { Layout } from "@/components/layout/Layout";
import { useEffect } from "react";
import {
  useGetMyNotifications,
  getGetMyNotificationsQueryKey,
  useMarkNotificationsRead,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Gift, MessageCircle, ArrowDownLeft, Users, Info as InfoIcon } from "lucide-react";
import { fmtDateShort, cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

const KIND_ICON: Record<string, any> = {
  bonus: Gift,
  dm: MessageCircle,
  transfer: ArrowDownLeft,
  friend: Users,
  info: InfoIcon,
};

export default function Notifications() {
  const { data: items = [] } = useGetMyNotifications({ query: { queryKey: getGetMyNotificationsQueryKey() } });
  const mark = useMarkNotificationsRead();
  const qc = useQueryClient();
  const { t } = useI18n();

  useEffect(() => {
    if (items.length > 0 && items.some((n) => !n.readAt)) {
      mark.mutate(undefined, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
          qc.invalidateQueries({ queryKey: getGetMyNotificationsQueryKey() });
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  return (
    <Layout>
      <div className="p-4 space-y-6 pb-24">
        <header>
          <h1 className="text-2xl font-black italic gold-text-gradient uppercase tracking-tighter">{t("notifications")}</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{t("notifications_subtitle")}</p>
        </header>

        {items.length === 0 ? (
          <div className="bg-card/40 border border-dashed border-primary/15 rounded-3xl p-10 flex flex-col items-center gap-3 text-center">
            <Bell className="w-10 h-10 text-muted-foreground" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("no_notif_msg")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((n) => {
              const Icon = KIND_ICON[n.kind] ?? InfoIcon;
              const unread = !n.readAt;
              return (
                <div key={n.id} className={cn(
                  "rounded-2xl p-4 flex items-start gap-3 border",
                  unread ? "bg-primary/5 border-primary/30" : "bg-card border-primary/10",
                )}>
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    unread ? "bg-primary text-black" : "bg-primary/10 text-primary",
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-white">{n.title}</p>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">{fmtDateShort(n.createdAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{n.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
