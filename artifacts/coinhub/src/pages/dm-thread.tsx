import { Layout } from "@/components/layout/Layout";
import { useState, useEffect, useRef } from "react";
import { useRoute, Link, useLocation } from "wouter";
import {
  useGetDmMessages,
  getGetDmMessagesQueryKey,
  useSendDmMessage,
  useGetMe,
  getGetMeQueryKey,
  getGetDmThreadsQueryKey,
  getGetMyNotificationsQueryKey,
  useGetPublicProfile,
  getGetPublicProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Avatar } from "@/components/Avatar";
import { OwnerBadge } from "@/components/OwnerBadge";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

function relativeTime(iso: string) {
  const date = new Date(iso);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "~";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sg`;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}`;
}

function PartnerHeader({ partnerId }: { partnerId: string }) {
  const { data: prof } = useGetPublicProfile(partnerId, {
    query: { queryKey: getGetPublicProfileQueryKey(partnerId), enabled: !!partnerId },
  });
  const username = prof?.username ?? "...";
  const color = prof?.avatarColor ?? "#D4AF37";
  const isAdmin = prof?.isAdmin ?? false;
  const publicId = prof?.publicId;
  const inner = (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar username={username} color={color} size="sm" />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-white truncate">{username}</p>
          {isAdmin && <OwnerBadge size="xs" />}
        </div>
        {publicId && <p className="text-[9px] font-mono text-muted-foreground">#{publicId}</p>}
      </div>
    </div>
  );
  return publicId ? <Link href={`/u/${publicId}`}>{inner}</Link> : inner;
}

export default function DmThread() {
  const [, params] = useRoute("/dm/:userId");
  const userId = params?.userId ?? "";
  const [, setLocation] = useLocation();
  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: messages = [] } = useGetDmMessages(userId, {
    query: { queryKey: getGetDmMessagesQueryKey(userId), enabled: !!userId, refetchInterval: 3000 },
  });
  const send = useSendDmMessage();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      qc.invalidateQueries({ queryKey: getGetDmThreadsQueryKey() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const message = text.trim();
    if (!message || send.isPending) return;
    send.mutate(
      { userId, data: { message } },
      {
        onSuccess: () => {
          setText("");
          qc.invalidateQueries({ queryKey: getGetDmMessagesQueryKey(userId) });
          qc.invalidateQueries({ queryKey: getGetDmThreadsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetMyNotificationsQueryKey() });
        },
        onError: (err: any) => toast({ title: t("send_failed"), description: err?.message ?? "", variant: "destructive" }),
      },
    );
  };

  return (
    <Layout hideNav hideHeader>
      <div className="flex flex-col h-[100dvh] bg-background">
        <header className="sticky top-0 z-10 bg-card/90 backdrop-blur-xl border-b border-primary/15 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setLocation("/dm")} className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <PartnerHeader partnerId={userId} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const mine = m.fromId === me?.id;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", mine ? "justify-end" : "justify-start")}
                >
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm break-words",
                    mine
                      ? "bg-primary/20 border border-primary/30 text-white rounded-tr-sm"
                      : "bg-card border border-primary/10 text-white/90 rounded-tl-sm",
                  )}>
                    <p className="leading-relaxed">{m.message}</p>
                    <p className="text-[9px] text-right opacity-50 mt-1">{relativeTime(m.createdAt)}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {messages.length === 0 && (
            <div className="text-center py-12 text-xs text-muted-foreground">{t("dm_ph")}</div>
          )}
          <div ref={scrollRef} />
        </div>

        <form onSubmit={handleSend} className="p-3 bg-background border-t border-primary/10 flex gap-2 items-center">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("dm_ph")}
            maxLength={500}
            className="flex-1 bg-card border border-primary/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={!text.trim() || send.isPending}
            className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-black active:scale-95 disabled:opacity-50"
          >
            {send.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </Layout>
  );
}
