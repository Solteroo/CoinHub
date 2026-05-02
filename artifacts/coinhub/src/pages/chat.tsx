import { Layout } from "@/components/layout/Layout";
import { useState, useEffect, useRef } from "react";
import {
  useGetChatMessages,
  usePostChatMessage,
  getGetChatMessagesQueryKey,
  useGetMe,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Users, Send, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { OwnerBadge } from "@/components/OwnerBadge";
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

export default function Chat() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: messages = [] } = useGetChatMessages(
    { limit: 50 },
    { query: { refetchInterval: 2500, queryKey: getGetChatMessagesQueryKey({ limit: 50 }) } },
  );
  const postChat = usePostChatMessage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [banUntil, setBanUntil] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const message = text.trim();
    if (!message || postChat.isPending) return;

    postChat.mutate(
      { data: { message } },
      {
        onSuccess: () => {
          setText("");
          queryClient.invalidateQueries({ queryKey: getGetChatMessagesQueryKey({ limit: 50 }) });
        },
        onError: (err: any) => {
          if (err?.status === 403 && err?.message?.toLowerCase().includes("ban")) {
            setBanUntil(err?.until ?? null);
            toast({ title: t("chat_banned_toast"), variant: "destructive" });
          } else if (err?.status === 429) {
            toast({ title: t("chat_slow_down"), variant: "destructive" });
          } else {
            toast({ title: t("send_failed"), description: err?.message ?? "", variant: "destructive" });
          }
        },
      },
    );
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100dvh-56px-64px)]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-primary/10 bg-card/60 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-sm font-black italic gold-text-gradient uppercase tracking-tight">
              {t("global_chat")}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Users className="w-3 h-3 text-primary" />
            <span className="text-[9px] font-bold text-primary uppercase">{t("online")}</span>
          </div>
        </div>

        {/* Ban notice */}
        {banUntil && (
          <div className="shrink-0 bg-destructive/10 border-b border-destructive/30 px-4 py-2.5 flex items-center gap-2 text-xs text-destructive">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{t("chat_banned")}: {new Date(banUntil).toLocaleString()}</span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMe = msg.userId === user?.id;
              const avatarEmoji = (msg as any).avatarEmoji as string | undefined;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={cn("flex gap-2.5 items-end", isMe ? "flex-row-reverse" : "flex-row")}
                >
                  {/* Avatar */}
                  <Link href={`/u/${msg.publicId}`} className="shrink-0 mb-0.5">
                    <Avatar
                      username={msg.username}
                      color={msg.avatarColor}
                      emoji={avatarEmoji}
                      size="sm"
                    />
                  </Link>

                  {/* Bubble */}
                  <div className={cn("flex flex-col max-w-[78%]", isMe ? "items-end" : "items-start")}>
                    {/* Name row */}
                    <div className={cn("flex items-center gap-1.5 mb-1 px-1", isMe ? "flex-row-reverse" : "flex-row")}>
                      <Link href={`/u/${msg.publicId}`}>
                        <span className={cn(
                          "text-[11px] font-black tracking-tight hover:underline",
                          msg.isAdmin ? "gold-text-gradient" : isMe ? "text-primary" : "text-white/80",
                        )}>
                          {msg.username}
                        </span>
                      </Link>
                      {msg.isAdmin && <OwnerBadge size="xs" />}
                    </div>

                    {/* Message bubble */}
                    <div className={cn(
                      "px-3.5 py-2.5 text-sm leading-relaxed break-words shadow-sm",
                      isMe
                        ? "bg-primary/25 border border-primary/30 text-white rounded-2xl rounded-br-sm"
                        : msg.isAdmin
                        ? "bg-gradient-to-br from-primary/20 to-amber-500/10 border border-primary/30 text-white rounded-2xl rounded-bl-sm gold-glow"
                        : "bg-card border border-white/7 text-white/90 rounded-2xl rounded-bl-sm",
                    )}>
                      {msg.message}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[9px] opacity-35 mt-0.5 px-1">{relativeTime(msg.createdAt)}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="shrink-0 px-3 py-2.5 bg-background/95 border-t border-primary/10 flex gap-2 items-center backdrop-blur-xl"
        >
          <Avatar
            username={user?.username ?? "?"}
            color={user?.avatarColor ?? "#D4AF37"}
            emoji={(user as any)?.avatarEmoji}
            size="sm"
            className="shrink-0"
          />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={t("chat_ph")}
            maxLength={200}
            className="flex-1 bg-card/80 border border-primary/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 text-white placeholder:text-white/30"
          />
          <button
            type="submit"
            disabled={!text.trim() || postChat.isPending}
            className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-black active:scale-95 disabled:opacity-50 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </Layout>
  );
}
