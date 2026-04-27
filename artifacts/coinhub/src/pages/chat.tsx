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

function relativeTime(iso: string) {
  const date = new Date(iso);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "Häzir";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sg`;
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
            toast({ title: "Çatdan gadagan edildiňiz", variant: "destructive" });
          } else if (err?.status === 429) {
            toast({ title: "Çalt ýazýarsyňyz", variant: "destructive" });
          } else {
            toast({ title: "Iberilmedi", description: err?.message ?? "", variant: "destructive" });
          }
        },
      },
    );
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100dvh-56px-64px)]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-primary/10 bg-card/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black italic gold-text-gradient uppercase tracking-tight">Global Çat</h1>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Users className="w-3 h-3 text-primary" />
            <span className="text-[9px] font-bold text-primary uppercase">Online</span>
          </div>
        </div>

        {banUntil && (
          <div className="bg-destructive/10 border-y border-destructive/30 p-3 flex items-center gap-2 text-xs text-destructive">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="flex-1">Çatdan gadagan: {new Date(banUntil).toLocaleString("tk-TM")}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMe = msg.userId === user?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-2", isMe ? "flex-row-reverse" : "flex-row")}
                >
                  <Link href={`/u/${msg.publicId}`} className="shrink-0">
                    <Avatar username={msg.username} color={msg.avatarColor} size="sm" />
                  </Link>
                  <div className={cn("flex flex-col max-w-[75%]", isMe ? "items-end" : "items-start")}>
                    <Link href={`/u/${msg.publicId}`}>
                      <div className="flex items-center gap-1.5 mb-0.5 px-1">
                        <span className={cn("text-[10px] font-bold hover:text-primary", isMe ? "text-primary" : "text-white")}>
                          {msg.username}
                        </span>
                        {msg.isAdmin && <OwnerBadge size="xs" />}
                        <span className="text-[8px] opacity-50 font-mono">#{msg.publicId}</span>
                      </div>
                    </Link>
                    <div className={cn(
                      "rounded-2xl px-3 py-2 text-sm break-words",
                      isMe
                        ? "bg-primary/20 border border-primary/25 text-white rounded-tr-sm"
                        : "bg-card border border-primary/10 text-white/90 rounded-tl-sm",
                    )}>
                      {msg.message}
                    </div>
                    <span className="text-[8px] opacity-40 mt-0.5 px-1">{relativeTime(msg.createdAt)}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>

        <form onSubmit={handleSend} className="p-3 bg-background border-t border-primary/10 flex gap-2 items-center">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Habar ýazyň..."
            maxLength={200}
            className="flex-1 bg-card border border-primary/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={!text.trim() || postChat.isPending}
            className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-black active:scale-95 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </Layout>
  );
}
