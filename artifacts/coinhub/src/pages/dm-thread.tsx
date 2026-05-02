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
import { Send, ArrowLeft, Loader2, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

function relativeTime(iso: string) {
  const date = new Date(iso);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "~";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
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
  const emoji = (prof as any)?.avatarEmoji as string | undefined;
  const isAdmin = prof?.isAdmin ?? false;
  const publicId = prof?.publicId;

  const inner = (
    <div className="flex items-center gap-3 min-w-0">
      <div className="relative">
        <Avatar username={username} color={color} emoji={emoji} size="md" />
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn(
            "font-black truncate",
            isAdmin ? "text-xl gold-text-gradient" : "text-base text-white",
          )}>
            {username}
          </p>
          {isAdmin && <OwnerBadge size="sm" />}
        </div>
        {publicId && (
          <p className="text-[11px] text-white/40 font-mono">#{publicId}</p>
        )}
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
  const { data: partner } = useGetPublicProfile(userId, {
    query: { queryKey: getGetPublicProfileQueryKey(userId), enabled: !!userId },
  });
  const { data: messages = [] } = useGetDmMessages(userId, {
    query: { queryKey: getGetDmMessagesQueryKey(userId), enabled: !!userId, refetchInterval: 2500 },
  });
  const send = useSendDmMessage();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      qc.invalidateQueries({ queryKey: getGetDmThreadsQueryKey() });
    }
  }, [messages.length]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const message = text.trim();
    if (!message || send.isPending) return;
    setText("");
    send.mutate(
      { userId, data: { message } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetDmMessagesQueryKey(userId) });
          qc.invalidateQueries({ queryKey: getGetDmThreadsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetMyNotificationsQueryKey() });
          scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        },
        onError: (err: any) => {
          setText(message);
          toast({ title: t("send_failed"), description: err?.message ?? "", variant: "destructive" });
        },
      },
    );
  };

  const partnerEmoji = (partner as any)?.avatarEmoji as string | undefined;
  const isPartnerAdmin = partner?.isAdmin ?? false;

  return (
    <Layout hideNav hideHeader>
      <div className="flex flex-col h-[100dvh]" style={{ background: "#08080f" }}>

        {/* Telegram-style header */}
        <div
          className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/5"
          style={{ background: "rgba(10,10,20,0.95)", backdropFilter: "blur(20px)" }}
        >
          <button
            onClick={() => setLocation("/dm")}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors shrink-0 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <PartnerHeader partnerId={userId} />
          </div>
          {isPartnerAdmin && (
            <div className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
          )}
        </div>

        {/* Messages area */}
        <div
          className="flex-1 overflow-y-auto px-3 py-4 space-y-2"
          style={{
            backgroundImage: isPartnerAdmin
              ? "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(212,175,55,0.06) 0%, transparent 60%)"
              : undefined,
          }}
        >
          <AnimatePresence initial={false}>
            {messages.map((m, idx) => {
              const mine = m.fromId === me?.id;
              const prevMsg = messages[idx - 1];
              const showAvatar = !mine && (!prevMsg || prevMsg.fromId !== m.fromId);

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className={cn("flex gap-2 items-end", mine ? "justify-end" : "justify-start")}
                >
                  {/* Partner avatar */}
                  {!mine && (
                    <div className="shrink-0 w-8 flex justify-center mb-0.5">
                      {showAvatar && (
                        <Avatar
                          username={partner?.username ?? "?"}
                          color={partner?.avatarColor ?? "#D4AF37"}
                          emoji={partnerEmoji}
                          size="sm"
                        />
                      )}
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={cn(
                      "max-w-[75%] flex flex-col",
                      mine ? "items-end" : "items-start",
                    )}
                  >
                    {/* Bubble body */}
                    <div
                      className={cn(
                        "px-4 py-2.5 leading-relaxed break-words text-sm",
                        mine
                          ? "rounded-2xl rounded-br-sm text-white"
                          : isPartnerAdmin
                          ? "rounded-2xl rounded-bl-sm text-white"
                          : "rounded-2xl rounded-bl-sm text-white/95",
                      )}
                      style={{
                        background: mine
                          ? "linear-gradient(135deg, rgba(212,175,55,0.3), rgba(212,175,55,0.15))"
                          : isPartnerAdmin
                          ? "linear-gradient(135deg, rgba(212,175,55,0.18), rgba(180,140,30,0.1))"
                          : "rgba(255,255,255,0.06)",
                        border: mine
                          ? "1px solid rgba(212,175,55,0.35)"
                          : isPartnerAdmin
                          ? "1px solid rgba(212,175,55,0.25)"
                          : "1px solid rgba(255,255,255,0.07)",
                        fontSize: "0.9rem",
                      }}
                    >
                      {m.message}
                    </div>

                    {/* Time */}
                    <span className="text-[9px] text-white/25 mt-0.5 px-1">
                      {relativeTime(m.createdAt)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty state */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-48 gap-3"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-sm text-white/30 font-medium">{t("dm_ph")}</p>
            </motion.div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Input area */}
        <form
          onSubmit={handleSend}
          className="shrink-0 px-3 py-3 flex gap-2 items-center border-t border-white/5"
          style={{ background: "rgba(10,10,20,0.95)", backdropFilter: "blur(20px)" }}
        >
          <Avatar
            username={me?.username ?? "?"}
            color={me?.avatarColor ?? "#D4AF37"}
            emoji={(me as any)?.avatarEmoji}
            size="sm"
            className="shrink-0"
          />
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={t("dm_ph")}
            maxLength={500}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-white placeholder:text-white/25"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
          <button
            type="submit"
            disabled={!text.trim() || send.isPending}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-black active:scale-90 disabled:opacity-40 transition-all shrink-0"
            style={{
              background: text.trim()
                ? "linear-gradient(135deg, #D4AF37, #b8942b)"
                : "rgba(255,255,255,0.07)",
            }}
          >
            {send.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className={cn("w-4 h-4", text.trim() ? "text-black" : "text-white/30")} />
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
}
